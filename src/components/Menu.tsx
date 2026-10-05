import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Chevron } from "./Icons";

export interface MenuOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="pill" data-open={open} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} title={title}>
        {icon}
        <span>{current.label}</span>
        <Chevron className="pill-chevron" />
      </button>
      {open && (
        <div className="menu-pop" role="listbox" aria-label={title}>
          <div className="menu-title">{title}</div>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className="menu-item"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
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
