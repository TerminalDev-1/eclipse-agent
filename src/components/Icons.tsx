import type { ReactNode, SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const Plus = (p: P) => <Icon {...p}><path d="M8 3v10M3 8h10" /></Icon>;
export const ArrowUp = (p: P) => <Icon {...p}><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></Icon>;
export const Stop = (p: P) => <Icon {...p}><rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" stroke="none" /></Icon>;
export const Chevron = (p: P) => <Icon {...p}><path d="m4 6 4 4 4-4" /></Icon>;
export const Check = (p: P) => <Icon {...p}><path d="m3.5 8.5 3 3 6-7" /></Icon>;
export const Folder = (p: P) => <Icon {...p}><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.4 1.5h5A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z" /></Icon>;
export const Layers = (p: P) => <Icon {...p}><path d="m8 2 6 3-6 3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3" /></Icon>;
export const Terminal = (p: P) => <Icon {...p}><path d="m4 5.5 2.5 2.5L4 10.5M8.5 10.5H12" /></Icon>;
export const File = (p: P) => <Icon {...p}><path d="M4 2.5h5l3 3v8H4zM9 2.5v3h3" /></Icon>;
export const Lock = (p: P) => <Icon {...p}><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></Icon>;
export const Pen = (p: P) => <Icon {...p}><path d="m10.5 2.5 3 3L6 13l-3.5.5L3 10z" /></Icon>;
export const Trash = (p: P) => <Icon {...p}><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 9h6l.5-9" /></Icon>;
export const Copy = (p: P) => <Icon {...p}><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" /></Icon>;
export const Search = (p: P) => <Icon {...p}><circle cx="7" cy="7" r="4" /><path d="m10 10 3.5 3.5" /></Icon>;
export const Sun = (p: P) => <Icon {...p}><circle cx="8" cy="8" r="2.8" /><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" /></Icon>;
export const Moon = (p: P) => <Icon {...p}><path d="M13 9.6A5.5 5.5 0 0 1 6.4 3a5.5 5.5 0 1 0 6.6 6.6z" /></Icon>;
export const Minimize =(p: P) => <Icon {...p}><path d="M3.5 8h9" /></Icon>;
export const Maximize = (p: P) => <Icon {...p}><rect x="3.5" y="3.5" width="9" height="9" rx="1" /></Icon>;
export const Close = (p: P) => <Icon {...p}><path d="m4 4 8 8M12 4l-8 8" /></Icon>;
