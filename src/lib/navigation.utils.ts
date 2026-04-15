import {
  Site,
  HeaderConfig,
  HeaderDropdownButtonConfig,
  HeaderDropdownContent,
  HeaderDropdownNavigationItemConfig,
  HeaderNavigationItem,
  HeaderNavigationItemButtonConfig,
  HeaderNavigationItemDropdownConfig,
  HeaderNavigationItemImageConfig,
  HeaderNavigationItemLinkConfig,
  HeaderNavigationItemMarkdownConfig,
  HeaderSection,
  LocalizedString,
  ResponsiveValue,
  ShadowConfig,
} from "@otl-core/cms-types";
import { marked } from "marked";
import {
  generateDesktopDropdownAnimations,
  generateMobileMenuAnimations,
  generateResponsiveSpacingCSS,
  generateSameLayerDropdownAnimations,
  generateScrollbarStyles,
  generateToggleIconAnimations,
  minifyCSS,
  normalizeResponsiveValue,
} from "@otl-core/style-utils";

/**
 * Convert ShadowConfig to CSS box-shadow string
 */
export function shadowConfigToCSS(shadow: ShadowConfig): string {
  const { offsetX, offsetY, blurRadius, spreadRadius, color, inset } = shadow;
  const parts = [offsetX, offsetY, blurRadius, spreadRadius, color];
  if (inset) {
    return `inset ${parts.join(" ")}`;
  }
  return parts.join(" ");
}

export function calculateNavigationWidth(
  sections: HeaderSection[],
  site?: Site,
): number {
  let totalWidth = 150;

  for (const section of sections) {
    for (const item of section?.items || []) {
      if (item.type === "logo") continue;

      const label =
        typeof item.label === "string"
          ? item.label
          : getLocalizedString(item.label, site) || "";
      const labelLength = label.length;

      if (item.type === "button") {
        totalWidth += labelLength * 8 + 48;
      } else if (
        item.type === "link" ||
        item.type === "dropdown" ||
        item.type === "markdown"
      ) {
        totalWidth += labelLength * 8 + 24;
      } else if (item.type === "image") {
        const imgConfig = item.config as { width?: string };
        const imgWidth = imgConfig?.width
          ? parseInt(imgConfig.width, 10) || 100
          : 100;
        totalWidth += imgWidth + 16;
      }
    }
  }

  return totalWidth;
}

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl" | null;

export function getBreakpointForWidth(estimatedWidth: number): Breakpoint {
  const MAX_USABLE_WIDTH = 1400;

  if (estimatedWidth > MAX_USABLE_WIDTH) return null;

  if (estimatedWidth <= 640) return "sm";
  if (estimatedWidth <= 768) return "md";
  if (estimatedWidth <= 1024) return "lg";
  if (estimatedWidth <= 1280) return "xl";
  return "2xl";
}

const RESPONSIVE_BREAKPOINTS = [
  { key: "sm", minWidth: "640px" },
  { key: "md", minWidth: "768px" },
  { key: "lg", minWidth: "1024px" },
  { key: "xl", minWidth: "1280px" },
] as const;

function generateResponsiveCustomProps(
  className: string,
  props: Record<string, ResponsiveValue<string> | undefined>,
): string[] {
  const css: string[] = [];
  const baseVars: string[] = [];
  const bpVars: Record<string, string[]> = {};

  for (const [prop, value] of Object.entries(props)) {
    if (!value) continue;
    if (typeof value === "string") {
      baseVars.push(`${prop}:${value}`);
    } else {
      if (value.base) baseVars.push(`${prop}:${value.base}`);
      for (const { key } of RESPONSIVE_BREAKPOINTS) {
        const bpVal = value[key as keyof typeof value];
        if (bpVal && typeof bpVal === "string") {
          if (!bpVars[key]) bpVars[key] = [];
          bpVars[key].push(`${prop}:${bpVal}`);
        }
      }
    }
  }

  const target = `.${className}`;
  if (baseVars.length > 0) {
    css.push(`${target}{${baseVars.join(";")}}`);
  }
  for (const { key, minWidth } of RESPONSIVE_BREAKPOINTS) {
    if (bpVars[key]?.length) {
      css.push(
        `@media(min-width:${minWidth}){${target}{${bpVars[key].join(";")}}}`,
      );
    }
  }
  return css;
}

