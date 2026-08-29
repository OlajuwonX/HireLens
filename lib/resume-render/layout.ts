import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import {
  formatDateRange,
  joinNonEmpty,
  sanitizePdfText,
  wrapText,
} from "@/lib/pdf/text-layout";
import {
  INK,
  MUTED,
  type ResolvedResumeDesign,
  type ResumeFontRole,
} from "@/lib/resume-design";
import {
  RESUME_PAGE_HEIGHT,
  RESUME_PAGE_WIDTH,
  type ResumeLayout,
  type ResumeLayoutPage,
  type ResumeMetrics,
  type ResumeTextRun,
} from "./types";

const MIN_COLUMN_WIDTH = 72;
const RIGHT_COLUMN_GAP = 14;

type BlockOptions = {
  size: number;
  role?: ResumeFontRole;
  color?: string;
  indent?: number;
  width?: number;
  align?: "left" | "center";
  tracking?: number;
  leading?: number;
};

class ResumeLayoutBuilder {
  private pages: ResumeLayoutPage[] = [];
  private page: ResumeLayoutPage = { runs: [], rules: [] };
  private y: number;

  constructor(
    private readonly design: ResolvedResumeDesign,
    private readonly metrics: ResumeMetrics,
  ) {
    this.pages.push(this.page);
    this.y = design.margin.top;
  }

  get contentWidth() {
    return (
      RESUME_PAGE_WIDTH - this.design.margin.left - this.design.margin.right
    );
  }

  private get bottom() {
    return RESUME_PAGE_HEIGHT - this.design.margin.bottom;
  }

  private measure(text: string, size: number, role: ResumeFontRole) {
    return this.metrics.widthOf(text, size, role);
  }

  private trackedWidth(
    text: string,
    size: number,
    role: ResumeFontRole,
    tracking: number,
  ) {
    const base = this.measure(text, size, role);

    return text.length > 1 ? base + tracking * size * (text.length - 1) : base;
  }

  newPage() {
    this.page = { runs: [], rules: [] };
    this.pages.push(this.page);
    this.y = this.design.margin.top;
  }

  ensure(height: number) {
    if (this.y + height <= this.bottom) {
      return;
    }

    this.newPage();
  }

  advance(height: number) {
    this.y += height;
  }

  get cursor() {
    return this.y;
  }

  lineHeight(size: number, leading?: number) {
    return size * (leading ?? this.design.leading);
  }

  private pushRun(run: ResumeTextRun) {
    if (run.text) {
      this.page.runs.push(run);
    }
  }

  metricsWidth(text: string, size: number, role: ResumeFontRole) {
    return this.measure(sanitizePdfText(text), size, role);
  }

  block(value: string, options: BlockOptions) {
    const role = options.role ?? "regular";
    const color = options.color ?? INK;
    const indent = options.indent ?? 0;
    const tracking = options.tracking ?? 0;
    const size = options.size;
    const height = this.lineHeight(size, options.leading);
    const width = Math.max(
      MIN_COLUMN_WIDTH,
      (options.width ?? this.contentWidth) - indent,
    );
    const lines = wrapText(
      value,
      (text) => this.trackedWidth(text, size, role, tracking),
      width,
    );

    for (const line of lines) {
      this.ensure(height);

      const lineWidth = this.trackedWidth(line, size, role, tracking);
      const x =
        options.align === "center"
          ? this.design.margin.left + (this.contentWidth - lineWidth) / 2
          : this.design.margin.left + indent;

      this.emitLineAt(line, x, this.y + size, size, role, color, tracking);
      this.advance(height);
    }

    return lines.length;
  }

  inlineHeader(name: string, headline: string, nameWidth: number) {
    const design = this.design;
    const size = design.scale.name;
    const height = this.lineHeight(size);
    const gap = 10;

    this.ensure(height);

    const baseline = this.y + size;

    this.pushRun({
      text: name,
      x: design.margin.left,
      y: baseline,
      size,
      role: "bold",
      color: INK,
    });

    const remaining = this.contentWidth - nameWidth - gap;

    if (remaining > MIN_COLUMN_WIDTH) {
      const [line] = wrapText(
        headline,
        (text) => this.measure(text, design.scale.headline, "regular"),
        remaining,
      );

      if (line) {
        this.pushRun({
          text: line,
          x: design.margin.left + nameWidth + gap,
          y: baseline,
          size: design.scale.headline,
          role: "regular",
          color: design.accent ?? MUTED,
        });
      }
    }

    this.advance(height);
  }

