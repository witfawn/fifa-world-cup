import "@testing-library/jest-dom/jest-globals";
import React from "react";
import { render, screen } from "@testing-library/react";
import { LeaderboardTable } from "@/components/LeaderboardTable";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "user-1", name: "Test User" } },
    status: "authenticated",
  }),
}));

const mockPredictions = [
  {
    id: "1",
    userId: "user-1",
    winnerTeam: "Brazil",
    favoriteTeam: "Argentina",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    userName: "Test User",
  },
  {
    id: "2",
    userId: "user-2",
    winnerTeam: "Brazil",
    favoriteTeam: "France",
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    userName: "Another User",
  },
  {
    id: "3",
    userId: "user-3",
    winnerTeam: "Argentina",
    favoriteTeam: "Germany",
    createdAt: "2024-01-03T00:00:00.000Z",
    updatedAt: "2024-01-03T00:00:00.000Z",
    userName: "Third User",
  },
];

describe("LeaderboardTable", () => {
  it("renders table headers", () => {
    render(<LeaderboardTable predictions={mockPredictions} />);
    expect(screen.getByText("#")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Winner Pick")).toBeInTheDocument();
    expect(screen.getByText("Favorite Team")).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
  });

  it("renders all predictions", () => {
    render(<LeaderboardTable predictions={mockPredictions} />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Another User")).toBeInTheDocument();
    expect(screen.getByText("Third User")).toBeInTheDocument();
  });

  it("shows most popular winner picks", () => {
    render(<LeaderboardTable predictions={mockPredictions} />);
    expect(screen.getByText("Most Popular Winner Picks")).toBeInTheDocument();
    expect(screen.getByText("Brazil (2)")).toBeInTheDocument();
    expect(screen.getByText("Argentina (1)")).toBeInTheDocument();
  });

  it("shows empty state when no predictions", () => {
    render(<LeaderboardTable predictions={[]} />);
    expect(screen.getByText("No predictions yet. Be the first to predict!")).toBeInTheDocument();
  });

  it("highlights current user's row", () => {
    const { container } = render(<LeaderboardTable predictions={mockPredictions} />);
    const userRow = container.querySelector("tr.bg-blue-50");
    expect(userRow).toBeTruthy();
  });
});
