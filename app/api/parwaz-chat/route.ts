import { NextResponse } from "next/server";
import { processParwazChatMessage } from "@/lib/parwazChatKnowledge";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Messages array required." },
        { status: 400 }
      );
    }

    // Get the most recent user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

    if (!lastUserMessage || !lastUserMessage.content) {
      return NextResponse.json({
        reply: "How can I assist you with Parwaz.pk today? Feel free to ask about posting tasks, taking AI interviews, or managing your wallet!",
        emotion: "idle",
        isOutOfScope: false,
      });
    }

    const userText = String(lastUserMessage.content).trim();

    // Process through the Parwaz knowledge and scope guardrails engine
    const result = processParwazChatMessage(userText);

    return NextResponse.json({
      reply: result.reply,
      emotion: result.emotion,
      isOutOfScope: result.isOutOfScope,
      quickAction: result.quickAction,
      suggestedQuestions: result.suggestedQuestions,
    });
  } catch (error) {
    console.error("ParwazChat API Error:", error);
    // Never fail harshly to user - always provide safe friendly response
    return NextResponse.json({
      reply: "I am ParwazChat, your dedicated Parwaz.pk assistant. How can I help you navigate tasks, verify your skills, or hire talent today?",
      emotion: "idle",
      isOutOfScope: false,
    });
  }
}