  rule(spec: { thickness: number; color: string }) {
    this.ensure(spec.thickness);
    this.page.rules.push({
      x: this.design.margin.left,
      y: this.y,
      width: this.contentWidth,
      thickness: spec.thickness,
      color: spec.color,
    });
    this.advance(spec.thickness);
  }

  accentTick(size: number, color: string) {
    const height = size * 0.95;

    this.page.rules.push({
      x: this.design.margin.left - 6,
      y: this.y + size * 0.2,
      width: 2.5,
      thickness: height,
      color,
    });
  }

  splitRow(
    left: string,
    right: string,
    options: {
      size: number;
      role: ResumeFontRole;
      rightSize: number;
      color?: string;
      rightColor?: string;
    },
  ) {
    const rightText = sanitizePdfText(right);
    const rawRightWidth = rightText
      ? this.measure(rightText, options.rightSize, "regular")
      : 0;
    const rightWidth = Math.min(
      rawRightWidth,
      Math.max(0, this.contentWidth - MIN_COLUMN_WIDTH - RIGHT_COLUMN_GAP),
    );
    const leftWidth = Math.max(
      MIN_COLUMN_WIDTH,
      this.contentWidth - rightWidth - (rightWidth ? RIGHT_COLUMN_GAP : 0),
    );
    const height = this.lineHeight(options.size);
    const lines = wrapText(
      left,
      (text) => this.measure(text, options.size, options.role),
      leftWidth,
    );

    if (lines.length === 0 && !rightText) {
      return;
    }

    const rows = lines.length > 0 ? lines : [""];

    rows.forEach((line, index) => {
      this.ensure(height);

      const baseline = this.y + options.size;

      this.pushRun({
        text: line,
        x: this.design.margin.left,
        y: baseline,
        size: options.size,
        role: options.role,
        color: options.color ?? INK,
      });

      if (index === 0 && rightText && rawRightWidth <= rightWidth) {
        this.pushRun({
          text: rightText,
          x: RESUME_PAGE_WIDTH - this.design.margin.right - rawRightWidth,
          y: baseline,
          size: options.rightSize,
          role: "regular",
          color: options.rightColor ?? MUTED,
        });
      }

      this.advance(height);
    });

    if (rightText && rawRightWidth > rightWidth) {
      this.block(rightText, {
        size: options.rightSize,
        color: options.rightColor ?? MUTED,
      });
    }
  }

  bullet(value: string) {
    const size = this.design.scale.body;
    const glyph = this.design.bulletGlyph;
    const indent = this.design.bulletIndent;
    const markerWidth = this.measure(glyph, size, "regular");
    const height = this.lineHeight(size);
    const lines = wrapText(
      value,
      (text) => this.measure(text, size, "regular"),
      Math.max(MIN_COLUMN_WIDTH, this.contentWidth - indent),
    );

    lines.forEach((line, index) => {
      this.ensure(height);

      const baseline = this.y + size;

      if (index === 0) {
        this.pushRun({
          text: glyph,
          x:
            this.design.margin.left +
            Math.max(0, (indent - markerWidth) / 2 - 1),
          y: baseline,
          size,
          role: "regular",
          color: this.design.accent ?? MUTED,
        });
      }

      this.pushRun({
        text: line,
        x: this.design.margin.left + indent,
        y: baseline,
        size,
        role: "regular",
        color: INK,
      });

      this.advance(height);
    });

    if (lines.length > 0) {
      this.advance(this.design.bulletGap);
    }
  }

  sectionHeading(label: string, reserve: number) {
    const design = this.design;
    const size = design.scale.sectionLabel;
    const text =
      design.sectionLabelCase === "upper" ? label.toUpperCase() : label;
    const headingHeight = this.lineHeight(size);
    const ruleHeight = design.sectionRule
      ? design.sectionRule.gapAbove +
        design.sectionRule.thickness +
        design.sectionRule.gapBelow
      : 0;

    this.advance(design.sectionGap);
    this.ensure(headingHeight + ruleHeight + reserve);

    if (design.accentTick && design.accent) {
      this.accentTick(size, design.accent);
    }

    this.block(text, {
      size,
      role: design.sectionLabelBold ? "bold" : "regular",
      color: design.accent ?? MUTED,
      tracking: design.sectionLabelTracking,
    });

    if (design.sectionRule) {
      this.advance(design.sectionRule.gapAbove);
      this.rule(design.sectionRule);
      this.advance(design.sectionRule.gapBelow);
    }
  }

