import type { ButtonHTMLAttributes } from "react";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
}

export function Pill({
  active = false,
  count,
  children,
  className = "",
  ...props
}: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={[
        "pill",
        "inline-flex items-center gap-s-1 flex-none",
        "h-8 px-s-2",
        "border rounded-r-full",
        "font-medium text-[14px] leading-[24px] font-ui whitespace-nowrap",
        "transition-[color,border-color,background-color] duration-150",
        "focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-2",
        active
          ? "text-accent-text border-accent-line bg-accent-tint"
          : [
              "text-text-3 border-border bg-transparent",
              "hover:text-text hover:border-border-strong hover:bg-surface-2",
            ].join(" "),
        className,
      ].join(" ")}
      {...props}
    >
      {children}
      {count != null && (
        <span
          className={[
            "pill__n",
            "font-mono font-medium text-[13px] leading-[18px]",
            active ? "text-accent-text opacity-80" : "text-text-4",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </button>
  );
}
