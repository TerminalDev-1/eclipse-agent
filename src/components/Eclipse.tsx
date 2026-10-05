import type { CSSProperties } from "react";

/** The mark: a moon over a turning corona. `active` quickens it while the agent works. */
export function Eclipse({ size = 160, active = false, orbits = false }: { size?: number; active?: boolean; orbits?: boolean }) {
  return (
    <span className="eclipse" data-active={active} style={{ "--size": `${size}px` } as CSSProperties} aria-hidden>
      <span className="eclipse-bloom" />
      {orbits && (
        <>
          <span className="eclipse-orbit" />
          <span className="eclipse-orbit" />
        </>
      )}
      <span className="eclipse-corona" />
      <span className="eclipse-moon" />
      <span className="eclipse-flare" />
    </span>
  );
}
