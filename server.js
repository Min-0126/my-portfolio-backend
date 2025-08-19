// server.js (CommonJS - easiest on Windows)
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

const app = express();
app.use(express.json());

// 🔒 GitHub Pages 오리진 허용 (경로 /WebPage는 넣지 않음)
app.use(cors({
  origin: ["https://min-0126.github.io"],
}));

// (선택) 로컬 개발 시에만 프론트 폴더 서빙
const publicDir = path.join(__dirname, "..", "frontend");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// ✅ health
app.post("/health", (req, res) => {
  res.json({ reply: "✅ Backend is alive. Use /api/chat for real answers." });
});

// 🤖 Chat endpoint that calls OpenAI
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

    const text = response.output_text;
    res.json({ reply: text });
  } catch (err) {
    console.error("OpenAI error:", err?.response?.data || err.message || err);
    res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 3000; // Render가 PORT 넣어줌
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
