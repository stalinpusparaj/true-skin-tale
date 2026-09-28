import { useState, type ReactNode } from "react";
import type { AgeJourneySelection } from "./a/components/skin/AgeJourney";
import { VersionA } from "./a/Page";
import { VersionB } from "./b/Page";

const groups = [
  ["navigation", "Landing page header"],
  ["hero", "Hero"],
  ["clinic-facts", "Trust / Quick Facts Strip"],
  ["pain", "Skin Concerns / Recognition"],
  ["assessment", "Skin Assessment / Skin Check"],
  ["treatments", "Treatment Options by Concern"],
  ["services", "Dermatology Services"],
  ["doctor", "Meet Your Dermatologist"],
  ["video", "Consultation Journey / How It Works"],
  ["age", "Interactive Age Preview"],
  ["testimonials", "Patient Testimonials"],
  ["before-after", "Before & After Gallery"],
  ["questions", "FAQ / Questions & Concerns"],
  ["clinic", "Visit Sanjay Rithik Hospital"],
  ["consultation", "Consultation / Appointment"],
  ["footer", "Footer"],
] as const;

const hiddenSections: Record<"a" | "b", readonly string[]> = {
  a: ["pain", "treatments", "video", "testimonials", "questions", "consultation", "footer"],
  b: ["navigation", "hero", "doctor", "age"],
} as const;

function Sections({ a, b }: { a: Record<string, ReactNode>; b: Record<string, ReactNode> }) {
  return (
    <div className="enhanced-site">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <main id="main-content" className="comparison-page">
      {a["schema"]}
      {groups.map(([key]) => (
        <div key={key} id={`compare-${key}`} className="comparison-group">
          {([['a', a], ['b', b]] as const).map(([version, sections]) => sections[key] && !hiddenSections[version].includes(key) ? (
            <div key={version} className={`version-${version} comparison-version`} data-section={key} data-version={version}>
              <div className={`comparison-content comparison-${key}`}>{sections[key]}</div>
            </div>
          ) : null)}
        </div>
      ))}
    </main>
    </div>
  );
}

export function Comparison() {
  const [ageSelection, setAgeSelection] = useState<AgeJourneySelection>();
  return <div id="review-top"><VersionA onAgeSelection={setAgeSelection} render={(a) => <VersionB sharedAgeSelection={ageSelection} render={(b) => <Sections a={a} b={b} />} />} /></div>;
}

