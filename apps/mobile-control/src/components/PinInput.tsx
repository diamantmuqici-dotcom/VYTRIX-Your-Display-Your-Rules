import { useRef } from "react";
import type { KeyboardEvent } from "react";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const LENGTH = 6;

export default function PinInput({ value, onChange, disabled = false }: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: LENGTH }, (_, index) => value[index] ?? "");

  const emit = (next: string[]) => onChange(next.join("").slice(0, LENGTH));

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    const next = [...digits];
    if (clean.length === 0) {
      next[index] = "";
      emit(next);
      return;
    }
    for (let offset = 0; offset < clean.length && index + offset < LENGTH; offset += 1) {
      next[index + offset] = clean[offset] ?? "";
    }
    emit(next);
    refs.current[Math.min(index + clean.length, LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      emit(next);
      refs.current[index - 1]?.focus();
      event.preventDefault();
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
      event.preventDefault();
      return;
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      refs.current[index + 1]?.focus();
      event.preventDefault();
    }
  };

  return (
    <div className="pin-input" role="group" aria-label="Six digit pairing code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          className="pin-cell"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
