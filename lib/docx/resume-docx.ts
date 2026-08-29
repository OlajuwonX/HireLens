import "server-only";

import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
  type ILevelsOptions,
  type IStylesOptions,
} from "docx";
import {
  readResumeDesignSelection,
  resolveResumeDesign,
  type ResolvedResumeDesign,
  type ResumeDesignSelection,
} from "@/lib/resume-design";
import {
  formatDateRange,
  joinNonEmpty,
  sanitizePdfText,
} from "@/lib/pdf/text-layout";

const PAGE_WIDTH_TWIPS = 12240;
const PAGE_HEIGHT_TWIPS = 15840;
const POINTS_TO_TWIPS = 20;

function pt(value: number) {
  return Math.round(value * POINTS_TO_TWIPS);
}

function halfPoints(value: number) {
  return Math.round(value * 2);
}

function hex(value: string) {
  return value.replace("#", "").toUpperCase();
}

function isLink(value: string) {
  return (
    /^(https?:\/\/|www\.)/i.test(value) || /^[\w.-]+\.[a-z]{2,}\//i.test(value)
  );
}

function linkHref(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function fontName(design: ResolvedResumeDesign) {
  switch (design.selection.typography) {
    case "SOURCE_SANS_3":
      return "Source Sans 3";
    case "SOURCE_SERIF_4":
      return "Source Serif 4";
    default:
      return "Inter";
  }
}

type RunOptions = {
  bold?: boolean;
  italics?: boolean;
  size: number;
  color?: string;
  allCaps?: boolean;
  characterSpacing?: number;
};

function run(design: ResolvedResumeDesign, text: string, options: RunOptions) {
  return new TextRun({
    text: sanitizePdfText(text, { trim: false }),
    bold: options.bold,
    italics: options.italics,
    size: halfPoints(options.size),
    color: hex(options.color ?? "#161A18"),
    font: fontName(design),
    allCaps: options.allCaps,
    characterSpacing: options.characterSpacing,
  });
}

function contactParagraph(
  design: ResolvedResumeDesign,
  resume: ImprovedResume,
) {
  const parts = [
    resume.header.email,
    resume.header.phone,
    resume.header.location,
    ...resume.header.links,
  ].filter((part): part is string => Boolean(part && part.trim()));

  if (parts.length === 0) {
    return null;
  }

  const children: (TextRun | ExternalHyperlink)[] = [];

  parts.forEach((part, index) => {
    if (index > 0) {
      children.push(
        run(design, design.contactSeparator, {
          size: design.scale.contact,
          color: "#5B625E",
        }),
      );
    }

    const clean = sanitizePdfText(part);

    if (isLink(clean)) {
      children.push(
        new ExternalHyperlink({
          link: linkHref(clean),
          children: [
            new TextRun({
              text: clean,
              size: halfPoints(design.scale.contact),
              color: hex(design.accent ?? "#2C5FA8"),
              font: fontName(design),
              underline: {},
            }),
          ],
        }),
      );
      return;
    }

    children.push(
      run(design, clean, {
        size: design.scale.contact,
        color: "#5B625E",
      }),
    );
  });

  return new Paragraph({
    children,
    alignment:
      design.headerAlign === "center"
        ? AlignmentType.CENTER
        : AlignmentType.LEFT,
    spacing: { after: pt(design.headerGap) },
  });
}

function sectionHeading(design: ResolvedResumeDesign, label: string) {
  return new Paragraph({
    children: [
      run(design, label, {
        size: design.scale.sectionLabel,
        bold: design.sectionLabelBold,
        color: design.accent ?? "#5B625E",
        allCaps: design.sectionLabelCase === "upper",
        characterSpacing: design.sectionLabelTracking
          ? Math.round(
              design.sectionLabelTracking * design.scale.sectionLabel * 20,
            )
          : undefined,
      }),
    ],
    spacing: {
      before: pt(design.sectionGap),
      after: pt(design.sectionRule ? design.sectionRule.gapBelow : 4),
    },
    border: design.sectionRule
      ? {
          bottom: {
            style: BorderStyle.SINGLE,
            size: Math.max(2, Math.round(design.sectionRule.thickness * 8)),
            color: hex(design.sectionRule.color),
            space: 2,
          },
        }
      : undefined,
  });
}

function entryRow(
  design: ResolvedResumeDesign,
  left: string,
  right: string,
  rightTab: number,
) {
  const children = [
    run(design, left, { size: design.scale.entryTitle, bold: true }),
  ];

  if (right) {
    children.push(
      new TextRun({ text: "\t", size: halfPoints(design.scale.dateRange) }),
      run(design, right, {
        size: design.scale.dateRange,
        color: "#5B625E",
      }),
    );
  }

  return new Paragraph({
    children,
    tabStops: right
      ? [{ type: TabStopType.RIGHT, position: rightTab }]
      : undefined,
    spacing: { before: pt(design.entryGap * 0.5) },
  });
}

function metaParagraph(design: ResolvedResumeDesign, text: string) {
  return new Paragraph({
    children: [
      run(design, text, {
        size: design.scale.entryMeta,
        italics: design.metaItalic,
        color: "#5B625E",
      }),
    ],
  });
}

function bulletParagraph(design: ResolvedResumeDesign, text: string) {
  return new Paragraph({
    children: [run(design, text, { size: design.scale.body })],
    numbering: { reference: "resume-bullets", level: 0 },
    spacing: { after: pt(design.bulletGap) },
  });
}

function bodyParagraph(design: ResolvedResumeDesign, text: string) {
  return new Paragraph({
    children: [run(design, text, { size: design.scale.body })],
    spacing: { after: pt(design.bulletGap) },
  });
}

const bulletLevels: ILevelsOptions[] = [
  {
    level: 0,
    format: "bullet",
    text: "•",
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 360, hanging: 220 },
      },
    },
  },
];

