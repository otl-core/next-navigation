"use client";

import { useEffect, useRef } from "react";

interface GridIconProps {
  isOpen: boolean;
  className?: string;
  size?: number;
  animationDuration?: number;
  animationTiming?: string;
}

export function GridIcon({
  isOpen,
  className = "",
  size = 24,
  animationDuration = 300,
  animationTiming = "ease-in-out",
}: GridIconProps) {
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
        // @ts-expect-error - CSS custom property
        "--square-size": "40%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "25%",
          top: "25%",
          width: "40%",
          height: "40%",
          backgroundColor: "currentColor",
          transform: "translate(-50%, -50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "grid-tl-open" : "grid-tl-close"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "75%",
          top: "25%",
          width: "40%",
          height: "40%",
          backgroundColor: "currentColor",
          transform: "translate(-50%, -50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "grid-tr-hide" : "grid-tr-show"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "25%",
          top: "75%",
          width: "40%",
          height: "40%",
          backgroundColor: "currentColor",
          transform: "translate(-50%, -50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "grid-bl-hide" : "grid-bl-show"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "75%",
          top: "75%",
          width: "40%",
          height: "40%",
          backgroundColor: "currentColor",
          transform: "translate(-50%, -50%)",
          animation: hasMountedRef.current
            ? `${isOpen ? "grid-br-open" : "grid-br-close"} ${duration} ${animationTiming} forwards`
            : "none",
        }}
      />
    </div>
  );
}
