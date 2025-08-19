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

    const model = process.env.MODEL || "gpt-4o-mini";

    // ✅ Chat Completions로 변경 (가장 호환성 좋음)
    const result = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant for a personal portfolio site." },
        { role: "user",   content: userMessage }
      ],
      temperature: 0.7,
    });

    const text = result.choices?.[0]?.message?.content?.trim() || "";
    res.json({ reply: text || "(empty)" });

  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    console.error("OpenAI error DETAIL:", err?.response?.data || err);
    return res.status(status).json({
      error: err?.response?.data?.error?.message || err?.message || "Server error",
      code: status,
    });
  }
});

    // 안전하게 텍스트 뽑기
    const text =
      r.output_text ??
      (r.output?.[0]?.content?.[0]?.text ?? "") ||
      "";

    if (!text) {
      // 혹시 구조가 바뀐 경우 대비
      return res.json({ reply: JSON.stringify(r) });
    }

    res.json({ reply: text });
  } catch (err) {
    // 🔍 자세한 에러를 로그 + 클라이언트로 전파(개발 중에만 유용)
    const status = err?.status || err?.response?.status || 500;
    const payload = err?.response?.data || { message: err?.message || "Unknown error" };
    console.error("OpenAI error DETAIL:", payload);

    // 클라이언트에도 이유를 보여줘서 빠르게 해결
    return res.status(status).json({
      error: payload?.error?.message || payload?.message || "Server error",
      code: status,
    });
  }
});
const port = process.env.PORT || 3000; // Render가 PORT를 넣어줌
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
