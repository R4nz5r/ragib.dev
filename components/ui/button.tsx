import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonBaseProps = {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  forcedState?: "hover" | "active" | "focus" | "disabled";
};

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    as?: "button";
  };

type ButtonAsAnchor = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    as: "a";
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantStyles: Record<Variant, string> = {
  primary: [
    "bg-accent text-on-accent",
    "hover:bg-accent-hover hover:shadow-[0_0_0_4px_var(--accent-tint)]",
    "active:bg-accent-press active:shadow-none active:translate-y-px",
    "disabled:bg-surface-3 disabled:text-text-4 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
  ].join(" "),
  outline: [
    "bg-transparent border-border-strong text-text",
    "hover:bg-surface-2 hover:border-text-4",
    "active:bg-surface-3 active:border-text-4 active:translate-y-px",
    "disabled:bg-transparent disabled:border-border disabled:text-text-4 disabled:cursor-not-allowed disabled:transform-none",
  ].join(" "),
  ghost: [
    "bg-transparent border-transparent text-text-2",
    "hover:bg-surface-2 hover:text-text",
    "active:bg-surface-3 active:text-text active:translate-y-px",
    "disabled:bg-transparent disabled:text-text-4 disabled:cursor-not-allowed disabled:transform-none",
  ].join(" "),
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-s-2 text-[13px] leading-[18px]",
  md: "h-10 px-s-2 text-[14px] leading-[24px]",
  lg: "h-12 px-s-3 text-[16px] leading-[24px]",
};

const iconOnlySizes: Record<Size, string> = {
  sm: "h-8 w-8 p-0",
  md: "h-10 w-10 p-0",
  lg: "h-12 w-12 p-0",
};

/** Keys to strip from props before spreading onto the DOM element. */
const customKeys = new Set(["as", "variant", "size", "iconOnly", "forcedState"]);

function stripCustomProps<T extends Record<string, unknown>>(
  props: T
): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!customKeys.has(key)) {
      clean[key] = props[key];
    }
  }
  return clean;
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    iconOnly = false,
    forcedState,
    className = "",
    as = "button",
  } = props;

  const classes = [
    "btn",
    `btn--${variant}`,
    size !== "md" ? `btn--${size}` : "",
    iconOnly ? "btn--icon" : "",
    forcedState ? `is-${forcedState}` : "",
    "inline-flex items-center justify-center gap-s-1",
    "border rounded-r-md font-semibold whitespace-nowrap no-underline cursor-pointer",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150",
    "focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-2",
    iconOnly ? iconOnlySizes[size] : sizeStyles[size],
    variantStyles[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const nativeProps = stripCustomProps(props);
  // className is built above, so override whatever was in nativeProps
  nativeProps.className = classes;

  if (as === "a") {
    return <a {...(nativeProps as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  }

  if (forcedState === "disabled") {
    (nativeProps as ButtonHTMLAttributes<HTMLButtonElement>).disabled = true;
  }

  return (
    <button {...(nativeProps as ButtonHTMLAttributes<HTMLButtonElement>)} />
  );
}
