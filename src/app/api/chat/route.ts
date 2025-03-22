import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    // Simple response system
    const response = `Hello! You said: "${message}". I'm a simple chatbot that echoes your messages.`;

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error("Error in chat route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({
        error: `Failed to process your request: ${errorMessage}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
