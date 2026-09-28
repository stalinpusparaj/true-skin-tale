// import { useRef, useState, type PointerEvent } from "react";
// import { ArrowLeftRight, ShieldCheck } from "lucide-react";
// import { cn } from "@/comparison/a/lib/utils";
// import case01Before from "@/comparison/a/assets/aviclear-gallery/01-before.png";
// import case01After from "@/comparison/a/assets/aviclear-gallery/01-after.png";
// import case02Before from "@/comparison/a/assets/aviclear-gallery/02-before.png";
// import case02After from "@/comparison/a/assets/aviclear-gallery/02-after.png";
// import case03Before from "@/comparison/a/assets/aviclear-gallery/03-before.png";
// import case03After from "@/comparison/a/assets/aviclear-gallery/03-after.png";
// import case04Before from "@/comparison/a/assets/aviclear-gallery/04-before.png";
// import case04After from "@/comparison/a/assets/aviclear-gallery/04-after.png";
// import case05Before from "@/comparison/a/assets/aviclear-gallery/05-before.png";
// import case05After from "@/comparison/a/assets/aviclear-gallery/05-after.png";
// import case06Before from "@/comparison/a/assets/aviclear-gallery/06-before.png";
// import case06After from "@/comparison/a/assets/aviclear-gallery/06-after.png";

// const CASES = [
//   [case01Before, case01After],
//   [case02Before, case02After],
//   [case03Before, case03After],
//   [case04Before, case04After],
//   [case05Before, case05After],
//   [case06Before, case06After],
// ] as const;

// function BeforeAfterCard({ before, after, index }: { before: string; after: string; index: number }) {
//   const surfaceRef = useRef<HTMLDivElement>(null);
//   const [position, setPosition] = useState(50);

//   function setFromPointer(event: PointerEvent<HTMLDivElement>) {
//     const bounds = event.currentTarget.getBoundingClientRect();
//     const next = ((event.clientX - bounds.left) / bounds.width) * 100;
//     setPosition(Math.min(100, Math.max(0, next)));
//   }

//   function startDrag(event: PointerEvent<HTMLDivElement>) {
//     if ((event.target as HTMLElement).closest("input, button")) return;
//     event.currentTarget.setPointerCapture(event.pointerId);
//     setFromPointer(event);
//   }

//   return (
//     <article className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-soft">
//       <div
//         ref={surfaceRef}
//         className="relative aspect-[4/3] select-none overflow-hidden bg-[#efe7df] [touch-action:none]"
//         onPointerDown={startDrag}
//         onPointerMove={(event) => {
//           if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromPointer(event);
//         }}
//         onPointerUp={(event) => {
//           if (event.currentTarget.hasPointerCapture(event.pointerId)) {
//             setFromPointer(event);
//             event.currentTarget.releasePointerCapture(event.pointerId);
//           }
//         }}
//         onPointerCancel={(event) => {
//           if (event.currentTarget.hasPointerCapture(event.pointerId)) {
//             event.currentTarget.releasePointerCapture(event.pointerId);
//           }
//         }}
//         onDragStart={(event) => event.preventDefault()}
//       >
//         <img src={before} alt={`Acne reference example ${index + 1}, before`} draggable={false} className="absolute inset-0 size-full object-cover" />
//         <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
//           <img src={after} alt={`Acne reference example ${index + 1}, after`} draggable={false} className="absolute inset-0 size-full object-cover" />
//         </div>
//         <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,.2)]" style={{ left: `${position}%` }}>
//           <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-ink/85 text-white shadow-lg">
//             <ArrowLeftRight className="size-4" />
//           </span>
//         </div>
//         <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-ink/75 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white">Before</span>
//         <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-clay px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-clay-foreground">After</span>
//         <label className="absolute inset-x-4 bottom-4 z-20 rounded-full border border-white/20 bg-ink/70 px-3 py-2 backdrop-blur">
//           <span className="sr-only">Drag before and after comparison {index + 1}</span>
//           <input
//             type="range"
//             min="0"
//             max="100"
//             value={position}
//             onChange={(event) => setPosition(Number(event.target.value))}
//             aria-label={`Drag before and after comparison ${index + 1}`}
//             className="age-range w-full"
//           />
//         </label>
//       </div>
//       <p className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">Drag the divider to compare</p>
//     </article>
//   );
// }

