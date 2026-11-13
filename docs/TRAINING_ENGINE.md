# Training Experience

## Study and Review

The curated study library contains 12 lessons, 36 explained questions and 20 glossary terms. Each lesson connects concepts, worked examples, common mistakes and a practice destination. Database-backed modules remain available on the dashboard, with question explanations editable through the content editor.

Lesson completion, quiz scores, concept results, saved hands, notes and table setups are stored locally in the browser, separated by authenticated user ID. They do not synchronize between devices. Clearing browser storage removes local progress. Server-backed content and authentication still use MariaDB and the Go API.

## Table Simulator

The no-limit Hold'em engine uses `pokersolver` for hand evaluation. Games support one to five AI opponents, 20-300 bb starting stacks and finite 5-50 hand sessions. Blinds are 0.5/1 bb; wager precision is half a big blind.

The engine handles heads-up action order, rotating buttons, the big blind option, full-raise reopening, short and cumulative all-in raises, side pots, uncalled refunds and split-pot odd chips. Opponents sample possible hands from ranges without inspecting other players' private cards. Their aggression, call margins and sizing depend on their profiles. Decisions and assumptions appear in the action history.

This is a probabilistic educational opponent, not a GTO solver or tournament ICM engine. Sampling ranges and aggression heuristics are models, not measured opponent statistics. Sessions track chip outcomes, not real-money winnings.

## Equity and EV

The Equity Lab accepts exact hole cards, a board and a 169-cell hand-class range. Selected classes expand to unblocked combinations. Custom ranges weight those combinations equally; built-in profiles use illustrative weights. Monte Carlo sampling supports 300, 1000 or 3000 trials and includes split-pot shares. Sampling margins describe numerical uncertainty, not confidence in the chosen range.

For a current pot P that includes the opponent's wager, pending call C and showdown equity E:

```text
Required equity = C / (P + C)
Call EV = E * (P + C) - C
Bet EV = F * P + (1 - F) * [E * (P + B + V) - B]
```

B is the hero's additional investment, V is the opponent's additional call and F is an assumed fold frequency. The table coach excludes inaccessible contribution layers when pricing short-stack calls and constrains recommendations to legal actions. Side-pot layers currently share one estimated equity; raising uses a simplified one-caller model. Future wagers, rake, equity realization and ICM are excluded from immediate EV.

Equity calculations and AI turns run in a Web Worker. Pages are lazy-loaded; lightweight formatting helpers do not import the evaluator.

## Verification

UI primitives, self-hosted fonts and the responsive arena are described in `DESIGN_SYSTEM.md`. Complete API/Newman instructions are in `API_TESTING.md`. The updated report is `docs/PokerLearn_ataskaita.docx`; public deployment remains an external acceptance task.

```powershell
cd frontend
npm test
npm run lint
npm run build
cd ../backend
go test ./...
```

The optional read-only `TestSeedContentIntegration` requires `POKER_INTEGRATION_DSN` pointing to an upgraded development seed database. It verifies authored explanations and scenario price corrections; ordinary Go tests skip it.

`scripts/browser-smoke.cjs` exercises browser flows with mocked content/authentication responses and real workers. It checks 60 page/viewport combinations from 320 to 1440 pixels, quiz retries, account-separated progress, saved table launch, all-in settlement and mobile navigation. Playwright and a Chromium-compatible browser are required; its executable path is currently Windows Edge. It does not replace live API integration tests or production Lighthouse measurements. Run `npm run test:browser` in `frontend`; screenshots/logs under `outputs/` are ignored by Git.

`scripts/browser-criteria.cjs` additionally exercises all three editor CRUD/detail flows, the admin role action, dialog keyboard behavior and 20 table layouts. The table checks reject overlap between seats, the hero and the board as well as horizontal document overflow.
