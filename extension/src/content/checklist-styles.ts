export const panelStyles = `
:host { all: initial; }
.panel {
  position: fixed; top: 16px; right: 16px; z-index: 2147483646;
  width: 320px; max-height: min(70vh, 560px); display: flex; flex-direction: column;
  background: #121412; color: #eef0ec; border: 1px solid #2c312d; border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
}
.panel.collapsed .list { display: none; }
.head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #2c312d; }
.panel.collapsed .head { border-bottom: 0; }
.title { font-weight: 600; }
.count { flex: 1; color: #9aa39c; font: 11px/1.4 ui-monospace, Menlo, monospace; text-transform: uppercase; letter-spacing: 0.04em; }
.icon { width: 24px; height: 24px; border: 0; border-radius: 4px; background: transparent; color: #9aa39c; font: 16px/1 system-ui; cursor: pointer; }
.icon:hover { background: #1f2420; color: #eef0ec; }
.list { overflow-y: auto; padding: 4px; }
.row { display: flex; gap: 10px; width: 100%; padding: 8px; border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.row:hover { background: #1f2420; }
.row:focus-visible, .icon:focus-visible { outline: 2px solid #c5f85a; outline-offset: 1px; }
.dot { flex: none; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: #c5f85a; }
.text { display: grid; min-width: 0; }
.label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status { color: #9aa39c; font-size: 12px; }
.row.ai .dot { background: #60a5fa; }
.row.needs-you .dot { background: #f59e0b; }
.row.needs-you .status { color: #f5b544; }
.row.skipped .dot { background: transparent; border: 1px solid #5b635d; }
.row.already .dot, .row.you .dot { background: #7c877f; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;
