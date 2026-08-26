import {
  MIN_RESUME_BODY_SIZE,
  MIN_RESUME_LEADING,
  type ResumeSpacing,
} from "./constants";
import type { ResumeDesignSelection } from "./schema";
import {
  resumeTemplates,
  type ResumeTemplateDescriptor,
  type ResumeTypeRole,
} from "./templates";
import { resumeFontFamilies, type ResumeFontFamily } from "./typography";

export type ResumeSpacingModifier = {
  leading: number;
  gap: number;
  margin: number;
};

export const resumeSpacingModifiers: Record<
  ResumeSpacing,
  ResumeSpacingModifier
> = {
  COMPACT: { leading: 0.92, gap: 0.72, margin: 0.84 },
  STANDARD: { leading: 1, gap: 1, margin: 1 },
};

export type ResolvedResumeDesign = ResumeTemplateDescriptor & {
  selection: ResumeDesignSelection;
  font: ResumeFontFamily;
};

function roundTo(value: number, places: number) {
  const factor = 10 ** places;

  return Math.round(value * factor) / factor;
}

export function resolveResumeDesign(
  selection: ResumeDesignSelection,
): ResolvedResumeDesign {
  const template = resumeTemplates[selection.template];
  const modifier = resumeSpacingModifiers[selection.spacing];
  const scale = { ...template.scale } as Record<ResumeTypeRole, number>;

  scale.body = Math.max(scale.body, MIN_RESUME_BODY_SIZE);

  return {
    ...template,
    scale,
    leading: roundTo(
      Math.max(template.leading * modifier.leading, MIN_RESUME_LEADING),
      3,
    ),
    sectionGap: roundTo(template.sectionGap * modifier.gap, 2),
    entryGap: roundTo(template.entryGap * modifier.gap, 2),
    bulletGap: roundTo(template.bulletGap * modifier.gap, 2),
    headerGap: roundTo(template.headerGap * modifier.gap, 2),
    margin: {
      top: roundTo(template.margin.top * modifier.margin, 2),
      right: roundTo(template.margin.right * modifier.margin, 2),
      bottom: roundTo(template.margin.bottom * modifier.margin, 2),
      left: roundTo(template.margin.left * modifier.margin, 2),
    },
    sectionRule: template.sectionRule
      ? {
          ...template.sectionRule,
          gapAbove: roundTo(template.sectionRule.gapAbove * modifier.gap, 2),
          gapBelow: roundTo(template.sectionRule.gapBelow * modifier.gap, 2),
        }
      : null,
    headerRule: template.headerRule
      ? {
          ...template.headerRule,
          gapAbove: roundTo(template.headerRule.gapAbove * modifier.gap, 2),
          gapBelow: roundTo(template.headerRule.gapBelow * modifier.gap, 2),
        }
      : null,
    selection,
    font: resumeFontFamilies[selection.typography],
  };
}