  inlineSection(label: string, value: string, labelColumn: number) {
    const design = this.design;
    const labelSize = design.scale.sectionLabel;
    const bodySize = design.scale.body;
    const height = this.lineHeight(bodySize);
    const text =
      design.sectionLabelCase === "upper" ? label.toUpperCase() : label;
    const lines = wrapText(
      value,
      (candidate) => this.measure(candidate, bodySize, "regular"),
      Math.max(MIN_COLUMN_WIDTH, this.contentWidth - labelColumn),
    );

    if (lines.length === 0) {
      return;
    }

    this.advance(design.sectionGap);
    this.ensure(height * Math.min(lines.length, 2));

    lines.forEach((line, index) => {
      this.ensure(height);

      const baseline = this.y + bodySize;

      if (index === 0) {
        this.emitLineAt(
          text,
          this.design.margin.left,
          this.y + labelSize,
          labelSize,
          design.sectionLabelBold ? "bold" : "regular",
          design.accent ?? MUTED,
          design.sectionLabelTracking,
        );
      }

      this.pushRun({
        text: line,
        x: this.design.margin.left + labelColumn,
        y: baseline,
        size: bodySize,
        role: "regular",
        color: INK,
      });

      this.advance(height);
    });
  }

  private emitLineAt(
    text: string,
    x: number,
    baseline: number,
    size: number,
    role: ResumeFontRole,
    color: string,
    tracking: number,
  ) {
    if (!tracking) {
      this.pushRun({ text, x, y: baseline, size, role, color });
      return;
    }

    let cursor = x;

    for (const character of text) {
      this.pushRun({
        text: character,
        x: cursor,
        y: baseline,
        size,
        role,
        color,
      });
      cursor += this.measure(character, size, role) + tracking * size;
    }
  }

  labelColumnWidth(labels: string[]) {
    const design = this.design;
    const size = design.scale.sectionLabel;
    const role: ResumeFontRole = design.sectionLabelBold ? "bold" : "regular";
    const widest = labels.reduce((widest, label) => {
      const text =
        design.sectionLabelCase === "upper" ? label.toUpperCase() : label;

      return Math.max(
        widest,
        this.trackedWidth(text, size, role, design.sectionLabelTracking),
      );
    }, 0);

    return Math.min(widest + 10, this.contentWidth / 3);
  }

  finish(): ResumeLayout {
    return {
      pages: this.pages,
      width: RESUME_PAGE_WIDTH,
      height: RESUME_PAGE_HEIGHT,
    };
  }
}

function headerBlock(
  builder: ResumeLayoutBuilder,
  resume: ImprovedResume,
  design: ResolvedResumeDesign,
) {
  const align = design.headerAlign === "center" ? "center" : "left";
  const name = sanitizePdfText(resume.header.name);
  const headline = sanitizePdfText(resume.header.headline);

  if (design.headerLayout === "inline" && name && headline) {
    const nameWidth = builder.metricsWidth(name, design.scale.name, "bold");

    builder.inlineHeader(name, headline, nameWidth);
  } else {
    if (name) {
      builder.block(name, { size: design.scale.name, role: "bold", align });
    }

    if (headline) {
      builder.advance(design.headerGap * 0.4);
      builder.block(headline, {
        size: design.scale.headline,
        role: design.metaItalic ? "italic" : "regular",
        color: design.accent ?? MUTED,
        align,
      });
    }
  }

  const contact = joinNonEmpty(
    [
      resume.header.email,
      resume.header.phone,
      resume.header.location,
      ...resume.header.links,
    ],
    design.contactSeparator,
  );

  if (contact) {
    builder.advance(design.headerGap);
    builder.block(contact, {
      size: design.scale.contact,
      color: MUTED,
      align,
    });
  }

  if (design.headerRule) {
    builder.advance(design.headerRule.gapAbove);
    builder.rule(design.headerRule);
    builder.advance(design.headerRule.gapBelow);
  }
}

