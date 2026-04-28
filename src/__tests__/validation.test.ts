import { validatePrediction } from "@/lib/validation";

describe("Prediction Validation", () => {
  it("accepts valid prediction data", () => {
    const data = { winnerTeam: "Brazil", favoriteTeam: "Argentina" };
    expect(() => validatePrediction(data)).not.toThrow();
  });

  it("rejects empty winnerTeam", () => {
    const data = { winnerTeam: "", favoriteTeam: "Argentina" };
    expect(() => validatePrediction(data)).toThrow("winnerTeam");
  });

  it("rejects empty favoriteTeam", () => {
    const data = { winnerTeam: "Brazil", favoriteTeam: "" };
    expect(() => validatePrediction(data)).toThrow("favoriteTeam");
  });

  it("rejects missing fields", () => {
    const data = {};
    expect(() => validatePrediction(data)).toThrow();
  });
});
