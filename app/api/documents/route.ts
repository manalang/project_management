import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const MAX_FILE_SIZE=10*1024*1024;
const allowed=new Set(["pdf","docx","xlsx","xls","csv","txt","md"]);
const uid=()=>typeof crypto.randomUUID==="function"?crypto.randomUUID():Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
async function owner(){return (await getChatGPTUser())?.userId??"local-preview"}

const clean=(value:string)=>value.replace(/\s+/g," ").replace(/^[•●▪◦‣*]+\s*/,"").trim();
const bareHeading=(value:string)=>clean(value).replace(/^#{1,6}\s*/,"").replace(/^\d+(?:\.\d+)*[.)]?\s*/,"").trim();
function heading(value:string){
 const line=bareHeading(value).replace(/[:\-–—]\s*$/,"").trim();
 if(!line||line.length>100)return false;
 return /[:\-–—]\s*$/.test(value)||/^#{1,6}\s/.test(value)||/^\d+(?:\.\d+)*[.)]?\s+/.test(clean(value))||
  (line.length<70&&line===line.toUpperCase()&&/[A-Z]/.test(line));
}
function section(text:string,labels:string[],limit=1800){
 const lines=text.replace(/\r/g,"").split("\n").map(v=>v.trim());
 const matcher=new RegExp("^(?:"+labels.join("|")+")\\b\\s*(?:[:\\-–—]\\s*)?(.*)$","i");
 for(let i=0;i<lines.length;i++){
  const match=bareHeading(lines[i]).match(matcher);if(!match)continue;
  const parts:string[]=[];if(clean(match[1]))parts.push(clean(match[1]));
  for(let j=i+1;j<lines.length&&parts.join(" ").length<limit;j++){
   if(!lines[j]){if(parts.length)break;continue}
   if(heading(lines[j]))break;
   parts.push(clean(lines[j]));
   if(parts.length>=8)break;
  }
  if(parts.length)return parts.join("\n").slice(0,limit);
 }
 return "";
}
function fallbackObjective(text:string){
 const blocks=text.replace(/\r/g,"").split(/\n\s*\n/).map(clean);
 return (blocks.find(block=>block.length>=90&&block.length<=1800&&
  /(?:project|program|system|develop|design|implement|deliver|provide|improve|replace|support)/i.test(block)&&
  !/(?:table of contents|revision history|confidential|copyright)/i.test(block))??"").slice(0,1800);
}
function fallbackCriteria(text:string){
 const candidates=text.replace(/\r/g,"").split("\n").map(clean).filter(line=>line.length>=20&&line.length<=320&&
  /(?:\bshall\b|\bmust\b|\brequired\b|\btarget\b|\bdeliver(?:able|ed)?\b|\baccept(?:ance|ed)?\b|\bcomplete(?:d|tion)?\b|\bavailability\b|\baccuracy\b|\bwithin\b|\bno later than\b|\bmetric\b|\bKPI\b|%|≥|<=)/i.test(line));
 return [...new Set(candidates)].slice(0,6).join("\n").slice(0,1800);
}
function isoDate(value:string){
 const parsed=new Date(value);return Number.isNaN(parsed.valueOf())?"":parsed.toISOString().slice(0,10);
}
function suggestions(text:string,filename:string){
 const name=section(text,["project (?:name|title)","title"])||filename.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ");
 const code=section(text,["project code","project id","identifier"]).match(/[A-Z][A-Z0-9-]{1,14}/i)?.[0]??"";
 const objective=section(text,["project objectives?","technical objectives?","program objectives?","objectives?","project goals?","goals?","purpose","mission","project overview","overview","project description","description","problem statement","business need","background(?: and need)?","scope"])||fallbackObjective(text);
 const success=section(text,["success criteria","acceptance criteria","performance criteria","project criteria","measures? of success","key results?","key outcomes?","desired outcomes?","expected outcomes?","performance targets?","metrics?","KPIs?","deliverables?","requirements?"])||fallbackCriteria(text);
 const budgetLine=section(text,["authorized budget","total budget","budget","estimated cost"]);
 const budget=(budgetLine.match(/\$?([0-9][0-9,]*(?:\.\d{1,2})?)/)?.[1]??"").replace(/,/g,"");
 const start=section(text,["start date","project start","kickoff date"]);
 const end=section(text,["target completion","completion date","end date","delivery date"]);
 return {name,code,objective,success,budget,startDate:isoDate(start),endDate:isoDate(end)};
}
export async function POST(request:Request){
 const bucket=env.BUCKET;if(!bucket)return Response.json({error:"Document storage is unavailable"},{status:503});
 const ownerId=await owner(),body=await request.json() as {draftId?:string;files?:Array<{name:string;type:string;size:number;data:string;text:string}>};
 const draftId=String(body.draftId||""),files=body.files??[];
 if(!draftId||!files.length||files.length>5)return Response.json({error:"Choose one to five documents"},{status:400});
 if(files.reduce((sum,file)=>sum+file.size,0)>20*1024*1024)return Response.json({error:"The combined upload must be 20 MB or less"},{status:400});
 const combined:Record<string,string>={name:"",code:"",objective:"",success:"",budget:"",startDate:"",endDate:""};
 const uploaded=[];
 for(const file of files){
  const ext=file.name.split(".").pop()?.toLowerCase()??"";
  if(!allowed.has(ext)||file.size>MAX_FILE_SIZE)return Response.json({error:file.name+" is unsupported or larger than 10 MB"},{status:400});
  try{
   const binary=atob(file.data),bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
   const text=String(file.text||"").replace(/\u0000/g," ").slice(0,120000);
   const found=suggestions(text,file.name);
   for(const key of Object.keys(combined))if(!combined[key]&&found[key as keyof typeof found])combined[key]=found[key as keyof typeof found];
   const id=uid(),safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),r2Key=ownerId+"/"+draftId+"/"+id+"-"+safe;
   await bucket.put(r2Key,bytes,{httpMetadata:{contentType:file.type||"application/octet-stream"},customMetadata:{ownerId,draftId,filename:file.name}});
   await env.DB!.prepare("INSERT INTO project_documents (id,owner_id,project_id,draft_id,filename,content_type,size_bytes,r2_key,excerpt,created_at) VALUES (?,?,NULL,?,?,?,?,?,?,?)")
    .bind(id,ownerId,draftId,file.name,file.type||"application/octet-stream",file.size,r2Key,text.slice(0,500),new Date().toISOString()).run();
   uploaded.push({id,filename:file.name,size:file.size});
  }catch(error){
   return Response.json({error:"Could not read "+file.name+". "+(error instanceof Error?error.message:"")},{status:422});
  }
 }
 return Response.json({uploaded,suggestions:combined});
}
