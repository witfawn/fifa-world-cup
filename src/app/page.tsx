import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center space-y-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900">
        FIFA World Cup Predicter
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Predict the World Cup winner and your favorite team. See how your picks
        compare with the community leaderboard.
      </p>

      <div className="flex justify-center gap-4">
        <Link
          href="/predict"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Make Your Prediction
        </Link>
        <Link
          href="/leaderboard"
          className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          View Leaderboard
        </Link>
      </div>
    </div>
  );
}
