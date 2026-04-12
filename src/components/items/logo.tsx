import { HeaderConfig } from "@otl-core/cms-types";
import Link from "next/link";

interface LogoProps {
  navigation: HeaderConfig;
  siteName: string;
  logoTextColor?: string;
  locale?: string;
  defaultLocale?: string;
}

function LogoContent({ navigation, siteName, logoTextColor }: LogoProps) {
  if (navigation.logo?.url) {
    return (
      <img
        src={navigation.logo.url}
        alt={navigation.logo.alt || siteName}
        className="navigation-logo-img"
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

export function Logo({
  navigation,
  siteName,
  logoTextColor,
  locale,
  defaultLocale,
}: LogoProps) {
  const href = locale && locale !== defaultLocale ? `/${locale}` : "/";
  return (
    <Link href={href} className="flex-shrink-0">
      <LogoContent
        navigation={navigation}
        siteName={siteName}
        logoTextColor={logoTextColor}
      />
    </Link>
  );
}