// export function BeforeAfterGallery() {
//   return (
//     <section id="a-before-after" className="section-shell bg-sand">
//       <div className="mx-auto w-full max-w-6xl">
//         <div className="max-w-3xl">
//           <p className="eyebrow text-clay">Before &amp; after gallery</p>
//           <h2 className="mt-5 text-4xl leading-[1.04] sm:text-5xl">See the kind of change people explore with acne care.</h2>
//           <p className="mt-5 leading-relaxed text-muted-foreground">Move each divider to compare the reference images. Individual results vary and suitability can only be assessed during consultation.</p>
//         </div>
//         <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
//           {CASES.map(([before, after], index) => (
//             <BeforeAfterCard key={before} before={before} after={after} index={index} />
//           ))}
//         </div>
//         <div className="mt-8 flex items-start gap-3 rounded-2xl border border-clay/20 bg-card/70 p-5 text-xs leading-relaxed text-muted-foreground">
//           <ShieldCheck className="mt-0.5 size-4 shrink-0 text-clay" />
//           <p>Warning: These photos are published for information purposes only to provide information on the nature of the intervention. They do not constitute any guarantee of results. These are reference examples from Clinique AntiAge’s AviClear gallery, not Sanjay Rithik Hospital patient results.</p>
//         </div>
//       </div>
//     </section>
//   );
// }



import { useState, type PointerEvent } from "react";
import { ArrowLeftRight, ShieldCheck } from "lucide-react";

import case01Before from "@/comparison/a/assets/aviclear-gallery/01-before.png";
import case01After from "@/comparison/a/assets/aviclear-gallery/01-after.png";
import case02Before from "@/comparison/a/assets/aviclear-gallery/02-before.png";
import case02After from "@/comparison/a/assets/aviclear-gallery/02-after.png";
import case03Before from "@/comparison/a/assets/aviclear-gallery/03-before.png";
import case03After from "@/comparison/a/assets/aviclear-gallery/03-after.png";
import case04Before from "@/comparison/a/assets/aviclear-gallery/04-before.png";
import case04After from "@/comparison/a/assets/aviclear-gallery/04-after.png";
import case05Before from "@/comparison/a/assets/aviclear-gallery/05-before.png";
import case05After from "@/comparison/a/assets/aviclear-gallery/05-after.png";
import case06Before from "@/comparison/a/assets/aviclear-gallery/06-before.png";
import case06After from "@/comparison/a/assets/aviclear-gallery/06-after.png";

const CASES = [
  {
    before: case01Before,
    after: case01After,
    title: "Acne Scar Treatment",
    sessions: "6 Sessions",
  },
  {
    before: case02Before,
    after: case02After,
    title: "Acne Treatment",
    sessions: "4 Sessions",
  },
  {
    before: case03Before,
    after: case03After,
    title: "Pigmentation Treatment",
    sessions: "2 Sessions",
  },
  {
    before: case04Before,
    after: case04After,
    title: "Melasma Treatment",
    sessions: "5 Sessions",
  },
  {
    before: case05Before,
    after: case05After,
    title: "Laser Hair Removal – Legs",
    sessions: "3 Sessions",
  },
  {
    before: case06Before,
    after: case06After,
    title: "Laser Hair Removal – Face",
    sessions: "4 Sessions",
  },
] as const;

type BeforeAfterCardProps = {
  before: string;
  after: string;
  title: string;
  sessions: string;
};

