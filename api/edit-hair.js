/**
 * Secure Vercel serverless hair edit via Gemini image model.
 *
 * Env (Vercel → Project Settings → Environment Variables):
 *   GEMINI_API_KEY=…          (required; never expose as VITE_*)
 *   ALLOWED_ORIGINS=…         (optional comma-separated extras / preview URLs)
 *   ALLOW_VERCEL_PREVIEWS=1   (optional; allow any https://*.vercel.app origin)
 *
 * Model: gemini-3.1-flash-image-preview (Nano Banana 2).
 * Fallback if that ID is rejected: gemini-2.0-flash-preview-image-generation
 */

import { GoogleGenAI } from "@google/genai";

const PRIMARY_MODEL = "gemini-3.1-flash-image-preview";
const FALLBACK_MODEL = "gemini-2.0-flash-preview-image-generation";

const MAX_BODY_CHARS = 8_000_000; // ~6MB binary as base64 data-URL ceiling
const MAX_PROMPT_CHARS = 500;
const MAX_BASE64_CHARS = 7_500_000;

const DEFAULT_ORIGINS = [
  "https://william-site-snowy.vercel.app",
  "https://hairbywilliam.com",
  "https://www.hairbywilliam.com",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
];

function getAllowedOrigins() {
  const extras = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...extras]);
}

function isVercelPreviewOrigin(origin) {
  if (process.env.ALLOW_VERCEL_PREVIEWS !== "1") return false;
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && u.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.has(origin) || isVercelPreviewOrigin(origin);
}

/** @returns {string | null} matched origin for CORS echo */
function authorizeRequest(req) {
  const originHeader =
    typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
  const refererRaw =
    typeof req.headers.referer === "string"
      ? req.headers.referer
      : typeof req.headers.referrer === "string"
        ? req.headers.referrer
        : "";

  let refererOrigin = "";
  if (refererRaw) {
    try {
      refererOrigin = new URL(refererRaw).origin;
    } catch {
      refererOrigin = "";
    }
  }

  if (!originHeader && !refererOrigin) return null;

  if (originHeader && isAllowedOrigin(originHeader)) return originHeader;
  if (refererOrigin && isAllowedOrigin(refererOrigin)) return refererOrigin;
  return null;
}

function setCors(res, matchedOrigin) {
  if (matchedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", matchedOrigin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_CHARS) {
        reject(Object.assign(new Error("Payload too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error("Invalid JSON"), { statusCode: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function sanitizePrompt(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PROMPT_CHARS);
}

function parseImagePayload(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.length > MAX_BASE64_CHARS) return null;

  const dataUrlMatch = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i.exec(
    trimmed,
  );
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1].toLowerCase().replace("image/jpg", "image/jpeg"),
      data: dataUrlMatch[2].replace(/\s/g, ""),
    };
  }

  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 64) {
    return { mimeType: "image/jpeg", data: trimmed.replace(/\s/g, "") };
  }
  return null;
}

function extractImageFromResponse(response) {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  for (const part of parts) {
    const inline = part?.inlineData || part?.inline_data;
    if (inline?.data) {
      const mime = (inline.mimeType || inline.mime_type || "image/png").toLowerCase();
      return `data:${mime};base64,${inline.data}`;
    }
  }
  return null;
}

function isModelNotFoundError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("is not supported") ||
    msg.includes("unknown model") ||
    msg.includes("invalid model") ||
    error?.status === 404
  );
}

async function generateEditedImage(ai, model, image, prompt) {
  const instruction = [
    "You are assisting a luxury salon virtual try-on.",
    "Edit ONLY the hair in this photo according to the guest request below.",
    "Preserve the person's face, skin tone, expression, identity, clothing, background, and lighting.",
    "Produce a photorealistic result suitable for a high-end salon preview.",
    "Do not add text, watermarks, logos, or extra people.",
    "",
    `Guest request: ${prompt}`,
  ].join("\n");

  return ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { text: instruction },
          { inlineData: { mimeType: image.mimeType, data: image.data } },
        ],
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });
}

/**
 * Shared core — used by Vercel handler and Vite dev middleware.
 * @param {{ image?: string, imageBase64?: string, prompt?: string }} payload
 * @param {{ apiKey: string }} opts
 */
export async function runEditHair(payload, { apiKey }) {
  if (!apiKey) {
    const err = new Error("Hair try-on is not configured");
    err.statusCode = 503;
    throw err;
  }

  const prompt = sanitizePrompt(payload?.prompt);
  if (!prompt) {
    const err = new Error("A styling prompt is required");
    err.statusCode = 400;
    throw err;
  }

  const image = parseImagePayload(payload?.image || payload?.imageBase64);
  if (!image) {
    const err = new Error("A valid JPEG, PNG, or WebP image (base64) is required");
    err.statusCode = 400;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await generateEditedImage(ai, PRIMARY_MODEL, image, prompt);
  } catch (primaryError) {
    if (!isModelNotFoundError(primaryError)) throw primaryError;
    // Fallback when primary preview ID is unavailable in this API project/region
    response = await generateEditedImage(ai, FALLBACK_MODEL, image, prompt);
  }

  const dataUrl = extractImageFromResponse(response);
  if (!dataUrl) {
    const err = new Error("No edited image returned");
    err.statusCode = 502;
    throw err;
  }

  return { image: dataUrl };
}

export default async function handler(req, res) {
  const matchedOrigin = authorizeRequest(req);
  setCors(res, matchedOrigin);

  if (req.method === "OPTIONS") {
    if (!matchedOrigin) {
      json(res, 403, { error: "Forbidden" });
      return;
    }
    res.statusCode = 204;
    res.end();
    return;
  }

  if (!matchedOrigin) {
    json(res, 403, { error: "Forbidden: request origin is not authorized" });
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  const contentType = String(req.headers["content-type"] || "");
  if (!contentType.toLowerCase().includes("application/json")) {
    json(res, 415, { error: "Content-Type must be application/json" });
    return;
  }

  try {
    const payload = await readBody(req);
    const result = await runEditHair(payload, {
      apiKey: process.env.GEMINI_API_KEY,
    });
    json(res, 200, result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;
    const safeStatus = status >= 400 && status < 600 ? status : 500;
    json(res, safeStatus, {
      error: error?.message || "Hair edit failed",
    });
  }
}
