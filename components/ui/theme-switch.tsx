"use client";

import { useTheme } from "@/components/theme-provider";
import { Icon } from "@/components/ui/icon";

export interface ThemeSwitchProps {
  checked?: boolean;
  interactive?: boolean;
  onToggle?: () => void;
  className?: string;
  "aria-label"?: string;
}

export function ThemeSwitch({
  checked,
  interactive = true,
  onToggle,
  className = "",
  "aria-label": ariaLabel,
}: ThemeSwitchProps = {}) {
  const themeContext = useTheme();
  const isDark = checked !== undefined ? checked : themeContext.mode === "dark";
  const handleClick = interactive
    ? (onToggle ?? themeContext.toggle)
    : undefined;

  const label = ariaLabel ?? (isDark ? "Dark theme" : "Light theme");

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      tabIndex={interactive ? undefined : -1}
      onClick={handleClick}
      className={[
        "switch",
        "relative flex-none w-14 h-8 p-0",
        "border border-border-strong rounded-r-full",
        "bg-surface-2",
        "transition-[background-color,border-color] duration-200",
        "focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-2",
        !interactive ? "cursor-default" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "switch__knob",
          "absolute top-[3px] left-[3px]",
          "w-6 h-6 rounded-r-full",
          "bg-accent text-on-accent",
          "grid place-items-center",
          "transition-transform duration-200",
          isDark ? "translate-x-6" : "translate-x-0",
        ].join(" ")}
      >
        {isDark ? (
          <Icon name="moon" size={16} className="w-3.5 h-3.5" />
        ) : (
          <Icon name="sun" size={16} className="w-3.5 h-3.5" />
        )}
      </span>
    </button>
  );
}
