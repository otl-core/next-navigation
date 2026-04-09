import { HeaderConfig } from "@otl-core/cms-types";
import Link from "next/link";

interface LogoProps {
  navigation: HeaderConfig;
  siteName: string;
  logoTextColor?: string;
}

function LogoContent({ navigation, siteName, logoTextColor }: LogoProps) {
  if (navigation.logo?.url) {
    return (
      <img
        src={navigation.logo.url}
        alt={navigation.logo.alt || siteName}
        width={navigation.logo.width}
        height={navigation.logo.height}
        style={{
          height: navigation.logo.height
            ? `${navigation.logo.height}px`
            : "40px",
          width: navigation.logo.width ? `${navigation.logo.width}px` : "auto",
        }}
      />
    );
  }

  const text = navigation.logo?.alt || siteName;
  return (
    <span
      className="text-xl font-bold"
      style={logoTextColor ? { color: logoTextColor } : undefined}
    >
      {text}
    </span>
  );
}

export function Logo({ navigation, siteName, logoTextColor }: LogoProps) {
  return (
    <Link href="/" className="flex-shrink-0">
      <LogoContent
        navigation={navigation}
        siteName={siteName}
        logoTextColor={logoTextColor}
      />
    </Link>
  );
}
