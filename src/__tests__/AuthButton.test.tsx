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

import { AuthButton } from "@/components/AuthButton";

describe("AuthButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state", () => {
    mockUseSession.mockReturnValue({ data: null, status: "loading" });
    render(<AuthButton />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows sign in button when unauthenticated", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<AuthButton />);
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  it("shows user info when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Test User", image: "/avatar.jpg" } },
      status: "authenticated",
    });
    render(<AuthButton />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });
});
