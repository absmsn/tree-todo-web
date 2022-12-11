export function geneID() {
  return String(Date.now()) + String(Math.floor(Math.random() * 1e4));
}

export function randomColorRGB() {
  return '#' + (Math.random() * 0xffffff << 0).toString(16);
}

export function randomColorHSL(minH = 0, maxH = 360, minS = 0, maxS = 100,minL = 0, maxL = 100) {
  let h = minH + Math.floor(Math.random() * (maxH - minH));
  let s = minS + Math.floor(Math.random() * (maxS - minS));
  let l = minL + Math.floor(Math.random() * (maxL - minL));
  return `hsl(${h},${s}%,${l}%)`;
}

export function randonBgColor() {
  return randomColorHSL(0, 360, 0, 100, 0, 60);
}