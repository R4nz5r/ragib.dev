import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  kbdSlot?: ReactNode;
}

export function Field({
  icon,
  kbdSlot,
  className = "",
  ...inputProps
}: FieldProps) {
  return (
    <label
      className={[
        "field",
        "flex items-center gap-s-1",
        "h-12 px-s-2",
        "border border-border-strong rounded-r-md",
        "bg-surface text-text-3",
        "transition-[border-color,box-shadow] duration-150",
        "hover:border-text-4",
        "focus-within:border-accent-text focus-within:shadow-[0_0_0_4px_var(--accent-tint)]",
        className,
      ].join(" ")}
    >
      {icon}
      <input
        className={[
          "flex-1 min-w-0 h-full",
          "border-0 outline-0 bg-transparent",
          "text-text font-ui text-[16px] leading-[24px]",
          "placeholder:text-text-4 placeholder:opacity-100",
        ].join(" ")}
        {...inputProps}
      />
      {kbdSlot}
    </label>
  );
}
