import { z } from "zod";

export const predictionSchema = z.object({
  winnerTeam: z.string().min(1, "Winner team is required"),
  favoriteTeam: z.string().min(1, "Favorite team is required"),
});

export type PredictionInput = z.infer<typeof predictionSchema>;

export function validatePrediction(data: unknown): PredictionInput {
  return predictionSchema.parse(data);
}
