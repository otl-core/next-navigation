"use client";

import { useEffect, useRef } from "react";

interface MeatballsIconProps {
  isOpen: boolean;
  className?: string;
  size?: number;
  animationDuration?: number;
  animationTiming?: string;
}

export function MeatballsIcon({
  isOpen,
  className = "",
  size = 24,
  animationDuration = 300,
  animationTiming = "ease-in-out",
}: MeatballsIconProps) {
  const duration = `${animationDuration}ms`;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  const dotSize = size * 0.125;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        // @ts-expect-error - CSS custom property
        "--dot-height": "12.5%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "25%",
          top: "50%",
          width: dotSize,
          height: "12.5%",
          backgroundColor: "currentColor",
          transform: "translate(-50%, -50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "meatballs-left-open" : "meatballs-left-close"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: dotSize,
          height: "12.5%",
          backgroundColor: "currentColor",
          transform: "translate(-50%, -50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "meatballs-middle-hide" : "meatballs-middle-show"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "75%",
          top: "50%",
          width: dotSize,
          height: "12.5%",
          backgroundColor: "currentColor",
          transform: "translate(-50%, -50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "meatballs-right-open" : "meatballs-right-close"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
    </div>
  );
}
