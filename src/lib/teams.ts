export const WORLD_CUP_TEAMS = [
  "Argentina",
  "Brazil",
  "France",
  "Germany",
  "Spain",
  "England",
  "Netherlands",
  "Portugal",
  "Italy",
  "Belgium",
  "Croatia",
  "Morocco",
  "Japan",
  "South Korea",
  "USA",
  "Mexico",
  "Australia",
  "Senegal",
  "Ecuador",
  "Uruguay",
  "Switzerland",
  "Poland",
  "Serbia",
  "Tunisia",
  "Cameroon",
  "Ghana",
  "Canada",
  "Qatar",
  "Saudi Arabia",
  "Iran",
  "Wales",
] as const;

export type Team = (typeof WORLD_CUP_TEAMS)[number];

export function getTeamOptions(): Team[] {
  return [...WORLD_CUP_TEAMS].sort();
}
