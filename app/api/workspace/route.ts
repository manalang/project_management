import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
const uid=()=>typeof crypto.randomUUID==="function"?crypto.randomUUID():Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);

async function owner(){return (await getChatGPTUser())?.userId ?? "local-preview"}
async function removeStarterData(ownerId:string){
 const rows=await env.DB.prepare("SELECT id FROM projects WHERE owner_id=?").bind(ownerId).all<{id:string}>();
 const ids=rows.results.map(row=>row.id);
 if(ids.length && ids.every(id=>["rca","pressure","ceres"].includes(id))){
  await env.DB.batch([
   env.DB.prepare("DELETE FROM tasks WHERE owner_id=?").bind(ownerId),
   env.DB.prepare("DELETE FROM meetings WHERE owner_id=?").bind(ownerId),
   env.DB.prepare("DELETE FROM metrics WHERE owner_id=?").bind(ownerId),
   env.DB.prepare("DELETE FROM projects WHERE owner_id=?").bind(ownerId),
  ]);
 }
}
export async function GET(){
 const o=await owner();await removeStarterData(o);
 const [p,t,m,k]=await Promise.all([
  env.DB.prepare("SELECT * FROM projects WHERE owner_id=? ORDER BY name").bind(o).all(),
  env.DB.prepare("SELECT * FROM tasks WHERE owner_id=? ORDER BY due_date").bind(o).all(),
  env.DB.prepare("SELECT * FROM meetings WHERE owner_id=? ORDER BY meeting_date").bind(o).all(),
  env.DB.prepare("SELECT * FROM metrics WHERE owner_id=? ORDER BY measured_at DESC").bind(o).all()]);
 return Response.json({projects:p.results,tasks:t.results,meetings:m.results,metrics:k.results});
}
export async function POST(req:Request){
 const o=await owner(),b=await req.json() as Record<string,unknown>;
 if(b.type==="project"){
  const id=uid();
  await env.DB.batch([
   env.DB.prepare("INSERT INTO projects VALUES (?,?,?,?,?,'Planning','good',0,?,0,?,?)")
    .bind(id,o,String(b.name),String(b.code).toUpperCase(),String(b.objective),Number(b.budget)||0,String(b.startDate),String(b.endDate)),
   env.DB.prepare("UPDATE project_documents SET project_id=? WHERE owner_id=? AND draft_id=?")
    .bind(id,o,String(b.draftId||"")),
  ]);
  return Response.json({id},{status:201});
 }
 if(b.type==="task"){const id=uid();await env.DB.prepare("INSERT INTO tasks VALUES (?,?,?,?,?,?,'Not started',?,?,?)").bind(id,o,String(b.projectId),String(b.title),String(b.assignee||"Unassigned"),String(b.dueDate),String(b.priority||"Medium"),b.critical?1:0,b.dependsOn?String(b.dependsOn):null).run();return Response.json({id},{status:201})}
 if(b.type==="task-status"){await env.DB.prepare("UPDATE tasks SET status=? WHERE id=? AND owner_id=?").bind(String(b.status),String(b.id),o).run();return Response.json({ok:true})}
 if(b.type==="task-update"){
  await env.DB.prepare("UPDATE tasks SET title=?,assignee=?,due_date=?,status=?,priority=?,critical=?,depends_on=? WHERE id=? AND owner_id=?")
   .bind(String(b.title),String(b.assignee||"Unassigned"),String(b.dueDate),String(b.status),String(b.priority||"Medium"),b.critical?1:0,b.dependsOn?String(b.dependsOn):null,String(b.id),o).run();
  return Response.json({ok:true});
 }
 if(b.type==="project-update"){
  await env.DB.prepare("UPDATE projects SET name=?,code=?,objective=?,status=?,health=?,progress=?,budget=?,spent=?,start_date=?,end_date=? WHERE id=? AND owner_id=?")
   .bind(String(b.name),String(b.code).toUpperCase(),String(b.objective),String(b.status),String(b.health),Math.max(0,Math.min(100,Number(b.progress)||0)),Number(b.budget)||0,Number(b.spent)||0,String(b.startDate),String(b.endDate),String(b.id),o).run();
  return Response.json({ok:true});
 }
 if(b.type==="meeting"){
  const id=uid();await env.DB.prepare("INSERT INTO meetings VALUES (?,?,?,?,?,?,?)").bind(id,o,String(b.projectId),String(b.title),String(b.meetingDate),String(b.agenda||""),String(b.notes||"")).run();return Response.json({id},{status:201});
 }
 if(b.type==="metric"){
  const id=uid();await env.DB.prepare("INSERT INTO metrics VALUES (?,?,?,?,?,?,?,?)").bind(id,o,String(b.projectId),String(b.name),Number(b.value)||0,Number(b.target)||0,String(b.unit||""),String(b.measuredAt)).run();return Response.json({id},{status:201});
 }
 return Response.json({error:"Unsupported action"},{status:400});
}