/**
 * Normalize a logo size value (responsive, plain string, or legacy
 * numeric pixels) into a ResponsiveValue<string>.
 */
function normalizeLogoSize(
  value: ResponsiveValue<string> | number | undefined,
): ResponsiveValue<string> | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return { base: `${value}px` };
  if (typeof value === "string") return { base: value };
  return value;
}

function generateLogoCSS(id: string, navigation: HeaderConfig): string[] {
  if (!navigation.logo?.url) return [];
  const width = normalizeLogoSize(navigation.logo.width) ?? { base: "auto" };
  const height = normalizeLogoSize(navigation.logo.height) ?? { base: "40px" };
  return generateResponsiveCustomProps(`navbar-${id} .navigation-logo-img`, {
    width,
    height,
  });
}

export function generateNavigationCSS(
  id: string,
  navigation: HeaderConfig,
  resolvedColors: Record<string, string | undefined>,
  dropdownIds: string[] = [],
): string {
  const cssBlocks: (string | null)[] = [];
  const isSameLayer = navigation.style?.dropdown?.layer === "same";

  cssBlocks.push(...generateLogoCSS(id, navigation));

  if (navigation.style?.layout?.margin) {
    const headerMarginCSS = generateResponsiveSpacingCSS(`header-${id}`, {
      margin: navigation.style.layout.margin,
    });
    if (headerMarginCSS) cssBlocks.push(headerMarginCSS);
  }

  if (navigation.style?.safeZone) {
    const safeZoneCSS = generateResponsiveSpacingCSS(`header-safe-zone-${id}`, {
      height: navigation.style.safeZone,
    });
    if (safeZoneCSS) cssBlocks.push(safeZoneCSS);
  }

  if (navigation.style) {
    if (isSameLayer) {
      // Same layer: navbar wrapper gets border/padding/shadow, navbar itself only gets inner styles
      const wrapperCSS = generateResponsiveSpacingCSS(`navbar-wrapper-${id}`, {
        border: navigation.style.border,
        padding: navigation.style.layout?.padding,
        shadow: navigation.style.shadow,
      });
      if (wrapperCSS) cssBlocks.push(wrapperCSS);
    } else {
      const navbarCSS = generateResponsiveSpacingCSS(`navbar-${id}`, {
        border: navigation.style.border,
        padding: navigation.style.layout?.padding,
        shadow: navigation.style.shadow,
      });
      if (navbarCSS) cssBlocks.push(navbarCSS);
    }

    const navbarInnerCSS = generateResponsiveSpacingCSS(`navbar-inner-${id}`, {
      gap: navigation.style.layout?.sectionGap,
      fontSize: navigation.style.fontSize?.navbar,
    });
    if (navbarInnerCSS) cssBlocks.push(navbarInnerCSS);

    const btnFontSize = navigation.style.fontSize?.buttonFontSize;
    if (btnFontSize) {
      cssBlocks.push(
        ...generateResponsiveCustomProps(`navbar-inner-${id}`, {
          "--btn-font-sm": btnFontSize.sm,
          "--btn-font-md": btnFontSize.md,
          "--btn-font-lg": btnFontSize.lg,
        }),
      );
    }
  }

  // Generate responsive offset margin for all dropdowns
  if (navigation.style?.dropdown?.offset) {
    const offset = navigation.style.dropdown.offset;
    const yNorm = normalizeResponsiveValue(offset.y);
    const leftNorm = normalizeResponsiveValue(offset.left);
    const rightNorm = normalizeResponsiveValue(offset.right);
    const breakpoints = ["base", "sm", "md", "lg", "xl", "2xl"] as const;
    const compositeMargin: Record<string, string> = {};
    for (const bp of breakpoints) {
      const top = yNorm[bp] || (bp === "base" ? "0" : undefined);
      const left = leftNorm[bp] || (bp === "base" ? "0" : undefined);
      const right = rightNorm[bp] || (bp === "base" ? "0" : undefined);
      if (top !== undefined || left !== undefined || right !== undefined) {
        compositeMargin[bp] = `${top || "0"} ${right || "0"} 0 ${left || "0"}`;
      }
    }
    if (Object.keys(compositeMargin).length > 0) {
      const marginValue = compositeMargin.base
        ? Object.keys(compositeMargin).length === 1
          ? compositeMargin.base
          : compositeMargin
        : compositeMargin;
      dropdownIds.forEach((dropdownId) => {
        const offsetCSS = generateResponsiveSpacingCSS(
          `navigation-dropdown-${dropdownId}`,
          { margin: marginValue as ResponsiveValue<string> },
        );
        if (offsetCSS) cssBlocks.push(offsetCSS);
      });
    }
  }

  if (navigation.style && dropdownIds.length > 0) {
    dropdownIds.forEach((dropdownId) => {
      if (isSameLayer) {
        // Same layer: dropdown only gets gap/fontSize, no border/padding/shadow (inherited from wrapper)
        const dropdownContentCSS = generateResponsiveSpacingCSS(
          `dropdown-content-${dropdownId}`,
          {
            gap: navigation.style?.dropdown?.sectionGap,
            fontSize: navigation.style?.fontSize?.dropdown,
          },
        );
        if (dropdownContentCSS) cssBlocks.push(dropdownContentCSS);
      } else {
        const dropdownCSS = generateResponsiveSpacingCSS(
          `navigation-dropdown-${dropdownId}`,
          {
            padding: navigation.style?.dropdown?.padding,
            border: navigation.style?.dropdown?.border,
            shadow: navigation.style?.dropdown?.shadow,
          },
        );
        if (dropdownCSS) cssBlocks.push(dropdownCSS);

        const dropdownContentCSS = generateResponsiveSpacingCSS(
          `dropdown-content-${dropdownId}`,
          {
            gap: navigation.style?.dropdown?.sectionGap,
            fontSize: navigation.style?.fontSize?.dropdown,
          },
        );
        if (dropdownContentCSS) cssBlocks.push(dropdownContentCSS);
      }

      const btnFontSize = navigation.style?.fontSize?.buttonFontSize;
      if (btnFontSize) {
        cssBlocks.push(
          ...generateResponsiveCustomProps(`dropdown-content-${dropdownId}`, {
            "--btn-font-sm": btnFontSize.sm,
            "--btn-font-md": btnFontSize.md,
            "--btn-font-lg": btnFontSize.lg,
          }),
        );
      }
    });
  }

  if (resolvedColors.burgerButtonBackgroundHover) {
    cssBlocks.push(
      `.mobile-menu-toggle-${id}:hover{background-color:${resolvedColors.burgerButtonBackgroundHover}!important}`,
    );
  }

  if (
    resolvedColors.dropdownMenuLinkHoverColor ||
    resolvedColors.dropdownMenuLinkHoverBackground
  ) {
    const hoverStyles: string[] = [];
    if (resolvedColors.dropdownMenuLinkHoverBackground) {
      hoverStyles.push(
        `background-color:${resolvedColors.dropdownMenuLinkHoverBackground}!important`,
      );
    }
    if (resolvedColors.dropdownMenuLinkHoverColor) {
      hoverStyles.push(
        `color:${resolvedColors.dropdownMenuLinkHoverColor}!important`,
      );
    }
    cssBlocks.push(
      `#mobile-menu-dropdown-${id} a:hover{${hoverStyles.join(";")}}`,
    );
  }

  cssBlocks.push(...generateToggleIconAnimations());
  cssBlocks.push(...generateMobileMenuAnimations());
  cssBlocks.push(...generateScrollbarStyles());
  cssBlocks.push(...generateDesktopDropdownAnimations());
  if (isSameLayer) {
    cssBlocks.push(...generateSameLayerDropdownAnimations());
  }

  return minifyCSS(cssBlocks.filter(Boolean).join(""));
}

