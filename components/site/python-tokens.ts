/**
 * Just enough Python highlighting for the replica's two files: keywords,
 * function names (after `def`, and the three builtins the solution calls),
 * numbers and comments, as the product's editor colours them. Pure and
 * deterministic, so the server and the client render the same spans.
 */
export type CodeToken = { text: string; kind: "k" | "f" | "n" | "c" | null };

const KEYWORDS = new Set(["def", "return", "while", "if", "elif", "else", "for", "in", "from", "import", "assert", "not", "and", "or"]);
const BUILTINS = new Set(["len", "max", "min"]);

export function tokenizePython(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const re = /(#.*$)|([A-Za-z_][A-Za-z0-9_]*)|(\d+)|([^#A-Za-z_\d]+)/g;
  let afterDef = false;
  for (let m = re.exec(line); m !== null; m = re.exec(line)) {
    const [text, comment, word, number] = m;
    if (comment) {
      tokens.push({ text, kind: "c" });
    } else if (word) {
      const kind = KEYWORDS.has(word) ? "k" : afterDef || BUILTINS.has(word) ? "f" : null;
      afterDef = word === "def";
      tokens.push({ text, kind });
    } else if (number) {
      tokens.push({ text, kind: "n" });
    } else {
      tokens.push({ text, kind: null });
    }
  }
  return tokens;
}
