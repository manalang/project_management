import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "./chatgpt-auth";
import ProjectControl from "./project-control";
export const dynamic = "force-dynamic";
export default async function Home(){
  const user=await getChatGPTUser();
  if(!user)return <main className="signed-out"><div className="signed-out-card"><span className="signed-out-mark">TT</span><small>Engineering Project Control</small><h1>Task tracking for your project team</h1><p>Sign in with the ChatGPT account your workspace owner invited. Your projects and permissions will be loaded automatically.</p><a href={chatGPTSignInPath("/")} target="_top">Sign in with ChatGPT</a></div></main>;
  return <ProjectControl signOutPath={chatGPTSignOutPath("/")}/>;
}
