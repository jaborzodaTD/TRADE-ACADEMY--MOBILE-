export default async function handler(req,res){
  if(req.method==='GET'){
    return res.status(200).json({ok:true,service:'trade-academy-ai'});
  }
  if(req.method!=='POST'){
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }

  try{
    const key=process.env.OPENAI_API_KEY;
    if(!key)return res.status(503).json({ok:false,error:'AI server is not configured'});
    const body=req.body||{};
    const message=typeof body.message==='string'?body.message.trim():'';
    const language=body.language==='tj'?'tj':'ru';
    const history=Array.isArray(body.history)?body.history.slice(-12).filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,4000)})):[];
    if(!message)return res.status(400).json({ok:false,error:'message is required'});

    const instructions=language==='tj'
      ? 'Ту AI-наставники TRADE ACADEMY ҳастӣ. Ба забони тоҷикӣ ҷавоб деҳ. Мавзӯъҳо: Forex, price action, risk management, RSI, MACD, EMA, шамъҳо ва психология. Ҷавобҳоро гуногун, дақиқ ва омӯзишӣ соз. Фоидаи кафолатнок ё сигнали кӯр надиҳ. Агар савол норавшан бошад, онро равшан кун.'
      : 'Ты AI-наставник TRADE ACADEMY. Отвечай по-русски. Темы: Forex, price action, risk management, RSI, MACD, EMA, свечи и психология. Отвечай по существу и по-разному в зависимости от вопроса и контекста. Не обещай гарантированную прибыль и не выдавай слепые гарантированные сигналы. Если вопрос неясный, уточни его.';

    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization:'Bearer '+key},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||'gpt-5.6-luna',
        instructions,
        input:[...history,{role:'user',content:message}],
        max_output_tokens:700
      })
    });

    const data=await response.json();
    if(!response.ok)return res.status(response.status).json({ok:false,error:data?.error?.message||'OpenAI request failed'});
    return res.status(200).json({ok:true,answer:data.output_text||'Не удалось получить ответ.'});
  }catch(error){
    console.error(error);
    return res.status(500).json({ok:false,error:'AI request failed'});
  }
}
