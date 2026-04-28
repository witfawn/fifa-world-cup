import "@testing-library/jest-dom/jest-globals";
import React from "react";
import { render, screen } from "@testing-library/react";

// Mock useSession
const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: (...args: unknown[]) => mockUseSession(...args),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock usePathname
const mockUsePathname = jest.fn(() => "/");
jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/link as a simple anchor
jest.mock("next/link", () => {
  const MockLink = ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

import { Header } from "@/components/Header";

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
  });

  it("renders the app title", () => {
    render(<Header />);
    expect(screen.getByText("FIFA World Cup Predicter")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Header />);
    expect(screen.getByText("Home")).toHaveAttribute("href", "/");
    expect(screen.getByText("Predict")).toHaveAttribute("href", "/predict");
    expect(screen.getByText("Leaderboard")).toHaveAttribute("href", "/leaderboard");
  });

  it("highlights the active page", () => {
    render(<Header />);
    const homeLink = screen.getByText("Home");
    expect(homeLink.className).toContain("bg-blue-100");
  });

  it("shows sign in when not authenticated", () => {
    render(<Header />);
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  it("shows user info when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Test User", image: "/avatar.jpg" } },
      status: "authenticated",
    });
    render(<Header />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });
});
