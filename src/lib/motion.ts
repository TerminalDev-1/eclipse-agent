import { useRef, type PointerEvent as ReactPointerEvent } from "react";

const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A ripple spreads from the point of contact on every button, like a touch on water. */
function installRipples() {
  const onDown = (e: PointerEvent) => {
    const button = (e.target as Element).closest<HTMLElement>("button:not(:disabled)");
    if (!button || button.closest(".titlebar-controls")) return;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.4;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    const drop = document.createElement("i");
    drop.style.width = drop.style.height = `${size}px`;
    drop.style.left = `${e.clientX - rect.left - size / 2}px`;
    drop.style.top = `${e.clientY - rect.top - size / 2}px`;
    ripple.append(drop);
    button.append(ripple);
    drop.addEventListener("animationend", () => ripple.remove(), { once: true });
  };
  document.addEventListener("pointerdown", onDown);
  return () => document.removeEventListener("pointerdown", onDown);
}

/** Publishes the pointer position so a soft light in the sky can drift after it. */
function installPointerLight() {
  let frame = 0;
  const onMove = (e: PointerEvent) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--px", `${e.clientX}px`);
      document.documentElement.style.setProperty("--py", `${e.clientY}px`);
    });
  };
  document.addEventListener("pointermove", onMove);
  return () => document.removeEventListener("pointermove", onMove);
}

export function installMotion() {
  if (calm()) return () => {};
  const offs = [installRipples(), installPointerLight()];
  return () => offs.forEach((off) => off());
}

/**
 * One highlight that glides between the `[data-glide]` children of a list as the pointer
 * moves over them, instead of each row lighting up on its own. Styled by `.glide`.
 */
export function useGlider<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const moveTo = (target: EventTarget | null) => {
    const box = ref.current;
    if (!box) return;
    const item = (target as Element | null)?.closest<HTMLElement>("[data-glide]");
    if (!item || !box.contains(item)) {
      box.style.setProperty("--glide-o", "0");
      return;
    }
    box.style.setProperty("--glide-y", `${item.offsetTop}px`);
    box.style.setProperty("--glide-h", `${item.offsetHeight}px`);
    box.style.setProperty("--glide-o", "1");
  };
  return {
    ref,
    onPointerOver: (e: ReactPointerEvent) => moveTo(e.target),
    onPointerLeave: () => moveTo(null),
  };
}
