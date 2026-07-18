import { useEffect, useId, useRef, useState } from "react";
import { portfolioSlides } from "../data/portfolio";

const FREE_TRIES = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "hbw-hair-edit-timestamps";
const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.86;

const STYLE_PRESETS = [
  {
    id: "blonde-highlights",
    label: "Blonde Highlights",
    prompt:
      "Change the hair to soft blonde highlights with natural dimension, keeping the current length and texture.",
    thumb:
      portfolioSlides.find((s) => s.id === "clip-04")?.poster ||
      "/portfolio/clip-04-poster.jpg",
  },
  {
    id: "buzz-cut",
    label: "Buzz Cut",
    prompt:
      "Change the hairstyle to a clean, even buzz cut while preserving facial features and skin tone.",
    thumb:
      portfolioSlides.find((s) => s.id === "work-05")?.src || "/portfolio/work-05.png",
  },
  {
    id: "textured-crop",
    label: "Textured Crop",
    prompt:
      "Restyle the hair into a modern textured crop with soft volume on top and tapered sides.",
    thumb:
      portfolioSlides.find((s) => s.id === "work-01")?.src || "/portfolio/work-01.png",
  },
  {
    id: "soft-waves",
    label: "Soft Waves",
    prompt:
      "Restyle the hair into soft, glossy waves with a polished salon finish and natural movement.",
    thumb:
      portfolioSlides.find((s) => s.id === "work-02")?.src || "/portfolio/work-02.png",
  },
  {
    id: "honey-balayage",
    label: "Honey Balayage",
    prompt:
      "Apply a honey balayage color with seamless blend from roots to ends; keep the face and lighting unchanged.",
    thumb:
      portfolioSlides.find((s) => s.id === "clip-03")?.poster ||
      "/portfolio/clip-03-poster.jpg",
  },
  {
    id: "gloss-length",
    label: "Gloss Length",
    prompt:
      "Extend the hair to glossy mid-back length with healthy shine and blended ends.",
    thumb:
      portfolioSlides.find((s) => s.id === "extensions-after")?.src ||
      "/portfolio/extensions_after.jpg",
  },
];

function readTimestamps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - WINDOW_MS;
    return parsed
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n > cutoff);
  } catch {
    return [];
  }
}

function writeTimestamps(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* private mode — in-session state still enforces the soft cap */
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}

