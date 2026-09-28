import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Heart, MapPin, RefreshCw, Sparkles, Target } from "lucide-react";
import { Button } from "@/comparison/b/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAttribution, track } from "@/comparison/b/lib/analytics";
import { cn } from "@/comparison/b/lib/utils";

export type Answers = Record<string, string>;

export type ResultProfile = { name: string; dims: Record<string, number> };

type Question = {
  id: string;
  title: string;
  help: string;
  options: string[];
  insight?: string;
};

const QUESTIONS: Question[] = [
  {
    id: "concern",
    title: "What concerns you most?",
    help: "Choose the change you notice first. There is no wrong answer.",
    options: [
      "Fine lines",
      "Acne",
      "Hair loss",
      "Dark circles",
      "Scars",
      "Pigmentation",
      "Sensitive skin",
      "Something else",
      "I'm not sure",
    ],
    insight:
      "Noted — this is one of the most common reasons people first book a skin consultation.",
  },
  {
    id: "area",
    title: "Where do you notice it most?",
    help: "This helps organise the areas you may want to discuss with the dermatologist.",
    options: ["Forehead", "Around eyes", "Cheeks", "Around mouth", "Jawline", "Entire face"],
  },
  {
    id: "duration",
    title: "When did you start noticing the change?",
    help: "A recent change and a gradual change may lead to different questions at consultation.",
    options: ["Recently", "6–12 months", "1–3 years", "Several years"],
  },
  {
    id: "tried",
    title: "What have you tried?",
    help: "Your previous experience helps the dermatologist understand what has—and hasn't—helped.",
    options: [
      "Skincare",
      "Facials",
      "Home remedies",
      "Previous clinical treatments",
      "Nothing yet",
    ],
  },
  {
    id: "goal",
    title: "What result matters most?",
    help: "The result you value should guide the conversation more than a treatment trend.",
    options: [
      "Look fresher",
      "Improve texture",
      "Reduce visible lines",
      "Improve firmness",
      "Improve pigmentation",
      "Understand my options",
    ],
    insight: "Most people who feel this way still want to look like themselves — just fresher.",
  },
  {
    id: "comfort",
    title: "What kind of approach are you comfortable exploring?",
    help: "This does not commit you to a treatment. It simply makes your preferences clear.",
    options: [
      "Minimal downtime",
      "Non-invasive options",
      "Open to dermatologist recommendations",
      "Not sure yet",
    ],
  },
];

const FOCUS_COPY: Record<string, string> = {
  "Fine lines": "fine lines, skin texture and facial freshness",
  Wrinkles: "visible lines, skin quality and natural-looking improvement",
  Acne: "breakouts, marks and skin health priorities",
  "Hair loss": "hair shedding, scalp concerns and the right questions to ask",
  "Dark circles": "the under-eye area and factors that can affect a tired appearance",
  Scars: "the appearance of scars, texture and suitable treatment discussions",
  "Loss of firmness": "firmness, facial support and overall freshness",
  Dullness: "brightness, hydration and tired-looking skin",
  Pigmentation: "uneven tone, pigmentation and skin clarity",
  "Texture / pores": "texture, pores and smoother-looking skin",
  "Sensitive skin": "skin comfort, sensitivity and gentle care options",
  "Loss of facial volume": "facial volume, support and balanced rejuvenation",
  "Overall ageing": "overall facial ageing, freshness and a realistic plan",
  "I'm not sure": "understanding the changes you have noticed and clarifying your priorities",
};


