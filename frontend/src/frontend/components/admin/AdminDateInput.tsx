import React, { useRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

export interface AdminDateInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  name?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

export function AdminDateInput({
  placeholder = "Start Date",
  value,
  onChange,
  className,
  name,
  min,
  max,
  disabled = false,
}: AdminDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === "function") {
        try {
          inputRef.current.showPicker();
        } catch {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={cn(
        "group flex h-10 w-full items-center rounded-lg border border-slate-200 bg-white shadow-2xs transition-all hover:border-slate-300 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 cursor-pointer overflow-hidden",
        disabled && "opacity-50 cursor-not-allowed bg-slate-50",
        className
      )}
    >
      <div className="relative flex-1 h-full flex items-center px-3 min-w-0">
        {/* Placeholder text shown when no date is selected */}
        {!value && (
          <span className="pointer-events-none absolute start-3 text-xs text-slate-400 font-medium select-none truncate">
            {placeholder}
          </span>
        )}
        <input
          ref={inputRef}
          type="date"
          name={name}
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-full bg-transparent text-xs font-medium text-slate-800 border-none outline-none focus:outline-none focus:ring-0 p-0 cursor-pointer [color-scheme:light]",
            !value && "opacity-0"
          )}
        />
      </div>
      <div className="h-full px-3.5 bg-slate-50/90 border-s border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-cyan-600 group-hover:bg-slate-100/80 transition-colors shrink-0">
        <Calendar className="size-4 text-slate-500 group-hover:text-cyan-600 transition-colors" />
      </div>
    </div>
  );
}
