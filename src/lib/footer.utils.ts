import {
  BorderConfig,
  FooterConfig,
  FooterContentSection,
  FooterSection,
  ResponsiveValue,
  ShadowConfig,
} from "@otl-core/cms-types";
import { isResponsiveConfig } from "@otl-core/cms-utils";
import { resolveColorToCSS } from "@otl-core/style-utils";

/**
 * Resolve all colors in the footer configuration to CSS values
 */
export function resolveFooterColors(
  style: FooterConfig["style"],
): Record<string, string | undefined> {
  const resolved: Record<string, string | undefined> = {
    background: resolveColorToCSS(style.background),
    text: resolveColorToCSS(style.text),
    linkColor: resolveColorToCSS(style.link.color),
    linkHoverColor: resolveColorToCSS(style.link.hoverColor),
  };

  return resolved;
}

/**
 * Resolve a responsive value to get the base value
 */
function getResponsiveBase<T>(value: ResponsiveValue<T> | T): T {
  if (typeof value === "object" && value !== null && "base" in value) {
    return value.base;
  }
  return value as T;
}

/**
 * Resolve border config to CSS string
 */
function resolveBorder(
  border: ResponsiveValue<BorderConfig> | undefined,
): string {
  if (!border) return "";

  const base = getResponsiveBase(border);
  if (!base) return "";

  const width = base.width ?? "0";
  const style = base.style ?? "solid";
  const color = base.color ? resolveColorToCSS(base.color) : "transparent";

  return `${width} ${style} ${color}`;
}

/**
 * Generate CSS for the footer configuration
 */
export function generateFooterCSS(
  id: string,
  footer: FooterConfig,
  resolvedColors: Record<string, string | undefined>,
): string {
  const cssBlocks: string[] = [];

  // Base footer styles
  const baseMargin = getResponsiveBase(footer.style.layout.margin);
  const basePadding = getResponsiveBase(footer.style.layout.padding);
  const baseSectionGap = getResponsiveBase(footer.style.layout.sectionGap);
  const borderCSS = resolveBorder(footer.style.border);

  const baseStyles = `
    .footer-${id} {
      ${resolvedColors.background ? `background-color: ${resolvedColors.background};` : ""}
      ${resolvedColors.text ? `color: ${resolvedColors.text};` : ""}
      ${baseMargin ? `margin: ${baseMargin};` : ""}
      ${basePadding ? `padding: ${basePadding};` : ""}
      ${borderCSS ? `border: ${borderCSS};` : ""}
      ${footer.style.shadow ? `box-shadow: ${formatShadow(isResponsiveConfig(footer.style.shadow) ? footer.style.shadow.base : footer.style.shadow)};` : ""}
    }
  `;
  cssBlocks.push(baseStyles);

  // Link styles
  if (resolvedColors.linkColor || resolvedColors.linkHoverColor) {
    cssBlocks.push(`
      .footer-${id} a {
        ${resolvedColors.linkColor ? `color: ${resolvedColors.linkColor};` : ""}
        text-decoration: none;
        transition: color 0.2s;
      }
      .footer-${id} a:hover {
        ${resolvedColors.linkHoverColor ? `color: ${resolvedColors.linkHoverColor};` : ""}
      }
    `);
  }

  // Section gap
  if (baseSectionGap) {
    cssBlocks.push(`
      .footer-${id} > .footer-section {
        gap: ${baseSectionGap};
      }
    `);
  }

  return minifyCSS(cssBlocks.filter(Boolean).join(""));
}

/**
 * Format shadow config to CSS box-shadow value
 */
function formatShadow(shadow: ShadowConfig): string {
  const insetStr = shadow.inset ? "inset " : "";
  return `${insetStr}${shadow.offsetX} ${shadow.offsetY} ${shadow.blurRadius} ${shadow.spreadRadius} ${shadow.color}`;
}

/**
 * Minify CSS by removing extra whitespace
 */
function minifyCSS(css: string): string {
  return css
    .replace(/\s+/g, " ")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*;\s*/g, ";")
    .replace(/;\s*}/g, "}")
    .trim();
}

/**
 * Check if a section has nested sections (is a container section)
 */
export function isContainerSection(
  section: FooterSection | FooterContentSection,
): section is FooterSection {
  return "sections" in section && Array.isArray(section.sections);
}

/**
 * Check if a section is a content section (has items)
 */
export function isContentSection(
  section: FooterSection | FooterContentSection,
): section is FooterContentSection {
  return "items" in section && Array.isArray(section.items);
}
