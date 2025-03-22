import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Chat from "@/models/Chat"; // Import your Chat model
import  connectDB  from "@/utils/db"; // Your MongoDB connection function

export async function POST(request: Request) {
  try {
    await connectDB(); // Ensure DB is connected

    const { userId, message } = await request.json();
    if (!userId || !message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Initialize Gemini API
    const key=process.env.GEMINI_API_KEY
    if(!key) return NextResponse.json({error: "API not configured"}, {status: 500})
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Define AI prompt
    const prompt = `Hello, you are a trading AI. Provide clear, definitive, and precise answers (not too long). Only help with trading queries. User's question: "${message}"`;

    // Generate AI response
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Find or create a chat document for this user
    let chat = await Chat.findOne({ user: userId });
    if (!chat) {
      chat = new Chat({ user: userId, chatHistory: [] });
    }

    // Append user message & AI response
    chat.chatHistory.push({ role: "user", content: message });
    chat.chatHistory.push({ role: "model", content: response });

    // Save to MongoDB
    await chat.save();

    // Return updated chat history
    return NextResponse.json({ chatHistory: chat.chatHistory });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB(); // Ensure DB is connected

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
