export function matter<T>(content: string): [T, string] {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!match) {
    return [{} as T, content];
  }

  const frontmatter = Bun.YAML.parse(match[1] ?? "") as T;
  const body = match[2] ?? "";

  return [frontmatter, body];
}
