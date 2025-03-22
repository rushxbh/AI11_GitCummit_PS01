"use client";

import { useEffect, useRef, useState } from "react";

interface AvatarProps {
  isAnimating: boolean;
  emotion?: "neutral" | "happy" | "thinking" | "confused";
  lipSyncData?: number[];
}

export default function Avatar({ 
  isAnimating, 
  emotion = "neutral", 
  lipSyncData 
}: AvatarProps) {
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
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw avatar
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 60;

    // Avatar background/face
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.8,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, "#5A67D8");
    gradient.addColorStop(1, "#3C366B");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw eyes based on blink state and emotion
    const eyeY = centerY - 10;
    const leftEyeX = centerX - 20;
    const rightEyeX = centerX + 20;
    
    ctx.fillStyle = "#FFFFFF";
    
    if (!blinkState) {
      // Eyes open
      const eyeSize = 10;
      
      // Left eye
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Right eye
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils - position based on emotion
      let pupilOffsetX = 0;
      let pupilOffsetY = 0;
      
      switch (emotion) {
        case "thinking":
          pupilOffsetX = 3;
          pupilOffsetY = -3;
          break;
        case "confused":
          pupilOffsetX = Math.sin(Date.now() / 500) * 3;
          break;
        case "happy":
          pupilOffsetY = 2;
          break;
      }
      
      ctx.fillStyle = "#000000";
      
      // Left pupil
      ctx.beginPath();
      ctx.arc(leftEyeX + pupilOffsetX, eyeY + pupilOffsetY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Right pupil
      ctx.beginPath();
      ctx.arc(rightEyeX + pupilOffsetX, eyeY + pupilOffsetY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Blink animation - draw lines instead of circles
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      
      // Left eye blink
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 8, eyeY);
      ctx.lineTo(leftEyeX + 8, eyeY);
      ctx.stroke();
      
      // Right eye blink
      ctx.beginPath();
      ctx.moveTo(rightEyeX - 8, eyeY);
      ctx.lineTo(rightEyeX + 8, eyeY);
      ctx.stroke();
    }

    // Draw mouth based on speaking state and emotion
    const mouthY = centerY + 20;
    const mouthWidth = 40;
    const mouthHeight = 15 * mouthOpenness;
    
    ctx.fillStyle = "#000000";
    
    if (emotion === "happy") {
      // Happy mouth - smile curve
      ctx.beginPath();
      ctx.moveTo(centerX - mouthWidth/2, mouthY);
      ctx.quadraticCurveTo(
        centerX, 
        mouthY + (isAnimating ? mouthHeight + 5 : 15), 
        centerX + mouthWidth/2, 
        mouthY
      );
      ctx.fill();
    } else {
      // Normal mouth - oval or line
      ctx.beginPath();
      if (mouthOpenness > 0.1) {
        // Open mouth when speaking
        ctx.ellipse(
          centerX, 
          mouthY, 
          mouthWidth / 2, 
          mouthHeight, 
          0, 
          0, 
          Math.PI * 2
        );
      } else {
        // Closed mouth when not speaking
        ctx.moveTo(centerX - mouthWidth/2, mouthY);
        ctx.lineTo(centerX + mouthWidth/2, mouthY);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fill();
    }

    // Add eyebrows based on emotion
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    
    const eyebrowY = eyeY - 15;
    const eyebrowLength = 15;
    
    // Left eyebrow
    ctx.beginPath();
    if (emotion === "thinking") {
      // Raised eyebrow for thinking
      ctx.moveTo(leftEyeX - eyebrowLength/2, eyebrowY + 3);
      ctx.lineTo(leftEyeX + eyebrowLength/2, eyebrowY - 3);
    } else if (emotion === "confused") {
      // Furrowed brow for confusion
      ctx.moveTo(leftEyeX - eyebrowLength/2, eyebrowY);
      ctx.lineTo(leftEyeX + eyebrowLength/2, eyebrowY + 5);
    } else if (emotion === "happy") {
      // Happy eyebrows
      ctx.moveTo(leftEyeX - eyebrowLength/2, eyebrowY);
      ctx.lineTo(leftEyeX + eyebrowLength/2, eyebrowY - 3);
    } else {
      // Neutral eyebrows
      ctx.moveTo(leftEyeX - eyebrowLength/2, eyebrowY);
      ctx.lineTo(leftEyeX + eyebrowLength/2, eyebrowY);
    }
    ctx.stroke();
    
    // Right eyebrow
    ctx.beginPath();
    if (emotion === "thinking") {
      // Raised eyebrow for thinking
      ctx.moveTo(rightEyeX - eyebrowLength/2, eyebrowY - 3);
      ctx.lineTo(rightEyeX + eyebrowLength/2, eyebrowY + 3);
    } else if (emotion === "confused") {
      // Furrowed brow for confusion
      ctx.moveTo(rightEyeX - eyebrowLength/2, eyebrowY + 5);
      ctx.lineTo(rightEyeX + eyebrowLength/2, eyebrowY);
    } else if (emotion === "happy") {
      // Happy eyebrows
      ctx.moveTo(rightEyeX - eyebrowLength/2, eyebrowY - 3);
      ctx.lineTo(rightEyeX + eyebrowLength/2, eyebrowY);
    } else {
      // Neutral eyebrows
      ctx.moveTo(rightEyeX - eyebrowLength/2, eyebrowY);
      ctx.lineTo(rightEyeX + eyebrowLength/2, eyebrowY);
    }
    ctx.stroke();

  }, [blinkState, isAnimating, mouthOpenness, emotion]);

  return (
    <div className="relative w-40 h-40 mx-auto mb-4">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="rounded-full bg-indigo-900 shadow-lg"
      />
      {isAnimating && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <div className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-full animate-pulse">
            Speaking...
          </div>
        </div>
      )}
    </div>
  );
}