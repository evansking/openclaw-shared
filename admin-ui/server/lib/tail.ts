import { open } from "fs/promises";

/** Read last `bytes` of a file (or entire file if smaller). */
export async function readTail(filePath: string, bytes: number): Promise<string> {
  let fh;
  try {
    fh = await open(filePath, "r");
    const stat = await fh.stat();
    const start = Math.max(0, stat.size - bytes);
    const buf = Buffer.alloc(Math.min(bytes, stat.size));
    await fh.read(buf, 0, buf.length, start);
    await fh.close();
    // If we started mid-file, drop the first (likely partial) line
    let text = buf.toString("utf-8");
    if (start > 0) {
      const nl = text.indexOf("\n");
      if (nl !== -1) text = text.slice(nl + 1);
    }
    return text;
  } catch {
    if (fh) await fh.close().catch(() => {});
    return "";
  }
}