const PROFILES: Record<string, ResultProfile> = {
  "Fine lines": {
    name: "Early Prevention Profile",
    dims: { "Fine Lines": 78, Firmness: 45, Texture: 40, Pigmentation: 25 },
  },
  Wrinkles: {
    name: "Renewal Focus Profile",
    dims: { "Fine Lines": 72, Firmness: 55, Texture: 45, Pigmentation: 28 },
  },
  Acne: {
    name: "Acne & Skin Health Profile",
    dims: { "Fine Lines": 20, Firmness: 20, Texture: 68, Pigmentation: 62 },
  },
  "Hair loss": {
    name: "Hair & Scalp Consultation Profile",
    dims: { "Fine Lines": 20, Firmness: 20, Texture: 30, Pigmentation: 20 },
  },
  "Dark circles": {
    name: "Under-Eye Concern Profile",
    dims: { "Fine Lines": 55, Firmness: 35, Texture: 35, Pigmentation: 62 },
  },
  Scars: {
    name: "Scar & Texture Profile",
    dims: { "Fine Lines": 30, Firmness: 30, Texture: 82, Pigmentation: 45 },
  },
  "Loss of firmness": {
    name: "Firmness Focus Profile",
    dims: { "Fine Lines": 50, Firmness: 80, Texture: 38, Pigmentation: 24 },
  },
  Dullness: {
    name: "Freshness & Renewal Profile",
    dims: { "Fine Lines": 30, Firmness: 35, Texture: 55, Pigmentation: 42 },
  },
  Pigmentation: {
    name: "Tone & Clarity Profile",
    dims: { "Fine Lines": 25, Firmness: 30, Texture: 45, Pigmentation: 82 },
  },
  "Texture / pores": {
    name: "Texture & Renewal Profile",
    dims: { "Fine Lines": 30, Firmness: 35, Texture: 78, Pigmentation: 40 },
  },
  "Sensitive skin": {
    name: "Sensitive Skin Profile",
    dims: { "Fine Lines": 25, Firmness: 25, Texture: 55, Pigmentation: 42 },
  },
  "Loss of facial volume": {
    name: "Structural Support Profile",
    dims: { "Fine Lines": 48, Firmness: 75, Texture: 35, Pigmentation: 22 },
  },
  "Overall ageing": {
    name: "Multi-Area Rejuvenation Profile",
    dims: { "Fine Lines": 50, Firmness: 55, Texture: 50, Pigmentation: 45 },
  },
  "I'm not sure": {
    name: "Discovery Profile",
    dims: { "Fine Lines": 42, Firmness: 42, Texture: 42, Pigmentation: 42 },
  },
};

function getProfile(concern?: string): ResultProfile {
  return PROFILES[concern ?? "I'm not sure"] ?? PROFILES["I'm not sure"]!;
}

const DESIRED_OUTCOMES = [
  "A fresher, healthier-looking appearance",
  "Feeling more comfortable in your own skin",
  "A natural result you're happy with",
  "More confidence, day to day",
];

const CONCERN_TITLE: Record<string, string> = {
  "Fine lines": "Fine Lines",
  Wrinkles: "Visible Lines",
  Acne: "Acne & Breakouts",
  "Hair loss": "Hair & Scalp Concerns",
  "Dark circles": "Dark Circles",
  Scars: "Scars & Texture",
  "Loss of firmness": "Firmness",
  Dullness: "Facial Freshness",
  Pigmentation: "Pigmentation",
  "Texture / pores": "Texture",
  "Sensitive skin": "Sensitive Skin",
  "Loss of facial volume": "Facial Support",
  "Overall ageing": "Overall Rejuvenation",
  "I'm not sure": "Understanding the Changes",
};

const GOAL_TITLE: Record<string, [string, string]> = {
  "Look fresher": ["Facial Freshness", "Overall complexion"],
  "Improve texture": ["Skin Texture", "Smoothness and pores"],
  "Reduce visible lines": ["Fine Lines", "Visible areas of concern"],
  "Improve firmness": ["Firmness", "Facial support and definition"],
  "Improve pigmentation": ["Even-Looking Tone", "Pigmentation and clarity"],
  "Understand my options": ["Treatment Clarity", "A realistic, informed plan"],
};

