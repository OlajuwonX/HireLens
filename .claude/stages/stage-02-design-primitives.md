# Stage 02: Design And UI Primitives

Goal: create the reusable UI, layout, and data-display primitives that will guide the product.

Implement:

- `components/ui/*` primitives from `.claude/primitives/ui-primitives.md`.
- `components/layout/*` primitives.
- `components/data-display/*` primitives.
- Shared class utilities.
- Accessible loading, empty, error, alert, toast, and progress states.
- Mobile-first layout primitives.

Rules:

- Separate each primitive into its own file.
- Keep primitives unopinionated and reusable.
- Use accessible Radix/shadcn-style patterns where appropriate.
- Avoid product-specific business logic in primitives.

Validation:

- Typecheck passes.
- Primitive examples or minimal smoke usage compile.
- Keyboard/focus behavior works for interactive primitives.

Suggested commit message:

```text
feat: add ui and layout primitives
```
