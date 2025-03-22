"use client";

import { useEffect, useRef } from "react";

interface AvatarProps {
  isAnimating: boolean;
  lipSyncData?: number[];
}

export default function Avatar({ isAnimating, lipSyncData }: AvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blinkState, setBlinkState] = useState(false);
  const [mouthOpenness, setMouthOpenness] = useState(0);
  
  // Animation frame tracking
  const animationFrameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    // Set up blink animation
    const blinkInterval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 200);
    }, Math.random() * 3000 + 2000); // Random blink between 2-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    // Handle lip sync animation
    if (isAnimating) {
      // Simple mouth animation when no lip sync data
      const animateMouth = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const deltaTime = timestamp - lastTimeRef.current;
        
        if (deltaTime > 100) {
          // Generate random mouth movement when speaking
          if (!lipSyncData) {
            setMouthOpenness(Math.sin(timestamp / 150) * 0.5 + 0.5);
          } else {
            // Use actual lip sync data if available
            const index = Math.floor((timestamp / 100) % lipSyncData.length);
            setMouthOpenness(lipSyncData[index] / 100);
          }
          lastTimeRef.current = timestamp;
        }
        
        animationFrameIdRef.current = requestAnimationFrame(animateMouth);
      };
      
      animationFrameIdRef.current = requestAnimationFrame(animateMouth);
    } else {
      setMouthOpenness(0);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isAnimating, lipSyncData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Placeholder for avatar rendering
    const drawPlaceholderAvatar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#4B5563";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
      ctx.fill();

      // Draw a simple face
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;

      // Eyes
      ctx.beginPath();
      ctx.arc(canvas.width / 2 - 15, canvas.height / 2 - 10, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(canvas.width / 2 + 15, canvas.height / 2 - 10, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Mouth - animated based on isAnimating
      ctx.beginPath();
      if (isAnimating) {
        ctx.arc(canvas.width / 2, canvas.height / 2 + 15, 10, 0, Math.PI);
      } else {
        ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2 + 15);
        ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2 + 15);
      }
      ctx.stroke();
    };

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      drawPlaceholderAvatar();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAnimating, lipSyncData]);

  return (
    <div className="relative w-32 h-32 mx-auto mb-4">
      <canvas
        ref={canvasRef}
        width={128}
        height={128}
        className="rounded-full bg-gray-700"
      />
    </div>
  );
}