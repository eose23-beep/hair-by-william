import { useId, useState } from "react";

const GOALS = [
  {
    id: "length",
    label: "Length & volume",
    hint: "Extensions that blend to your texture",
    service: "extensions",
    title: "Hair Extensions",
  },
  {
    id: "smooth",
    label: "Smoother finish",
    hint: "Frizz control with soft movement",
    service: "blowout",
    title: "Brazilian Blowout",
  },
  {
    id: "cut",
    label: "Fresh shape",
    hint: "Precision cut for face and lifestyle",
    service: "cuts",
    title: "Precision Cuts",
  },
  {
    id: "color",
    label: "Color fix or refresh",
    hint: "Tone balance and dimensional color",
    service: "color",
    title: "Color Correction",
  },
  {
    id: "unsure",
    label: "Not sure yet",
    hint: "A short consult with William",
    service: "consultation",
    title: "Consultation",
  },
];

const LENGTHS = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
];

const TIMING = [
  { id: "this-weekend", label: "This Fri–Sat" },
  { id: "next-weekend", label: "Next weekend" },
  { id: "flexible", label: "Flexible" },
];

/**
 * Compact chip quiz → recommends a service → Book with ?service= preselected.
 * No gimmicks — editorial chips only.
 */
export default function StyleQuiz() {
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [goalId, setGoalId] = useState(null);
  const [lengthId, setLengthId] = useState(null);
  const [timingId, setTimingId] = useState(null);

  const goal = GOALS.find((item) => item.id === goalId) ?? null;
  const bookHref = goal ? `/?service=${goal.service}#contact-form` : "#contact-form";

  const reset = () => {
    setStep(0);
    setGoalId(null);
    setLengthId(null);
    setTimingId(null);
  };

  return (
    <section
      id="style-quiz"
      className="shell section style-quiz"
      aria-labelledby={titleId}
    >
      <div className="style-quiz__panel motion-block">
        <header className="style-quiz__intro">
          <p className="kicker">Find your service</p>
          <h2 id={titleId} className="section-heading">
            What are we creating?
          </h2>
          <p className="lead style-quiz__copy">
            Four quick taps. We recommend a service, then you book by WhatsApp or text — open
            Friday–Saturday · 10 AM–6 PM · El Paso.
          </p>
        </header>

        <div className="style-quiz__progress" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`style-quiz__tick${step >= index ? " is-active" : ""}`}
            />
          ))}
        </div>

        {step === 0 ? (
          <fieldset className="style-quiz__fieldset">
            <legend className="style-quiz__legend">What do you want most?</legend>
            <div className="style-quiz__chips" role="list">
              {GOALS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  className={`style-quiz__chip${goalId === item.id ? " is-selected" : ""}`}
                  onClick={() => {
                    setGoalId(item.id);
                    setStep(1);
                  }}
                >
                  <span className="style-quiz__chip-label">{item.label}</span>
                  <span className="style-quiz__chip-hint">{item.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <fieldset className="style-quiz__fieldset">
            <legend className="style-quiz__legend">Current length?</legend>
            <div className="style-quiz__chips style-quiz__chips--inline" role="list">
              {LENGTHS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  className={`style-quiz__chip style-quiz__chip--compact${
                    lengthId === item.id ? " is-selected" : ""
                  }`}
                  onClick={() => {
                    setLengthId(item.id);
                    setStep(2);
                  }}
                >
                  <span className="style-quiz__chip-label">{item.label}</span>
                </button>
              ))}
            </div>
            <button type="button" className="style-quiz__back" onClick={() => setStep(0)}>
              Back
            </button>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset className="style-quiz__fieldset">
            <legend className="style-quiz__legend">When do you hope to visit?</legend>
            <div className="style-quiz__chips style-quiz__chips--inline" role="list">
              {TIMING.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  className={`style-quiz__chip style-quiz__chip--compact${
                    timingId === item.id ? " is-selected" : ""
                  }`}
                  onClick={() => {
                    setTimingId(item.id);
                    setStep(3);
                  }}
                >
                  <span className="style-quiz__chip-label">{item.label}</span>
                </button>
              ))}
            </div>
            <p className="style-quiz__note">
              Hours are Friday–Saturday only — no fake “only 2 spots left.” We’ll confirm what’s
              open when you message.
            </p>
            <button type="button" className="style-quiz__back" onClick={() => setStep(1)}>
              Back
            </button>
          </fieldset>
        ) : null}

        {step === 3 && goal ? (
          <div className="style-quiz__result" role="status" aria-live="polite">
            <p className="style-quiz__result-kicker">Recommended</p>
            <h3 className="style-quiz__result-title">{goal.title}</h3>
            <p className="style-quiz__result-copy">{goal.hint}</p>
            <p className="style-quiz__hours">Friday–Saturday · 10 AM–6 PM · El Paso</p>
            <div className="style-quiz__actions">
              <a
                className="cta-button"
                href={bookHref}
                data-mcp-action="book-appointment"
                data-mcp-description={`Book ${goal.title} with Hair by William via WhatsApp or text. Service preselected from the style quiz.`}
                data-mcp-params={`{"service":"${goal.service}","destination":"#contact-form","source":"style-quiz"}`}
              >
                Book {goal.title === "Consultation" ? "a consult" : goal.title}
              </a>
              <button type="button" className="secondary-button" onClick={reset}>
                Start over
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
