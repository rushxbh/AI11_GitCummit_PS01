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
            authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik53ek53TmV1R3ptcFZTQjNVZ0J4ZyJ9.eyJodHRwczovL2QtaWQuY29tL2ZlYXR1cmVzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX2N1c3RvbWVyX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9uYW1lIjoidHJpYWwiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9zdWJzY3JpcHRpb25faWQiOiIiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9iaWxsaW5nX2ludGVydmFsIjoibW9udGgiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9wbGFuX2dyb3VwIjoiZGVpZC10cmlhbCIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX3ByaWNlX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJpY2VfY3JlZGl0cyI6IiIsImh0dHBzOi8vZC1pZC5jb20vY2hhdF9zdHJpcGVfc3Vic2NyaXB0aW9uX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9jcmVkaXRzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vcHJvdmlkZXIiOiJnb29nbGUtb2F1dGgyIiwiaHR0cHM6Ly9kLWlkLmNvbS9pc19uZXciOmZhbHNlLCJodHRwczovL2QtaWQuY29tL2FwaV9rZXlfbW9kaWZpZWRfYXQiOiIiLCJodHRwczovL2QtaWQuY29tL29yZ19pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vYXBwc192aXNpdGVkIjpbIlN0dWRpbyJdLCJodHRwczovL2QtaWQuY29tL2N4X2xvZ2ljX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jcmVhdGlvbl90aW1lc3RhbXAiOiIyMDI1LTAzLTIyVDA5OjQyOjIyLjUzOVoiLCJodHRwczovL2QtaWQuY29tL2FwaV9nYXRld2F5X2tleV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vaGFzaF9rZXkiOiJkSHFOeGZTaHNHUVdvcmZTNEROYmIiLCJodHRwczovL2QtaWQuY29tL3ByaW1hcnkiOnRydWUsImh0dHBzOi8vZC1pZC5jb20vZW1haWwiOiIyMDIyLnJ1c2hhYmguamFpbkB2ZXMuYWMuaW4iLCJodHRwczovL2QtaWQuY29tL2NvdW50cnlfY29kZSI6IklOIiwiaHR0cHM6Ly9kLWlkLmNvbS9wYXltZW50X3Byb3ZpZGVyIjoic3RyaXBlIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmQtaWQuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTAyMDk3MDA0Mjg4NDY1NTM3NjY2IiwiYXVkIjpbImh0dHBzOi8vZC1pZC51cy5hdXRoMC5jb20vYXBpL3YyLyIsImh0dHBzOi8vZC1pZC51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzQyNjM2NjQyLCJleHAiOjE3NDI3MjMwNDIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgcmVhZDpjdXJyZW50X3VzZXIgdXBkYXRlOmN1cnJlbnRfdXNlcl9tZXRhZGF0YSBvZmZsaW5lX2FjY2VzcyIsImF6cCI6Ikd6ck5JMU9yZTlGTTNFZURSZjNtM3ozVFN3MEpsUllxIn0.NNuxBEZ2ru3_1VURlaHVNdSBR81LxDma-FI1BIPOTjABCZ2jOyndYuInZdUKAT8pQlmxtUspyDd9120tVJ0pY9Pc6IWJLJG42mHHiSsBKkysWKEqOexPmD77RlEn7cyQfpt91ltV6nSW4Dc_GgSA4X8QciJfc97QhIZ-c8-VnrXkR3avDepzzu26690sOyohPrWwI99H-5Nviyj5gRrza4oH_1DbhMm-kb9VzDJ-caLAxDM4VNMQc0S_KvuImRidlJoc06ceunIyP3Af6mwJ56531Gih-EJ3tdUHPryZvPdaTNx0eONXSTSqaqBmLXEFD371wAG_wN2bPD7sZjWt2A`
          },
          body: JSON.stringify({
            source_url: 'https://res.cloudinary.com/dgkqxnmyg/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1742670258/IMG_0221_yuk7jr.jpg',
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
              'authorization': `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik53ek53TmV1R3ptcFZTQjNVZ0J4ZyJ9.eyJodHRwczovL2QtaWQuY29tL2ZlYXR1cmVzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX2N1c3RvbWVyX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9uYW1lIjoidHJpYWwiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9zdWJzY3JpcHRpb25faWQiOiIiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9iaWxsaW5nX2ludGVydmFsIjoibW9udGgiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9wbGFuX2dyb3VwIjoiZGVpZC10cmlhbCIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX3ByaWNlX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJpY2VfY3JlZGl0cyI6IiIsImh0dHBzOi8vZC1pZC5jb20vY2hhdF9zdHJpcGVfc3Vic2NyaXB0aW9uX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9jcmVkaXRzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vcHJvdmlkZXIiOiJnb29nbGUtb2F1dGgyIiwiaHR0cHM6Ly9kLWlkLmNvbS9pc19uZXciOmZhbHNlLCJodHRwczovL2QtaWQuY29tL2FwaV9rZXlfbW9kaWZpZWRfYXQiOiIiLCJodHRwczovL2QtaWQuY29tL29yZ19pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vYXBwc192aXNpdGVkIjpbIlN0dWRpbyJdLCJodHRwczovL2QtaWQuY29tL2N4X2xvZ2ljX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jcmVhdGlvbl90aW1lc3RhbXAiOiIyMDI1LTAzLTIyVDA5OjQyOjIyLjUzOVoiLCJodHRwczovL2QtaWQuY29tL2FwaV9nYXRld2F5X2tleV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vaGFzaF9rZXkiOiJkSHFOeGZTaHNHUVdvcmZTNEROYmIiLCJodHRwczovL2QtaWQuY29tL3ByaW1hcnkiOnRydWUsImh0dHBzOi8vZC1pZC5jb20vZW1haWwiOiIyMDIyLnJ1c2hhYmguamFpbkB2ZXMuYWMuaW4iLCJodHRwczovL2QtaWQuY29tL2NvdW50cnlfY29kZSI6IklOIiwiaHR0cHM6Ly9kLWlkLmNvbS9wYXltZW50X3Byb3ZpZGVyIjoic3RyaXBlIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmQtaWQuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTAyMDk3MDA0Mjg4NDY1NTM3NjY2IiwiYXVkIjpbImh0dHBzOi8vZC1pZC51cy5hdXRoMC5jb20vYXBpL3YyLyIsImh0dHBzOi8vZC1pZC51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzQyNjM2NjQyLCJleHAiOjE3NDI3MjMwNDIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgcmVhZDpjdXJyZW50X3VzZXIgdXBkYXRlOmN1cnJlbnRfdXNlcl9tZXRhZGF0YSBvZmZsaW5lX2FjY2VzcyIsImF6cCI6Ikd6ck5JMU9yZTlGTTNFZURSZjNtM3ozVFN3MEpsUllxIn0.NNuxBEZ2ru3_1VURlaHVNdSBR81LxDma-FI1BIPOTjABCZ2jOyndYuInZdUKAT8pQlmxtUspyDd9120tVJ0pY9Pc6IWJLJG42mHHiSsBKkysWKEqOexPmD77RlEn7cyQfpt91ltV6nSW4Dc_GgSA4X8QciJfc97QhIZ-c8-VnrXkR3avDepzzu26690sOyohPrWwI99H-5Nviyj5gRrza4oH_1DbhMm-kb9VzDJ-caLAxDM4VNMQc0S_KvuImRidlJoc06ceunIyP3Af6mwJ56531Gih-EJ3tdUHPryZvPdaTNx0eONXSTSqaqBmLXEFD371wAG_wN2bPD7sZjWt2A`
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