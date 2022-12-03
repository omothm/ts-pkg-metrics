export function stripPrefix(s: string, prefix: string): string {
  if (s.startsWith(prefix)) {
    return s.substring(prefix.length);
  }
  return s;
}
