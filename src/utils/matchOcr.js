import { createWorker } from "tesseract.js";

const kdaPattern = /(\d{1,3})\s*\/\s*(\d{1,3})\s*\/\s*(\d{1,3})/g;

function cleanName(value) {
  return String(value || "")
    .replace(/[^\p{L}\p{N} _.'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function cleanRowName(value) {
  const cleaned = cleanName(value).replace(/^\s*[A-Z]?\s*\d{1,3}\s+/, "").trim();
  if (/^team\s*\d?/i.test(cleaned) || /^k\s*\/\s*d\s*\/\s*a/i.test(cleaned)) return "";
  const parts = cleaned.split(" ").filter(Boolean);
  // Scoreboard rows usually read: level, player name, champion, K/D/A.
  // Remove the final champion token when OCR kept it on the same line.
  if (parts.length > 1 && /^[A-Za-z][A-Za-z.'-]{2,}$/.test(parts.at(-1))) parts.pop();
  return parts.join(" ").trim().slice(0, 100);
}

function parseRows(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const rows = [];
  lines.forEach((line, index) => {
    const matches = [...line.matchAll(kdaPattern)];
    const match = matches.at(-1);
    if (!match) return;
    const beforeKda = line.slice(0, match.index).replace(/[|()[\]{}]/g, " ").replace(/^\s*(?:\d{1,3}\s+)+/, "").trim();
    const previous = lines[index - 1] || "";
    const name = cleanRowName(beforeKda || previous);
    if (!name || /^\d+$/.test(name) || name.length < 2) return;
    const numbers = match.slice(1).map(Number);
    if (numbers.every((value) => value === 0) && /team/i.test(beforeKda)) return;
    rows.push({ name, champion: "", kills: numbers[0], deaths: numbers[1], assists: numbers[2] });
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
