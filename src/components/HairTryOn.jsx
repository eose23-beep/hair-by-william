import { useEffect, useId, useRef, useState } from "react";

const FREE_TRIES = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "hbw-hair-edit-timestamps";
const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.86;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** Four service presets only. Text chips seed the prompt; user can edit freely. */
const STYLE_PRESETS = [
  {
    id: "extensions",
    label: "Extensions",
    service: "extensions",
    mark: "EX",
    prompt:
      "Add custom hair extensions for natural mid-back length and blended volume, seamless join at the roots, keeping the face, skin tone, and lighting unchanged.",
  },
  {
    id: "cuts",
    label: "Cuts",
    service: "cuts",
    mark: "CU",
    prompt:
      "Shape a precision haircut with clean lines and an editorial finish suited to this face shape, keeping facial features and lighting unchanged.",
  },
  {
    id: "color",
    label: "Color",
    service: "color",
    mark: "CO",
    prompt:
      "Apply dimensional color with balanced tone and soft lived-in depth from roots to ends, no harsh lines, preserving the face and lighting.",
  },
  {
    id: "blowout",
    label: "Brazilian Blowout",
    service: "blowout",
    mark: "BB",
    prompt:
      "Restyle into a Brazilian Blowout finish: sleek smooth length with soft movement and frizz-controlled gloss, preserving the face and skin tone.",
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

function validateImageFile(file) {
  if (!file) return "Choose a photo to continue.";
  const type = String(file.type || "").toLowerCase();
  const nameOk = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
  if (type && !ACCEPTED_MIME.has(type) && !type.startsWith("image/")) {
    return "Please choose a photo (JPEG, PNG, or WebP).";
  }
  if (!type && !nameOk) {
    return "Please choose a photo (JPEG, PNG, or WebP).";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "That photo is over 8 MB. Try a smaller image or take a new selfie.";
  }
  if (file.size === 0) {
    return "That file looks empty. Try another photo.";
  }
  return "";
}

function stopStream(stream) {
  stream?.getTracks?.().forEach((t) => t.stop());
}

const DOWNLOAD_BASENAME = "hair-by-william-try-on";

function extensionFromMime(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

async function downloadResultImage(sourceUrl) {
  if (!sourceUrl) return;

  let blob = null;
  let mime = "image/png";

  try {
    if (sourceUrl.startsWith("data:")) {
      const res = await fetch(sourceUrl);
      blob = await res.blob();
      mime = blob.type || sourceUrl.slice(5, sourceUrl.indexOf(";")) || mime;
    } else {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error("fetch failed");
      blob = await res.blob();
      mime = blob.type || mime;
    }
  } catch {
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const filename = `${DOWNLOAD_BASENAME}.${extensionFromMime(mime)}`;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } catch {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  } finally {
    anchor.remove();
    // Delay revoke so Safari can finish the download handshake.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
  }
}

export default function HairTryOn() {
  const fileInputId = useId();
  const promptId = useId();
  const dropZoneId = useId();
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const ctaRef = useRef(null);
  const dropDepthRef = useRef(0);

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
  const [cameraPhase, setCameraPhase] = useState("live");
  const [captureDraft, setCaptureDraft] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const remaining = Math.max(0, FREE_TRIES - timestamps.length);
  const capped = remaining <= 0;
  const selected = STYLE_PRESETS.find((s) => s.id === presetId);
  const canGenerate =
    Boolean(preview) && Boolean(prompt.trim()) && !capped && status !== "loading";
  const loading = status === "loading";
  const cameraSupported =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  useEffect(() => {
    return () => {
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen || cameraPhase !== "live") return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream) {
      video.srcObject = stream;
      const play = video.play?.();
      if (play?.catch) play.catch(() => {});
    }
  }, [cameraOpen, cameraPhase, facingMode]);

  const applyPhoto = async (dataUrl) => {
    const compressed = await compressSelfie(dataUrl);
    setPreview(compressed);
    setResultUrl(null);
    setError("");
    setStatus("idle");
  };

  const clearPhoto = () => {
    setPreview(null);
    setResultUrl(null);
    setError("");
    setStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
  };

  const ingestFile = async (file) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      setStatus("error");
      return;
    }
    try {
      const raw = await fileToDataUrl(file);
      await applyPhoto(raw);
    } catch (err) {
      setError(err?.message || "Could not open that photo.");
      setStatus("error");
    }
  };

  const onPickFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await ingestFile(file);
    } finally {
      event.target.value = "";
    }
  };

  const onDrop = async (event) => {
    event.preventDefault();
    dropDepthRef.current = 0;
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    await ingestFile(file);
  };

  const onDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropDepthRef.current += 1;
    if (event.dataTransfer?.types?.includes?.("Files")) {
      setDragActive(true);
    }
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropDepthRef.current = Math.max(0, dropDepthRef.current - 1);
    if (dropDepthRef.current === 0) setDragActive(false);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  };

  const releaseCamera = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const closeCamera = () => {
    releaseCamera();
    setCameraOpen(false);
    setCameraPhase("live");
    setCaptureDraft(null);
    setCameraBusy(false);
  };

  const startCamera = async (nextFacing = facingMode) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera isn’t available here. Upload a front-facing photo instead.");
      setStatus("error");
      fileRef.current?.click();
      return false;
    }

    setCameraBusy(true);
    setError("");
    try {
      releaseCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setFacingMode(nextFacing);
      setCameraPhase("live");
      setCaptureDraft(null);
      setCameraOpen(true);
      return true;
    } catch (err) {
      const denied =
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      const missing =
        err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError";
      setError(
        denied
          ? "Camera access was denied. Upload a selfie instead, or allow camera permission and try again."
          : missing
            ? "No camera found. Upload a clear front-facing photo instead."
            : "Camera unavailable. You can upload a photo instead.",
      );
      setStatus("error");
      setCameraOpen(false);
      return false;
    } finally {
      setCameraBusy(false);
    }
  };

  const openCamera = async () => {
    await startCamera(facingMode);
  };

  const toggleFacing = async () => {
    const next = facingMode === "user" ? "environment" : "user";
    await startCamera(next);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Camera isn’t ready yet. Hold still a moment, then capture.");
      setStatus("error");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror front camera so confirmation matches the live preview.
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    releaseCamera();
    setCaptureDraft(dataUrl);
    setCameraPhase("confirm");
    setError("");
  };

  const retakePhoto = async () => {
    setCaptureDraft(null);
    await startCamera(facingMode);
  };

  const useCapturedPhoto = async () => {
    if (!captureDraft) return;
    try {
      await applyPhoto(captureDraft);
      closeCamera();
    } catch (err) {
      setError(err?.message || "Could not use that selfie.");
      setStatus("error");
    }
  };

  const onSelectPreset = (preset) => {
    setPresetId(preset.id);
    setPrompt(preset.prompt);
  };

  const onPromptChange = (value) => {
    setPrompt(value);
    const match = STYLE_PRESETS.find((s) => s.prompt === value.trim());
    setPresetId(match ? match.id : "custom");
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
      setError("Describe the style you want, or pick a service preset.");
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

  const bookHref = selected?.service
    ? `/?service=${selected.service}#contact-form`
    : "#contact-form";

  const hintLabel =
    presetId === "custom" || !selected ? "custom prompt" : selected.label;

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
            Pick a service William offers, or write your own prompt. Preview
            first, then book the chair finish.
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
              <p className="hair-tryon__guide" id={`${dropZoneId}-hint`}>
                Front-facing portrait, face centered, soft even light.
              </p>

              <input
                id={fileInputId}
                ref={fileRef}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                aria-labelledby={`${fileInputId}-label`}
                aria-describedby={`${dropZoneId}-hint`}
                onChange={onPickFile}
              />

              {!cameraOpen ? (
                <div
                  id={dropZoneId}
                  className={[
                    "hair-tryon__dropzone",
                    dragActive ? "is-drag" : "",
                    preview ? "has-preview" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                >
                  {preview ? (
                    <div className="hair-tryon__drop-preview">
                      <img
                        src={preview}
                        alt="Selected selfie ready for styling"
                        className="hair-tryon__drop-img"
                        width={320}
                        height={400}
                      />
                      <div className="hair-tryon__drop-meta">
                        <span className="hair-tryon__drop-title">Photo ready</span>
                        <span className="hair-tryon__drop-copy">
                          Replace anytime, or remove to start over.
                        </span>
                        <div className="hair-tryon__drop-actions">
                          <button
                            type="button"
                            className="secondary-button hair-tryon__touch"
                            onClick={() => fileRef.current?.click()}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            className="secondary-button hair-tryon__touch"
                            onClick={clearPhoto}
                          >
                            Remove
                          </button>
                          {cameraSupported ? (
                            <button
                              type="button"
                              className="secondary-button hair-tryon__touch"
                              onClick={openCamera}
                              disabled={cameraBusy}
                            >
                              Retake selfie
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="hair-tryon__drop-target"
                      onClick={() => fileRef.current?.click()}
                      aria-describedby={`${dropZoneId}-hint`}
                    >
                      <span className="hair-tryon__drop-icon" aria-hidden="true">
                        ◇
                      </span>
                      <span className="hair-tryon__drop-title">
                        {dragActive ? "Drop to upload" : "Drop a photo here"}
                      </span>
                      <span className="hair-tryon__drop-copy">
                        or tap to browse — JPEG, PNG, or WebP · up to 8 MB
                      </span>
                    </button>
                  )}

                  {!preview ? (
                    <div className="hair-tryon__upload-actions">
                      <button
                        type="button"
                        className="secondary-button hair-tryon__touch"
                        onClick={() => fileRef.current?.click()}
                      >
                        Upload photo
                      </button>
                      <button
                        type="button"
                        className="cta-button hair-tryon__touch hair-tryon__selfie-cta"
                        onClick={openCamera}
                        disabled={cameraBusy}
                      >
                        {cameraBusy ? "Opening…" : "Take selfie"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {cameraOpen ? (
              <div
                className={`hair-tryon__camera hair-tryon__camera--${cameraPhase}`}
                role="dialog"
                aria-modal="true"
                aria-label={
                  cameraPhase === "confirm"
                    ? "Confirm selfie"
                    : "Selfie camera"
                }
              >
                <div className="hair-tryon__camera-stage">
                  {cameraPhase === "confirm" && captureDraft ? (
                    <img
                      src={captureDraft}
                      alt="Captured selfie preview"
                      className="hair-tryon__camera-still"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      className={`hair-tryon__camera-video${
                        facingMode === "user" ? " is-mirrored" : ""
                      }`}
                      autoPlay
                      playsInline
                      muted
                    />
                  )}
                  <span className="hair-tryon__camera-badge" aria-hidden="true">
                    {cameraPhase === "confirm"
                      ? "Review"
                      : facingMode === "user"
                        ? "Front camera"
                        : "Rear camera"}
                  </span>
                </div>

                {cameraPhase === "live" ? (
                  <div className="hair-tryon__camera-actions">
                    <button
                      type="button"
                      className="cta-button hair-tryon__touch"
                      onClick={captureFrame}
                      disabled={cameraBusy}
                    >
                      Capture
                    </button>
                    <button
                      type="button"
                      className="secondary-button hair-tryon__touch"
                      onClick={toggleFacing}
                      disabled={cameraBusy}
                    >
                      Flip camera
                    </button>
                    <button
                      type="button"
                      className="secondary-button hair-tryon__touch"
                      onClick={closeCamera}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="hair-tryon__camera-actions">
                    <button
                      type="button"
                      className="cta-button hair-tryon__touch"
                      onClick={useCapturedPhoto}
                    >
                      Use photo
                    </button>
                    <button
                      type="button"
                      className="secondary-button hair-tryon__touch"
                      onClick={retakePhoto}
                      disabled={cameraBusy}
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      className="secondary-button hair-tryon__touch"
                      onClick={() => {
                        closeCamera();
                        fileRef.current?.click();
                      }}
                    >
                      Upload instead
                    </button>
                  </div>
                )}

                <p className="hair-tryon__camera-hint">
                  {cameraPhase === "confirm"
                    ? "Looks good? Use this photo, or retake for a clearer face view."
                    : "Center your face. Soft light from the front works best."}
                </p>
              </div>
            ) : null}

            <fieldset className="hair-tryon__styles">
              <legend className="hair-tryon__step-label">Service</legend>
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
                      <span className="hair-tryon__chip-mark" aria-hidden="true">
                        {style.mark}
                      </span>
                      <span className="hair-tryon__chip-label">{style.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="hair-tryon__prompt">
              <label className="hair-tryon__step-label" htmlFor={promptId}>
                Describe your look
              </label>
              <textarea
                id={promptId}
                className="hair-tryon__textarea"
                rows={3}
                maxLength={500}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="e.g. Soft honey balayage with curtain bangs, keep my face the same"
              />
            </div>

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
                    : !prompt.trim()
                      ? "Add a prompt or pick a service."
                      : `Ready: ${hintLabel}.`}
              </p>
              {(capped || status === "done") && (
                <a
                  className="secondary-button hair-tryon__touch hair-tryon__book"
                  href={bookHref}
                >
                  Book this look
                </a>
              )}
            </div>

            {error ? (
              <p className="hair-tryon__error" role="alert">
                {error}
                {!preview && /camera|upload/i.test(error) ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      className="hair-tryon__error-link"
                      onClick={() => fileRef.current?.click()}
                    >
                      Upload a photo
                    </button>
                  </>
                ) : null}
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
              <figcaption className="hair-tryon__frame-cap">Your photo</figcaption>
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
            <figure className="hair-tryon__frame hair-tryon__frame--result">
              <figcaption className="hair-tryon__frame-cap">Preview</figcaption>
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
                <>
                  <img
                    src={resultUrl}
                    alt={`AI preview: ${hintLabel}`}
                    width={480}
                    height={640}
                  />
                  <button
                    type="button"
                    className="secondary-button hair-tryon__touch hair-tryon__download"
                    onClick={() => downloadResultImage(resultUrl)}
                  >
                    Download
                  </button>
                </>
              ) : (
                <div
                  className="hair-tryon__empty hair-tryon__empty--result"
                  aria-hidden="true"
                >
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
