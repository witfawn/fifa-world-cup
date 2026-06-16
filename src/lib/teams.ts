// Team name to emoji flag mapping for FIFA World Cup 2026
export const TEAM_FLAGS: Record<string, string> = {
  Mexico: "🇲🇽",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  Czechia: "🇨🇿",
  Canada: "🇨🇦",
  "Bosnia-Herzegovina": "🇧🇦",
  Qatar: "🇶🇦",
  Switzerland: "🇨🇭",
  "United States": "🇺🇸",
  Paraguay: "🇵🇾",
  Australia: "🇦🇺",
  Türkiye: "🇹🇷",
  Germany: "🇩🇪",
  Curaçao: "🇨🇼",
  Netherlands: "🇳🇱",
  Japan: "🇯🇵",
  "Ivory Coast": "🇨🇮",
  Ecuador: "🇪🇨",
  Sweden: "🇸🇪",
  Tunisia: "🇹🇳",
  Spain: "🇪🇸",
  "Cape Verde": "🇨🇻",
  Morocco: "🇲🇦",
  Haiti: "🇭🇹",
  Brazil: "🇧🇷",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "New Zealand": "🇳🇿",
  Egypt: "🇪🇬",
  Belgium: "🇧🇪",
  Iran: "🇮🇷",
  Uruguay: "🇺🇾",
  "Saudi Arabia": "🇸🇦",
  France: "🇫🇷",
  Senegal: "🇸🇳",
  Iraq: "🇮🇶",
  Norway: "🇳🇴",
  Argentina: "🇦🇷",
  Algeria: "🇩🇿",
  Jordan: "🇯🇴",
  Austria: "🇦🇹",
  Portugal: "🇵🇹",
  "Congo DR": "🇨🇩",
  Uzbekistan: "🇺🇿",
  Colombia: "🇨🇴",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Croatia: "🇭🇷",
  Ghana: "🇬🇭",
  Panama: "🇵🇦",
};

export function getTeamFlag(teamName: string): string {
  return TEAM_FLAGS[teamName] ?? "⚽";
}

// Shorten team names for mobile / narrow displays
const SHORT_NAMES: Record<string, string> = {
  "Bosnia-Herzegovina": "Bosnia",
  "United States": "USA",
  "South Korea": "S. Korea",
  "South Africa": "S. Africa",
  "Cape Verde": "Cape Verde",
  "Congo DR": "DR Congo",
  "Saudi Arabia": "Saudi",
  "New Zealand": "New Zealand",
  "Ivory Coast": "Ivory Coast",
  "Curaçao": "Curaçao",
};

export function shortenTeamName(name: string): string {
  if (SHORT_NAMES[name]) return SHORT_NAMES[name];
  if (name.length > 10) {
    const parts = name.split(" ");
    return parts.length > 1 ? parts.join(" ") : name;
  }
  return name;
}