export function sectionsToDropdownContent(
  sections: HeaderSection[],
): HeaderDropdownContent[] {
  const result: HeaderDropdownContent[] = [];
  let lastSectionHadContent = false;

  sections.forEach((section: HeaderSection, index: number) => {
    const items = section?.items?.filter((item: HeaderNavigationItem) => {
      if (item.type === "logo") return false;
      if (resolveItemVisibility(item) === "navbar-only") return false;
      return true;
    });

    if (items?.length === 0) {
      return; // Skip this section, don't update lastSectionHadContent
    }

    // Add divider if the previous section had content and this isn't the first section with content
    if (lastSectionHadContent && result.length > 0) {
      result.push({
        id: `divider-${sections[index - 1].id}`,
        type: "divider",
        config: {},
      });
    }

    items?.forEach((item: HeaderNavigationItem) => {
      if (item.type === "link") {
        const config = item.config as HeaderNavigationItemLinkConfig;
        const navConfig: HeaderDropdownNavigationItemConfig = {
          label: item.label || "",
          href: config.href,
          icon: config.icon,
          external: config.external,
        };
        result.push({
          id: item.id,
          type: "navigation-item",
          config: navConfig,
        });
      } else if (item.type === "button") {
        const config = item.config as HeaderNavigationItemButtonConfig;
        const btnConfig: HeaderDropdownButtonConfig = {
          label: item.label || "",
          href: config.href,
          icon: config.icon,
          external: config.external,
          variant: config.variant,
          size: config.size,
        };
        result.push({
          id: item.id,
          type: "button",
          config: btnConfig,
        });
      } else if (item.type === "dropdown") {
        const config = item.config as HeaderNavigationItemDropdownConfig;
        result.push({
          id: item.id,
          type: "dropdown",
          label: item.label || "",
          config,
        });
      } else if (item.type === "markdown") {
        const config = item.config as HeaderNavigationItemMarkdownConfig;
        result.push({
          id: item.id,
          type: "markdown",
          config: { content: config.content || item.label || "" },
        });
      } else if (item.type === "image") {
        const config = item.config as HeaderNavigationItemImageConfig;
        result.push({
          id: item.id,
          type: "image",
          config: {
            src: config.src,
            alt: config.alt,
            width: config.width ? { base: config.width } : { base: "100%" },
            height: config.height ? { base: config.height } : { base: "auto" },
            objectFit: config.objectFit,
            href: config.href,
          },
        });
      }
    });

    lastSectionHadContent = true;
  });

  return result;
}

