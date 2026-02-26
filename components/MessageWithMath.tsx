"use client";

import { useMemo } from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

type Part =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "display"; value: string };

function parseLatex(content: string): Part[] {
  const parts: Part[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    const displayMatch = remaining.match(/^\$\$([\s\S]*?)\$\$/);
    const inlineMatch = remaining.match(/^\\\((.*?)\\\)/s);

    if (displayMatch) {
      parts.push({ type: "display", value: displayMatch[1].trim() });
      remaining = remaining.slice(displayMatch[0].length);
    } else if (inlineMatch) {
      parts.push({ type: "inline", value: inlineMatch[1].trim() });
      remaining = remaining.slice(inlineMatch[0].length);
    } else {
      const nextDisplay = remaining.indexOf("$$");
      const nextInline = remaining.indexOf("\\(");
      let cut = remaining.length;
      if (nextDisplay >= 0 && (nextInline < 0 || nextDisplay < nextInline)) {
        cut = nextDisplay;
      } else if (nextInline >= 0) {
        cut = nextInline;
      }
      // Prevent infinite loop on malformed/incomplete LaTeX markers.
      // If we are at a marker start but no valid closing delimiter was found,
      // treat one character as plain text and continue.
      if (cut === 0) {
        parts.push({ type: "text", value: remaining[0] });
        remaining = remaining.slice(1);
        continue;
      }
      const text = remaining.slice(0, cut);
      if (text) parts.push({ type: "text", value: text });
      remaining = remaining.slice(cut);
    }
  }

  return parts;
}

function renderPart(part: Part, index: number): React.ReactNode {
  if (part.type === "text") {
    const paragraphs = part.value.split(/\n{2,}/);
    if (paragraphs.length === 1) return <span key={index}>{part.value}</span>;
    return (
      <span key={index} className="block">
        {paragraphs.map((p, i) => (
          <span key={i} className={i === paragraphs.length - 1 ? "block" : "mb-3 block"}>
            {p}
          </span>
        ))}
      </span>
    );
  }
  if (part.type === "display") {
    return (
      <span key={index} className="my-2 block overflow-x-auto">
        <BlockMath
          math={part.value}
          errorColor="#DC2626"
          renderError={() => <span>{`$$${part.value}$$`}</span>}
        />
      </span>
    );
  }
  return (
    <span key={index} className="inline">
      <InlineMath
        math={part.value}
        errorColor="#DC2626"
        renderError={() => <span>{`\\(${part.value}\\)`}</span>}
      />
    </span>
  );
}

export function MessageWithMath({ content }: { content: string }) {
  const normalizedContent = useMemo(() => {
    return (content || "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, [content]);

  const parts = useMemo(() => parseLatex(normalizedContent), [normalizedContent]);
  return (
    <span className="whitespace-pre-wrap leading-relaxed [&_.katex]:text-inherit [&_.katex]:text-base">
      {parts.map((part, i) => renderPart(part, i))}
    </span>
  );
}
