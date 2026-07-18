import { useEffect, useId, useRef, useState } from "react";
import { portfolioSlides } from "../data/portfolio";

const FREE_TRIES = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "hbw-hair-edit-timestamps";
const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.86;

/** Lookbook-backed presets mapped to William's real services (no generic cuts). */
function slideThumb(id, fallback) {
  const slide = portfolioSlides.find((s) => s.id === id);
  if (!slide) return fallback;
  return slide.poster || slide.src || fallback;
}

const STYLE_PRESETS = [
  {
    id: "extension-length",
    label: "Hair Extensions",
    service: "extensions",
    prompt:
      "Add custom hair extensions for natural mid-back length and blended volume, seamless join at the roots, keeping the face, skin tone, and lighting unchanged.",
    thumb: slideThumb("extensions-after", "/portfolio/extensions_after.jpg"),
  },
  {
    id: "honey-waves",
    label: "Honey Balayage",
    service: "color",
    prompt:
      "Apply a honey balayage with soft dimensional glow and loose waves, salon bounce through the ends, keeping facial features and lighting unchanged.",
    thumb: slideThumb("clip-04", "/portfolio/clip-04-poster.jpg"),
  },
  {
    id: "gloss-blowout",
    label: "Brazilian Blowout",
    service: "blowout",
    prompt:
      "Restyle into a high-shine Brazilian Blowout finish: sleek, smooth length with soft movement and frizz-controlled gloss, preserving the face and skin tone.",
    thumb: "/portfolio/blowout_after.jpg",
  },
  {
    id: "soft-waves",
    label: "Soft Waves",
    service: "cuts",
    prompt:
      "Shape a precision cut with soft glossy waves, blended highlight dimension, and light movement through the ends; keep the face and lighting the same.",
    thumb: slideThumb("work-02", "/portfolio/work-02.png"),
  },
  {
    id: "dimensional-color",
    label: "Color Correction",
    service: "color",
    prompt:
      "Apply lived-in dimensional color with balanced tone and soft depth from roots to ends; no harsh lines; preserve facial features and lighting.",
    thumb: slideThumb("work-05", "/portfolio/work-05.png"),
  },
  {
    id: "layered-volume",
    label: "Precision Cut",
    service: "cuts",
    prompt:
      "Restyle into a layered salon blowout with warm dimensional color, soft volume through the crown, and polished ends; keep the face unchanged.",
    thumb: slideThumb("work-01", "/portfolio/work-01.png"),
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
    /* private mode: in-session state still enforces the soft cap */
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
  const ctaRef = useRef(null);

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
  const canGenerate = Boolean(preview) && !capped && status !== "loading";
  const loading = status === "loading";

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
        "You've used your 3 free hair previews for today. Try again tomorrow, or book a visit so William can shape the look in chair.",
      );
      return;
    }
    if (!preview) {
      setError("Upload a clear front-facing selfie first.");
      setStatus("error");
      ctaRef.current?.focus();
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
          <h2 id="hair-tryon-heading" className="section-heading">
            Try a look
          </h2>
          <p className="lead hair-tryon__copy">
            Preview extensions, color, cuts, and blowouts from William&apos;s
            lookbook, then book the chair finish.
          </p>
          <p className="hair-tryon__meta" aria-live="polite">
            {capped
              ? "Free previews used for today. Book to refine the look in chair."
              : `${remaining} free preview${remaining === 1 ? "" : "s"} left in the next 24 hours.`}
          </p>
        </header>

        <div className="hair-tryon__stage">
          <div className="hair-tryon__controls">
            <div className="hair-tryon__step">
              <p className="hair-tryon__step-label" id={`${fileInputId}-label`}>
                Your photo
              </p>
              <input
                id={fileInputId}
                ref={fileRef}
                className="sr-only"
                type="file"
                accept="image/*"
                capture="user"
                aria-labelledby={`${fileInputId}-label`}
                onChange={onPickFile}
              />
              <div className="hair-tryon__upload-actions">
                <button
                  type="button"
                  className="secondary-button hair-tryon__touch"
                  onClick={() => fileRef.current?.click()}
                >
                  {preview ? "Replace photo" : "Upload photo"}
                </button>
                <button
                  type="button"
                  className="secondary-button hair-tryon__touch"
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
                  <button type="button" className="cta-button hair-tryon__touch" onClick={captureFrame}>
                    Capture
                  </button>
                  <button
                    type="button"
                    className="secondary-button hair-tryon__touch"
                    onClick={closeCamera}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            <fieldset className="hair-tryon__styles">
              <legend className="hair-tryon__step-label">Style</legend>
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

            <div className="hair-tryon__generate">
              <button
                ref={ctaRef}
                type="button"
                className="cta-button hair-tryon__cta"
                onClick={onVisualize}
                disabled={!canGenerate}
                aria-describedby="hair-tryon-cta-hint"
              >
                {loading ? "Styling…" : "Visualize Style"}
              </button>
              <p id="hair-tryon-cta-hint" className="hair-tryon__hint">
                {!preview
                  ? "Add a photo first, then visualize."
                  : capped
                    ? "Daily free previews used. Book to continue in chair."
                    : `Ready: ${selected.label} from William's lookbook.`}
              </p>
              {(capped || status === "done") && (
                <a
                  className="secondary-button hair-tryon__touch hair-tryon__book"
                  href={
                    selected.service
                      ? `/?service=${selected.service}#contact`
                      : "#contact"
                  }
                >
                  Book this look
                </a>
              )}
            </div>

            <div className="hair-tryon__prompt">
              <label className="hair-tryon__step-label" htmlFor={promptId}>
                Refine (optional)
              </label>
              <textarea
                id={promptId}
                className="hair-tryon__textarea"
                rows={2}
                maxLength={500}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Longer extensions with soft honey ends"
              />
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
              <figcaption className="sr-only">Source photo</figcaption>
              {preview ? (
                <img
                  src={preview}
                  alt="Your uploaded selfie"
                  width={480}
                  height={640}
                />
              ) : (
                <div className="hair-tryon__empty" aria-hidden="true">
                  <span className="hair-tryon__empty-title">Add your photo</span>
                  <span className="hair-tryon__empty-copy">
                    Front-facing, good light
                  </span>
                </div>
              )}
            </figure>
            <figure className="hair-tryon__frame">
              <figcaption className="sr-only">Style preview</figcaption>
              {loading ? (
                <div
                  className="hair-tryon__skeleton"
                  role="status"
                  aria-label="Generating style preview"
                >
                  <span className="hair-tryon__skeleton-shine" aria-hidden="true" />
                  <span className="hair-tryon__skeleton-label">Styling your look…</span>
                </div>
              ) : resultUrl ? (
                <img
                  src={resultUrl}
                  alt={`AI preview of ${selected.label}`}
                  width={480}
                  height={640}
                />
              ) : (
                <div className="hair-tryon__empty hair-tryon__empty--result" aria-hidden="true">
                  <span className="hair-tryon__empty-title">Result</span>
                  <span className="hair-tryon__empty-copy">
                    Appears after you visualize
                  </span>
                </div>
              )}
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
