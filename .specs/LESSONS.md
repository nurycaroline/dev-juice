# LESSONS — auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation — do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 — Payload size caps for webview messages must target string fields only; allow non-string protocol fields (numbers/booleans) so tool message contracts are not broken
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `webview/message-validation` · harmful: 0
- features: webview-architecture-unification
- evidence: src/panels/BaseWebviewPanel.ts:validateWebviewMessage (D1, ARCH-08 AC3) (webview/message-validation)
- last seen: 2026-07-09T14:28:36Z

### L-002 — Prevent error-driven HTML injection by routing all webview HTML through the shared template loader and reporting load failures via showErrorMessage, instead of sanitizing ad-hoc inline error-HTML fallbacks
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `webview/security` · harmful: 0
- features: webview-architecture-unification
- evidence: src/panels/tools/pixGeneratorPanel.ts (D2, ARCH-10 AC4) (webview/security)
- last seen: 2026-07-09T14:28:42Z

## Quarantined (failed when applied — ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
