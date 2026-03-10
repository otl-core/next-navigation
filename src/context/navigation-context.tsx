"use client";

import { usePathname } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface NavigationContextType {
  headerRef: React.RefObject<HTMLElement | null>;
  isDropdownOpen: boolean;
  activeDropdown: string | null;
  openDropdown: (dropdownId: string) => void;
  closeDropdown: () => void;
  toggleDropdown: (dropdownId: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  const openDropdown = useCallback(
    (dropdownId: string) => setActiveDropdown(dropdownId),
    [],
  );
  const closeDropdown = useCallback(() => setActiveDropdown(null), []);
  const toggleDropdown = useCallback(
    (dropdownId: string) =>
      setActiveDropdown((prev) => (prev === dropdownId ? null : dropdownId)),
    [],
  );

  // Close dropdown on route change (render-time derivation, not an effect)
  const prevPathname = useRef(pathname);
  if (pathname !== prevPathname.current) {
    prevPathname.current = pathname;
    if (activeDropdown) {
      setActiveDropdown(null);
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeDropdown) {
        closeDropdown();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activeDropdown, closeDropdown]);

  useEffect(() => {
    if (!activeDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if click is on an internal navigation element (back button, nested dropdown triggers)
      if (target.closest("[data-navigation-internal]")) {
        return;
      }

      // Check if click is outside the header
      if (!headerRef.current?.contains(target)) {
        closeDropdown();
      }
    };

    // Use capture phase to handle clicks before they bubble
    document.addEventListener("click", handleClickOutside, true);

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [activeDropdown, closeDropdown]);

  const isDropdownOpen = useMemo(
    () => activeDropdown !== null,
    [activeDropdown],
  );

  return (
    <NavigationContext.Provider
      value={{
        headerRef,
        isDropdownOpen,
        activeDropdown,
        openDropdown,
        closeDropdown,
        toggleDropdown,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}
