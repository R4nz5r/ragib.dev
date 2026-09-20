import type { HTMLAttributes } from "react";

export function Kbd({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={[
        "inline-flex items-center flex-none",
        "h-6 px-s-1",
        "border border-border-strong rounded-r-sm",
        "bg-surface-2 text-text-3",
        "font-mono font-medium text-[13px] leading-[18px]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </kbd>
  );
}
