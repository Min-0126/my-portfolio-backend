// server.js (Express 5 + OpenAI Chat Completions)
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();
console.log("BOOT => hasKey:", !!process.env.OPENAI_API_KEY, " node:", process.version);

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in env");
  process.exit(1);
}

const app = express();
app.use(express.json());

// CORS (GitHub Pages 오리진 허용) + 프리플라이트(OPTIONS) 직접 허용
const ALLOW_ORIGIN = "https://min-0126.github.io";
app.use(cors({
  origin: [ALLOW_ORIGIN],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", ALLOW_ORIGIN);
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    return res.sendStatus(204);
  }
  next();
});

// 브라우저 확인용
app.get("/", (req, res) => res.send("✅ Backend is up. Use POST /api/chat"));
app.get("/health", (req, res) => res.json({ ok: true }));

// (선택) 로컬에 frontend 폴더가 있을 때만 정적 서빙
const publicDir = path.join(__dirname, "..", "frontend");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === Chat endpoint (Chat Completions) ===
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = String(req.body?.message ?? "");
    if (!userMessage.trim()) {
      return res.status(400).json({ error: "Empty message" });
    }

    const model = process.env.MODEL || "gpt-4o-mini";

    const result = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant for a personal portfolio site." },
        { role: "user",   content: userMessage }
      ],
      temperature: 0.7,
    });

    const text =
      (result.choices &&
       result.choices[0] &&
       result.choices[0].message &&
       result.choices[0].message.content || "").trim();

    return res.json({ reply: text });

  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    const detail = err?.response?.data || { message: err?.message || "Server error" };
    console.error("OpenAI error DETAIL:", detail);
    return res.status(status).json({
      error: detail?.error?.message || detail?.message || "Server error",
      code: status,
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
