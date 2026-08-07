import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "agh_session";

type Payload = {
  rol?: string;
};

async function getPayload(req: NextRequest): Promise<Payload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "agh-central-dev-secret-change-in-production"
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as Payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  if (isPublicAsset) return NextResponse.next();

  const session = await getPayload(req);

  if (!session && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && isLogin) {
    const dest = session.rol === "admin" ? "/" : "/portal";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (session?.rol === "cliente") {
    const allowed =
      pathname === "/portal" ||
      pathname.startsWith("/portal/") ||
      pathname === "/login" ||
      // Fotos del catálogo (usadas en el portal)
      /^\/api\/maquinas\/\d+\/imagen\/?$/.test(pathname);
    if (!allowed) {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
  }

  if (session?.rol === "admin" && pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
