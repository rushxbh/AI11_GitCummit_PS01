"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  isAnimating: boolean;
  size?: number;
  className?: string;
}

export default function Avatar({
  isAnimating,
  size = 48,
  className,
}: AvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = size;
    canvas.height = size;

    // Center coordinates
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = (size / 2) * 0.8;

    // Animation variables
    let animationFrameId: number;
    const hue = 210; // Blue hue
    const waveAmplitude = 3;
    const waveFrequency = 0.15;
    let wavePhase = 0;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw circular gradient background
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.8)`);
      gradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0.8)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw animated wave pattern if animating
      if (isAnimating) {
        wavePhase += 0.1;

        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;

        for (let i = 0; i < 360; i += 5) {
          const angle = (i * Math.PI) / 180;
          const x = centerX + Math.cos(angle) * (radius * 0.6);
          const y = centerY + Math.sin(angle) * (radius * 0.6);

          const waveOffset =
            Math.sin(i * waveFrequency + wavePhase) * waveAmplitude;

          if (i === 0) {
            ctx.moveTo(x, y + waveOffset);
          } else {
            ctx.lineTo(x, y + waveOffset);
          }
        }

        ctx.closePath();
        ctx.stroke();
      }

      // Draw AI icon
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = `${size * 0.4}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AI", centerX, centerY);

      if (isAnimating) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={cn("rounded-full", className)}
    />
  );
}
