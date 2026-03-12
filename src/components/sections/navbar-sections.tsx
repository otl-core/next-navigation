import {
  Site,
  HeaderConfig,
  HeaderNavigationItem,
  HeaderSection,
} from "@otl-core/cms-types";
import React from "react";
import { resolveItemVisibility } from "../../lib/navigation.utils";
import { MobileMenuToggle } from "../mobile/mobile-menu-toggle";
import { NavigationItem } from "./navigation-item";

interface NavbarSectionProps {
  section: HeaderSection;
  logo?: {
    text?: string;
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  navigation?: HeaderConfig;
  resolvedColors: Record<string, string | undefined>;
  itemsShowClass?: string;
  togglerHideClass?: string;
  isTogglerSection?: boolean;
  site: Site;
  mobileMenuId?: string;
}

export const NavbarSections: React.FC<NavbarSectionProps> = ({
  section,
  navigation,
  resolvedColors,
  itemsShowClass,
  togglerHideClass,
  isTogglerSection,
  site,
  mobileMenuId,
}) => {
  // Check if this section contains a logo
  const hasLogo = section?.items?.some(
    (item: HeaderNavigationItem) => item.type === "logo",
  );

  const sectionStyle: React.CSSProperties = (() => {
    let flexValue = section.flex;

    // Smart flex handling for better logo and navigation behavior
    if (flexValue === "0" || flexValue === undefined) {
      if (hasLogo) {
        // Logo section: Don't shrink, take natural size
        flexValue = "0 0 auto";
      } else {
        // Other sections with flex: 0 - allow shrinking if needed
        flexValue = "0 1 auto";
      }
    }

    return {
      flex: flexValue,
      justifyContent: section.justify || "flex-start",
      alignItems: section.align || "center",
      gap: section.gap || "0",
      // For non-logo sections, ensure they can shrink below content width
      ...(!hasLogo ? { minWidth: 0 } : {}),
    };
  })();

  // Check if section should be hidden when empty
  const shouldHide = (() => {
    if (!section.hideWhenEmpty) return false;

    // Never hide if there's a logo - logos are always visible
    const sectionHasLogo = section.items?.some(
      (item: HeaderNavigationItem) => item.type === "logo",
    );
    if (sectionHasLogo) return false;

    // Never hide if there are items with visibility: navbar-only or both - they're always visible
    const hasAlwaysVisibleItems = section.items?.some(
      (item: HeaderNavigationItem) =>
        resolveItemVisibility(item) === "navbar-only" ||
        resolveItemVisibility(item) === "both",
    );
    if (hasAlwaysVisibleItems) return false;

    // Check if there are any collapsible items (responsive or mobile-only)
    const collapsibleItems = section.items?.filter(
      (item: HeaderNavigationItem) =>
        item.type !== "logo" &&
        resolveItemVisibility(item) !== "navbar-only" &&
        resolveItemVisibility(item) !== "both",
    );

    // If there are collapsible items, section is not empty
    if (collapsibleItems && collapsibleItems.length > 0) return false;

    // Don't hide if this is the toggler section (toggler button should show)
    if (isTogglerSection) return false;

    return true;
  })();

  // Apply the same visibility class as items if hideWhenEmpty is enabled
  const sectionVisibilityClass = (() => {
    if (!section.hideWhenEmpty) return "";

    // Check if there are any items that are always visible (logos or navbar-only/both)
    const alwaysVisibleItems = section.items?.filter(
      (item: HeaderNavigationItem) =>
        item.type === "logo" ||
        resolveItemVisibility(item) === "navbar-only" ||
        resolveItemVisibility(item) === "both",
    );

    // If there are always visible items, don't apply visibility class
    if (alwaysVisibleItems && alwaysVisibleItems.length > 0) return "";

    // If all items collapse, apply the same visibility class
    return itemsShowClass;
  })();

  if (shouldHide) {
    return null;
  }

  return (
    <div
      className={`flex flex-row ${sectionVisibilityClass}`}
      style={sectionStyle}
      data-section-id={section.id}
    >
      {section.items?.map((item: HeaderNavigationItem) => {
        return (
          <NavigationItem
            key={item.id}
            item={item}
            navigation={navigation}
            resolvedColors={resolvedColors}
            itemsShowClass={itemsShowClass}
            site={site}
          />
        );
      })}
      {isTogglerSection && navigation && mobileMenuId && (
        <div className={`flex flex-shrink-0 ${togglerHideClass}`}>
          <MobileMenuToggle
            navigation={navigation}
            resolvedColors={resolvedColors}
            toggleId={`toggler-${section.id}`}
            mobileMenuId={mobileMenuId}
          />
        </div>
      )}
    </div>
  );
};
