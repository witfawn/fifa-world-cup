"use client";

import { getTeamOptions } from "@/lib/teams";

interface TeamSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
  excludeTeam?: string;
}

export function TeamSelect({
  value,
  onChange,
  label,
  id,
  excludeTeam,
}: TeamSelectProps) {
  const teams = getTeamOptions();

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select a team</option>
        {teams.map((team) => (
          <option
            key={team}
            value={team}
            disabled={team === excludeTeam}
          >
            {team}
          </option>
        ))}
      </select>
    </div>
  );
}
