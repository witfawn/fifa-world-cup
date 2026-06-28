"use client";

import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function RulesPage() {
  const { data: session } = useSession();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-2">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            📋 How to Play
          </h1>
          {!session && (
            <a
              href="/login"
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: "rgba(212, 168, 67, 0.12)",
                color: "var(--gold)",
              }}
            >
              Log in →
            </a>
          )}
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Predict match scores for the FIFA World Cup 2026 and compete with your friends.
        </p>

        {/* Getting Started */}
        <Section title="🚀 Getting Started">
          <Step number={1} text="Log in with Google or email" />
          <Step number={2} text="Go to the Predict tab" />
          <Step number={3} text="Pick scores for each match by tapping the score boxes" />
          <Step number={4} text="Your picks save automatically — come back anytime to change them" />
        </Section>

        {/* Group Stage */}
        <Section title="⚽ Group Stage Scoring">
          <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
            12 groups of 4 teams. Each team plays 3 matches. You predict the score for all 72 group stage games.
          </p>
          <ScoringRow points="10 pts" label="Exact score" example="You said 2-1, actual was 2-1" />
          <ScoringRow points="7 pts" label="Correct goal difference" example="You said 3-1 (diff +2), actual was 2-0 (diff +2)" />
          <ScoringRow points="5 pts" label="Correct winner" example="You said France wins, France won 3-0" />
          <ScoringRow points="1 pt" label="Participation" example="You picked a score — even if wrong, you get 1 point" />
          <ScoringRow points="0 pts" label="No prediction" example="You did not pick this game" />
          <Note text="Ties are valid predictions in group stage. If you predict a tie and it is a tie, you get at least 7 pts (goal difference is always 0)." />
        </Section>

        {/* Knockout Stage */}
        <Section title="🏆 Knockout Stage Scoring">
          <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
            From Round of 32 onward. You predict after the group stage ends when the bracket is set.
          </p>
          <ScoringRow points="+10 pts" label="Correct winner" example="You said Brazil advances, Brazil won (even via penalties)" />
          <ScoringRow points="+6 pts" label="Exact score" example="You said 1-1, actual was 1-1 after extra time" />
          <ScoringRow points="+4 pts" label="Correct winner + goal diff" example="You said France 2-0, actual was France 3-1 (winner + diff correct)" />
          <ScoringRow points="1 pt" label="Participation" example="You picked a score — even if wrong, you get 1 point" />
          <ScoringRow points="0 pts" label="No prediction" example="You did not pick this game" />
          <Note text="Score = result after 90 min (or 120 min if extra time). If you predict a tie, pick which team wins after penalty kicks. The +10 winner bonus uses your PK pick when the game ends in a draw." />
        </Section>

        {/* Knockout Examples */}
        <Section title="📝 Knockout Scoring Examples">
          <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
            All bonuses stack on top of 1 pt participation. Max per game: 21 pts.
          </p>

          {/* Example 1 */}
          <div className="mb-4">
            <p className="text-xs font-bold mb-2" style={{ color: "var(--foreground)" }}>
              ⚽ You predicted: Argentina 2-1
            </p>
            <div className="space-y-1.5">
              <ExampleRow actual="Argentina 2-1" pts="21" why="10 winner + 6 exact + 4 diff (+1 both)" />
              <ExampleRow actual="Argentina 1-0" pts="16" why="10 winner + 4 diff (+1 both)" />
              <ExampleRow actual="Argentina 3-1" pts="11" why="10 winner — diff is +2, not +1" />
              <ExampleRow actual="France 2-1" pts="1" why="Wrong winner" />
              <ExampleRow actual="2-2, Argentina PKs" pts="11" why="10 winner (PK pick right) — wrong score" />
            </div>
          </div>

          {/* Example 2 */}
          <div className="mb-4">
            <p className="text-xs font-bold mb-2" style={{ color: "var(--foreground)" }}>
              ⚽ You predicted: 1-1, Brazil wins PKs
            </p>
            <div className="space-y-1.5">
              <ExampleRow actual="1-1, Brazil PKs" pts="21" why="10 winner + 6 exact + 4 diff (0 both)" />
              <ExampleRow actual="1-1, Germany PKs" pts="11" why="6 exact + 4 diff — wrong PK winner" />
              <ExampleRow actual="2-2, Brazil PKs" pts="15" why="10 winner + 4 diff (0 both)" />
              <ExampleRow actual="Brazil 2-1" pts="1" why="You predicted a draw" />
            </div>
          </div>

          {/* Example 3 */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: "var(--foreground)" }}>
              ⚽ You predicted: 0-0, Spain wins PKs
            </p>
            <div className="space-y-1.5">
              <ExampleRow actual="0-0, Spain PKs" pts="21" why="10 winner + 6 exact + 4 diff (0 both)" />
              <ExampleRow actual="0-0, Portugal PKs" pts="11" why="6 exact + 4 diff — wrong PK winner" />
              <ExampleRow actual="1-1, Spain PKs" pts="15" why="10 winner + 4 diff (0 both)" />
              <ExampleRow actual="Spain 2-0" pts="1" why="You predicted a draw" />
            </div>
          </div>
        </Section>

        {/* Locking */}
        <Section title="🔒 Locking Rules">
          <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
            Each match locks <strong style={{ color: "var(--foreground)" }}>5 minutes before kickoff</strong>. Once locked:
          </p>
          <ul className="text-sm space-y-1.5 ml-4" style={{ color: "var(--muted)" }}>
            <li>• No changes allowed</li>
            <li>• If you did not pick, you get 0 points</li>
            <li>• If you picked, you get at least 1 point (more if accurate)</li>
          </ul>
        </Section>

        {/* Prizes */}
        <Section title="💰 Prizes">
          <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
            $100 entry fee per player. Prize pool scales with the number of participants.
          </p>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-xs" style={{ minWidth: 420 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left py-2 pr-2 font-semibold" style={{ color: "var(--muted)" }}>
                    Place
                  </th>
                  <th className="text-center py-2 px-2 font-semibold" style={{ color: "var(--muted)" }}>
                    &lt;10
                  </th>
                  <th className="text-center py-2 px-2 font-semibold" style={{ color: "var(--muted)" }}>
                    10–15
                  </th>
                  <th className="text-center py-2 px-2 font-semibold" style={{ color: "var(--muted)" }}>
                    16–20
                  </th>
                  <th className="text-center py-2 pl-2 font-semibold" style={{ color: "var(--muted)" }}>
                    20+
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-2 pr-2 font-medium" style={{ color: "var(--foreground)" }}>🥇 1st</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--gold)" }}>100%</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--gold)" }}>70%</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--gold)" }}>65%</td>
                  <td className="text-center py-2 pl-2" style={{ color: "var(--gold)" }}>60%</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-2 pr-2 font-medium" style={{ color: "var(--foreground)" }}>🥈 2nd</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--muted)" }}>—</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--gold)" }}>30%</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--gold)" }}>25%</td>
                  <td className="text-center py-2 pl-2" style={{ color: "var(--gold)" }}>25%</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-2 pr-2 font-medium" style={{ color: "var(--foreground)" }}>🥉 3rd</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--muted)" }}>—</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--muted)" }}>—</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--gold)" }}>10%</td>
                  <td className="text-center py-2 pl-2" style={{ color: "var(--gold)" }}>10%</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2 font-medium" style={{ color: "var(--foreground)" }}>4th</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--muted)" }}>—</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--muted)" }}>—</td>
                  <td className="text-center py-2 px-2" style={{ color: "var(--muted)" }}>—</td>
                  <td className="text-center py-2 pl-2" style={{ color: "var(--gold)" }}>5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Tips */}
        <Section title="💡 Tips">
          <ul className="text-sm space-y-2" style={{ color: "var(--muted)" }}>
            <li>• <strong style={{ color: "var(--foreground)" }}>Tap the score box</strong> to set a score (0, 1, 2, ...)</li>
            <li>• <strong style={{ color: "var(--foreground)" }}>Tap the red ×</strong> to clear a pick</li>
            <li>• You can change picks anytime before lock</li>
            <li>• Skip games and come back later — no penalty</li>
            <li>• Use the <strong style={{ color: "var(--foreground)" }}>Upcoming</strong> view to see what is next</li>
            <li>• Use <strong style={{ color: "var(--foreground)" }}>By Group</strong> to see all 6 games for a group</li>
          </ul>
        </Section>
      </main>

      <BottomNav />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <h2
        className="text-sm font-bold uppercase tracking-wider mb-4"
        style={{ color: "var(--gold)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          backgroundColor: "rgba(212, 168, 67, 0.15)",
          color: "var(--gold)",
        }}
      >
        {number}
      </div>
      <p className="text-sm" style={{ color: "var(--foreground)" }}>
        {text}
      </p>
    </div>
  );
}

