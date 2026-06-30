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
 * Knockout Stage (cumulative bonuses — all stack on top of 1 pt participation):
 *   Participation (picked)    → 1 point (always, if you made a pick)
 *   Correct winner            → +10 points
 *   Correct goal difference   → +4 points  (requires correct winner for non-draws;
 *                                           independent for draw predictions)
 *   Exact score               → +6 points  (requires correct winner for non-draws;
 *                                           independent for draw predictions)
 *   → Exact match:            1 + 10 + 6 + 4 = 21 pts
 *   → Winner + diff (not exact): 1 + 10 + 4 = 15 pts
 *   → Winner only:            1 + 10 = 11 pts
 *   → Draw pick, wrong PK winner: 1 + 6 + 4 = 11 pts
 *   → Wrong winner (non-draw): 1 pt (participation only)
 *   No prediction             → 0 points
 *
 * Knockout PK edge case:
 *   When the actual score is a draw (e.g. 1-1), the +10 "correct winner"
 *   bonus is based on the predicted PK winner vs actual PK winner.
 *   The score comparison (exact score, goal diff) is still based on the
 *   score at the end of extra time (not PK goals).
 */

export type MatchType = "group" | "knockout";
export type PkWinner = "home" | "away" | null;

export interface PredictionScore {
  homeScore: number;
  awayScore: number;
  pkWinner?: PkWinner;
}

export interface ActualScore {
  homeScore: number;
  awayScore: number;
  pkWinner?: PkWinner;
}

/** Determine match result: 'home' | 'away' | 'draw' */
function getResult(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

/**
 * Get the effective winner for a match result.
 * If the score is a draw and pkWinner is set, the PK winner is the effective winner.
 * Otherwise, use the score result.
 */
function getEffectiveWinner(home: number, away: number, pkWinner?: PkWinner): "home" | "away" | "draw" {
  const scoreResult = getResult(home, away);
  if (scoreResult === "draw" && pkWinner) {
    return pkWinner;
  }
  return scoreResult;
}

/**
 * Calculate points for a single prediction against the actual result.
 * @param pred - User's predicted score
 * @param actual - Actual match result (with optional pkWinner)
 * @param matchType - 'group' (default) or 'knockout'
 */
export function calculatePoints(
  pred: PredictionScore,
  actual: ActualScore,
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
  actual: ActualScore
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
  actual: ActualScore
): number {
  // Participation: always 1 pt if you picked a score
  let points = 1;

  const predWinner = getEffectiveWinner(pred.homeScore, pred.awayScore, pred.pkWinner);
  const actualWinner = getEffectiveWinner(actual.homeScore, actual.awayScore, actual.pkWinner);
  const predDiff = Math.abs(pred.homeScore - pred.awayScore);
  const actualDiff = Math.abs(actual.homeScore - actual.awayScore);
  const isDrawPrediction = pred.homeScore === pred.awayScore;

  if (predWinner === actualWinner) {
    points += 10;

    // Goal diff and exact score always count when winner is correct
    if (predDiff === actualDiff) {
      points += 4;
    }
    if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) {
      points += 6;
    }
  } else if (isDrawPrediction) {
    // Draw prediction with wrong PK winner: goal diff and exact score
    // are still independent (PK winner is a separate dimension)
    if (predDiff === actualDiff) {
      points += 4;
    }
    if (pred.homeScore === actual.homeScore && pred.awayScore === actual.awayScore) {
      points += 6;
    }
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
