import { Site, HeaderConfig, HeaderSection } from "@otl-core/cms-types";
import { cn } from "@otl-core/style-utils";
import { ReactNode } from "react";
import { NavbarSections } from "../sections/navbar-sections";

interface NavbarProps {
  id: string;
  className: string;
  headerStyles: React.CSSProperties;
  sortedSections: HeaderSection[];
  navigation: HeaderConfig;
  resolvedColors: Record<string, string | undefined>;
  itemsShowClass: string;
  togglerHideClass: string;
  togglerSectionId: string;
  site: Site;
  locale?: string;
  mobileMenuId?: string;
  containerContent?: boolean;
  isSameLayer?: boolean;
}

export function Navbar({
  id,
  className,
  headerStyles,
  sortedSections,
  navigation,
  resolvedColors,
  itemsShowClass,
  togglerHideClass,
  togglerSectionId,
  site,
  locale,
  mobileMenuId,
  containerContent = false,
  isSameLayer = false,
}: NavbarProps): ReactNode {
  const dropdownLayer = navigation.style?.dropdown?.layer || "below";

  function getNavbarZ(): string {
    if (isSameLayer) return "";
    return dropdownLayer === "above" ? "z-[1]" : "z-[9999]";
  }
  const navbarZ = getNavbarZ();

  const sectionsContent = sortedSections.map((section) => (
    <NavbarSections
      key={section.id}
      section={section}
      site={site}
      locale={locale}
      navigation={navigation}
      resolvedColors={resolvedColors}
      itemsShowClass={itemsShowClass}
      togglerHideClass={togglerHideClass}
      isTogglerSection={section.id === togglerSectionId}
      mobileMenuId={mobileMenuId}
    />
  ));

  return (
    <div
      className={cn(
        `navbar-${id}`,
        `relative flex items-center justify-between`,
        navbarZ,
        !containerContent && `navbar-inner-${id}`,
        className,
      )}
      style={isSameLayer ? undefined : headerStyles}
    >
      {containerContent ? (
        <div
          className={cn(
            "container mx-auto flex items-center justify-between w-full",
            `navbar-inner-${id}`,
          )}
        >
          {sectionsContent}
        </div>
      ) : (
        sectionsContent
      )}
    </div>
  );
}
