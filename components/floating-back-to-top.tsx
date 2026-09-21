"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function getSnapshot() {
  return window.scrollY > 300;
}

function getServerSnapshot() {
  return false;
}

export function FloatingBackToTop() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={[
        "fixed z-40 right-5",
        "bottom-[calc(20px+env(safe-area-inset-bottom,0px))]",
        "w-10 h-10 rounded-full",
        "flex items-center justify-center",
        "border border-border-strong",
        "bg-surface/85 backdrop-blur-md shadow-lg",
        "text-text-3 transition-all duration-200 cursor-pointer",
        "hover:text-text hover:border-accent-line hover:bg-surface-2",
        "active:translate-y-px active:bg-surface-3",
        "focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-2",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none",
      ].join(" ")}
    >
      <Icon
        name="arr-up"
        size={20}
        className="transition-transform duration-150 group-hover:-translate-y-0.5"
      />
    </button>
  );
}