export function buildResumeLayout(
  resume: ImprovedResume,
  design: ResolvedResumeDesign,
  metrics: ResumeMetrics,
): ResumeLayout {
  const builder = new ResumeLayoutBuilder(design, metrics);

  headerBlock(builder, resume, design);

  const inlineLabels = design.inlineSectionLabels;
  const labelColumn = inlineLabels
    ? builder.labelColumnWidth(["Summary", "Skills", "Experience"])
    : 0;

  const summary = sanitizePdfText(resume.professionalSummary);

  if (summary) {
    if (inlineLabels) {
      builder.inlineSection("Summary", summary, labelColumn);
    } else {
      builder.sectionHeading("Summary", builder.lineHeight(design.scale.body));
      builder.block(summary, { size: design.scale.body });
    }
  }

  const skillLines = resume.skills
    .filter((group) => group.items.length > 0)
    .map((group) => `${group.category}: ${group.items.join(", ")}`);

  if (skillLines.length > 0) {
    if (inlineLabels) {
      builder.inlineSection(
        "Skills",
        skillLines.join(design.contactSeparator),
        labelColumn,
      );
    } else {
      builder.sectionHeading("Skills", builder.lineHeight(design.scale.body));

      skillLines.forEach((line, index) => {
        if (index > 0) {
          builder.advance(design.bulletGap);
        }

        builder.block(line, { size: design.scale.body });
      });
    }
  }

  if (resume.experience.length > 0) {
    builder.sectionHeading(
      "Experience",
      builder.lineHeight(design.scale.entryTitle),
    );

    resume.experience.forEach((entry, index) => {
      if (index > 0) {
        builder.advance(design.entryGap);
      }

      const dates = formatDateRange(entry.startDate, entry.endDate);
      const context = joinNonEmpty(
        [entry.company, entry.location],
        design.contactSeparator,
      );

      if (design.inlineEntryMeta) {
        builder.splitRow(
          joinNonEmpty([entry.title, context], design.contactSeparator),
          dates,
          {
            size: design.scale.entryTitle,
            role: "bold",
            rightSize: design.scale.dateRange,
          },
        );
      } else {
        builder.splitRow(entry.title, dates, {
          size: design.scale.entryTitle,
          role: "bold",
          rightSize: design.scale.dateRange,
        });

        if (context) {
          builder.block(context, {
            size: design.scale.entryMeta,
            role: design.metaItalic ? "italic" : "regular",
            color: MUTED,
          });
        }
      }

      builder.advance(design.bulletGap);

      for (const bullet of entry.bullets) {
        builder.bullet(bullet);
      }
    });
  }

  if (resume.projects.length > 0) {
    builder.sectionHeading(
      "Projects",
      builder.lineHeight(design.scale.entryTitle),
    );

    resume.projects.forEach((project, index) => {
      if (index > 0) {
        builder.advance(design.entryGap);
      }

      builder.block(project.name, {
        size: design.scale.entryTitle,
        role: "bold",
      });

      if (project.technologies.length > 0) {
        builder.block(project.technologies.join(", "), {
          size: design.scale.entryMeta,
          role: design.metaItalic ? "italic" : "regular",
          color: MUTED,
        });
      }

      builder.advance(design.bulletGap);

      for (const bullet of project.bullets) {
        builder.bullet(bullet);
      }
    });
  }

  if (resume.education.length > 0) {
    builder.sectionHeading(
      "Education",
      builder.lineHeight(design.scale.entryTitle),
    );

    resume.education.forEach((entry, index) => {
      if (index > 0) {
        builder.advance(design.entryGap * 0.7);
      }

      builder.splitRow(entry.qualification, entry.date ?? "", {
        size: design.scale.entryTitle,
        role: "bold",
        rightSize: design.scale.dateRange,
      });

      if (entry.institution) {
        builder.block(entry.institution, {
          size: design.scale.entryMeta,
          role: design.metaItalic ? "italic" : "regular",
          color: MUTED,
        });
      }
    });
  }

  if (resume.certifications.length > 0) {
    builder.sectionHeading(
      "Certifications",
      builder.lineHeight(design.scale.entryTitle),
    );

    resume.certifications.forEach((entry, index) => {
      if (index > 0) {
        builder.advance(design.entryGap * 0.6);
      }

      builder.splitRow(entry.name, entry.date ?? "", {
        size: design.scale.entryTitle,
        role: "bold",
        rightSize: design.scale.dateRange,
      });

      if (entry.issuer) {
        builder.block(entry.issuer, {
          size: design.scale.entryMeta,
          role: design.metaItalic ? "italic" : "regular",
          color: MUTED,
        });
      }
    });
  }

  for (const section of resume.additionalSections) {
    if (section.items.length === 0) {
      continue;
    }

    builder.sectionHeading(
      section.title,
      builder.lineHeight(design.scale.body),
    );

    for (const item of section.items) {
      builder.bullet(item);
    }
  }

  return builder.finish();
}
