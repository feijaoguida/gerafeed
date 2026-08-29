import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  priority?: boolean;
  forceDark?: boolean;
  forceLight?: boolean;
}

const SIZES = {
  sm: {
    full: { width: 120, height: 31, className: "h-7 w-auto" },
    icon: { width: 28, height: 28, className: "h-7 w-7" },
  },
  md: {
    full: { width: 160, height: 41, className: "h-9 w-auto" },
    icon: { width: 36, height: 36, className: "h-9 w-9" },
  },
  lg: {
    full: { width: 200, height: 51, className: "h-12 w-auto" },
    icon: { width: 48, height: 48, className: "h-12 w-12" },
  },
};

export function Logo({
  variant = "full",
  size = "md",
  href,
  className,
  priority = false,
  forceDark = false,
  forceLight = false,
}: LogoProps) {
  const dimensions = SIZES[size][variant];

  const renderImages = () => {
    if (variant === "icon") {
      return (
        <Image
          src="/brand/icon.png"
          alt="GeraFeed"
          width={dimensions.width}
          height={dimensions.height}
          priority={priority}
          className={cn("object-contain", dimensions.className)}
        />
      );
    }

    if (forceDark) {
      return (
        <Image
          src="/brand/logo-dark.png"
          alt="GeraFeed - Inteligência que publica"
          width={dimensions.width}
          height={dimensions.height}
          priority={priority}
          className={cn("object-contain", dimensions.className)}
        />
      );
    }

    if (forceLight) {
      return (
        <Image
          src="/brand/logo.png"
          alt="GeraFeed - Inteligência que publica"
          width={dimensions.width}
          height={dimensions.height}
          priority={priority}
          className={cn("object-contain", dimensions.className)}
        />
      );
    }

    return (
      <>
        {/* Light Mode Logo */}
        <Image
          src="/brand/logo.png"
          alt="GeraFeed - Inteligência que publica"
          width={dimensions.width}
          height={dimensions.height}
          priority={priority}
          className={cn("dark:hidden object-contain", dimensions.className)}
        />
        {/* Dark Mode Logo */}
        <Image
          src="/brand/logo-dark.png"
          alt="GeraFeed - Inteligência que publica"
          width={dimensions.width}
          height={dimensions.height}
          priority={priority}
          className={cn("hidden dark:block object-contain", dimensions.className)}
        />
      </>
    );
  };

  const content = (
    <div className={cn("inline-flex items-center select-none", className)}>
      {renderImages()}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-hidden">
        {content}
      </Link>
    );
  }

  return content;
}
