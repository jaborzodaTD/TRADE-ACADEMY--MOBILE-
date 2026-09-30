import { askMentor, MentorLang, MentorResult } from './mentorEngine';

const AI_URL = process.env.EXPO_PUBLIC_AI_URL || '';

export async function askOnlineMentor(question:string, lang:MentorLang, history:string[]=[]):Promise<MentorResult>{
  if (!AI_URL) return askMentor(question, lang, history);

  try {
    const r=await fetch(AI_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        message:question,
        language:lang,
        history:history.slice(-12).map(x=>{
          const i=x.indexOf(': ');
          return i>0
            ? {role:x.slice(0,i)==='YOU'?'user':'assistant',content:x.slice(i+2)}
            : {role:'user',content:x};
        })
      })
    });

    const data=await r.json();
    if(!r.ok || !data?.answer) throw new Error(data?.error||'AI request failed');

    return {
      text:String(data.answer),
      topic:'AI Mentor',
      suggestions:[]
    };
  }catch{
    return askMentor(question, lang, history);
  }
}
