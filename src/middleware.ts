import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login (the sign-in page)
     * - /api/auth (NextAuth API routes)
     * - /api/migrate (temporary migration endpoint)
     * - /_next (Next.js internals)
     * - /favicon.ico, /fonts, etc.
     */
    "/((?!login|api/auth|api/migrate|_next|favicon\\.ico|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
