// Deterministic color from job ID — same ID always gets the same hue.
// Used by both the timeline dots and the job card dot.
const PALETTE = [
  "#60a5fa", // blue-400
  "#a78bfa", // violet-400
  "#f472b6", // pink-400
  "#fb923c", // orange-400
  "#34d399", // emerald-400
  "#facc15", // yellow-400
  "#38bdf8", // sky-400
  "#c084fc", // purple-400
  "#f87171", // red-400
  "#2dd4bf", // teal-400
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function jobColor(jobId: string): string {
  return PALETTE[hash(jobId) % PALETTE.length];
}
