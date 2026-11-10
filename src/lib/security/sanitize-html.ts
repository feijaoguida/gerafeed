/**
 * Utility for sanitizing HTML strings against Stored and Reflected XSS.
 * Strips active scripts, iframes, dangerous tags, inline event handlers (on*),
 * and executable URL schemes (javascript:, vbscript:, data:text/html).
 * Preserves safe editorial HTML tags, attributes, and base64 image data URIs.
 */

// Tags completely removed including their inner content
const DANGEROUS_TAGS_WITH_CONTENT = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "applet",
  "noscript",
  "frame",
  "frameset",
  "form",
];

// Disallowed standalone/void tags removed without removing siblings
const DANGEROUS_STANDALONE_TAGS = [
  "base",
  "meta",
  "link",
  "input",
  "textarea",
  "button",
  "select",
];

/**
 * Sanitizes dirty HTML string to prevent XSS execution in browsers.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== "string") {
    return "";
  }

  let clean = dirtyHtml;

  // 1. Remove dangerous paired tags and their contents
  for (const tag of DANGEROUS_TAGS_WITH_CONTENT) {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, "gi");
    clean = clean.replace(regex, "");
    // Also remove unclosed opening/closing tags for safety
    const singleRegex = new RegExp(`</?${tag}\\b[^>]*>`, "gi");
    clean = clean.replace(singleRegex, "");
  }

  // 2. Remove dangerous standalone tags
  for (const tag of DANGEROUS_STANDALONE_TAGS) {
    const tagRegex = new RegExp(`</?${tag}\\b[^>]*>`, "gi");
    clean = clean.replace(tagRegex, "");
  }

  // 3. Remove inline JavaScript event handlers (e.g. onload, onerror, onclick, onmouseover)
  clean = clean.replace(/\son[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 4. Remove srcdoc attributes which could execute inline HTML inside frames/elements
  clean = clean.replace(/\ssrcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 5. Neutralize dangerous URL schemes in href, src, or action attributes
  // Allows http:, https:, mailto:, tel:, #, and data:image/(jpeg|jpg|png|webp|gif);base64
  clean = clean.replace(
    /\s(href|src|action|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attr, val1, val2, val3) => {
      const rawVal = (val1 ?? val2 ?? val3 ?? "").trim();
      const decodedVal = rawVal.replace(/&#[xX]?[0-9a-fA-F]+;/g, "").toLowerCase();

      // Check for dangerous schemes: javascript:, vbscript:, data: (non-image)
      if (
        decodedVal.startsWith("javascript:") ||
        decodedVal.startsWith("vbscript:") ||
        decodedVal.startsWith("livescript:") ||
        (decodedVal.startsWith("data:") &&
          !decodedVal.match(/^data:image\/(?:jpeg|jpg|png|webp|gif|svg\+xml);base64,/i))
      ) {
        return ` ${attr}="#"`;
      }

      return match;
    }
  );

  return clean;
}

