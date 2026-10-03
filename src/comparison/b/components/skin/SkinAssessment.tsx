import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDot,
  Droplets,
  Feather,
  HelpCircle,
  Lock,
  Sparkles,
  Sun,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { setSkinCheck } from "@/comparison/skinCheckStore";
import { getAttribution, track } from "@/comparison/b/lib/analytics";
import { cn } from "@/comparison/b/lib/utils";

export type Answers = Record<string, string>;

export type ResultProfile = { name: string; dims: Record<string, number> };

/**
 * The skin check is a short game: two taps (plus an optional "when"), then a useful
 * result with the booking form right beside it. Fewer questions and no gate before the
 * result means more visitors reach the form; answers still flow to the CRM and score.
 */
type Concern = {
  value: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  result: [string, string];
  profile: ResultProfile;
};

const CONCERNS: Concern[] = [
  {
    value: "Fine lines",
    label: "Fine lines",
    hint: "Wrinkles or ageing changes",
    icon: Feather,
    result: [
      "Natural-looking ageing care",
      "Ask whether skin boosters, HIFU, Botox or other options fit your goals. Dr. Kiruthika explains what suits your skin, and what doesn't.",
    ],
    profile: { name: "Early Prevention Profile", dims: { "Fine Lines": 78, Firmness: 45, Texture: 40, Pigmentation: 25 } },
  },
  {
    value: "Acne",
    label: "Acne",
    hint: "Breakouts or acne marks",
    icon: CircleDot,
    result: [
      "A clear acne plan",
      "A dermatologist can find the pattern behind recurring acne, marks or scars and explain a realistic treatment path, so you stop guessing with products.",
    ],
    profile: { name: "Acne & Skin Health Profile", dims: { "Fine Lines": 20, Firmness: 20, Texture: 68, Pigmentation: 62 } },
  },
  {
    value: "Hair loss",
    label: "Hair loss",
    hint: "Shedding or thinning",
    icon: Droplets,
    result: [
      "A cause-first hair assessment",
      "Before choosing PRP or any other treatment, Dr. Kiruthika checks your scalp and explains what may be driving the hair fall.",
    ],
    profile: { name: "Hair & Scalp Consultation Profile", dims: { "Fine Lines": 20, Firmness: 20, Texture: 30, Pigmentation: 20 } },
  },
  {
    value: "Pigmentation",
    label: "Pigmentation",
    hint: "Dark patches or uneven tone",
    icon: Sun,
    result: [
      "A proper pigmentation assessment",
      "Different dark patches need different approaches. Identify yours first, before spending more on creams that don't work.",
    ],
    profile: { name: "Tone & Clarity Profile", dims: { "Fine Lines": 25, Firmness: 30, Texture: 45, Pigmentation: 82 } },
  },
  {
    value: "Laser hair removal",
    label: "Unwanted hair",
    hint: "Laser for face or body hair",
    icon: Zap,
    result: [
      "A laser suitability consultation",
      "Ask about dermatologist-supervised laser hair reduction in Karur: suitable areas, expected sessions, comfort and cost, before you choose a package.",
    ],
    profile: { name: "Laser Hair Reduction Profile", dims: { "Fine Lines": 10, Firmness: 10, Texture: 35, Pigmentation: 30 } },
  },
  {
    value: "Something else",
    label: "Something else",
    hint: "Sensitive skin, scars or other",
    icon: HelpCircle,
    result: [
      "A conversation about your concern",
      "You don't need to know the treatment name. Bring the concern, and the dermatologist will explain your options.",
    ],
    profile: { name: "Discovery Profile", dims: { "Fine Lines": 42, Firmness: 42, Texture: 42, Pigmentation: 42 } },
  },
];

const IMPACTS = [
  "I notice it in photos or the mirror",
  "It affects my confidence or comfort",
  "I've tried products, but it keeps coming back",
  "I'm not sure what is causing it",
];

const TIMINGS = ["This week", "Within a month", "Just exploring"];

const STEPS = ["concern", "impact", "timing"] as const;

type Stage = "quiz" | "result" | "done";

function concernFor(value?: string) {
  return CONCERNS.find((item) => item.value === value) ?? CONCERNS[CONCERNS.length - 1]!;
}

