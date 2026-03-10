"use client";

import { useEffect, useRef } from "react";

interface HamburgerIconProps {
  isOpen: boolean;
  className?: string;
  size?: number;
  animationDuration?: number;
  animationTiming?: string;
}

export function HamburgerIcon({
  isOpen,
  className = "",
  size = 24,
  animationDuration = 300,
  animationTiming = "ease-in-out",
}: HamburgerIconProps) {
  const duration = `${animationDuration}ms`;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "25%",
          width: size,
          height: "12.5%",
          backgroundColor: "currentColor",
          transform: "translateY(-50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "hamburger-top-open" : "hamburger-top-close"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: size,
          height: "12.5%",
          backgroundColor: "currentColor",
          transform: "translateY(-50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "hamburger-middle-hide" : "hamburger-middle-show"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "75%",
          width: size,
          height: "12.5%",
          backgroundColor: "currentColor",
          transform: "translateY(-50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "hamburger-bottom-open" : "hamburger-bottom-close"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
    </div>
  );
}
