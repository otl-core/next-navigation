import { describe, expect, it } from "vitest";
import {
  calculateNavigationWidth,
  getBreakpointForWidth,
  getLocalizedString,
  parseMarkdownToHTML,
  resolveDropdownColor,
  sectionsToDropdownContent,
} from "../../src/lib/navigation.utils";
import type { HeaderSection } from "../../src/types/navigation";

describe("Navigation Utils", () => {
  describe("calculateNavigationWidth", () => {
    it("should return base width for empty sections", () => {
      expect(calculateNavigationWidth([])).toBe(150);
    });

    it("should skip logo items", () => {
      const sections = [
        {
          items: [{ type: "logo", label: "Logo" }],
        },
      ];
      expect(calculateNavigationWidth(sections)).toBe(150);
    });

    it("should calculate width for links", () => {
      const sections = [
        {
          items: [
            { type: "link", label: "Home" },
            { type: "link", label: "About" },
          ],
        },
      ];
      // Base: 150, Home: 4*8+24=56, About: 5*8+24=64
      expect(calculateNavigationWidth(sections)).toBe(150 + 56 + 64);
    });

    it("should calculate width for buttons", () => {
      const sections = [
        {
          items: [{ type: "button", label: "Click" }],
        },
      ];
      // Base: 150, Click: 5*8+48=88
      expect(calculateNavigationWidth(sections)).toBe(150 + 88);
    });

    it("should handle localized labels", () => {
      const sections = [
        {
          items: [{ type: "link", label: { en: "Hello", de: "Hallo" } }],
        },
      ];
      // Uses en by default: 5*8+24=64
      expect(calculateNavigationWidth(sections)).toBe(150 + 64);
    });

    it("should handle missing en in localized labels", () => {
      const sections = [
        {
          items: [{ type: "link", label: { de: "Hallo" } }],
        },
      ];
      // Falls back to first available (de: "Hallo"): 5*8+24=64
      expect(calculateNavigationWidth(sections)).toBe(150 + 64);
    });

    it("should calculate width for dropdowns", () => {
      const sections = [
        {
          items: [{ type: "dropdown", label: "Services" }],
        },
      ];
      // Services: 8*8+24=88
      expect(calculateNavigationWidth(sections)).toBe(150 + 88);
    });

    it("should handle mixed navigation items", () => {
      const sections = [
        {
          items: [
            { type: "logo", label: "Logo" },
            { type: "link", label: "Home" },
            { type: "button", label: "Sign Up" },
            { type: "dropdown", label: "More" },
          ],
        },
      ];
      // Base: 150, Home: 4*8+24=56, Sign Up: 7*8+48=104, More: 4*8+24=56
      expect(calculateNavigationWidth(sections)).toBe(150 + 56 + 104 + 56);
    });

    it("should handle edge cases", () => {
      // Very long label
      const longLabel = "A".repeat(100);
      const sections = [
        {
          items: [{ type: "link", label: longLabel }],
        },
      ];
      expect(calculateNavigationWidth(sections)).toBe(150 + 100 * 8 + 24);

      // Empty label
      const emptyLabel = [
        {
          items: [{ type: "link", label: "" }],
        },
      ];
      expect(calculateNavigationWidth(emptyLabel)).toBe(150 + 24);

      // Special characters in label (emojis count differently)
      const specialChars = [
        {
          items: [{ type: "link", label: "🚀✨💻" }],
        },
      ];
      // Emojis may have different character lengths, just check it's calculated
      const result = calculateNavigationWidth(specialChars);
      expect(result).toBeGreaterThan(150);
      expect(result).toBeLessThan(300);
    });
  });

  describe("getBreakpointForWidth", () => {
    it("should return null for widths above max", () => {
      expect(getBreakpointForWidth(1500)).toBe(null);
      expect(getBreakpointForWidth(2000)).toBe(null);
    });

    it("should return sm for small widths", () => {
      expect(getBreakpointForWidth(320)).toBe("sm");
      expect(getBreakpointForWidth(640)).toBe("sm");
    });

    it("should return md for medium widths", () => {
      expect(getBreakpointForWidth(641)).toBe("md");
      expect(getBreakpointForWidth(768)).toBe("md");
    });

    it("should return lg for large widths", () => {
      expect(getBreakpointForWidth(769)).toBe("lg");
      expect(getBreakpointForWidth(1024)).toBe("lg");
    });

    it("should return xl for extra large widths", () => {
      expect(getBreakpointForWidth(1025)).toBe("xl");
      expect(getBreakpointForWidth(1280)).toBe("xl");
    });

    it("should return 2xl for 2xl widths", () => {
      expect(getBreakpointForWidth(1281)).toBe("2xl");
      expect(getBreakpointForWidth(1400)).toBe("2xl");
    });

    it("should handle edge cases", () => {
      // Exact breakpoint boundaries
      expect(getBreakpointForWidth(640)).toBe("sm");
      expect(getBreakpointForWidth(768)).toBe("md");
      expect(getBreakpointForWidth(1024)).toBe("lg");
      expect(getBreakpointForWidth(1280)).toBe("xl");

      // Very small widths
      expect(getBreakpointForWidth(0)).toBe("sm");
      expect(getBreakpointForWidth(1)).toBe("sm");

      // Negative widths (shouldn't happen but good to test)
      expect(getBreakpointForWidth(-100)).toBe("sm");

      // Very large widths
      expect(getBreakpointForWidth(10000)).toBe(null);
      expect(getBreakpointForWidth(Number.MAX_SAFE_INTEGER)).toBe(null);
    });
  });

  describe("resolveDropdownColor", () => {
    const resolvedColors = {
      primary: "#007bff",
      secondary: "#6c757d",
    };

    it("should return undefined for undefined colorRef", () => {
      expect(resolveDropdownColor(undefined, resolvedColors)).toBeUndefined();
    });

    it("should return custom color value", () => {
      const colorRef = { type: "custom", value: "#ff0000" };
      expect(resolveDropdownColor(colorRef, resolvedColors)).toBe("#ff0000");
    });

    it("should resolve theme color from resolvedColors", () => {
      const colorRef = { type: "theme", value: "primary" };
      expect(resolveDropdownColor(colorRef, resolvedColors)).toBe("#007bff");
    });

    it("should return undefined for missing theme color", () => {
      const colorRef = { type: "theme", value: "missing" };
      expect(resolveDropdownColor(colorRef, resolvedColors)).toBeUndefined();
    });

    it("should use fallback when colorRef is undefined", () => {
      expect(resolveDropdownColor(undefined, resolvedColors, "#000000")).toBe(
        "#000000",
      );
    });

    it("should use fallback when theme color not found", () => {
      const colorRef = { type: "theme", value: "missing" };
      expect(resolveDropdownColor(colorRef, resolvedColors, "#default")).toBe(
        "#default",
      );
    });
  });

  describe("sectionsToDropdownContent", () => {
    it("should return empty array for empty sections", () => {
      expect(sectionsToDropdownContent([])).toEqual([]);
    });

    it("should skip logo items", () => {
      const sections: HeaderSection[] = [
        {
          id: "section1",
          items: [
            {
              id: "logo1",
              type: "logo",
              label: "Logo",
              config: {},
            },
          ],
          flex: { base: "1" },
          align: "center",
          justify: "flex-start",
          sortOrder: 0,
        },
      ];
      expect(sectionsToDropdownContent(sections)).toEqual([]);
    });

    it("should convert link items", () => {
      const sections: HeaderSection[] = [
        {
          id: "section1",
          items: [
            {
              id: "link1",
              type: "link",
              label: "Home",
              config: {
                href: "/",
              },
            },
          ],
          flex: { base: "1" },
          align: "center",
          justify: "flex-start",
          sortOrder: 0,
        },
      ];

      const result = sectionsToDropdownContent(sections);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "link1",
        type: "navigation-item",
        config: {
          label: "Home",
          href: "/",
          icon: undefined,
          external: undefined,
        },
      });
    });

    it("should convert button items", () => {
      const sections: HeaderSection[] = [
        {
          id: "section1",
          items: [
            {
              id: "btn1",
              type: "button",
              label: "Sign Up",
              config: {
                href: "/signup",
                variant: "primary",
                size: "md",
              },
            },
          ],
          flex: { base: "1" },
          align: "center",
          justify: "flex-start",
          sortOrder: 0,
        },
      ];

      const result = sectionsToDropdownContent(sections);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "btn1",
        type: "button",
        config: {
          label: "Sign Up",
          href: "/signup",
          icon: undefined,
          external: undefined,
          variant: "primary",
          size: "md",
        },
      });
    });

    it("should convert dropdown items with label", () => {
      const sections: HeaderSection[] = [
        {
          id: "section1",
          items: [
            {
              id: "dropdown1",
              type: "dropdown",
              label: "Services",
              config: {
                content: [],
              },
            },
          ],
          flex: { base: "1" },
          align: "center",
          justify: "flex-start",
          sortOrder: 0,
        },
      ];

      const result = sectionsToDropdownContent(sections);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "dropdown1",
        type: "dropdown",
        label: "Services",
        config: {
          content: [],
        },
      });
    });

    it("should add dividers between sections", () => {
      const sections: HeaderSection[] = [
        {
          id: "section1",
          items: [
            {
              id: "link1",
              type: "link",
              label: "Home",
              config: { href: "/" },
            },
          ],
          flex: { base: "1" },
          align: "center",
          justify: "flex-start",
          sortOrder: 0,
        },
        {
          id: "section2",
          items: [
            {
              id: "link2",
              type: "link",
              label: "About",
              config: { href: "/about" },
            },
          ],
          flex: { base: "1" },
          align: "center",
          justify: "flex-start",
          sortOrder: 1,
        },
      ];

      const result = sectionsToDropdownContent(sections);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("link1");
      expect(result[1].type).toBe("divider");
      expect(result[1].id).toBe("divider-section1");
      expect(result[2].id).toBe("link2");
    });

    it("should not add divider after last section", () => {
      const sections: HeaderSection[] = [
        {
          id: "section1",
          items: [
            {
              id: "link1",
              type: "link",
              label: "Home",
              config: { href: "/" },
            },
          ],
          flex: { base: "1" },
          align: "center",
          justify: "flex-start",
          sortOrder: 0,
        },
      ];

      const result = sectionsToDropdownContent(sections);
      expect(result).toHaveLength(1);
      expect(result[0].type).not.toBe("divider");
    });

    it("should skip sections with only logo items", () => {
      const sections: HeaderSection[] = [
        {
          id: "section1",
          items: [
            {
              id: "logo1",
              type: "logo",
              label: "Logo",
              config: {},
            },
          ],
          flex: { base: "1" },
          align: "center",
          justify: "flex-start",
          sortOrder: 0,
        },
        {
          id: "section2",
          items: [
            {
              id: "link1",
              type: "link",
              label: "Home",
              config: { href: "/" },
            },
          ],
          flex: { base: "1" },
          align: "center",
          justify: "flex-start",
          sortOrder: 1,
        },
      ];

      const result = sectionsToDropdownContent(sections);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("link1");
    });
  });

  describe("getLocalizedString", () => {
    it("should return empty string for null/undefined", () => {
      expect(getLocalizedString(null)).toBe("");
      expect(getLocalizedString(undefined)).toBe("");
    });

    it("should return string directly", () => {
      expect(getLocalizedString("Hello")).toBe("Hello");
    });

    it("should use preferred locale", () => {
      const value = { en: "Hello", de: "Hallo" };
      expect(getLocalizedString(value, { preferredLocale: "de" })).toBe(
        "Hallo",
      );
    });

    it("should fall back to default locale", () => {
      const value = { en: "Hello", de: "Hallo" };
      expect(
        getLocalizedString(value, {
          preferredLocale: "fr",
          defaultLocale: "de",
        }),
      ).toBe("Hallo");
    });

    it("should fall back to en", () => {
      const value = { en: "Hello", de: "Hallo" };
      expect(
        getLocalizedString(value, {
          preferredLocale: "fr",
          defaultLocale: "es",
        }),
      ).toBe("Hello");
    });

    it("should try supported locales", () => {
      const value = { de: "Hallo", fr: "Bonjour" };
      expect(
        getLocalizedString(value, {
          preferredLocale: "en",
          supportedLocales: ["fr", "de"],
        }),
      ).toBe("Bonjour");
    });

    it("should return first available as last resort", () => {
      const value = { zh: "你好" };
      expect(getLocalizedString(value)).toBe("你好");
    });
  });

  describe("parseMarkdownToHTML", () => {
    it("should parse bold text", () => {
      expect(parseMarkdownToHTML("**bold**")).toBe(
        "<p><strong>bold</strong></p>\n",
      );
    });

    it("should parse bold text followed by plain text without space", () => {
      expect(parseMarkdownToHTML("**help**me")).toBe(
        "<p><strong>help</strong>me</p>\n",
      );
    });

    it("should parse italic text", () => {
      expect(parseMarkdownToHTML("*italic*")).toBe("<p><em>italic</em></p>\n");
    });

    it("should parse bold+italic mixed with plain text", () => {
      expect(parseMarkdownToHTML("**bold***italic*plain")).toBe(
        "<p><strong>bold</strong><em>italic</em>plain</p>\n",
      );
    });

    it("should transform headings to divs with classes", () => {
      expect(parseMarkdownToHTML("# Heading")).toBe(
        '<div class="h1">Heading</div>\n',
      );
      expect(parseMarkdownToHTML("## Sub")).toBe('<div class="h2">Sub</div>\n');
    });

    it("should parse bold text with punctuation before closing marker", () => {
      expect(parseMarkdownToHTML("**krippner:**digital")).toBe(
        "<p><strong>krippner:</strong>digital</p>\n",
      );
    });

    it("should handle plain text without markdown", () => {
      expect(parseMarkdownToHTML("hello world")).toBe("<p>hello world</p>\n");
    });
  });
});
