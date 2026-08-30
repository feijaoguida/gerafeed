import React from "react";
import Link from "next/link";

interface MarkdownContentProps {
  content: string;
}

/**
 * Renderiza Markdown seguro diretamente em elementos React,
 * sem uso de dangerouslySetInnerHTML e com suporte a links internos via next/link.
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let elementIndex = 0;

  const flushList = () => {
    if (!currentList) return;
    const ListTag = currentList.type;
    const items = [...currentList.items];
    const key = `list-${elementIndex++}`;

    elements.push(
      <ListTag
        key={key}
        className={`my-4 pl-6 space-y-2 text-foreground/90 leading-relaxed ${
          currentList.type === "ul" ? "list-disc" : "list-decimal"
        }`}
      >
        {items.map((it, idx) => (
          <li key={idx}>{renderInline(it)}</li>
        ))}
      </ListTag>
    );

    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Linha vazia
    if (!trimmed) {
      flushList();
      continue;
    }

    // Título H1 (# )
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={`h1-${elementIndex++}`}
          className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mt-8 mb-4 tracking-tight"
        >
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Título H2 (## )
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={`h2-${elementIndex++}`}
          className="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-10 mb-4 tracking-tight border-b border-border/40 pb-2"
        >
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // Título H3 (### )
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={`h3-${elementIndex++}`}
          className="font-heading text-xl sm:text-2xl font-bold text-foreground mt-8 mb-3 tracking-tight"
        >
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // Título H4 (#### )
    if (trimmed.startsWith("#### ")) {
      flushList();
      elements.push(
        <h4
          key={`h4-${elementIndex++}`}
          className="font-heading text-lg font-bold text-foreground mt-6 mb-2 tracking-tight"
        >
          {renderInline(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    // Citação Blockquote (> )
    if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${elementIndex++}`}
          className="my-6 border-l-4 border-primary pl-4 italic text-muted-foreground bg-surface-muted/40 py-2 rounded-r-lg"
        >
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Lista não ordenada (- ou *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const text = trimmed.replace(/^[-*]\s+/, "");
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [text] };
      } else {
        currentList.items.push(text);
      }
      continue;
    }

    // Lista ordenada (1. , 2. )
    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      const text = orderedMatch[1];
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [text] };
      } else {
        currentList.items.push(text);
      }
      continue;
    }

    // Parágrafo comum
    flushList();
    elements.push(
      <p
        key={`p-${elementIndex++}`}
        className="font-sans text-base sm:text-lg text-foreground/90 leading-relaxed mb-5"
      >
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <article className="prose prose-slate dark:prose-invert max-w-none">{elements}</article>;
}

/**
 * Processador de formatação inline segura:
 * - **negrito**
 * - *itálico*
 * - `código inline`
 * - [link](href)
 */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  // Regex para link [text](url), bold **text**, italic *text*, code `code`
  const inlineRegex = /(!?\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/;

  while (remaining) {
    const match = remaining.match(inlineRegex);
    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(remaining.slice(0, match.index));
    }

    const matchedStr = match[0];

    if (matchedStr.startsWith("**") && match[5]) {
      // Bold
      parts.push(<strong key={`b-${keyIndex++}`} className="font-semibold text-foreground">{match[5]}</strong>);
    } else if (matchedStr.startsWith("*") && match[7]) {
      // Italic
      parts.push(<em key={`em-${keyIndex++}`} className="italic">{match[7]}</em>);
    } else if (matchedStr.startsWith("`") && match[9]) {
      // Code
      parts.push(
        <code
          key={`code-${keyIndex++}`}
          className="px-1.5 py-0.5 rounded-md bg-surface-muted text-foreground text-sm font-mono border border-border"
        >
          {match[9]}
        </code>
      );
    } else if (matchedStr.startsWith("[") && match[2] && match[3]) {
      // Link
      const label = match[2];
      const href = match[3];

      if (href.startsWith("/")) {
        parts.push(
          <Link
            key={`l-${keyIndex++}`}
            href={href}
            className="text-primary underline hover:text-primary/80 font-medium transition-colors"
          >
            {label}
          </Link>
        );
      } else {
        parts.push(
          <a
            key={`a-${keyIndex++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 font-medium transition-colors"
          >
            {label}
          </a>
        );
      }
    } else {
      parts.push(matchedStr);
    }

    remaining = remaining.slice(match.index + matchedStr.length);
  }

  return <React.Fragment>{parts}</React.Fragment>;
}
