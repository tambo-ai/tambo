"use client";

import { useEffect, useState, useCallback } from "react";
import { HeroSection } from "@/components/layout/sections/hero";
import { DemoSection } from "@/components/layout/sections/demo";
import { HowItWorksSection } from "@/components/layout/sections/howitworks";
import { TeamSection } from "@/components/layout/sections/team";
import { DiscordSection } from "@/components/layout/sections/discord";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [gradientSize, setGradientSize] = useState(25);
  const [gradientOpacity, setGradientOpacity] = useState(0.15);
  const [trail, setTrail] = useState<
    { x: number; y: number; opacity: number }[]
  >([]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const newPosition = { x: event.clientX, y: event.clientY };
    setMousePosition(newPosition);

    // Dynamically change gradient size based on mouse speed
    const speed = Math.sqrt(event.movementX ** 2 + event.movementY ** 2);
    setGradientSize(Math.min(50, Math.max(20, 25 + speed / 2)));

    // Dynamically change gradient opacity based on mouse position
    const distanceFromCenter = Math.sqrt(
      (event.clientX - window.innerWidth / 2) ** 2 +
        (event.clientY - window.innerHeight / 2) ** 2
    );
    const maxDistance = Math.sqrt(
      (window.innerWidth / 2) ** 2 + (window.innerHeight / 2) ** 2
    );
    setGradientOpacity(0.1 + (distanceFromCenter / maxDistance) * 0.1);

    // Add new position to trail with full opacity
    setTrail((prevTrail) =>
      [...prevTrail, { ...newPosition, opacity: 1 }].slice(-50)
    ); // Keep last 50 points
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    const fadeInterval = setInterval(() => {
      setTrail((prevTrail) =>
        prevTrail
          .map((point) => ({
            ...point,
            opacity: Math.max(0, point.opacity - 0.02),
          }))
          .filter((point) => point.opacity > 0)
      );
    }, 50);

    return () => clearInterval(fadeInterval);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {trail.map((point, index, array) => {
            if (index === 0) return null;
            const prevPoint = array[index - 1];
            return (
              <line
                key={index}
                x1={prevPoint.x}
                y1={prevPoint.y}
                x2={point.x}
                y2={point.y}
                stroke={`rgba(210, 71, 191, ${point.opacity})`}
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(210, 71, 191, ${gradientOpacity}), transparent ${gradientSize}%)`,
            transition: "background 0.2s ease",
          }}
        />
      </div>
      <HeroSection />
      <DemoSection />
      <HowItWorksSection />
      <TeamSection />
      <DiscordSection />
    </div>
  );
}
