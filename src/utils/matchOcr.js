import { createWorker } from "tesseract.js";

const kdaPattern = /(\d{1,3})\s*[\/:|]\s*(\d{1,3})\s*[\/:|]\s*(\d{1,3})/;

function cleanName(value) {
  return String(value || "")
    .replace(/[^\p{L}\p{N} _.'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function parseRows(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const rows = [];
  lines.forEach((line, index) => {
    const match = line.match(kdaPattern);
    if (!match) return;
    const beforeKda = line.slice(0, match.index).replace(/[|()[\]{}]/g, " ").trim();
    const previous = lines[index - 1] || "";
    const name = cleanName(beforeKda || previous);
    if (!name || /^\d+$/.test(name) || name.length < 2) return;
    rows.push({ name, champion: "", kills: Number(match[1]), deaths: Number(match[2]), assists: Number(match[3]) });
  });
  return rows.filter((row, index, all) => all.findIndex((candidate) => candidate.name.toLowerCase() === row.name.toLowerCase()) === index).slice(0, 10);
}

export async function analyzeMatchScreenshot(image, onProgress) {
  const worker = await createWorker("eng", 1, { logger: (message) => onProgress?.(message) });
  try {
    const { data } = await worker.recognize(image);
    const rows = parseRows(data.text);
    const empty = () => ({ name: "", role: "", champion: "", kills: "", deaths: "", assists: "" });
    return {
      date: "",
      winner: "",
      blue: [...rows.slice(0, 5), ...Array.from({ length: Math.max(0, 5 - rows.slice(0, 5).length) }, empty)],
      red: [...rows.slice(5, 10), ...Array.from({ length: Math.max(0, 5 - rows.slice(5, 10).length) }, empty)],
      detectedRows: rows.length,
    };
  } finally {
    await worker.terminate();
  }
}
