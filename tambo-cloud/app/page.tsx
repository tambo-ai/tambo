"use client";

import { useEffect, useState, useCallback } from "react";
import { HeroSection } from "@/components/layout/sections/hero";
import { DemoSection } from "@/components/layout/sections/demo";
import { HowItWorksSection } from "@/components/layout/sections/howitworks";
import { TeamSection } from "@/components/layout/sections/team";
import { DiscordSection } from "@/components/layout/sections/discord";
import { LiveDemoSection } from "@/components/layout/sections/app";
import { FooterSection } from "@/components/layout/sections/footer";
import { ExamplesSection } from "@/components/layout/sections/domains";

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
    setTrail((prevTrail) => {
      const newTrail = [...prevTrail, { ...newPosition, opacity: 1 }].slice(
        -30
      ); // Keep last 30 points for faster disappearance
      return newTrail.map((point, index) => ({
        ...point,
        opacity: Math.min(1, 0.7 + (index / newTrail.length) * 0.3), // Increase starting opacity and make it more opaque as it gets further
      }));
    });
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
            opacity: Math.max(0, point.opacity - 0.05), // Faster fade out
          }))
          .filter((point) => point.opacity > 0)
      );
    }, 30); // Shorter interval for faster updates

    return () => clearInterval(fadeInterval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full">
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
                stroke={`rgba(230, 131, 215, ${point.opacity})`}
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div
          className="absolute inset-0 transition-background duration-200 ease-in-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(230, 131, 215, ${gradientOpacity}), transparent ${gradientSize}%)`,
          }}
        />
      </div>
      <HeroSection />
      <ExamplesSection />
      <HowItWorksSection />
      <DemoSection />
      <LiveDemoSection />
      <TeamSection />
      <DiscordSection />
      <FooterSection />
    </div>
  );
}
