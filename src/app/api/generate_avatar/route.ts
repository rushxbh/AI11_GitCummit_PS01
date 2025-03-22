// app/api/generate-avatar/route.ts (for App Router)
// or pages/api/generate-avatar.ts (for Pages Router)

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Step 1: Create a talk request
    const createOptions = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${process.env.DID_API_KEY}`
      },
      body: JSON.stringify({
        source_url: 'https://studio.d-id.com/agents/share?id=agt_7PwG8P1B&utm_source=copy&key=WjI5dloyeGxMVzloZFhSb01ud3hNREl3T1Rjd01EUXlPRGcwTmpVMU16YzJOalk2Y3pWdWRHTklOalJoVUdwSk5sVjVOV3cxTUV0TQ==',
        script: {
          type: 'text',
          subtitles: false,
          provider: { type: 'microsoft', voice_id: 'Sara' },
          input: message.substring(0, 1000), // Limit length
          ssml: false
        },
        config: { 
          fluent: true,
          result_format: 'mp4'
        }
      })
    };

    const createResponse = await fetch('https://api.d-id.com/talks', createOptions);
    const createData = await createResponse.json();

    if (!createResponse.ok) {
      return NextResponse.json({ error: createData.error || "Failed to create D-ID talk" }, { status: 500 });
    }

    const talkId = createData.id;

    // Step 2: Poll for the talk to be ready
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 30; // Timeout after ~30 seconds

    while (!resultUrl && attempts < maxAttempts) {
      attempts++;

      const statusOptions = {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${process.env.DID_API_KEY}`
        }
      };

      const statusResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, statusOptions);
      const statusData = await statusResponse.json();

      if (statusData.status === "done") {
        resultUrl = statusData.result_url;
        break;
      } else if (statusData.status === "error") {
        return NextResponse.json({ error: "D-ID processing failed" }, { status: 500 });
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (resultUrl) {
      return NextResponse.json({ videoUrl: resultUrl }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Timed out waiting for D-ID processing" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error generating D-ID avatar:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate avatar video" 
    }, { status: 500 });
  }
}

// For Pages Router (if needed)
// export default async function handler(req, res) {...}