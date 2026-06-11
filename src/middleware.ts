import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ token, req }) {
      const { pathname } = req.nextUrl;

      // Public page paths — always allow
      if (
        pathname === "/login" ||
        pathname === "/rules" ||
        pathname.startsWith("/payment") ||
        pathname.startsWith("/auth/verify")
      ) {
        return true;
      }

      // Public API paths — always allow
      if (
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/debug") ||
        pathname.startsWith("/api/results")
      ) {
        return true;
      }

      // Everything else requires a valid session
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/((?!_next|favicon\\.ico|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
