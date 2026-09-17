import { getChatGPTUser } from "./chatgpt-auth";
import ProjectControl from "./project-control";
export const dynamic = "force-dynamic";
export default async function Home(){
  const user=await getChatGPTUser();
  return <ProjectControl displayName={user?.displayName ?? "Dana"}/>;
}
