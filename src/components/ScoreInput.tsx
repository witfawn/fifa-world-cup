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
  const hasValue = value !== null && value !== undefined;
  const currentValue = value ?? 0;

  const handleTap = () => {
    if (disabled) return;
    if (!hasValue) {
      onChange(0);
    } else if (currentValue < 15) {
      onChange(currentValue + 1);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
  };

  return (
    <div className="relative">
      {/* Score display - tappable */}
      <button
        onClick={handleTap}
        disabled={disabled}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-all active:scale-95"
        style={{
          backgroundColor: disabled ? "var(--navy)" : "var(--navy-light)",
          border: hasValue
            ? "2px solid var(--gold)"
            : "2px solid var(--border)",
          color: disabled
            ? "var(--muted)"
            : hasValue
            ? "var(--gold)"
            : "var(--muted)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {hasValue ? currentValue : "—"}
      </button>

      {/* Small reset button when value is set */}
      {hasValue && !disabled && (
        <button
          onClick={handleReset}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
          style={{
            backgroundColor: "var(--danger)",
            color: "white",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
