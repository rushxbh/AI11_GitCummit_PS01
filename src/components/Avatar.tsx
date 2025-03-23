"use client";

import { useEffect, useRef, useState } from "react";

interface AvatarProps {
  assistantMessage?: string;
}

export default function Avatar({ assistantMessage }: AvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate a new video when assistantMessage changes
  useEffect(() => {
    if (!assistantMessage || assistantMessage.trim() === "") return;

    const generateVideo = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Step 1: Create a talk request
        const createOptions = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik53ek53TmV1R3ptcFZTQjNVZ0J4ZyJ9.eyJodHRwczovL2QtaWQuY29tL2ZlYXR1cmVzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX2N1c3RvbWVyX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9uYW1lIjoidHJpYWwiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9zdWJzY3JpcHRpb25faWQiOiIiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9iaWxsaW5nX2ludGVydmFsIjoibW9udGgiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9wbGFuX2dyb3VwIjoiZGVpZC10cmlhbCIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX3ByaWNlX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJpY2VfY3JlZGl0cyI6IiIsImh0dHBzOi8vZC1pZC5jb20vY2hhdF9zdHJpcGVfc3Vic2NyaXB0aW9uX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9jcmVkaXRzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vcHJvdmlkZXIiOiJnb29nbGUtb2F1dGgyIiwiaHR0cHM6Ly9kLWlkLmNvbS9pc19uZXciOmZhbHNlLCJodHRwczovL2QtaWQuY29tL2FwaV9rZXlfbW9kaWZpZWRfYXQiOiIiLCJodHRwczovL2QtaWQuY29tL29yZ19pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vYXBwc192aXNpdGVkIjpbIlN0dWRpbyJdLCJodHRwczovL2QtaWQuY29tL2N4X2xvZ2ljX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jcmVhdGlvbl90aW1lc3RhbXAiOiIyMDI1LTAzLTIyVDA5OjQxOjA3LjMxOFoiLCJodHRwczovL2QtaWQuY29tL2FwaV9nYXRld2F5X2tleV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vaGFzaF9rZXkiOiJnV2tPVmJDMnRPU2pNNHNsTlVQalUiLCJodHRwczovL2QtaWQuY29tL3ByaW1hcnkiOnRydWUsImh0dHBzOi8vZC1pZC5jb20vZW1haWwiOiJndXB0YS5hZGl0eWEyMzA5QGdtYWlsLmNvbSIsImh0dHBzOi8vZC1pZC5jb20vY291bnRyeV9jb2RlIjoiSU4iLCJodHRwczovL2QtaWQuY29tL3BheW1lbnRfcHJvdmlkZXIiOiJzdHJpcGUiLCJpc3MiOiJodHRwczovL2F1dGguZC1pZC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDAxNjczODA0NjY0MTE3MDg1ODciLCJhdWQiOlsiaHR0cHM6Ly9kLWlkLnVzLmF1dGgwLmNvbS9hcGkvdjIvIiwiaHR0cHM6Ly9kLWlkLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3NDI3MjcwMTgsImV4cCI6MTc0MjgxMzQxOCwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCByZWFkOmN1cnJlbnRfdXNlciB1cGRhdGU6Y3VycmVudF91c2VyX21ldGFkYXRhIG9mZmxpbmVfYWNjZXNzIiwiYXpwIjoiR3pyTkkxT3JlOUZNM0VlRFJmM20zejNUU3cwSmxSWXEifQ.Hoj33OABUQLY10_sh9JwzZTRofzUrB6p0EYX4OvDMUIwX_3EfwRNmPhBN77awXevbu1_5zyZ4TKbTrJOOlsuqDQ6ZodLnFBfxOrF6YWiAwUuxfuhlu86JdcMjoy2laMzba6cgI3qmlwXDVrXDiOFQ_5ggiAMUt2XEG16avxC1phbr3fyg86h8x2g0VML04UCJ7kqL4OJt-3jDvBJJ4cIlE6hLtcKXI1kOON5-TEIrePsfA4TXLKTdREZ2z8VvdFpKiwiCrLLCaMFJMzoVyeCQc-Su5QivtlDia2wFR3f7V86lDxHZzCiDQSvU8QIPjfkvsafcYKbFbUcO6BhU_tfkw`
          },
          body: JSON.stringify({
            source_url: 'https://i.pinimg.com/736x/29/77/de/2977defdc1048cc251b9a7950a384ca3.jpg',
            script: {
              type: 'text',
              subtitles: 'false',
              provider: {type: 'microsoft', voice_id: 'Sara'},
              input: assistantMessage.trim().substring(0, 1000),
              ssml: 'false'
            },
            config: {fluent: 'false'}
          })
        };
        
        console.log("Creating D-ID talk...");
        const createResponse = await fetch('https://api.d-id.com/talks', createOptions);
        const createData = await createResponse.json();
        
        if (!createResponse.ok) {
          throw new Error(createData.error || "Failed to create D-ID talk");
        }
        
        const talkId = createData.id;
        console.log("Talk created with ID:", talkId);
        
        // Step 2: Poll for the talk to be ready
        let resultUrl = null;
        let attempts = 0;
        const maxAttempts = 30; // Max 30 seconds wait time
        
        while (!resultUrl && attempts < maxAttempts) {
          attempts++;
          console.log(`Polling attempt ${attempts}...`);
          
          const statusOptions = {
            method: 'GET', 
            headers: {
              'accept': 'application/json',
              'authorization': `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik53ek53TmV1R3ptcFZTQjNVZ0J4ZyJ9.eyJodHRwczovL2QtaWQuY29tL2ZlYXR1cmVzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX2N1c3RvbWVyX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9uYW1lIjoidHJpYWwiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9zdWJzY3JpcHRpb25faWQiOiIiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9iaWxsaW5nX2ludGVydmFsIjoibW9udGgiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9wbGFuX2dyb3VwIjoiZGVpZC10cmlhbCIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX3ByaWNlX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJpY2VfY3JlZGl0cyI6IiIsImh0dHBzOi8vZC1pZC5jb20vY2hhdF9zdHJpcGVfc3Vic2NyaXB0aW9uX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9jcmVkaXRzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vcHJvdmlkZXIiOiJnb29nbGUtb2F1dGgyIiwiaHR0cHM6Ly9kLWlkLmNvbS9pc19uZXciOmZhbHNlLCJodHRwczovL2QtaWQuY29tL2FwaV9rZXlfbW9kaWZpZWRfYXQiOiIiLCJodHRwczovL2QtaWQuY29tL29yZ19pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vYXBwc192aXNpdGVkIjpbIlN0dWRpbyJdLCJodHRwczovL2QtaWQuY29tL2N4X2xvZ2ljX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jcmVhdGlvbl90aW1lc3RhbXAiOiIyMDI1LTAzLTIyVDA5OjQxOjA3LjMxOFoiLCJodHRwczovL2QtaWQuY29tL2FwaV9nYXRld2F5X2tleV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vaGFzaF9rZXkiOiJnV2tPVmJDMnRPU2pNNHNsTlVQalUiLCJodHRwczovL2QtaWQuY29tL3ByaW1hcnkiOnRydWUsImh0dHBzOi8vZC1pZC5jb20vZW1haWwiOiJndXB0YS5hZGl0eWEyMzA5QGdtYWlsLmNvbSIsImh0dHBzOi8vZC1pZC5jb20vY291bnRyeV9jb2RlIjoiSU4iLCJodHRwczovL2QtaWQuY29tL3BheW1lbnRfcHJvdmlkZXIiOiJzdHJpcGUiLCJpc3MiOiJodHRwczovL2F1dGguZC1pZC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDAxNjczODA0NjY0MTE3MDg1ODciLCJhdWQiOlsiaHR0cHM6Ly9kLWlkLnVzLmF1dGgwLmNvbS9hcGkvdjIvIiwiaHR0cHM6Ly9kLWlkLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3NDI3MjcwMTgsImV4cCI6MTc0MjgxMzQxOCwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCByZWFkOmN1cnJlbnRfdXNlciB1cGRhdGU6Y3VycmVudF91c2VyX21ldGFkYXRhIG9mZmxpbmVfYWNjZXNzIiwiYXpwIjoiR3pyTkkxT3JlOUZNM0VlRFJmM20zejNUU3cwSmxSWXEifQ.Hoj33OABUQLY10_sh9JwzZTRofzUrB6p0EYX4OvDMUIwX_3EfwRNmPhBN77awXevbu1_5zyZ4TKbTrJOOlsuqDQ6ZodLnFBfxOrF6YWiAwUuxfuhlu86JdcMjoy2laMzba6cgI3qmlwXDVrXDiOFQ_5ggiAMUt2XEG16avxC1phbr3fyg86h8x2g0VML04UCJ7kqL4OJt-3jDvBJJ4cIlE6hLtcKXI1kOON5-TEIrePsfA4TXLKTdREZ2z8VvdFpKiwiCrLLCaMFJMzoVyeCQc-Su5QivtlDia2wFR3f7V86lDxHZzCiDQSvU8QIPjfkvsafcYKbFbUcO6BhU_tfkw`
            }
          };
          
          const statusResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, statusOptions);
          const statusData = await statusResponse.json();
          
          if (statusData.status === "done") {
            resultUrl = statusData.result_url;
            console.log("Video ready:", resultUrl);
            break;
          } else if (statusData.status === "error") {
            throw new Error("D-ID processing failed");
          }
          
          // Wait for 1 second before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (resultUrl) {
          setVideoUrl(resultUrl);
        } else {
          throw new Error("Timed out waiting for D-ID processing");
        }
      } catch (error) {
        console.error("Error generating video:", error);
        setError(error instanceof Error ? error.message : "Failed to generate video");
      } finally {
        setIsLoading(false);
      }
    };
    
    generateVideo();
  }, [assistantMessage]);
  
  // Handle video ended
  const handleVideoEnded = () => {
    setVideoUrl(null);
  };
  
  return (
    <div className="relative w-64 h-64 mx-auto mb-4 bg-gray-800 rounded-full overflow-hidden">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          controls={false}
          onEnded={handleVideoEnded}
          onError={() => {
            console.error("Video error");
            setError("Failed to play video");
            setVideoUrl(null);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {!isLoading && !error && (
            <p className="text-white text-sm text-center p-4">AI Avatar will appear here</p>
          )}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 text-center">
          {error}
        </div>
      )}
    </div>
  );
}