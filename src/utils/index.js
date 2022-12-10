export function geneID() {
  return String(Date.now()) + String(Math.floor(Math.random() * 1e4));
}
