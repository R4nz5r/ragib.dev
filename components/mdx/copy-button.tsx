"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

interface CopyButtonProps {
  rawCode: string;
  forceCopied?: boolean;
}

export function CopyButton({ rawCode, forceCopied }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const isCopied = forceCopied ?? copied;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rawCode);
      if (!forceCopied) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy code to clipboard", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={isCopied ? "Copied to clipboard" : "Copy code to clipboard"}
      className={[
        "btn btn--ghost btn--sm inline-flex items-center gap-s-1 h-8 px-s-2 rounded-r-md",
        "font-semibold text-[13px] leading-[18px] transition-colors duration-150 cursor-pointer",
        isCopied
          ? "is-copied text-accent-text hover:text-accent-text"
          : "text-text-3 hover:text-text hover:bg-surface-2",
      ].join(" ")}
    >
      <Icon name={isCopied ? "check" : "copy"} size={16} />
      <span className="lbl">{isCopied ? "Copied" : "Copy"}</span>
    </button>
  );
}
