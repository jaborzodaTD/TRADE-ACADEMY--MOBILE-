import { askMentor, MentorLang, MentorResult } from './mentorEngine';

const AI_URL = process.env.EXPO_PUBLIC_AI_URL || '';

export async function askOnlineMentor(question:string, lang:MentorLang, history:string[]=[]):Promise<MentorResult>{
  if (!AI_URL) return askMentor(question, lang, history);
  try {
    const r=await fetch(AI_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,lang,history:history.slice(-12)})});
    const data=await r.json();
    if(!r.ok || !data?.text) throw new Error(data?.error||'AI request failed');
    return {text:String(data.text),topic:'AI Mentor',suggestions:[]};
  }catch{
    return askMentor(question,lang,history);
  }
}