function ScoringRow({
  points,
  label,
  example,
}: {
  points: string;
  label: string;
  example: string;
}) {
  return (
    <div
      className="py-2.5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3 mb-1">
        <span
          className="text-sm font-bold w-16 flex-shrink-0"
          style={{ color: "var(--gold)" }}
        >
          {points}
        </span>
        <span
          className="text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          {label}
        </span>
      </div>
      <p className="text-xs ml-16" style={{ color: "var(--muted)" }}>
        {example}
      </p>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return (
    <div
      className="mt-3 p-3 rounded-lg"
      style={{
        backgroundColor: "rgba(212, 168, 67, 0.08)",
        border: "1px solid rgba(212, 168, 67, 0.15)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--gold)" }}>
        💡 {text}
      </p>
    </div>
  );
}

function ExampleRow({
  actual,
  pts,
  why,
}: {
  actual: string;
  pts: string;
  why: string;
}) {
  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs"
      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
    >
      <span
        className="font-bold w-8 text-right flex-shrink-0"
        style={{ color: "var(--gold)" }}
      >
        {pts}
      </span>
      <span
        className="font-medium flex-shrink-0"
        style={{ color: "var(--foreground)" }}
      >
        {actual}
      </span>
      <span
        className="ml-auto text-right"
        style={{ color: "var(--muted)", fontSize: "10px" }}
      >
        {why}
      </span>
    </div>
  );
}