export function resolveDropdownColor(
  colorRef: { type: string; value: string } | undefined,
  resolvedColors: Record<string, string | undefined>,
  fallback?: string,
): string | undefined {
  if (!colorRef) return fallback;

  if (colorRef.type === "custom") {
    return colorRef.value;
  }

  if (colorRef.type === "theme") {
    return resolvedColors[colorRef.value] || fallback;
  }

  if (colorRef.type === "variable") {
    // For variables, construct the CSS variable reference
    return `var(--color-${colorRef.value})`;
  }

  return fallback;
}

function getBrowserPreferredLocales(options = {}) {
  const defaultOptions = {
    languageCodeOnly: false,
  };
  const opt = {
    ...defaultOptions,
    ...options,
  };
  const browserLocales =
    navigator.languages === undefined
      ? [navigator.language]
      : navigator.languages;
  if (!browserLocales) {
    return undefined;
  }
  return browserLocales.map((locale) => {
    const trimmedLocale = locale.trim();
    return opt.languageCodeOnly ? trimmedLocale.split(/-|_/)[0] : trimmedLocale;
  });
}

export function getLocalizedString(
  value: string | LocalizedString | null | undefined,
  options?:
    | Site
    | {
        preferredLocale?: string;
        defaultLocale?: string;
        supportedLocales?: string[];
      },
): string {
  // Handle null/undefined
  if (value === null || value === undefined) return "";

  // If it's already a string, return it
  if (typeof value === "string") return value;

  // Normalize options to handle both Site and simple options object
  const preferredLocale =
    options && "preferredLocale" in options
      ? options.preferredLocale
      : undefined;
  function getDefaultLocale(): string | undefined {
    if (options && "defaultLocale" in options) return options.defaultLocale;
    if (options && "default_locale" in options) return options.default_locale;
    return undefined;
  }
  function getSupportedLocales(): string[] | undefined {
    if (options && "supportedLocales" in options)
      return options.supportedLocales;
    if (options && "supported_locales" in options)
      return options.supported_locales;
    return undefined;
  }
  const defaultLocale = getDefaultLocale();
  const supportedLocales = getSupportedLocales();

  // Try preferred locale first (if explicitly provided)
  if (preferredLocale && preferredLocale in value && value[preferredLocale]) {
    return value[preferredLocale];
  }

  // Try browser locales if no explicit preferred locale
  if (!preferredLocale) {
    const browserLocales = getBrowserPreferredLocales();
    if (browserLocales) {
      for (const locale of browserLocales) {
        if (locale in value && value[locale]) {
          return value[locale];
        }
      }
    }
  }

  // Try default locale
  if (defaultLocale && defaultLocale in value && value[defaultLocale]) {
    return value[defaultLocale];
  }

  // Try 'en' as fallback
  if ("en" in value && value.en) {
    return value.en;
  }

  // Try any supported locale
  if (supportedLocales) {
    for (const locale of supportedLocales) {
      if (locale in value && value[locale]) {
        return value[locale];
      }
    }
  }

  // Return first available value as last resort
  const keys = Object.keys(value);
  if (keys.length > 0 && value[keys[0]]) {
    return value[keys[0]];
  }

  return "";
}