function BeforeAfterCard({
  before,
  after,
  title,
  sessions,
}: BeforeAfterCardProps) {
  const [position, setPosition] = useState(50);

  function setCompareFromPointer(
    event: PointerEvent<HTMLDivElement>
  ) {
    const bounds = event.currentTarget.getBoundingClientRect();

    const percentage =
      ((event.clientX - bounds.left) / bounds.width) * 100;

    setPosition(Math.min(100, Math.max(0, percentage)));
  }

  function startCompareDrag(
    event: PointerEvent<HTMLDivElement>
  ) {
    if (
      (event.target as HTMLElement).closest(
        "input, button, label"
      )
    ) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setCompareFromPointer(event);
  }

  return (
    <article className="group">
      <div
        className="
          relative
          aspect-[4/3]
          w-full
          cursor-ew-resize
          select-none
          overflow-hidden
          rounded-[22px]
          bg-[#dceff1]
          shadow-[0_12px_35px_rgba(37,28,35,0.08)]
          [touch-action:none]
        "
        onPointerDown={startCompareDrag}
        onDragStart={(event) => event.preventDefault()}
        onPointerMove={(event) => {
          if (
            event.currentTarget.hasPointerCapture(
              event.pointerId
            )
          ) {
            setCompareFromPointer(event);
          }
        }}
        onPointerUp={(event) => {
          if (
            event.currentTarget.hasPointerCapture(
              event.pointerId
            )
          ) {
            setCompareFromPointer(event);

            event.currentTarget.releasePointerCapture(
              event.pointerId
            );
          }
        }}
        onPointerCancel={(event) => {
          if (
            event.currentTarget.hasPointerCapture(
              event.pointerId
            )
          ) {
            event.currentTarget.releasePointerCapture(
              event.pointerId
            );
          }
        }}
      >
        {/* BEFORE IMAGE */}
        <img
          src={before}
          alt={`${title} before`}
          draggable={false}
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
          "
        />

        {/* AFTER IMAGE */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: `inset(0 0 0 ${position}%)`,
          }}
        >
          <img
            src={after}
            alt={`${title} after`}
            draggable={false}
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        </div>

        {/* BOTTOM GRADIENT */}
        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            z-[5]
            h-[45%]
            bg-gradient-to-t
            from-black/70
            via-black/25
            to-transparent
          "
        />

        {/* BEFORE PILL */}
        <span
          className="
            pointer-events-none
            absolute
            left-4
            top-4
            z-20
            rounded-full
            bg-[#064c64]/90
            px-4
            py-2
            text-[10px]
            font-bold
            uppercase
            tracking-[0.13em]
            text-white
            shadow-md
            backdrop-blur-sm
          "
        >
          Before
        </span>

        {/* AFTER PILL */}
        <span
          className="
            pointer-events-none
            absolute
            right-4
            top-4
            z-20
            rounded-full
            bg-[#1aa8ba]
            px-4
            py-2
            text-[10px]
            font-bold
            uppercase
            tracking-[0.13em]
            text-white
            shadow-md
          "
        >
          After
        </span>

        {/* VERTICAL DIVIDER */}
        <div
          className="
            pointer-events-none
            absolute
            inset-y-0
            z-20
            w-[2px]
            bg-white/90
            shadow-[0_0_8px_rgba(0,0,0,0.18)]
          "
          style={{
            left: `${position}%`,
          }}
        >
          {/* CENTER DRAG HANDLE */}
          <div
            className="
              absolute
              left-1/2
              top-[42%]
              flex
              h-11
              w-11
              -translate-x-1/2
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/80
              bg-[#064c64]/95
              text-white
              shadow-xl
              backdrop-blur-sm
              transition-transform
              duration-200
              group-hover:scale-110
            "
          >
            <ArrowLeftRight size={17} />
          </div>
        </div>

        {/* TREATMENT INFORMATION */}
        <div
          className="
            pointer-events-none
            absolute
            bottom-[66px]
            left-5
            right-5
            z-20
            text-white
          "
        >
          <h3
            className="
              font-serif
              text-[18px]
              font-semibold
              leading-[1.15]
              tracking-[-0.01em]
              drop-shadow-md
              sm:text-[19px]
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-1.5
              text-[13px]
              font-normal
              leading-none
              text-white/90
              drop-shadow-sm
            "
          >
            {sessions}
          </p>
        </div>

        {/* BOTTOM SLIDER */}
        <label
          className="
            absolute
            bottom-3
            left-4
            right-4
            z-30
            flex
            h-10
            cursor-pointer
            items-center
            rounded-full
            border
            border-white/25
            bg-[#064c64]/80
            px-3
            shadow-lg
            backdrop-blur-md
          "
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span className="sr-only">
            Adjust before and after comparison
          </span>

          <div className="relative flex w-full items-center">
            {/* TRACK */}
            <div
              className="
                pointer-events-none
                absolute
                left-0
                right-0
                h-[4px]
                rounded-full
                bg-white/35
              "
            />

            {/* RANGE INPUT */}
            <input
              type="range"
              min="0"
              max="100"
              value={position}
              onChange={(event) =>
                setPosition(Number(event.target.value))
              }
              aria-label={`Compare ${title} before and after`}
              className="
                relative
                z-10
                h-5
                w-full
                cursor-ew-resize
                appearance-none
                bg-transparent

                [&::-webkit-slider-runnable-track]:h-[4px]
                [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-runnable-track]:bg-transparent

                [&::-webkit-slider-thumb]:mt-[-6px]
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:border-[3px]
                [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:bg-[#1aa8ba]
                [&::-webkit-slider-thumb]:shadow-md

                [&::-moz-range-track]:h-[4px]
                [&::-moz-range-track]:rounded-full
                [&::-moz-range-track]:bg-transparent

                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-[3px]
                [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:bg-[#1aa8ba]
                [&::-moz-range-thumb]:shadow-md
              "
            />
          </div>
        </label>
      </div>
    </article>
  );
}

export function BeforeAfterGallery() {
  return (
    <section
      id="a-before-after"
      className="
        bg-[#eff9fa]
        px-5
        py-20
        sm:px-8
        sm:py-24
        lg:px-10
        lg:py-28
      "
    >
      <div className="mx-auto max-w-[1440px]">
        {/* SECTION HEADING */}
        <header className="mx-auto max-w-4xl text-center">
          <p
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.22em]
              text-[#0b8fa5]
              sm:text-sm
            "
          >
            Transformations
          </p>

          {/* MAIN HEADING — REDUCED APPROX. 20% */}
          <h2
            className="
              mt-4
              font-serif
              text-[2rem]
              font-semibold
              leading-[1.08]
              tracking-[-0.025em]
              text-[#123f50]
              sm:text-[2.4rem]
              lg:text-[3rem]
            "
          >
            Before &amp; After Results
          </h2>

          <p
            className="
              mx-auto
              mt-4
              max-w-2xl
              text-sm
              leading-7
              text-[#587582]
              sm:text-base
            "
          >
            Explore reference before-and-after examples and drag
            the divider to compare each image.
          </p>
        </header>

        {/* GALLERY */}
        <div
          className="
            mt-12
            grid
            grid-cols-1
            gap-6
            sm:mt-14
            sm:grid-cols-2
            lg:mt-16
            lg:grid-cols-3
            lg:gap-8
          "
        >
          {CASES.map((item) => (
            <BeforeAfterCard
              key={item.before}
              before={item.before}
              after={item.after}
              title={item.title}
              sessions={item.sessions}
            />
          ))}
        </div>

        {/* DISCLAIMER */}
        <div
          className="
            mx-auto
            mt-12
            flex
            max-w-5xl
            items-start
            gap-3
            rounded-2xl
            border
            border-[#c9e7eb]
            bg-white/55
            px-5
            py-4
            text-xs
            leading-6
            text-[#587582]
            backdrop-blur-sm
          "
        >
          <ShieldCheck
            className="
              mt-1
              h-4
              w-4
              shrink-0
              text-[#0b8fa5]
            "
          />

          <p>
            These photos are published for informational purposes
            only to illustrate the nature of the intervention.
            Individual results may vary and no specific outcome is
            guaranteed. These are reference examples from Clinique
            AntiAge&apos;s AviClear gallery and are not Sanjay Rithik
            Hospital patient results.
          </p>
        </div>
      </div>
    </section>
  );
}
