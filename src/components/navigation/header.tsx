import {
  ColorReference,
  Site,
  HeaderConfig,
  HeaderNavigationItem,
  HeaderNavigationItemConfig,
} from "@otl-core/cms-types";
import React from "react";
import { NavigationProvider } from "../../context/navigation-context";
import {
  cn,
  resolveColorToCSS,
  resolveColorsToCSS,
} from "@otl-core/style-utils";
import {
  calculateNavigationWidth,
  generateNavigationCSS,
  getBreakpointForWidth,
  sectionsToDropdownContent,
} from "../../lib/navigation.utils";
import { NavigationHeaderWrapper } from "../mobile/navigation-header-wrapper";
import { NavigationDropdown } from "./dropdown";
import { Navbar } from "./navbar";

const SHOW_CLASSES = {
  sm: "hidden sm:flex",
  md: "hidden md:flex",
  lg: "hidden lg:flex",
  xl: "hidden xl:flex",
  "2xl": "hidden 2xl:flex",
} as const;

const HIDE_CLASSES = {
  sm: "sm:hidden",
  md: "md:hidden",
  lg: "lg:hidden",
  xl: "xl:hidden",
  "2xl": "2xl:hidden",
} as const;

interface NavigationHeaderProps {
  navigation: HeaderConfig;
  site: Site;
  className?: string;
  siteName?: string;
  id?: string;
}

