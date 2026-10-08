import {env} from "cloudflare:workers";
import {getChatGPTUser} from "../../chatgpt-auth";
const uid=()=>typeof crypto.randomUUID==="function"?crypto.randomUUID():Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
type Access={userId:string;email:string;name:string;ownerId:string;role:"owner"|"admin"|"member";memberId?:string;canManage:boolean};

async function access():Promise<Access|null>{
 const user=await getChatGPTUser();if(!user)return null;
 const owned=await env.DB.prepare("SELECT owner_id FROM projects WHERE owner_id=? LIMIT 1").bind(user.userId).first<{owner_id:string}>();
 if(owned)return{userId:user.userId,email:user.email.toLowerCase(),name:user.displayName,ownerId:user.userId,role:"owner",canManage:true};
 const member=await env.DB.prepare("SELECT id,workspace_owner_id,role,name FROM workspace_members WHERE lower(email)=lower(?) LIMIT 1").bind(user.email).first<{id:string;workspace_owner_id:string;role:string;name:string}>();
 if(!member)return{userId:user.userId,email:user.email.toLowerCase(),name:user.displayName,ownerId:"",role:"member",canManage:false};
 const role=member.role==="admin"?"admin":"member";return{userId:user.userId,email:user.email.toLowerCase(),name:member.name||user.displayName,ownerId:member.workspace_owner_id,role,memberId:member.id,canManage:role==="admin"};
}
const assigned=(assignee:string,email:string)=>assignee.split(/[,;]+/).some(value=>value.trim().toLowerCase()===email);
async function visibleProject(a:Access,projectId:string){
 if(a.canManage)return !!await env.DB.prepare("SELECT id FROM projects WHERE id=? AND owner_id=?").bind(projectId,a.ownerId).first();
 return !!await env.DB.prepare("SELECT pa.id FROM project_access pa JOIN projects p ON p.id=pa.project_id WHERE pa.member_id=? AND pa.project_id=? AND p.owner_id=?").bind(a.memberId,projectId,a.ownerId).first();
}

export async function GET(){
 const a=await access();if(!a)return Response.json({error:"Sign in required"},{status:401});if(!a.ownerId)return Response.json({error:"Your email has not been invited to this tracker",email:a.email},{status:403});
 const projectQuery=a.canManage?env.DB.prepare("SELECT * FROM projects WHERE owner_id=? ORDER BY name").bind(a.ownerId):env.DB.prepare("SELECT p.* FROM projects p JOIN project_access pa ON pa.project_id=p.id WHERE pa.member_id=? AND p.owner_id=? ORDER BY p.name").bind(a.memberId,a.ownerId);
 const taskQuery=a.canManage?env.DB.prepare("SELECT * FROM tasks WHERE owner_id=? ORDER BY due_date").bind(a.ownerId):env.DB.prepare("SELECT DISTINCT t.* FROM tasks t JOIN project_access pa ON pa.project_id=t.project_id WHERE pa.member_id=? AND t.owner_id=? ORDER BY t.due_date").bind(a.memberId,a.ownerId);
 const [p,t]=await Promise.all([projectQuery.all(),taskQuery.all()]);
 let members:any[]=[];let projectAccess:any[]=[];
 if(a.canManage){const [m,pa]=await Promise.all([env.DB.prepare("SELECT * FROM workspace_members WHERE workspace_owner_id=? ORDER BY name,email").bind(a.ownerId).all(),env.DB.prepare("SELECT pa.* FROM project_access pa JOIN workspace_members wm ON wm.id=pa.member_id WHERE wm.workspace_owner_id=?").bind(a.ownerId).all()]);members=m.results;projectAccess=pa.results}
 return Response.json({projects:p.results,tasks:t.results,members,projectAccess,currentUser:{email:a.email,name:a.name,role:a.role,canManage:a.canManage}});
}

