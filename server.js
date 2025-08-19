// server.js (CommonJS)
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

// ✅ CORS: GitHub Pages 오리진 허용 + 프리플라이트 허용
app.use(cors({
  origin: ["https://min-0126.github.io"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", "https://min-0126.github.io");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    return res.sendStatus(204);
  }
  next();
});

// ✅ 브라우저에서 확인용 라우트 (이게 없으면 'Cannot GET /'가 뜸)
app.get("/", (req, res) => {
  res.send("✅ Backend is up. Use POST /api/chat");
});

// ✅ 헬스 체크 (브라우저에서 바로 확인 가능)
app.get("/health", (req, res) => {
  res.json({ ok: true, hint: "Use POST /api/chat" });
});

// (선택) 로컬에 frontend 폴더가 있을 때만 정적 서빙
const publicDir = path.join(__dirname, "..", "frontend");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// 🤖 Chat endpoint: OpenAI 호출
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = String(req.body?.message ?? "");
    if (!userMessage.trim()) {
      return res.status(400).json({ error: "Empty message" });
    }

    const response = await openai.responses.create({
      model: process.env.MODEL || "gpt-4o-mini",
      input: [
        { role: "system", content: "You are a helpful assistant for a personal portfolio site." },
        { role: "user", content: userMessage }
      ],
    });

    res.json({ reply: response.output_text });
  } catch (err) {
    console.error("OpenAI error:", err?.response?.data || err.message || err);
    res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 3000; // Render가 PORT를 넣어줌
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
