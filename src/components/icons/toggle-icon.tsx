import type { ToggleIconType } from "@otl-core/cms-types";
import { HamburgerIcon } from "./hamburger-icon";
import { toggleIconMap } from "./toggle-icon-map";

interface ToggleIconProps {
  type: ToggleIconType;
  isOpen: boolean;
  className?: string;
  size?: number;
  animationDuration?: number;
  animationTiming?: string;
}

export function ToggleIcon({
  type,
  isOpen,
  className = "",
  size = 24,
  animationDuration,
  animationTiming,
}: ToggleIconProps) {
  const IconComponent = toggleIconMap.get(type);
  if (!IconComponent) {
    return (
      <HamburgerIcon
        isOpen={isOpen}
        className={className}
        size={size}
        animationDuration={animationDuration}
        animationTiming={animationTiming}
      />
    );
  }
  return (
    <IconComponent
      isOpen={isOpen}
      className={className}
      size={size}
      animationDuration={animationDuration}
      animationTiming={animationTiming}
    />
  );
}
