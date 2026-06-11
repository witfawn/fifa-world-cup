/**
 * Scoring engine for Bangers WC 2026.
 *
 * Group Stage (exclusive tiers — highest applicable):
 *   Exact score match         → 10 points
 *   Correct goal difference   → 7 points
 *   Correct winner            → 5 points
 *   Participation (picked)    → 1 point
 *   No prediction             → 0 points
 *
 * Knockout Stage (cumulative bonuses — "+" prefix):
 *   Correct winner            → +10 points (base bonus)
 *   Exact score               → +6 points (additional)
 *   Correct winner + diff     → +4 points (additional)
 *   → Exact match:            10 + 6 + 4 = 20 pts
 *   → Winner + diff (not exact): 10 + 4 = 14 pts
 *   → Winner only:            10 pts
 *   Participation (picked)    → 1 point
 *   No prediction             → 0 points
 */

export type MatchType = "group" | "knockout";

export interface PredictionScore {
  homeScore: number;
  awayScore: number;
}

/** Determine match result: 'home' | 'away' | 'draw' */
function getResult(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

/**
 * Calculate points for a single prediction against the actual result.
 * @param pred - User's predicted score
 * @param actual - Actual match result
 * @param matchType - 'group' (default) or 'knockout'
 */
export function calculatePoints(
  pred: PredictionScore,
  actual: PredictionScore,
  matchType: MatchType = "group"
): number {
  if (matchType === "knockout") {
    return calculateKnockoutPoints(pred, actual);
  }
  return calculateGroupPoints(pred, actual);
}

/** Group Stage: exclusive tiers — highest applicable wins */
function calculateGroupPoints(
  pred: PredictionScore,
  actual: PredictionScore
): number {
  const predDiff = pred.homeScore - pred.awayScore;
  const actualDiff = actual.homeScore - actual.awayScore;

  // Exact score match → 10 pts
  if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) {
    return 10;
  }

  // Correct goal difference → 7 pts
  if (predDiff === actualDiff) {
    return 7;
  }

  // Correct winner → 5 pts
  if (
    getResult(pred.homeScore, pred.awayScore) ===
    getResult(actual.homeScore, actual.awayScore)
  ) {
    return 5;
  }

  // Participation (picked a score but wrong) → 1 pt
  return 1;
}

/** Knockout Stage: cumulative bonuses */
function calculateKnockoutPoints(
  pred: PredictionScore,
  actual: PredictionScore
): number {
  let points = 0;

  const predWinner = getResult(pred.homeScore, pred.awayScore);
  const actualWinner = getResult(actual.homeScore, actual.awayScore);
  const predDiff = Math.abs(pred.homeScore - pred.awayScore);
  const actualDiff = Math.abs(actual.homeScore - actual.awayScore);

  // Correct winner → +10 pts
  if (predWinner === actualWinner) {
    points += 10;

    // Correct winner + goal difference → +4 pts
    if (predDiff === actualDiff) {
      points += 4;
    }

    // Exact score → +6 pts
    if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) {
      points += 6;
    }
  } else {
    // Wrong result but picked a score → 1 pt (participation)
    points = 1;
  }

  return points;
}

/**
 * Determine if a match is group stage or knockout.
 * Group matches have single-letter groups (A-L), knockout have other identifiers.
 */
export function getMatchType(group: string): MatchType {
  if (/^[A-L]$/.test(group)) return "group";
  return "knockout";
}
