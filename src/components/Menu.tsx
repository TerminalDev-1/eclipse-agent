import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Chevron } from "./Icons";

export interface MenuOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
}

// Long enough to see the choice land before the menu leaves.
const PICK_MS = 260;
const CLOSE_MS = 160;

/** A pill that opens a small popover of options above the composer. */
export function Menu<T extends string>({
  value,
  options,
  onChange,
  icon,
  title,
}: {
  value: T;
  options: MenuOption<T>[];
  onChange: (value: T) => void;
  icon?: ReactNode;
  title: string;
}) {
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const [picked, setPicked] = useState<T | null>(null);
  // Bumped on every choice so the pill replays its animation, even for the same value.
  const [pulse, setPulse] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const current = options.find((o) => o.value === value) ?? options[0];

  const close = () => {
    setState("closing");
    timers.current.push(
      window.setTimeout(() => {
        setState("closed");
        setPicked(null);
      }, CLOSE_MS),
    );
  };

  const pick = (option: T) => {
    setPicked(option);
    onChange(option);
    timers.current.push(
      window.setTimeout(() => {
        close();
        setPulse((n) => n + 1);
      }, PICK_MS),
    );
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (state !== "open") return;
    const dismiss = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, [state]);

  const open = state === "open";
  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="pill"
        data-open={open}
        onClick={() => (open ? close() : setState("open"))}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={title}
      >
        {icon}
        <span className="pill-label" key={`${value}-${pulse}`}>
          {current.label}
        </span>
        <Chevron className="pill-chevron" />
        {pulse > 0 && <i className="pill-flare" key={pulse} />}
      </button>
      {state !== "closed" && (
        <div className="menu-pop" role="listbox" aria-label={title} data-closing={state === "closing"}>
          <div className="menu-title">{title}</div>
          {options.map((option, index) => (
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              data-picked={option.value === picked}
              className="menu-item"
              style={{ "--i": index } as CSSProperties}
              onClick={() => pick(option.value)}
            >
              {option.icon && <span className="menu-item-icon">{option.icon}</span>}
              <span className="menu-item-text">
                <span className="menu-item-label">{option.label}</span>
                {option.hint && <span className="menu-item-hint">{option.hint}</span>}
              </span>
              {option.value === value && <Check className="menu-item-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
