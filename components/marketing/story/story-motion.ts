import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { nearestIndex, stepLabel } from "@/lib/marketing/story";

export const PINNED_QUERY = "(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";
export const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

const all = (root: Element, selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));

const filled = (element: HTMLElement) =>
  `inset(0 ${element.style.getPropertyValue("--score-rest") || "0%"} 0 0)`;

function playDetails(timeline: gsap.core.Timeline, scene: HTMLElement, at: gsap.Position) {
  timeline.from(all(scene, "[data-reveal]"), { autoAlpha: 0, y: 14, stagger: 0.05, duration: 0.3 }, at);

  const fills = all(scene, "[data-score-fill]");

  if (fills.length > 0) {
    gsap.set(fills, { transition: "none" });
    timeline.fromTo(
      fills,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: (_index: number, element: HTMLElement) => filled(element), stagger: 0.06, duration: 0.5 },
      at,
    );
  }

  for (const total of all(scene, "[data-total]")) {
    timeline.from(total, { textContent: 0, snap: { textContent: 1 }, duration: 0.5, ease: "power1.out" }, at);
  }
}

export function buildPinned(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("[data-stage]");
  const scenes = all(root, "[data-scene]");
  const step = root.querySelector<HTMLElement>("[data-step]");
  const bar = root.querySelector<HTMLElement>("[data-progress]");

  if (!stage || scenes.length === 0) {
    return;
  }

  gsap.set(scenes.slice(1), { autoAlpha: 0 });

  const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

  timeline.addLabel("scene-0");
  scenes.slice(1).forEach((scene, index) => {
    timeline
      .to(scenes[index], { autoAlpha: 0, y: -40, duration: 0.4 }, "+=0.6")
      .fromTo(scene, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.4 }, "<0.1");
    playDetails(timeline, scene, "<0.15");
    timeline.addLabel(`scene-${index + 1}`);
  });
  timeline.to({}, { duration: 0.6 });

  const stops = scenes.map((_, index) => timeline.labels[`scene-${index}`] / timeline.duration());

  ScrollTrigger.create({
    trigger: stage,
    start: "top top",
    end: () => `+=${window.innerHeight * scenes.length}`,
    pin: true,
    scrub: 0.6,
    animation: timeline,
    invalidateOnRefresh: true,
    snap: { snapTo: "labels", duration: { min: 0.2, max: 0.6 }, delay: 0.1, ease: "power1.inOut" },
    onUpdate: (self) => {
      if (step) {
        step.textContent = stepLabel(nearestIndex(self.progress, stops), scenes.length);
      }

      if (bar) {
        gsap.set(bar, { scaleX: self.progress });
      }
    },
  });
}

export function buildReveals(root: HTMLElement) {
  for (const scene of all(root, "[data-scene]")) {
    const timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: scene, start: "top 75%", once: true },
    });

    playDetails(timeline, scene, 0);
  }
}
