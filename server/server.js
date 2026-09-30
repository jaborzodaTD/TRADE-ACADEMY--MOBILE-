import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({limit:"64kb"}));
const port = process.env.PORT || 8787;

app.get("/health", (_req,res)=>res.json({ok:true,service:"trade-academy-ai"}));

app.post("/api/mentor", async (req,res)=>{
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(503).json({ok:false,error:"AI server is not configured yet"});
    const client = new OpenAI({apiKey:key});
    const {message, history=[], language="ru"} = req.body || {};
    if (!message || typeof message !== "string") return res.status(400).json({ok:false,error:"message is required"});
    const safeHistory = Array.isArray(history) ? history.slice(-12).filter(x=>x && (x.role==="user"||x.role==="assistant") && typeof x.content==="string").map(x=>({role:x.role,content:x.content.slice(0,4000)})) : [];
    const system = language === "tj"
      ? "Ту AI-наставники TRADE ACADEMY ҳастӣ. Ба забони тоҷикӣ ҷавоб деҳ, равшан ва омӯзишӣ. Мавзӯъҳо: Forex, price action, risk management, RSI, MACD, EMA, свечаҳо ва психология. Фоида ё натиҷаи кафолатнок ва сигнали кӯр надиҳ. Агар савол нодуруст бошад, ислоҳ кун. Қадамҳо ва мисолҳои содда истифода бар."
      : "Ты AI-наставник TRADE ACADEMY. Отвечай по-русски, ясно и по делу. Темы: Forex, price action, risk management, RSI, MACD, EMA, свечи и психология. Не обещай прибыль и не выдавай слепые гарантированные сигналы. Если вопрос неверный, исправь его. Используй шаги и простые примеры.";
    const response = await client.responses.create({model:"gpt-5.6-luna",instructions:system,input:[...safeHistory,{role:"user",content:message}],max_output_tokens:700});
    res.json({ok:true,answer:response.output_text || "Не удалось получить ответ."});
  } catch (e) {
    console.error(e);
    res.status(500).json({ok:false,error:"AI request failed"});
  }
});

app.listen(port,()=>console.log(`TRADE ACADEMY AI listening on ${port}`));
