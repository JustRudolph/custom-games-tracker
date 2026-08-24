import { createWorker } from "tesseract.js";

const kdaPattern = /(\d{1,3})\s*[/|:\u00b7]\s*(\d{1,3})\s*[/|:\u00b7]\s*(\d{1,3})/g;

async function preprocessImage(image) {
  const source = typeof image === "string" ? image : URL.createObjectURL(image);
  try {
    const element = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = source;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = element.naturalWidth * scale;
    canvas.height = element.naturalHeight * scale;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(element, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const gray = pixels.data[index] * 0.299 + pixels.data[index + 1] * 0.587 + pixels.data[index + 2] * 0.114;
      const value = gray > 145 ? 255 : Math.max(0, gray * 0.72);
      pixels.data[index] = value;
      pixels.data[index + 1] = value;
      pixels.data[index + 2] = value;
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    if (typeof image !== "string") URL.revokeObjectURL(source);
  }
}

async function cropDataUrl(image, x, y, width, height, scale = 4) {
  const element = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = image;
  });
  const canvas = document.createElement("canvas");
  const cropWidth = Math.max(1, Math.round(element.naturalWidth * width));
  const cropHeight = Math.max(1, Math.round(element.naturalHeight * height));
  canvas.width = cropWidth * scale;
  canvas.height = cropHeight * scale;
  canvas.getContext("2d").drawImage(element, Math.round(element.naturalWidth * x), Math.round(element.naturalHeight * y), cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function firstKda(text) {
  const match = [...String(text || "").matchAll(kdaPattern)][0];
  return match ? match.slice(1).map(Number) : null;
}

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

function findKda(line) {
  const slashMatches = [...line.matchAll(kdaPattern)];
  const slashMatch = slashMatches.at(-1);
  if (slashMatch) return { match: slashMatch, values: slashMatch.slice(1).map(Number), start: slashMatch.index };

  const numbers = [...line.matchAll(/\d{1,3}/g)];
  const candidates = [];
  for (let index = 0; index <= numbers.length - 3; index += 1) {
    const values = numbers.slice(index, index + 3).map((item) => Number(item[0]));
    if (values.every((value) => value <= 30)) candidates.push({ values, start: numbers[index].index });
  }
  const candidate = candidates.at(-1);
  return candidate ? { values: candidate.values, start: candidate.start } : null;
}

function parseRows(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const rows = [];
  lines.forEach((line, index) => {
    const kda = findKda(line);
    if (!kda) return;
    const beforeKda = line.slice(0, kda.start).replace(/[|()[\]{}]/g, " ").replace(/^\s*(?:[A-Z]?\s*\d{1,3}\s+)+/, "").trim();
    const previous = lines[index - 1] || "";
    const name = cleanRowName(beforeKda || previous);
    if (!name || /^\d+$/.test(name) || name.length < 2) return;
    const numbers = kda.values;
    if (numbers.every((value) => value === 0) && /team/i.test(beforeKda)) return;
    rows.push({ name, champion: "", kills: numbers[0], deaths: numbers[1], assists: numbers[2] });
  });
  return rows.filter((row, index, all) => all.findIndex((candidate) => candidate.name.toLowerCase() === row.name.toLowerCase()) === index).slice(0, 10);
}

export async function analyzeMatchScreenshot(image, onProgress) {
  const worker = await createWorker("eng", 1, { logger: (message) => onProgress?.(message) });
  try {
    const processedImage = await preprocessImage(image);
    await worker.setParameters({ tessedit_pageseg_mode: "7", preserve_interword_spaces: "1", tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .'_-/:" });
    const rows = [];
    const teamStarts = [0.07, 0.56];
    for (const teamStart of teamStarts) {
      for (let rowIndex = 0; rowIndex < 5; rowIndex += 1) {
        const rowY = teamStart + rowIndex * 0.082;
        const nameResult = await worker.recognize(await cropDataUrl(image, 0.155, rowY + 0.014, 0.145, 0.028));
        const kdaResult = await worker.recognize(await cropDataUrl(image, 0.695, rowY + 0.014, 0.075, 0.028));
        const values = firstKda(kdaResult.data.text);
        const name = cleanRowName(nameResult.data.text);
        if (name && values) rows.push({ name, champion: "", kills: values[0], deaths: values[1], assists: values[2] });
      }
    }
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