export async function POST(req:Request){
 const a=await access();if(!a)return Response.json({error:"Sign in required"},{status:401});if(!a.ownerId)return Response.json({error:"Access denied"},{status:403});
 const b=await req.json() as Record<string,unknown>;
 if(b.type==="member-upsert"){
  if(!a.canManage)return Response.json({error:"Administrator access required"},{status:403});
  const email=String(b.email||"").trim().toLowerCase(),name=String(b.name||email),role=b.role==="admin"?"admin":"member";if(!email.includes("@"))return Response.json({error:"Enter a valid email"},{status:400});
  const existing=await env.DB.prepare("SELECT id FROM workspace_members WHERE workspace_owner_id=? AND lower(email)=lower(?)").bind(a.ownerId,email).first<{id:string}>(),id=existing?.id||uid();
  const statements=[existing?env.DB.prepare("UPDATE workspace_members SET name=?,role=? WHERE id=? AND workspace_owner_id=?").bind(name,role,id,a.ownerId):env.DB.prepare("INSERT INTO workspace_members (id,workspace_owner_id,email,name,role,created_at) VALUES (?,?,?,?,?,?)").bind(id,a.ownerId,email,name,role,new Date().toISOString()),env.DB.prepare("DELETE FROM project_access WHERE member_id=?").bind(id)];
  if(role!=="admin")for(const projectId of Array.isArray(b.projectIds)?b.projectIds:[])if(await visibleProject(a,String(projectId)))statements.push(env.DB.prepare("INSERT INTO project_access (id,member_id,project_id,project_role) VALUES (?,?,?,?)").bind(uid(),id,String(projectId),String(b.projectRole||"resource")));
  await env.DB.batch(statements);return Response.json({id},{status:existing?200:201});
 }
 if(b.type==="project"){
  if(!a.canManage)return Response.json({error:"Administrator access required"},{status:403});const id=uid();await env.DB.prepare("INSERT INTO projects VALUES (?,?,?,?,?,'Planning','good',0,?,0,?,?)").bind(id,a.ownerId,String(b.name),String(b.code).toUpperCase(),String(b.objective||""),Number(b.budget)||0,String(b.startDate),String(b.endDate)).run();return Response.json({id},{status:201});
 }
 if(b.type==="task"){
  if(!a.canManage||!await visibleProject(a,String(b.projectId)))return Response.json({error:"Administrator access required"},{status:403});const id=uid();await env.DB.prepare("INSERT INTO tasks (id,owner_id,project_id,title,assignee,due_date,status,priority,critical,depends_on,parent_id,description,notes) VALUES (?,?,?,?,?,?,?,?,0,NULL,?,?,?)").bind(id,a.ownerId,String(b.projectId),String(b.title),String(b.assignee||"Unassigned"),String(b.dueDate),String(b.status||"Not started"),String(b.priority||"Medium"),b.parentId?String(b.parentId):null,String(b.description||""),String(b.notes||"")).run();return Response.json({id},{status:201});
 }
 if(b.type==="task-status"||b.type==="task-update"){
  const task=await env.DB.prepare("SELECT * FROM tasks WHERE id=? AND owner_id=?").bind(String(b.id),a.ownerId).first<any>();if(!task)return Response.json({error:"Task not found"},{status:404});if(!a.canManage&&!assigned(String(task.assignee),a.email))return Response.json({error:"You can edit only tasks assigned to your email"},{status:403});
  if(b.type==="task-status"){await env.DB.prepare("UPDATE tasks SET status=? WHERE id=? AND owner_id=?").bind(String(b.status),String(b.id),a.ownerId).run();return Response.json({ok:true})}
  const projectId=a.canManage?String(b.projectId):String(task.project_id),parentId=a.canManage?(b.parentId?String(b.parentId):null):task.parent_id;await env.DB.prepare("UPDATE tasks SET project_id=?,title=?,assignee=?,due_date=?,status=?,priority=?,parent_id=?,description=?,notes=? WHERE id=? AND owner_id=?").bind(projectId,String(b.title),a.canManage?String(b.assignee||"Unassigned"):String(task.assignee),String(b.dueDate),String(b.status),String(b.priority||"Medium"),parentId,String(b.description||""),String(b.notes||""),String(b.id),a.ownerId).run();return Response.json({ok:true});
 }
 return Response.json({error:"Unsupported action"},{status:400});
}
