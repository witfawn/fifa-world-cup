import "@testing-library/jest-dom/jest-globals";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PredictionForm } from "@/components/PredictionForm";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
) as jest.Mock;

describe("PredictionForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form with both selects", () => {
    render(<PredictionForm />);
    expect(screen.getByText("Make Your Prediction")).toBeInTheDocument();
    expect(screen.getByLabelText("Who will win the World Cup?")).toBeInTheDocument();
    expect(screen.getByLabelText("Your favorite team")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit prediction/i })).toBeInTheDocument();
  });

  it("shows error when submitting without selections", () => {
    render(<PredictionForm />);
    fireEvent.click(screen.getByRole("button", { name: /submit prediction/i }));
    expect(screen.getByText("Please select both teams")).toBeInTheDocument();
  });

  it("pre-fills initial values", () => {
    render(<PredictionForm initialWinner="Brazil" initialFavorite="Argentina" />);
    const winnerSelect = screen.getByLabelText("Who will win the World Cup?") as HTMLSelectElement;
    const favoriteSelect = screen.getByLabelText("Your favorite team") as HTMLSelectElement;
    expect(winnerSelect.value).toBe("Brazil");
    expect(favoriteSelect.value).toBe("Argentina");
  });

  it("disables the excluded team option in each select", () => {
    render(<PredictionForm initialWinner="Brazil" />);
    const favoriteSelect = screen.getByLabelText("Your favorite team") as HTMLSelectElement;
    const brazilOption = favoriteSelect.querySelector('option[value="Brazil"]');
    expect(brazilOption).toHaveProperty("disabled", true);
  });
});
