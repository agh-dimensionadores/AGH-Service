import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/agh-logo.png";

export function BrandLogo({
  href,
  subtitle,
  size = "sidebar",
}: {
  href: string;
  subtitle?: string;
  size?: "sidebar" | "login";
}) {
  const isLogin = size === "login";

  return (
    <Link
      href={href}
      className={`brand-logo block ${isLogin ? "text-center" : "sidebar-brand-link"}`}
    >
      <Image
        src={LOGO_SRC}
        alt="AGH Dimensionadores"
        width={isLogin ? 240 : 240}
        height={isLogin ? 48 : 52}
        priority={isLogin}
        className={
          isLogin
            ? "brand-logo-img mx-auto h-12 w-auto max-w-[min(100%,240px)]"
            : "brand-logo-img sidebar-brand-img"
        }
      />
      {subtitle ? (
        <span
          className={
            isLogin
              ? "brand-logo-sub mt-3 block text-[0.65rem] tracking-[0.16em] text-[#a8b5ab] uppercase"
              : "brand-logo-sub sidebar-brand-sub"
          }
        >
          {subtitle}
        </span>
      ) : null}
    </Link>
  );
}
