import { memo, useRef, useState, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { api } from "../lib/api";
import { Check, Copy } from "./Icons";

function Link({ href, children }: ComponentPropsWithoutRef<"a">) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (href && /^https?:\/\//.test(href)) api.openLink(href);
      }}
    >
      {children}
    </a>
  );
}

function Pre({ children }: ComponentPropsWithoutRef<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(ref.current?.innerText ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="codeblock">
      <button type="button" className="codeblock-copy" onClick={copy} aria-label="Copy code">
        {copied ? <Check /> : <Copy />}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ a: Link, pre: Pre }}>
        {text}
      </ReactMarkdown>
    </div>
  );
});
