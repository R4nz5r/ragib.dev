import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

export interface CalloutProps {
  type?: "info" | "warning";
  title?: string;
  children: ReactNode;
}

export function Callout({ type = "info", title, children }: CalloutProps) {
  const isWarn = type === "warning";

  return (
    <aside
      className={`callout ${isWarn ? "callout--warn" : ""} my-s-3`}
      role="note"
    >
      <Icon
        name={isWarn ? "alert" : "info"}
        size={20}
        className="ic flex-none"
      />
      <div className="flex-1 min-w-0 flex flex-col gap-s-0">
        {title && <b>{title}</b>}
        <div className="callout__content">{children}</div>
      </div>
    </aside>
  );
}
