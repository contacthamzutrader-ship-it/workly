import { NextResponse } from "next/server";
import { processParwazChatMessage, isRomanUrdu } from "@/lib/parwazChatKnowledge";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

async function callGeminiIfAvailable(userText: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const systemPrompt = `You are WorklyChat, the official AI assistant of Workly (Pakistan's smarter freelancing marketplace).
Guidelines:
1. Always be polite, courteous, encouraging, and professional.
2. If the user writes in Roman Urdu, reply in natural, friendly Roman Urdu. If in English, reply in crisp English.
3. Keep answers concise (2-3 short paragraphs max).
4. Strictly focus on Workly marketplace topics: posting tasks, bidding, AI skill verification interviews, trust scores, and Safepay payments (held escrow, Easypaisa, JazzCash, bank payouts).
5. If the user asks out-of-scope questions (general trivia, homework, recipes), politely redirect them to Workly topics.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${userText}` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 350,
            temperature: 0.65,
          },
        }),
      }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText ? String(candidateText).trim() : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limitStatus = checkRateLimit(`chat_${ip}`, 35, 60_000);
    if (!limitStatus.success) {
      return NextResponse.json({
        reply: "You are sending messages too quickly. Please pause for a moment and try again.",
        emotion: "idle",
        isOutOfScope: false,
      }, { status: 429 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Messages array required." },
        { status: 400 }
      );
    }

    // Limit array inspection to last 30 messages to prevent payload flooding
    const safeMessages = messages.slice(-30);
    const lastUserMessage = [...safeMessages].reverse().find((m) => m && m.role === "user");

    if (!lastUserMessage || !lastUserMessage.content) {
      return NextResponse.json({
        reply: "How can I assist you with Workly today? Feel free to ask about posting tasks, taking AI interviews, or managing your wallet!",
        emotion: "idle",
        isOutOfScope: false,
      });
    }

    // Enforce max text length of 2000 chars
    const userText = String(lastUserMessage.content).trim().slice(0, 2000);

    // Process through the Workly knowledge and scope guardrails engine
    const result = processParwazChatMessage(userText);

    // If an LLM is available and query is valid, provide dynamic GenAI response
    let finalReply = result.reply;
    if (!result.isOutOfScope && process.env.GEMINI_API_KEY) {
      const aiReply = await callGeminiIfAvailable(userText);
      if (aiReply) {
        finalReply = aiReply;
      }
    }

    return NextResponse.json({
      reply: finalReply,
      emotion: result.emotion,
      isOutOfScope: result.isOutOfScope,
      quickAction: result.quickAction,
      suggestedQuestions: result.suggestedQuestions,
    });
  } catch (error) {
    console.error("WorklyChat API Error:", error);
    return NextResponse.json({
      reply: "I am WorklyChat, your dedicated Workly assistant. How can I help you navigate tasks, verify your skills, or hire talent today?",
      emotion: "idle",
      isOutOfScope: false,
    });
  }
}
