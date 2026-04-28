"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PredictionForm } from "@/components/PredictionForm";

export default function PredictPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [existingPrediction, setExistingPrediction] = useState<{
    winnerTeam: string;
    favoriteTeam: string;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/predictions/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.prediction) {
            setExistingPrediction(data.prediction);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="py-8">
      <PredictionForm
        initialWinner={existingPrediction?.winnerTeam || ""}
        initialFavorite={existingPrediction?.favoriteTeam || ""}
      />
    </div>
  );
}
