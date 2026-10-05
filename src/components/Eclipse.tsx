import type { CSSProperties } from "react";

/** The mark: a moon over a turning corona. `active` quickens it while the agent works. */
export function Eclipse({ size = 160, active = false }: { size?: number; active?: boolean }) {
  return (
    <span className="eclipse" data-active={active} style={{ "--size": `${size}px` } as CSSProperties} aria-hidden>
      <span className="eclipse-bloom" />
      <span className="eclipse-corona" />
      <span className="eclipse-moon" />
      <span className="eclipse-flare" />
    </span>
  );
}
