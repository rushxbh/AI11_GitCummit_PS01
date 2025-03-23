import { NextResponse } from "next/server";
import { queryRAG } from "@/utils/queryRag";
import Chat from "@/models/Chat";
import dbConnect from "@/utils/db";

export async function POST(req: Request) {
  await dbConnect();
  const { userId, message } = await req.json();

  try {
    // Get AI response
    const responseText = await queryRAG(message);

    // Find existing chat document for the user
    let chat = await Chat.findOne({ user: userId });

    if (!chat) {
      // If no chat document exists, create a new one
      chat = new Chat({ user: userId, chatHistory: [] });
    }

    // Append new messages to chatHistory
    chat.chatHistory.push({ role: "user", content: message });
    chat.chatHistory.push({ role: "model", content: responseText });

    // Save updated chat document
    await chat.save();

    return NextResponse.json({ content: responseText });
  } catch (error) {
    console.error("Error processing chat:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect(); // Ensure DB is connected

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const chat = await Chat.findOne({ user: userId });

    if (!chat) {
      return NextResponse.json({ chatHistory: [] }); // Return empty history if no chat found
    }

    return NextResponse.json({ chatHistory: chat.chatHistory });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}
