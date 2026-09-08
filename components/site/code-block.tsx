import * as React from "react";

/**
 * Python, highlighted as HTML.
 *
 * Ported from `../code-socratic`'s `apps/web/components/CodeBlock.tsx`. The
 * session's editor is Monaco, which is far too much to ship to a marketing page
 * for a block of code nobody can type into — so the same Python is rendered
 * statically, with the gutter the editor shows.
 *
 * `KEYWORDS` is Monaco's own Python list verbatim, which is why `len(...)` and
 * `max(...)` colour as keywords rather than as calls: Monaco's Monarch tokenizer
 * has no function scope, so a call is never coloured in the real editor either.
 * Agreeing with the product means matching what Monaco *emits*, not what a theme
 * could colour.
 *
 * The four token classes are painted by `app/site.css` from SLDS palette hooks
 * (ADR-014) — the product's Carbon blue and purple are literals, and rule 3
 * does not allow those here.
 */

const KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break", "case",
  "class", "continue", "def", "del", "elif", "else", "except", "exec", "finally",
  "for", "from", "global", "if", "import", "in", "is", "lambda", "match", "nonlocal",
  "not", "or", "pass", "print", "raise", "return", "try", "type", "while", "with",
  "yield",
  "abs", "all", "any", "apply", "basestring", "bin", "bool", "buffer", "bytearray",
  "callable", "chr", "classmethod", "cmp", "coerce", "compile", "complex", "delattr",
  "dict", "dir", "divmod", "enumerate", "eval", "execfile", "file", "filter", "float",
  "format", "frozenset", "getattr", "globals", "hasattr", "hash", "help", "hex", "id",
  "input", "int", "intern", "isinstance", "issubclass", "iter", "len", "list",
  "locals", "long", "map", "max", "memoryview", "min", "next", "object", "oct", "open",
  "ord", "pow", "property", "range", "raw_input", "reduce", "reload", "repr",
  "reversed", "round", "self", "set", "setattr", "slice", "sorted", "staticmethod",
  "str", "sum", "super", "tuple", "unichr", "unicode", "vars", "xrange", "zip",
]);

/**
 * Ordered alternatives, matched left to right — a `#` inside a string must lose
 * to the string, so strings come first. The last group is a bare word, sorted
 * against `KEYWORDS` afterwards.
 */
const TOKEN =
  /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#[^\n]*)|(\b\d[\w.]*\b)|(\b[A-Za-z_]\w*\b)/g;

type Piece = { text: string; kind: string | null };

function tokenize(source: string): Piece[] {
  const out: Piece[] = [];
  let last = 0;
  for (const m of source.matchAll(TOKEN)) {
    const at = m.index;
    if (at > last) out.push({ text: source.slice(last, at), kind: null });
    const [text, str, comment, num, word] = m;
    if (str) out.push({ text, kind: "string" });
    else if (comment) out.push({ text, kind: "comment" });
    else if (num) out.push({ text, kind: "number" });
    else if (word) out.push({ text, kind: KEYWORDS.has(word) ? "keyword" : null });
    last = at + text.length;
  }
  if (last < source.length) out.push({ text: source.slice(last), kind: null });
  return out;
}

export function CodeBlock({ code, lineNumbers = false }: { code: string; lineNumbers?: boolean }) {
  const source = code.replace(/\n+$/, "");
  const pieces = tokenize(source);
  const count = source.split("\n").length;

  return (
    <div className="site-code">
      {lineNumbers && (
        <div className="site-code__gutter" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
      )}
      <pre className="site-code__pre">
        <code>
          {pieces.map((piece, i) =>
            piece.kind ? (
              <span key={i} className={`site-code__${piece.kind}`}>
                {piece.text}
              </span>
            ) : (
              <React.Fragment key={i}>{piece.text}</React.Fragment>
            ),
          )}
        </code>
      </pre>
    </div>
  );
}
