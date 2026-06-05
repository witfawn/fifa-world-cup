"use client";

interface ScoreInputProps {
  value: number | null;
  onChange: (val: number | null) => void;
  disabled?: boolean;
}

export default function ScoreInput({
  value,
  onChange,
  disabled,
}: ScoreInputProps) {
  const currentValue = value ?? 0;
  const hasValue = value !== null && value !== undefined;

  const increment = () => {
    if (disabled) return;
    const newVal = Math.min(currentValue + 1, 20);
    onChange(newVal);
  };

  const decrement = () => {
    if (disabled) return;
    if (currentValue <= 0) {
      onChange(null);
    } else {
      onChange(currentValue - 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Minus button */}
      <button
        onClick={decrement}
        disabled={disabled || (!hasValue && currentValue === 0)}
        className="w-8 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all"
        style={{
          backgroundColor: disabled ? "var(--navy)" : "var(--navy-light)",
          border: "2px solid var(--border)",
          color: disabled ? "var(--muted)" : "var(--foreground)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        −
      </button>

      {/* Score display */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
        style={{
          backgroundColor: disabled ? "var(--navy)" : "var(--navy-light)",
          border: hasValue
            ? "2px solid var(--gold)"
            : "2px solid var(--border)",
          color: disabled ? "var(--muted)" : "var(--foreground)",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {hasValue ? currentValue : "—"}
      </div>

      {/* Plus button */}
      <button
        onClick={increment}
        disabled={disabled}
        className="w-8 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all"
        style={{
          backgroundColor: disabled ? "var(--navy)" : "var(--navy-light)",
          border: "2px solid var(--border)",
          color: disabled ? "var(--muted)" : "var(--foreground)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        +
      </button>
    </div>
  );
}