type Stage = "quiz" | "revealing" | "gate" | "result";

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
  const questionRef = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);
  useEffect(() => { if (navigated.current) questionRef.current?.focus(); }, [step]);
  const initialAnswers = initialAreas.length ? { area: initialAreas.join(", ") } : {};
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [stage, setStage] = useState<Stage>("quiz");
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const [gateName, setGateName] = useState("");
  const [gatePhone, setGatePhone] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateSending, setGateSending] = useState(false);
  const question = QUESTIONS[Math.min(step, QUESTIONS.length - 1)]!;
  const progress = stage !== "quiz" ? 100 : ((step + 1) / QUESTIONS.length) * 100;

  const areasKey = initialAreas.join("|");
  useEffect(() => {
    // Only carry a face-explorer selection into Q2 before the visitor has started
    // answering — once real progress exists, a later face-area toggle must never
    // silently discard it.
    if (stage === "quiz" && step === 0 && initialAreas.length > 0) {
      setAnswers((current) => ({ ...current, area: initialAreas.join(", ") }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasKey]);

  function choose(value: string) {
    if (step === 0 && !answers["concern"]) track("assessment_started");
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    nextQuestion(next);
  }

  function nextQuestion(answerState = answers) {
    if (!answerState[question.id]) return;
    navigated.current = true;
    track("assessment_question_completed", {
      question: question.id,
      answer: answerState[question.id],
      question_number: step + 1,
    });
    track("assessment_question_answered", {
      question: question.id,
      answer: answerState[question.id],
      question_number: step + 1,
    });

    const advance = () => {
      setActiveInsight(null);
      if (step === QUESTIONS.length - 1) {
        onComplete(answerState);
        onProfile?.(getProfile(answerState["concern"]));
        track("assessment_completed");
        setStage("result");
        return;
      }
      setStep((current) => current + 1);
    };

    advance();
  }

  async function submitGate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = gateName.trim();
    const phone = gatePhone.trim();
    if (name.length < 2 || phone.length < 7) {
      setGateError("Please share your name and mobile number so we can send your Skin Profile.");
      return;
    }
    setGateError("");
    setGateSending(true);
    const profile = getProfile(answers["concern"]);
    track("skin_profile_lead_captured", { concern: answers["concern"], profile: profile.name });

    const endpoint =
      (import.meta.env["VITE_LEAD_ENDPOINT"] as string | undefined) ?? "/api/lead-capture";
    const payload = {
      lead_type: "skin_profile_result",
      name,
      phone,
      primary_concern: answers["concern"] ?? "",
      result_profile: profile.name,
      result_dimensions: profile.dims,
      assessment_responses: answers,
      consent_status: true,
      landing_page_identifier: "anti-aging-consultation-karur",
      timestamp: new Date().toISOString(),
      ...getAttribution(),
    };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Lead endpoint rejected the request");
    } catch {
      setGateError("We couldn't save your details. Please try again.");
      setGateSending(false);
      return;
    }

    setGateSending(false);
    setStage("result");
    track("personalized_result_viewed", { concern: answers["concern"], profile: profile.name });
  }

  function resetAssessment() {
    setStep(0);
    setStage("quiz");
    setAnswers(initialAnswers);
    setActiveInsight(null);
    setGateName("");
    setGatePhone("");
    setGateError("");
  }

  if (stage === "revealing") {
    return (
      <div
        className="assessment-card flex flex-col items-center py-20 text-center"
        aria-live="polite"
      >
        <RefreshCw className="size-7 animate-spin text-clay" />
        <p className="mt-5 font-display text-3xl">Your Skin Profile is ready.</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          We're organising your answers into the areas that appear most relevant to your goals.
        </p>
      </div>
    );
  }

  if (stage === "gate") {
    return (
      <form onSubmit={submitGate} className="assessment-card" aria-live="polite">
        <p className="eyebrow text-clay">Almost there</p>
        <h3 className="mt-4 max-w-2xl text-3xl leading-[1.1] sm:text-4xl">
          Where should we send your Skin Profile?
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Share your summary with the clinic so they can contact you about your concerns.
        </p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="b-gate-name" className="form-label">
              Name
            </Label>
            <Input
              id="b-gate-name"
              value={gateName}
              onChange={(event) => setGateName(event.target.value)}
              placeholder="Your name"
              className="mt-2 h-12 rounded-xl border-border bg-background"
            />
          </div>
          <div>
            <Label htmlFor="b-gate-phone" className="form-label">
              Mobile / WhatsApp number
            </Label>
            <Input
              id="b-gate-phone"
              type="tel"
              value={gatePhone}
              onChange={(event) => setGatePhone(event.target.value)}
              placeholder="10-digit mobile number"
              className="mt-2 h-12 rounded-xl border-border bg-background"
            />
          </div>
        </div>
        {gateError && <p className="mt-3 text-xs text-destructive">{gateError}</p>}
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          By continuing, you agree to be contacted by Sanjay Rithik Hospital about your Skin
          Profile. We won't use these details for anything else.
        </p>
        <Button
          type="submit"
          variant="clay"
          size="xl"
          className="mt-6 w-full sm:w-auto"
          disabled={gateSending}
        >
          {gateSending ? "Preparing your profile…" : "Show My Personalised Result"} <ArrowRight />
        </Button>
      </form>
    );
  }

  if (stage === "result") {
    const profile = getProfile(answers["concern"]);
    const focus = FOCUS_COPY[answers["concern"] ?? "I'm not sure"] ?? FOCUS_COPY["I'm not sure"];
    const concernLabel = CONCERN_TITLE[answers["concern"] ?? "I'm not sure"] ?? "Skin Priorities";
    const selectedGoal = GOAL_TITLE[answers["goal"] ?? ""] ?? [
      "Treatment Clarity",
      "Realistic options",
    ];

    return (
      <div className="assessment-card" aria-live="polite">
        <p className="eyebrow text-clay">Your Skin Check Summary</p>
        <h3 className="mt-4 max-w-3xl text-4xl leading-[1.08] sm:text-5xl">Your priority: {concernLabel}</h3>
        <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
          Based on what you've told us, {focus} are the priorities to bring into your consultation.
        </p>

        <p className="mt-3 text-xs text-muted-foreground">
          A self-reported profile to guide your conversation with the dermatologist—not a medical
          diagnosis.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-ink-foreground sm:p-7">
            <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-clay/20 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Your skin snapshot</p>
                <p className="mt-2 font-display text-3xl leading-tight">What you told us</p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-clay">
                <Sparkles className="size-5" />
              </span>
            </div>
            <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Main concern", value: concernLabel, icon: Target },
                { label: "Area noticed most", value: answers["area"] || "Not specified", icon: MapPin },
                { label: "Noticed since", value: answers["duration"] || "Not specified", icon: Clock3 },
                { label: "Desired result", value: selectedGoal[0], icon: Heart },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <Icon className="size-4 text-clay" />
                  <p className="mt-4 text-[0.68rem] uppercase tracking-[0.12em] text-ink-foreground/45">{label}</p>
                  <p className="mt-1 text-sm font-medium leading-snug text-ink-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-clay/20 bg-gradient-to-br from-clay/15 via-card to-sand p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Your desired direction</p>
                <p className="mt-2 font-display text-3xl leading-tight">What you want</p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-clay/15 text-clay">
                <Heart className="size-5" />
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {DESIRED_OUTCOMES.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 py-3 text-sm leading-snug">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-clay text-clay-foreground">
                    <Check className="size-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-ink/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              Your consultation can focus on {selectedGoal[1].toLowerCase()} and a realistic plan for your skin.
            </div>
          </div>
        </div>
        <p className="mt-5 max-w-2xl border-l-2 border-clay pl-5 text-sm italic leading-relaxed text-muted-foreground">
          The next step is understanding which professional options may actually be appropriate for
          you—that's what a consultation is for.
        </p>

        <div className="mt-8 rounded-2xl bg-sand p-6">
          <p className="eyebrow text-clay">Your next best step</p>
          <p className="mt-3 max-w-2xl font-display text-3xl leading-tight">
            You don't need to choose a treatment. You just need to understand your options.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The dermatologist can assess these priorities and explain which options may be
            appropriate for your skin.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border bg-gradient-to-br from-sage/10 to-clay/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-clay">Your profile</p>
          <p className="font-display text-xl">{profile.name}</p>
          <span className="text-sm text-muted-foreground">Natural-result preference</span>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            variant="clay"
            size="xl"
            asChild
            onClick={() => track("booking_form_started", { source: "assessment_result" })}
          >
            <a href="#b-consultation">
              Discuss With Dermatologist <ArrowRight />
            </a>
          </Button>
          <button
            type="button"
            onClick={resetAssessment}
            className="rounded-full px-5 py-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Start again
          </button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          This assessment is educational and does not replace medical consultation.
        </p>
      </div>
    );
  }

  return (
    <div className="assessment-card">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow text-clay">
          Question {step + 1} of {QUESTIONS.length}
        </p>
        <span className="text-xs text-muted-foreground">About 60 seconds</span>
      </div>
      <div
        className="mt-4 h-1 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={QUESTIONS.length}
        aria-valuenow={step + 1}
        aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}
      >
        <div
          className="h-full bg-gradient-clay transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <h3 ref={questionRef} tabIndex={-1} aria-live="polite" className="mt-7 text-3xl leading-[1.08] sm:text-[2.65rem]">{question.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{question.help}</p>
      {question.id === "area" && initialAreas.length > 0 && (
        <div className="mt-5 rounded-2xl bg-sand p-5">
          <p className="text-sm font-medium">We've added these from the face explorer:</p>
          <p className="mt-2 text-xs text-muted-foreground">{initialAreas.join(" · ")}</p>
          <Button
            type="button"
            variant="clay"
            size="pill"
            className="mt-4"
            onClick={() => choose(initialAreas.join(", "))}
          >
            Continue with these areas <ArrowRight />
          </Button>
        </div>
      )}
      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
        {(question.id === "area" && answers["concern"] === "Hair loss" ? ["Scalp", "Hairline", "Overall hair thinning", "Not sure"] : question.options).map((option) => {
          const selected = answers[question.id] === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => choose(option)}
              className={cn(
                "group flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-5 py-4 text-left text-[0.95rem] transition-all duration-300",
                "hover:-translate-y-0.5 hover:border-clay hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
                selected && "border-clay bg-sand",
              )}
            >
              <span>{option}</span>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground group-hover:border-clay group-hover:text-clay">
                {selected ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        variant="clay"
        size="xl"
        className="skin-check-next mt-6 w-full sm:w-auto"
        disabled={!answers[question.id]}
        onClick={nextQuestion}
      >
        {step === QUESTIONS.length - 1 ? "See my summary" : "Next question"} <ArrowRight />
      </Button>
      {activeInsight && (
        <div
          className="mt-5 rounded-2xl border-l-2 border-clay bg-sand px-5 py-4 text-sm leading-relaxed text-muted-foreground"
          aria-live="polite"
        >
          {activeInsight}
        </div>
      )}
      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep((current) => current - 1)}
          className="mt-6 inline-flex items-center gap-2 rounded-full py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
      )}
    </div>
  );
}
