import { NextResponse } from "next/server";
import { queryRAG } from "@/utils/queryRag"; // RAG retrieval
import Chat from "@/models/Chat";
import dbConnect from "@/utils/db";
import { Ollama } from "ollama";

const ollama = new Ollama();


export async function POST(req: Request) {
  await dbConnect();
  const { userId, message, fullHistory = false } = await req.json();

  try {
    // Step 1: Retrieve relevant context from Pinecone (RAG)
    const retrievedDocs = await queryRAG(message);

    // Step 2: Fetch chat history from MongoDB
    let chat = await Chat.findOne({ user: userId });
    if (!chat) chat = new Chat({ user: userId, chatHistory: [] });

    // Step 3: Prepare messages for Ollama
    let chatHistory = chat.chatHistory.map(({ role, content }: {role: string, content: string}) => ({
      role: role === "assistant" ? "model" : "user",
      content,
    }));

    // Limit history if `fullHistory === false`
    if (!fullHistory) chatHistory = chatHistory.slice(-5);

    // Step 4: Construct the prompt
    let prompt = message;
    if (retrievedDocs.length > 0) {
      prompt = `Use the following context to answer the query:\n\n${retrievedDocs}\n\nUser: ${message}`;
    }

    // Step 5: Query Ollama
    const response = await ollama.chat({
      model: "mistral", // Change to "llama3" if using Llama 3
      messages: [...chatHistory, { role: "user", content: prompt }],
    });
    console.log(response)
    const responseText = response.message.content;

    // Step 6: Store messages in chat history
    chat.chatHistory.push({ role: "user", content: message });
    chat.chatHistory.push({ role: "model", content: responseText });
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
