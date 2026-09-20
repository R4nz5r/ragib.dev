import type { HTMLAttributes } from "react";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "active";
}

export function Tag({
  variant = "default",
  children,
  className = "",
  ...props
}: TagProps) {
  return (
    <span
      className={[
        "inline-flex items-center",
        "h-6 px-s-1",
        "border rounded-r-sm",
        "font-mono font-medium text-[13px] leading-[18px] whitespace-nowrap",
        variant === "active"
          ? "text-accent-text border-accent-line bg-accent-tint"
          : "text-text-3 border-border bg-surface-2",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
