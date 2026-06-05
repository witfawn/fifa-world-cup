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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange(null);
      return;
    }
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0 && num <= 99) {
      onChange(num);
    }
  };

  return (
    <input
      type="number"
      min={0}
      max={99}
      value={value !== null && value !== undefined ? value : ""}
      onChange={handleChange}
      disabled={disabled}
      placeholder="—"
      className="w-12 h-12 text-center text-lg font-bold rounded-lg outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      style={{
        backgroundColor: disabled ? "var(--navy)" : "var(--navy-light)",
        border: value !== null && value !== undefined
          ? "2px solid var(--gold)"
          : "2px solid var(--border)",
        color: disabled ? "var(--muted)" : "var(--foreground)",
        cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.5 : 1,
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "var(--gold)";
        }
      }}
      onBlur={(e) => {
        if (!disabled && (value === null || value === undefined)) {
          e.currentTarget.style.borderColor = "var(--border)";
        }
      }}
    />
  );
}
