import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // Non-API routes: exclude known public paths
    "/((?!login|rules|payment|admin|auth/verify|_next|favicon\\.ico|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // API routes: only require auth on specific API paths
    "/api/(?!auth|debug|results)(.*)",
  ],
};
