import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";

const FONT_DIR = "public/fonts";

const FAMILIES = {
  INTER: {
    slug: "inter",
    files: {
      regular: "inter-regular.ttf",
      bold: "inter-bold.ttf",
      italic: "inter-italic.ttf",
    },
  },
  SOURCE_SANS_3: {
    slug: "source-sans-3",
    files: {
      regular: "source-sans-3-regular.ttf",
      bold: "source-sans-3-bold.ttf",
      italic: "source-sans-3-italic.ttf",
    },
  },
  SOURCE_SERIF_4: {
    slug: "source-serif-4",
    files: {
      regular: "source-serif-4-regular.ttf",
      bold: "source-serif-4-bold.ttf",
      italic: "source-serif-4-italic.ttf",
    },
  },
};

const RANGES = [
  [0x20, 0x7e],
  [0xa1, 0x24f],
  [0x1e00, 0x1eff],
  [0x2010, 0x2015],
  [0x2018, 0x201d],
  [0x2022, 0x2022],
  [0x2026, 0x2026],
  [0x20ac, 0x20ac],
];

async function widthsFor(filename) {
  const bytes = new Uint8Array(
    await readFile(path.join(FONT_DIR, filename)),
  );
  const font = fontkit.create(bytes);
  const widths = {};

  for (const [lo, hi] of RANGES) {
    for (let codePoint = lo; codePoint <= hi; codePoint += 1) {
      try {
        const advance =
          font.glyphForCodePoint(codePoint).advanceWidth / font.unitsPerEm;

        widths[codePoint.toString(36)] = Math.round(advance * 100000) / 100000;
      } catch {
        continue;
      }
    }
  }

  return { widths, fallback: 0.5 };
}

let written = 0;

for (const [typography, family] of Object.entries(FAMILIES)) {
  const roles = {};

  for (const [role, filename] of Object.entries(family.files)) {
    roles[role] = await widthsFor(filename);
  }

  const target = path.join(FONT_DIR, `metrics-${family.slug}.json`);

  await writeFile(target, JSON.stringify({ typography, roles }));
  written += 1;

  const size = JSON.stringify({ typography, roles }).length;

  console.log(`${target}  ${(size / 1024).toFixed(0)}KB`);
}

console.log(`generated ${written} metrics files`);
