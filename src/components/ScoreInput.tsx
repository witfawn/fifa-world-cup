"use client";

import { useState, useRef, useEffect } from "react";

interface ScoreInputProps {
  value: number | null;
  onChange: (val: number | null) => void;
  disabled?: boolean;
}

const SCORE_OPTIONS = ["—", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"];

export default function ScoreInput({
  value,
  onChange,
  disabled,
}: ScoreInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState<number | null>(value);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasValue = value !== null && value !== undefined;
  const currentValue = value ?? 0;

  // Sync temp value when value prop changes
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  // Scroll to current value when picker opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const index = hasValue ? currentValue + 1 : 0; // +1 because "—" is at index 0
      const itemHeight = 44;
      const scrollTop = index * itemHeight;
      scrollRef.current.scrollTo({ top: scrollTop, behavior: "smooth" });
    }
  }, [isOpen, hasValue, currentValue]);

  const handleConfirm = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsOpen(false);
  };

  return (
    <>
      {/* Score display button */}
      <button
        onClick={() => {
          if (!disabled) {
            setTempValue(value);
            setIsOpen(true);
          }
        }}
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

      {/* Bottom sheet picker */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCancel}
          />

          {/* Picker */}
          <div
            className="relative w-full max-w-md rounded-t-2xl p-4 pb-6"
            style={{ backgroundColor: "var(--surface)" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handleCancel}
                className="text-sm font-medium"
                style={{ color: "var(--muted)" }}
              >
                Cancel
              </button>
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Select Score
              </span>
              <button
                onClick={handleConfirm}
                className="text-sm font-semibold"
                style={{ color: "var(--gold)" }}
              >
                Done
              </button>
            </div>

            {/* Scroll wheel */}
            <div
              ref={scrollRef}
              className="h-44 overflow-y-auto snap-y snap-mandatory scrollbar-hide"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
              }}
            >
              {/* Spacer for centering */}
              <div className="h-16" />

              {SCORE_OPTIONS.map((opt) => {
                const numVal = opt === "—" ? null : parseInt(opt);
                const isSelected =
                  numVal === tempValue ||
                  (numVal === null && tempValue === null);

                return (
                  <button
                    key={opt}
                    onClick={() => setTempValue(numVal)}
                    className="w-full h-11 flex items-center justify-center text-2xl font-bold snap-center transition-all"
                    style={{
                      color: isSelected
                        ? "var(--gold)"
                        : "var(--foreground)",
                      opacity: isSelected ? 1 : 0.4,
                      transform: isSelected ? "scale(1.2)" : "scale(1)",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}

              {/* Spacer for centering */}
              <div className="h-16" />
            </div>

            {/* Highlight bar */}
            <div
              className="absolute left-4 right-4 top-24 h-11 rounded-lg pointer-events-none"
              style={{
                backgroundColor: "rgba(212, 168, 67, 0.1)",
                border: "1px solid rgba(212, 168, 67, 0.2)",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
