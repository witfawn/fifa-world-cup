import NextAuth from "next-auth";

// Use a proxy to lazily initialize the NextAuth handler
// so that the DB adapter is only created at runtime, not build time
let _handler: ReturnType<typeof NextAuth> | null = null;

function getHandler() {
  if (!_handler) {
    // Dynamic import to avoid build-time DB initialization
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuthOptions } = require("@/lib/auth") as typeof import("@/lib/auth");
    _handler = NextAuth(getAuthOptions());
  }
  return _handler;
}

export function GET(...args: Parameters<ReturnType<typeof NextAuth>>) {
  return getHandler()(...args);
}

export function POST(...args: Parameters<ReturnType<typeof NextAuth>>) {
  return getHandler()(...args);
}
