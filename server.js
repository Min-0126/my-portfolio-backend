// server.js (CommonJS - easiest on Windows)
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

const app = express();
app.use(express.json());

// 1) Serve your frontend from ../frontend
const publicDir = path.join(__dirname, "..", "frontend");
app.use(express.static(publicDir));

// 2) Optional health check (handy for quick tests)
app.post("/health", (req, res) => {
  res.json({ reply: "✅ Backend is alive. Use /api/chat for real answers." });
});

// 3) Chat endpoint that calls OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = String(req.body?.message ?? "");
    if (!userMessage.trim()) {
      return res.status(400).json({ error: "Empty message" });
    }

    // Modern Responses API
    const response = await openai.responses.create({
      model: process.env.MODEL || "gpt-4o-mini",
      input: [
        { role: "system", content: "You are a helpful assistant for a personal portfolio site." },
        { role: "user", content: userMessage }
      ],
    });

    const text = response.output_text; // concatenates text segments for you
    res.json({ reply: text });
  } catch (err) {
    console.error("OpenAI error:", err?.response?.data || err.message || err);
    res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
