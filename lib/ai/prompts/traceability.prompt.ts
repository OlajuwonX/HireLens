export const TRACEABILITY_PROMPT = `TRACEABILITY:

When a <source_evidence> block is supplied, every line in it has a stable id such as S-001.

Return one traceability entry for every source id, recording what happened to that statement in the improved resume:

- KEEP: reproduced with at most cosmetic change
- REFINE: rewritten with its evidence intact
- MERGE: combined with other statements; list each merged id separately with action MERGE
- DROP: removed

reason may be empty for KEEP and REFINE. For MERGE and DROP, reason must say why.

Never omit a source id. A statement that silently disappears is an error.

When no <source_evidence> block is supplied, return an empty traceability array.`;
