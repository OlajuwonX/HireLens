"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { stepLabel } from "@/lib/marketing/story";
import { scenes } from "./scenes";
import { buildPinned, buildReveals, MOTION_QUERY, PINNED_QUERY } from "./story-motion";
import { sceneVisuals } from "./visuals";

gsap.registerPlugin(ScrollTrigger);

export function StoryScroll() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = root.current;

    if (!element) {
      return;
    }

    const media = gsap.matchMedia();

    media.add({ pin: PINNED_QUERY, motion: MOTION_QUERY }, (context) => {
      if (context.conditions?.pin) {
        element.dataset.pinned = "true";
        buildPinned(element);
        return () => {
          delete element.dataset.pinned;
        };
      }

      if (context.conditions?.motion) {
        buildReveals(element);
      }
    });

    return () => media.revert();
  }, []);

  return (
    <section
      ref={root}
      id="how-it-works"
      aria-labelledby="story-heading"
      className="group/story scroll-mt-20 border-t border-border"
    >
      <div className="py-10 sm:py-16">
        <p className="font-mono text-system font-medium uppercase text-text-muted">How it works</p>
        <h2 id="story-heading" className="mt-3 max-w-reading text-page-title font-semibold text-text-primary">
          Follow one job from the posting to the interview.
        </h2>
      </div>

      <div data-stage className="relative group-data-[pinned]/story:h-dvh">
        {scenes.map((scene, index) => {
          const Visual = sceneVisuals[scene.id];

          return (
            <article
              key={scene.id}
              data-scene
              aria-labelledby={`scene-${scene.id}`}
              className="pb-16 sm:pb-24 group-data-[pinned]/story:absolute group-data-[pinned]/story:inset-0 group-data-[pinned]/story:flex group-data-[pinned]/story:items-center group-data-[pinned]/story:pb-0"
            >
              <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
                <div>
                  <p data-reveal className="font-mono text-system font-medium uppercase text-accent">
                    {stepLabel(index, scenes.length)} · {scene.kicker}
                  </p>
                  <h3
                    id={`scene-${scene.id}`}
                    data-reveal
                    className="mt-3 text-page-title font-semibold text-text-primary"
                  >
                    {scene.title}
                  </h3>
                  <p data-reveal className="mt-4 max-w-reading text-body text-text-secondary">
                    {scene.body}
                  </p>
                </div>
                <Visual />
              </div>
            </article>
          );
        })}

        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-8 hidden items-center gap-4 group-data-[pinned]/story:flex">
          <span data-step className="font-mono text-system text-text-muted">
            {stepLabel(0, scenes.length)}
          </span>
          <span className="h-px flex-1 bg-border">
            <span data-progress className="block h-full origin-left scale-x-0 bg-accent" />
          </span>
        </div>
      </div>
    </section>
  );
}