async function compressSelfie(dataUrl) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load photo"));
    el.src = dataUrl;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export default function HairTryOn() {
  const fileInputId = useId();
  const promptId = useId();
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [timestamps, setTimestamps] = useState(() =>
    typeof window !== "undefined" ? readTimestamps() : [],
  );
  const [presetId, setPresetId] = useState(STYLE_PRESETS[0].id);
  const [prompt, setPrompt] = useState(STYLE_PRESETS[0].prompt);
  const [preview, setPreview] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  const remaining = Math.max(0, FREE_TRIES - timestamps.length);
  const capped = remaining <= 0;
  const selected =
    STYLE_PRESETS.find((s) => s.id === presetId) || STYLE_PRESETS[0];

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const applyPhoto = async (dataUrl) => {
    const compressed = await compressSelfie(dataUrl);
    setPreview(compressed);
    setResultUrl(null);
    setError("");
    setStatus("idle");
  };

  const onPickFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo (JPEG, PNG, or WebP).");
      setStatus("error");
      return;
    }
    try {
      const raw = await fileToDataUrl(file);
      await applyPhoto(raw);
    } catch (err) {
      setError(err?.message || "Could not open that photo.");
      setStatus("error");
    } finally {
      event.target.value = "";
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      fileRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setError("Camera unavailable. You can upload a photo instead.");
      setStatus("error");
      fileRef.current?.click();
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    closeCamera();
    try {
      await applyPhoto(dataUrl);
    } catch (err) {
      setError(err?.message || "Could not capture selfie.");
      setStatus("error");
    }
  };

  const onSelectPreset = (preset) => {
    setPresetId(preset.id);
    setPrompt(preset.prompt);
  };

  const onVisualize = async () => {
    const fresh = readTimestamps();
    if (fresh.length >= FREE_TRIES) {
      setTimestamps(fresh);
      setStatus("capped");
      window.alert(
        "You've used your 3 free hair previews for today. Please try again tomorrow, or book a visit to refine the look in chair.",
      );
      return;
    }
    if (!preview) {
      setError("Upload a clear front-facing selfie first.");
      setStatus("error");
      return;
    }
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Describe the style you want, or pick a preset.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    setResultUrl(null);

    try {
      const res = await fetch("/api/edit-hair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: preview,
          prompt: trimmed.slice(0, 500),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Preview failed. Try again in a moment.");
      }
      if (!data?.image) {
        throw new Error("No preview returned.");
      }

      const next = [...readTimestamps(), Date.now()].slice(-FREE_TRIES);
      writeTimestamps(next);
      setTimestamps(next);
      setResultUrl(data.image);
      setStatus(next.length >= FREE_TRIES ? "capped" : "done");
    } catch (err) {
      setError(err?.message || "Preview failed.");
      setStatus("error");
    }
  };

  return (
    <section
      id="try-on"
      className="shell section hair-tryon"
      aria-labelledby="hair-tryon-heading"
    >
      <div className="hair-tryon__layout">
        <header className="hair-tryon__intro">
          <p className="kicker">Preview</p>
          <h2 id="hair-tryon-heading" className="section-heading">
            Try a look
          </h2>
          <p className="lead hair-tryon__copy">
            Upload a selfie or take one, choose a finish, and see an AI preview
            before you book.
          </p>
          <p className="hair-tryon__meta" aria-live="polite">
            {capped
              ? "Free previews used for today. Book to refine cut and color in chair."
              : `${remaining} free preview${remaining === 1 ? "" : "s"} left in the next 24 hours.`}
          </p>
        </header>

        <div className="hair-tryon__stage">
          <div className="hair-tryon__controls">
            <div className="hair-tryon__upload">
              <label className="hair-tryon__upload-label" htmlFor={fileInputId}>
                {preview ? "Change photo" : "Your photo"}
              </label>
              <input
                id={fileInputId}
                ref={fileRef}
                className="sr-only"
                type="file"
                accept="image/*"
                capture="user"
                onChange={onPickFile}
              />
              <div className="hair-tryon__upload-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => fileRef.current?.click()}
                >
                  {preview ? "Replace photo" : "Upload photo"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={openCamera}
                >
                  Take selfie
                </button>
              </div>
            </div>

            {cameraOpen ? (
              <div className="hair-tryon__camera" role="dialog" aria-label="Camera">
                <video
                  ref={videoRef}
                  className="hair-tryon__camera-video"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="hair-tryon__camera-actions">
                  <button type="button" className="cta-button" onClick={captureFrame}>
                    Capture
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeCamera}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            <fieldset className="hair-tryon__styles">
              <legend className="hair-tryon__legend">Style presets</legend>
              <div className="hair-tryon__chips" role="list">
                {STYLE_PRESETS.map((style) => {
                  const active = style.id === presetId;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      role="listitem"
                      className={`hair-tryon__chip${active ? " is-active" : ""}`}
                      aria-pressed={active}
                      onClick={() => onSelectPreset(style)}
                    >
                      <img
                        src={style.thumb}
                        alt=""
                        width={72}
                        height={72}
                        loading="lazy"
                      />
                      <span>{style.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="hair-tryon__prompt">
              <label className="hair-tryon__legend" htmlFor={promptId}>
                Describe the look
              </label>
              <textarea
                id={promptId}
                className="hair-tryon__textarea"
                rows={3}
                maxLength={500}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Change hair color to platinum blonde"
              />
            </div>

            <div className="hair-tryon__actions">
              <button
                type="button"
                className="cta-button"
                onClick={onVisualize}
                disabled={status === "loading" || capped || !preview}
              >
                {status === "loading" ? "Styling…" : "Visualize Style"}
              </button>
              {(capped || status === "done") && (
                <a className="secondary-button" href="#contact">
                  Book this look
                </a>
              )}
            </div>

            {error ? (
              <p className="hair-tryon__error" role="alert">
                {error}
              </p>
            ) : null}

            <p className="hair-tryon__privacy">
              AI preview only. Not a guarantee of the salon result. Your photo is
              sent once for processing and is not stored by this site. See{" "}
              <a href="/privacy.html">Privacy</a>.
            </p>
          </div>

          <div className="hair-tryon__frames" aria-live="polite">
            <figure className="hair-tryon__frame">
              <figcaption>Your photo</figcaption>
              {preview ? (
                <img
                  src={preview}
                  alt="Your uploaded selfie"
                  width={480}
                  height={640}
                />
              ) : (
                <div className="hair-tryon__placeholder">Front-facing, good light</div>
              )}
            </figure>
            <figure className="hair-tryon__frame">
              <figcaption>Preview</figcaption>
              {status === "loading" ? (
                <div
                  className="hair-tryon__placeholder hair-tryon__placeholder--pulse"
                  role="status"
                >
                  <span className="hair-tryon__spinner" aria-hidden="true" />
                  <span>AI is styling their hair…</span>
                </div>
              ) : resultUrl ? (
                <img
                  src={resultUrl}
                  alt={`AI preview — ${selected.label}`}
                  width={480}
                  height={640}
                />
              ) : (
                <div className="hair-tryon__placeholder">Result appears here</div>
              )}
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