function documentStyles(design: ResolvedResumeDesign): IStylesOptions {
  return {
    default: {
      document: {
        run: {
          font: fontName(design),
          size: halfPoints(design.scale.body),
          color: hex("#161A18"),
        },
        paragraph: {
          spacing: {
            line: Math.round(design.leading * 240),
            lineRule: "auto",
          },
        },
      },
    },
  };
}

export async function renderImprovedResumeDocx(
  resume: ImprovedResume,
  selection?: Partial<ResumeDesignSelection>,
): Promise<Uint8Array> {
  const design = resolveResumeDesign(readResumeDesignSelection(selection));
  const rightTab =
    PAGE_WIDTH_TWIPS - pt(design.margin.left) - pt(design.margin.right);
  const children: Paragraph[] = [];
  const centered =
    design.headerAlign === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;

  children.push(
    new Paragraph({
      children: [
        run(design, resume.header.name, {
          size: design.scale.name,
          bold: true,
        }),
      ],
      alignment: centered,
    }),
  );

  if (resume.header.headline) {
    children.push(
      new Paragraph({
        children: [
          run(design, resume.header.headline, {
            size: design.scale.headline,
            italics: design.metaItalic,
            color: design.accent ?? "#5B625E",
          }),
        ],
        alignment: centered,
      }),
    );
  }

  const contact = contactParagraph(design, resume);

  if (contact) {
    children.push(contact);
  }

  if (resume.professionalSummary) {
    children.push(sectionHeading(design, "Summary"));
    children.push(bodyParagraph(design, resume.professionalSummary));
  }

  const skillGroups = resume.skills.filter((group) => group.items.length > 0);

  if (skillGroups.length > 0) {
    children.push(sectionHeading(design, "Skills"));

    for (const group of skillGroups) {
      children.push(
        new Paragraph({
          children: [
            run(design, `${group.category}: `, {
              size: design.scale.body,
              bold: true,
            }),
            run(design, group.items.join(", "), { size: design.scale.body }),
          ],
          spacing: { after: pt(design.bulletGap) },
        }),
      );
    }
  }

  if (resume.experience.length > 0) {
    children.push(sectionHeading(design, "Experience"));

    for (const entry of resume.experience) {
      children.push(
        entryRow(
          design,
          entry.title,
          formatDateRange(entry.startDate, entry.endDate),
          rightTab,
        ),
      );

      const context = joinNonEmpty(
        [entry.company, entry.location],
        design.contactSeparator,
      );

      if (context) {
        children.push(metaParagraph(design, context));
      }

      for (const bullet of entry.bullets) {
        children.push(bulletParagraph(design, bullet));
      }
    }
  }

  if (resume.projects.length > 0) {
    children.push(sectionHeading(design, "Projects"));

    for (const project of resume.projects) {
      children.push(entryRow(design, project.name, "", rightTab));

      if (project.technologies.length > 0) {
        children.push(metaParagraph(design, project.technologies.join(", ")));
      }

      for (const bullet of project.bullets) {
        children.push(bulletParagraph(design, bullet));
      }
    }
  }

  if (resume.education.length > 0) {
    children.push(sectionHeading(design, "Education"));

    for (const entry of resume.education) {
      children.push(
        entryRow(design, entry.qualification, entry.date ?? "", rightTab),
      );

      if (entry.institution) {
        children.push(metaParagraph(design, entry.institution));
      }
    }
  }

  if (resume.certifications.length > 0) {
    children.push(sectionHeading(design, "Certifications"));

    for (const entry of resume.certifications) {
      children.push(entryRow(design, entry.name, entry.date ?? "", rightTab));

      if (entry.issuer) {
        children.push(metaParagraph(design, entry.issuer));
      }
    }
  }

  for (const section of resume.additionalSections) {
    if (section.items.length === 0) {
      continue;
    }

    children.push(sectionHeading(design, section.title));

    for (const item of section.items) {
      children.push(bulletParagraph(design, item));
    }
  }

  const doc = new Document({
    title: `${sanitizePdfText(resume.header.name)} - Resume`,
    creator: "HireLens",
    description: "Resume generated by HireLens",
    styles: documentStyles(design),
    numbering: {
      config: [{ reference: "resume-bullets", levels: bulletLevels }],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_TWIPS, height: PAGE_HEIGHT_TWIPS },
            margin: {
              top: pt(design.margin.top),
              right: pt(design.margin.right),
              bottom: pt(design.margin.bottom),
              left: pt(design.margin.left),
            },
          },
        },
        children,
      },
    ],
  });

  return new Uint8Array(await Packer.toBuffer(doc));
}