/**
 * Resolve the effective visibility for a navigation item.
 * Supports the new `visibility` field and the legacy `collapse` field.
 * collapse: false → "navbar-only", collapse: true/undefined → "responsive"
 */
export function resolveItemVisibility(
  item: HeaderNavigationItem,
): HeaderNavigationItem["visibility"] {
  if (item.visibility) return item.visibility;
  const legacy = (item as unknown as Record<string, unknown>).collapse;
  if (legacy === false) return "navbar-only";
  return undefined;
}

const VISIBILITY_CLASSES: Record<string, string> = {
  "navbar-only": "flex",
  "mobile-only": "hidden",
  both: "flex",
};

/**
 * Get the CSS class for an item's visibility, falling back to the
 * responsive breakpoint class when no explicit visibility is set.
 */
export function getVisibilityClass(
  item: HeaderNavigationItem,
  fallback?: string,
): string {
  const vis = resolveItemVisibility(item);
  return (vis && VISIBILITY_CLASSES[vis]) || fallback || "";
}

/**
 * Pre-processes emphasis markers into raw HTML tags before the CommonMark
 * parser sees them, bypassing delimiter-run edge cases like
 * `**krippner:**digital`.
 */
function preprocessEmphasis(text: string): string {
  const codes: string[] = [];
  let s = text.replace(/`[^`]+`/g, (m) => {
    codes.push(m);
    return `\x00C${codes.length - 1}\x00`;
  });
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(?<![\\*])\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  s = s.replace(/\x00C(\d+)\x00/g, (_, i) => codes[parseInt(i)]);
  return s;
}

export function parseMarkdownToHTML(markdown: string): string {
  // Pre-process emphasis, then parse markdown to HTML
  const html = marked.parse(preprocessEmphasis(markdown), {
    async: false,
  }) as string;

  // Transform h1-h6 elements to divs with corresponding classes
  return html
    .replace(/<h1>/g, '<div class="h1">')
    .replace(/<\/h1>/g, "</div>")
    .replace(/<h2>/g, '<div class="h2">')
    .replace(/<\/h2>/g, "</div>")
    .replace(/<h3>/g, '<div class="h3">')
    .replace(/<\/h3>/g, "</div>")
    .replace(/<h4>/g, '<div class="h4">')
    .replace(/<\/h4>/g, "</div>")
    .replace(/<h5>/g, '<div class="h5">')
    .replace(/<\/h5>/g, "</div>")
    .replace(/<h6>/g, '<div class="h6">')
    .replace(/<\/h6>/g, "</div>");
}
