import NextAuth from "next-auth";

// Use a proxy to lazily initialize the NextAuth handler
// so that the DB adapter is only created at runtime, not build time
let _handler: ReturnType<typeof NextAuth> | null = null;

async function getHandler() {
  if (!_handler) {
    // Dynamic import to avoid build-time DB initialization
    const { getAuthOptions } = await import("@/lib/auth");
    _handler = NextAuth(getAuthOptions());
  }
  return _handler;
}

export async function GET(...args: Parameters<ReturnType<typeof NextAuth>>) {
  const handler = await getHandler();
  return handler(...args);
}

export async function POST(...args: Parameters<ReturnType<typeof NextAuth>>) {
  const handler = await getHandler();
  return handler(...args);
}
