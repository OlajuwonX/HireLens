# UI Primitive Files

Create UI primitives as separate focused files. Do not bundle unrelated primitives into a single file.

Required `components/ui` primitives:

- `button.tsx`
- `input.tsx`
- `textarea.tsx`
- `select.tsx`
- `checkbox.tsx`
- `radio-group.tsx`
- `dialog.tsx`
- `sheet.tsx`
- `dropdown-menu.tsx`
- `tooltip.tsx`
- `tabs.tsx`
- `table.tsx`
- `card.tsx`
- `badge.tsx`
- `avatar.tsx`
- `skeleton.tsx`
- `separator.tsx`
- `progress.tsx`
- `alert.tsx`
- `toast.tsx`
- `empty-state.tsx`
- `error-state.tsx`
- `loading-state.tsx`
- `pagination.tsx`
- `search-input.tsx`
- `date-picker.tsx`
- `file-dropzone.tsx`
- `score-ring.tsx`
- `chart-container.tsx`
- `accessible-icon-button.tsx`

Required `components/layout` primitives:

- `app-shell.tsx`
- `dashboard-sidebar.tsx`
- `dashboard-header.tsx`
- `mobile-navigation.tsx`
- `page-header.tsx`
- `page-container.tsx`
- `section.tsx`
- `responsive-grid.tsx`
- `details-panel.tsx`

Required `components/data-display` primitives:

- `metric-card.tsx`
- `status-badge.tsx`
- `score-card.tsx`
- `data-table.tsx`
- `mobile-data-list.tsx`
- `timeline.tsx`
- `activity-item.tsx`
- `requirement-status.tsx`
- `usage-meter.tsx`

UI rules:

- Mobile-first from 320px upward.
- Use semantic HTML before ARIA.
- No browser `alert()`.
- Every async workflow needs loading, error, success, and retry states.
- Avoid heavy particle backgrounds, excessive gradients, huge rounded cards, and decorative motion.
- Productivity SaaS UI should be calm, dense enough for repeated use, and easy to scan.