export const Header: React.FC<NavigationHeaderProps> = ({
  navigation,
  site = {
    default_locale: "en",
    supported_locales: ["en"],
  } as Site,
  className = "",
  siteName: _siteName = "Logo",
  id = "default",
}) => {
  const isFixed = navigation.style?.position === "fixed";
  const containerBehavior = navigation.style?.container || "edged";
  const hasSafeZone = !!navigation.style?.safeZone;

  const estimatedWidth = calculateNavigationWidth(
    navigation.sections || [],
    site,
  );
  const breakpoint = getBreakpointForWidth(estimatedWidth);

  const styleType = navigation.style?.type || "default";

  const showClass = breakpoint ? SHOW_CLASSES[breakpoint] : "";
  const hideClass = breakpoint ? HIDE_CLASSES[breakpoint] : "";

  const resolvedColors: Record<string, string | undefined> = navigation.style
    ? {
        ...resolveColorsToCSS(
          Object.fromEntries(
            Object.entries(navigation.style).filter(
              ([key]) =>
                key !== "type" &&
                key !== "position" &&
                key !== "container" &&
                key !== "safeZone" &&
                key !== "layout" &&
                key !== "border" &&
                key !== "shadow" &&
                key !== "link" &&
                key !== "burger" &&
                key !== "dropdown" &&
                key !== "background" &&
                key !== "text",
            ),
          ) as Record<string, ColorReference | undefined>,
        ),
        // Manually resolve background and text colors
        background: resolveColorToCSS(navigation.style.background),
        text: resolveColorToCSS(navigation.style.text),
        // Manually resolve link colors
        linkColor: resolveColorToCSS(navigation.style.link?.color),
        linkHoverColor: resolveColorToCSS(navigation.style.link?.hoverColor),
        // Manually resolve burger colors
        burgerButtonBackground: resolveColorToCSS(
          navigation.style.burger?.button?.background,
        ),
        burgerButtonBackgroundHover: resolveColorToCSS(
          navigation.style.burger?.button?.backgroundHover,
        ),
        burgerIconColor: resolveColorToCSS(
          navigation.style.burger?.icon?.color,
        ),
        burgerIconHover: resolveColorToCSS(
          navigation.style.burger?.icon?.hoverColor,
        ),
      }
    : {};

  const headerStyles: React.CSSProperties = {
    ...(resolvedColors.background && {
      backgroundColor: resolvedColors.background,
    }),
    ...(resolvedColors.text && {
      color: resolvedColors.text,
    }),
  };

  const linkStyle: React.CSSProperties = {
    ...(resolvedColors.linkColor && { color: resolvedColors.linkColor }),
  };

  const sortedSections = [...(navigation.sections || [])].sort(
    (a, b) => a.order - b.order,
  );

  // Determine which section should have the toggler
  let togglerSectionId = navigation.togglerSectionId;

  // "none" means explicitly no mobile toggler at all
  if (togglerSectionId === "none") {
    togglerSectionId = "";
  } else if (!togglerSectionId) {
    // If no togglerSectionId specified, auto-assign to last non-logo section if there's content
    const hasContent = sortedSections.some((section) =>
      section.items?.some((item: HeaderNavigationItem) => item.type !== "logo"),
    );

    if (hasContent) {
      const nonLogoSections = sortedSections.filter(
        (section) =>
          !section.items?.some(
            (item: HeaderNavigationItem) => item.type === "logo",
          ),
      );

      if (nonLogoSections.length > 0) {
        togglerSectionId = nonLogoSections[nonLogoSections.length - 1].id;
      }
    }
  }

  const dropdownItems: Array<{
    item: HeaderNavigationItem;
    config: HeaderNavigationItemConfig;
  }> = [];
  sortedSections.forEach((section) => {
    section.items?.forEach((item: HeaderNavigationItem) => {
      if (item.type === "dropdown") {
        dropdownItems.push({
          item: item,
          config: item.config || {},
        });
      }
    });
  });

  // Collect all dropdown IDs for CSS generation (including mobile menu)
  const dropdownIds = [
    `mobile-menu-${id}`,
    ...(dropdownItems || []).map((d) => d.item.id),
  ];

  // Generate all CSS once at the header level
  const styles = generateNavigationCSS(
    id,
    navigation,
    resolvedColors,
    dropdownIds,
  );

  const isSameLayer = navigation.style?.dropdown?.layer === "same";

  if (styleType === "minimal") {
    // Minimal mode: All items render in navbar, but items without collapse:false get "hidden" class
    // This means only logo and collapse:false items are VISIBLE
    const navbarAndDropdowns = (
      <>
        <Navbar
          id={id}
          className={className}
          headerStyles={isSameLayer ? {} : headerStyles}
          sortedSections={sortedSections}
          navigation={navigation}
          resolvedColors={resolvedColors}
          togglerSectionId={togglerSectionId || "navbar"}
          itemsShowClass="hidden" // All items hidden by default in minimal mode
          togglerHideClass="" // Always show toggler in minimal mode
          site={site}
          mobileMenuId={`mobile-menu-${id}`}
          containerContent={containerBehavior === "edged"}
          isSameLayer={isSameLayer}
        />
        <NavigationDropdown
          itemId={`mobile-menu-${id}`}
          config={{ content: sectionsToDropdownContent(sortedSections) }}
          navigation={navigation}
          resolvedColors={resolvedColors}
          styles={headerStyles}
          linkStyle={linkStyle}
          dropdownId={`mobile-menu-${id}`}
          site={site}
          containerContent={containerBehavior === "edged"}
          isSameLayer={isSameLayer}
        />
        {dropdownItems?.map(({ item, config }) => (
          <NavigationDropdown
            key={item.id}
            itemId={item.id}
            config={config}
            navigation={navigation}
            resolvedColors={resolvedColors}
            styles={headerStyles}
            linkStyle={linkStyle}
            dropdownId={item.id}
            site={site}
            containerContent={containerBehavior === "edged"}
            isSameLayer={isSameLayer}
          />
        ))}
      </>
    );

    const navbarContent = isSameLayer ? (
      <div className={`navbar-wrapper-${id}`} style={headerStyles}>
        {navbarAndDropdowns}
      </div>
    ) : (
      navbarAndDropdowns
    );

    const navbarWithContainer =
      containerBehavior === "boxed" ? (
        <div className="container mx-auto">{navbarContent}</div>
      ) : (
        navbarContent
      );

    const headerContent = (
      <NavigationHeaderWrapper
        className={cn(
          `header-${id}`,
          "relative",
          isFixed
            ? "fixed top-0 left-0 right-0 z-50"
            : "absolute top-0 left-0 right-0 z-50",
        )}
        data-container={containerBehavior}
      >
        {navbarWithContainer}
      </NavigationHeaderWrapper>
    );

    return (
      <>
        {styles && <style>{styles}</style>}
        <NavigationProvider>
          {headerContent}
          {hasSafeZone && (
            <div
              className={`header-safe-zone-${id} bg-surface`}
              aria-hidden="true"
            />
          )}
        </NavigationProvider>
      </>
    );
  }

  const defaultNavbarAndDropdowns = (
    <>
      <Navbar
        id={id}
        className={className}
        headerStyles={isSameLayer ? {} : headerStyles}
        sortedSections={sortedSections}
        navigation={navigation}
        resolvedColors={resolvedColors}
        togglerSectionId={togglerSectionId || "navbar"}
        itemsShowClass={showClass}
        togglerHideClass={hideClass}
        site={site}
        mobileMenuId={`mobile-menu-${id}`}
        containerContent={containerBehavior === "edged"}
        isSameLayer={isSameLayer}
      />
      <NavigationDropdown
        itemId={`mobile-menu-${id}`}
        config={{ content: sectionsToDropdownContent(sortedSections) }}
        navigation={navigation}
        resolvedColors={resolvedColors}
        styles={headerStyles}
        linkStyle={linkStyle}
        dropdownId={`mobile-menu-${id}`}
        site={site}
        containerContent={containerBehavior === "edged"}
        isSameLayer={isSameLayer}
      />
      {dropdownItems?.map(
        ({
          item,
          config,
        }: {
          item: HeaderNavigationItem;
          config: HeaderNavigationItemConfig;
        }) => (
          <NavigationDropdown
            config={config}
            key={item.id}
            itemId={item.id}
            navigation={navigation}
            resolvedColors={resolvedColors}
            styles={headerStyles}
            linkStyle={linkStyle}
            dropdownId={item.id}
            site={site}
            containerContent={containerBehavior === "edged"}
            isSameLayer={isSameLayer}
          />
        ),
      )}
    </>
  );

  const navbarContent = isSameLayer ? (
    <div className={`navbar-wrapper-${id}`} style={headerStyles}>
      {defaultNavbarAndDropdowns}
    </div>
  ) : (
    defaultNavbarAndDropdowns
  );

  const navbarWithContainer =
    containerBehavior === "boxed" ? (
      <div className="container mx-auto">{navbarContent}</div>
    ) : (
      navbarContent
    );

  const headerContent = (
    <NavigationHeaderWrapper
      className={cn(
        `header-${id}`,
        "relative",
        isFixed
          ? "fixed top-0 left-0 right-0 z-50"
          : "absolute top-0 left-0 right-0 z-50",
      )}
      data-container={containerBehavior}
    >
      {navbarWithContainer}
    </NavigationHeaderWrapper>
  );

  return (
    <>
      {styles && <style>{styles}</style>}
      <NavigationProvider>
        {headerContent}
        {hasSafeZone && (
          <div
            className={`header-safe-zone-${id} bg-surface`}
            aria-hidden="true"
          />
        )}
      </NavigationProvider>
    </>
  );
};