const WHATSAPP =
  "https://wa.me/918903009723?text=" +
  encodeURIComponent("Hello, I completed the skin check and would like a free consultation in Karur.");

export function SkinAssessment({
  initialAreas = [],
  onComplete,
  onProfile,
}: {
  initialAreas?: string[];
  onComplete: (answers: Answers) => void;
  onProfile?: (profile: ResultProfile) => void;
}) {
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<Stage>("quiz");
  const [answers, setAnswers] = useState<Answers>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [step, stage]);

  function finish(next: Answers) {
    const withAreas = initialAreas.length ? { ...next, area: initialAreas.join(", ") } : next;
    const profile = concernFor(withAreas["concern"]).profile;
    setAnswers(withAreas);
    onComplete(withAreas);
    onProfile?.(profile);
    setSkinCheck({ answers: withAreas, profile });
    // Skin answers stay out of analytics; only progress through the quiz is tracked.
    track("assessment_completed");
    setStage("result");
  }

  function pick(value: string) {
    moved.current = true;
    const id = STEPS[step]!;
    if (step === 0) track("assessment_started");
    track("assessment_question_answered", { question: id, question_number: step + 1 });
    const next = { ...answers, [id]: value };
    setAnswers(next);
    if (step === STEPS.length - 1) finish(next);
    else setStep(step + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 10) {
      setError("Please add your name and 10-digit mobile number.");
      return;
    }
    setError("");
    setSending(true);
    const concern = concernFor(answers["concern"]);
    const endpoint =
      (import.meta.env["VITE_LEAD_ENDPOINT"] as string | undefined)?.trim() || "/api/lead-capture";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          lead_type: "skin_profile_result",
          source: "skin_check",
          name: name.trim(),
          phone: phone.trim(),
          primary_concern: answers["concern"] ?? "",
          result_profile: concern.profile.name,
          result_dimensions: concern.profile.dims,
          assessment_responses: answers,
          consent_status: true,
          consent_whatsapp: true,
          landing_page_identifier: "anti-aging-consultation-karur",
          timestamp: new Date().toISOString(),
          ...getAttribution(),
        }),
        signal: AbortSignal.timeout(15000),
      });
      const receipt = response.ok ? await response.json() : null;
      if (receipt?.ok !== true) throw new Error("Lead not confirmed");
    } catch {
      setError("We couldn't save your details. Please try again, or message us on WhatsApp.");
      setSending(false);
      return;
    }
    track("skin_profile_lead_captured");
    setSending(false);
    setStage("done");
  }

  function restart() {
    moved.current = true;
    setAnswers({});
    setStep(0);
    setStage("quiz");
    setError("");
  }

  const dots = (
    <div className="skin-game-progress" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <i key={index} className={cn((stage !== "quiz" || index <= step) && "on")} />
      ))}
    </div>
  );

  if (stage === "done") {
    return (
      <div className="skin-game skin-game-done" aria-live="polite">
        <span className="skin-game-done-check" aria-hidden="true">
          <Check />
        </span>
        <h3 ref={headingRef} tabIndex={-1} className="skin-game-heading">
          You've taken the right first step.
        </h3>
        <p className="skin-game-sub">
          The clinic will call or WhatsApp you to arrange your free consultation with Dr. S.
          Kiruthika. Want to pick a time now?
        </p>
        <a
          className="skin-game-btn"
          href={WHATSAPP}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("whatsapp_clicked", { source: "skin_check_done" })}
        >
          Continue on WhatsApp <ArrowRight />
        </a>
        <p className="skin-game-fine">
          77A, Sengunthapuram Main Road, Karur · Open daily 10 am–2:30 pm and 6–9:30 pm
        </p>
      </div>
    );
  }

  if (stage === "result") {
    const concern = concernFor(answers["concern"]);
    const Icon = concern.icon;
    return (
      <div className="skin-game" aria-live="polite">
        {dots}
        <p className="skin-game-step">Your result</p>
        <h3 ref={headingRef} tabIndex={-1} className="skin-game-heading">
          Your calm next step
        </h3>
        <div className="skin-game-result">
          <div className="skin-game-result-card">
            <span className="skin-game-result-icon" aria-hidden="true">
              <Icon />
            </span>
            <p className="skin-game-kicker">Your starting point</p>
            <p className="skin-game-result-title">{concern.result[0]}</p>
            <p className="skin-game-result-copy">{concern.result[1]}</p>
            <ul className="skin-game-tags" aria-label="Your answers">
              <li>{concern.label}</li>
              {answers["impact"] && <li>{answers["impact"]}</li>}
              {answers["timing"] && <li>Start: {answers["timing"]}</li>}
            </ul>
            <p className="skin-game-note">
              A consultation doesn't commit you to treatment. You'll hear suitable options,
              sessions, downtime and cost before you decide.
            </p>
          </div>

          <form className="skin-game-form" method="post" action="/api/lead-capture" onSubmit={submit} noValidate>
            <p className="skin-game-offer">
              <Sparkles aria-hidden="true" /> Free consultation · Karur
            </p>
            <p className="skin-game-form-title">Talk it through for free</p>
            <p className="skin-game-form-sub">
              Leave your name and WhatsApp number. The clinic will arrange a time that suits you.
            </p>
            <label className="skin-game-field">
              <span>Your name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <label className="skin-game-field">
              <span>Mobile / WhatsApp number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="10-digit number"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            {error && <p className="skin-game-error">{error}</p>}
            <button type="submit" className="skin-game-btn skin-game-btn-full" disabled={sending}>
              {sending ? "Booking…" : "Book My Free Consultation"} {!sending && <ArrowRight />}
            </button>
            <p className="skin-game-fine">
              <Lock aria-hidden="true" /> No payment online. By booking you agree to be contacted
              about this consultation.
            </p>
          </form>
        </div>
        <button type="button" className="skin-game-back" onClick={restart}>
          <ArrowLeft /> Change answers
        </button>
      </div>
    );
  }

  const id = STEPS[step]!;
  return (
    <div className="skin-game">
      {dots}
      <p className="skin-game-step">
        Step {step + 1} of 3{id === "timing" && " · optional"}
      </p>
      {id === "concern" && (
        <>
          <h3 ref={headingRef} tabIndex={-1} className="skin-game-heading">
            What concerns you most right now?
          </h3>
          <p className="skin-game-sub">There's no wrong answer. Tap the closest match.</p>
          <div className="skin-game-choices">
            {CONCERNS.map(({ value, label, hint, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={answers["concern"] === value}
                className={cn("skin-game-choice", answers["concern"] === value && "selected")}
                onClick={() => pick(value)}
              >
                <span className="skin-game-choice-icon" aria-hidden="true">
                  <Icon />
                </span>
                <strong>{label}</strong>
                <span className="skin-game-choice-hint">{hint}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {id === "impact" && (
        <>
          <h3 ref={headingRef} tabIndex={-1} className="skin-game-heading">
            How is it affecting your day?
          </h3>
          <p className="skin-game-sub">This helps Dr. Kiruthika understand what matters to you.</p>
          <div className="skin-game-answers">
            {IMPACTS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={answers["impact"] === option}
                className={cn("skin-game-answer", answers["impact"] === option && "selected")}
                onClick={() => pick(option)}
              >
                {option} <ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}
      {id === "timing" && (
        <>
          <h3 ref={headingRef} tabIndex={-1} className="skin-game-heading">
            When would you like to start?
          </h3>
          <p className="skin-game-sub">Same-day consultations are often available.</p>
          <div className="skin-game-answers skin-game-answers-row">
            {TIMINGS.map((option) => (
              <button key={option} type="button" className="skin-game-answer" onClick={() => pick(option)}>
                {option} <ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
          <button type="button" className="skin-game-skip" onClick={() => finish(answers)}>
            Skip and see my result
          </button>
        </>
      )}
      <div className="skin-game-actions">
        {step > 0 ? (
          <button
            type="button"
            className="skin-game-back"
            onClick={() => {
              moved.current = true;
              setStep(step - 1);
            }}
          >
            <ArrowLeft /> Back
          </button>
        ) : (
          <span className="skin-game-fine">About 20 seconds · not a diagnosis</span>
        )}
      </div>
    </div>
  );
}
