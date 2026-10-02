import { useEffect, useRef, useState } from "react";
import { ArrowRight, Quote, Star } from "lucide-react";
import { Button } from "@/comparison/b/components/ui/button";
import { testimonials } from "@/comparison/b/data/testimonials";
import { track } from "@/comparison/b/lib/analytics";
import { Reveal } from "./Reveal";

export function TestimonialGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          track("testimonial_grid_viewed");
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="b-testimonials" className="section-shell bg-paper">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-clay">Patient experiences</p>
          <h2 className="mt-5 text-4xl leading-[1.04] sm:text-5xl">
            Will it work for someone like me? Hear it from our patients.
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Real reviews from Sanjay Rithik Hospital's Google Business listing — people who came in
            with one specific concern and left with a plan that fit them.
          </p>
        </Reveal>

        <div ref={reviewRef} onScroll={(event) => { const el = event.currentTarget; const width = el.firstElementChild?.getBoundingClientRect().width ?? el.clientWidth; setReviewIndex(Math.min(2, Math.round(el.scrollLeft / (width + 16)))); }} className="review-grid mt-10 grid gap-5 lg:grid-cols-3" aria-label="Patient reviews">
          {testimonials.slice(0, 3).map((item, index) => (
            <Reveal key={item.name} delay={index * 40}>
              <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex text-clay" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: item.rating }).map((_, starIndex) => (
                      <Star key={starIndex} className="size-3.5 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <Quote className="size-5 shrink-0 text-clay/50" aria-hidden="true" />
                </div>
                {item.quote.length > 300 ? <><p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">“{item.quote.split(/(?<=\.)\s/)[0]} …”</p><details className="mt-4"><summary>Read full review</summary><p className="mt-3 text-sm leading-relaxed text-muted-foreground">“{item.quote}”</p></details></> : <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">“{item.quote}”</p>}
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.meta}
                    {item.timeAgo ? ` · ${item.timeAgo}` : ""}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="review-pagination" aria-label="Choose a review">{[0,1,2].map((index) => <button key={index} type="button" aria-label={`Show review ${index + 1}`} aria-current={reviewIndex === index ? "true" : undefined} onClick={() => { const el = reviewRef.current; const width = el?.firstElementChild?.getBoundingClientRect().width ?? 0; el?.scrollTo({ left: index * (width + 16), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }} />)}</div>
        <Reveal delay={120} className="mt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong>Individual results vary.</strong> Treatment suitability, sessions, recovery and
            outcomes depend on individual factors and are confirmed at consultation.
          </p>
        </Reveal>

        <Reveal
          delay={140}
          className="mt-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center"
        >
          <Button variant="ink" size="xl" asChild>
            <a
              href="#b-skin-check"
              onClick={() => track("testimonial_cta_clicked", { action: "assessment" })}
            >
              Check My Skin <ArrowRight />
            </a>
          </Button>
          <Button variant="quiet" size="xl" asChild>
            <a
              href="#b-consultation"
              onClick={() => track("testimonial_cta_clicked", { action: "b-consultation" })}
            >
              Discuss My Options
            </a>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
