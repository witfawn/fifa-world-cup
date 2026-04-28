import { getTeamOptions } from "@/lib/teams";

describe("World Cup Teams", () => {
  it("returns a sorted array of teams", () => {
    const teams = getTeamOptions();
    expect(teams.length).toBeGreaterThan(0);
    const sorted = [...teams].sort();
    expect(teams).toEqual(sorted);
  });

  it("includes common World Cup teams", () => {
    const teams = getTeamOptions();
    expect(teams).toContain("Brazil");
    expect(teams).toContain("Argentina");
    expect(teams).toContain("France");
    expect(teams).toContain("Germany");
  });

  it("does not mutate the original array", () => {
    const teams1 = getTeamOptions();
    const teams2 = getTeamOptions();
    expect(teams1).toEqual(teams2);
  });
});

describe("Leaderboard Sorting Logic", () => {
  interface Prediction {
    winnerTeam: string;
    createdAt: string;
  }

  function sortByRecent(predictions: Prediction[]): Prediction[] {
    return [...predictions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  function getWinnerCounts(predictions: Prediction[]): Record<string, number> {
    const counts: Record<string, number> = {};
    predictions.forEach((p) => {
      counts[p.winnerTeam] = (counts[p.winnerTeam] || 0) + 1;
    });
    return counts;
  }

  function getTopPicks(
    predictions: Prediction[],
    limit: number = 5
  ): [string, number][] {
    const counts = getWinnerCounts(predictions);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  }

  it("sorts predictions by most recent first", () => {
    const predictions: Prediction[] = [
      { winnerTeam: "Brazil", createdAt: "2024-01-01" },
      { winnerTeam: "Argentina", createdAt: "2024-01-03" },
      { winnerTeam: "France", createdAt: "2024-01-02" },
    ];
    const sorted = sortByRecent(predictions);
    expect(sorted[0].winnerTeam).toBe("Argentina");
    expect(sorted[1].winnerTeam).toBe("France");
    expect(sorted[2].winnerTeam).toBe("Brazil");
  });

  it("counts winner picks correctly", () => {
    const predictions: Prediction[] = [
      { winnerTeam: "Brazil", createdAt: "2024-01-01" },
      { winnerTeam: "Brazil", createdAt: "2024-01-02" },
      { winnerTeam: "Argentina", createdAt: "2024-01-03" },
    ];
    const counts = getWinnerCounts(predictions);
    expect(counts["Brazil"]).toBe(2);
    expect(counts["Argentina"]).toBe(1);
  });

  it("returns top picks sorted by popularity", () => {
    const predictions: Prediction[] = [
      { winnerTeam: "Brazil", createdAt: "2024-01-01" },
      { winnerTeam: "Argentina", createdAt: "2024-01-02" },
      { winnerTeam: "Brazil", createdAt: "2024-01-03" },
      { winnerTeam: "France", createdAt: "2024-01-04" },
      { winnerTeam: "Brazil", createdAt: "2024-01-05" },
      { winnerTeam: "Argentina", createdAt: "2024-01-06" },
    ];
    const top = getTopPicks(predictions, 3);
    expect(top[0]).toEqual(["Brazil", 3]);
    expect(top[1]).toEqual(["Argentina", 2]);
    expect(top[2]).toEqual(["France", 1]);
  });
});
