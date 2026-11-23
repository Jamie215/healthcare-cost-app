# Healthcare Cost App

A participant app for a clinical study. Participants record healthcare visits, medications,
related expenses and assistance received, plus an initial questionnaire and a three-month
check-in. Built with [Expo](https://expo.dev) (React Native + TypeScript) for iOS, Android and a
browser build for reviewers.

> **Use fictional information only.** The app currently runs on an in-memory mock of the
> EmPOWER backend. Nothing is saved or sent anywhere, and refreshing clears entries.

## Getting started

Requires Node.js 22.13 or later.

```bash
npm install
npm run web       # open in a browser
npm start         # Expo dev server; scan the QR code with Expo Go, or press i / a for simulators
```

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run lint`      | ESLint (`eslint-config-expo` + Prettier compat) |
| `npm run format`    | Format with Prettier (`format:check` in CI)     |
| `npm run typecheck` | TypeScript, strict mode                         |
| `npm test`          | Jest + React Native Testing Library             |
| `npm run build:web` | Static web build in `dist/`                     |

CI (`.github/workflows/ci.yml`) runs lint, format check, type check, tests and the web build on
every pull request, and uploads the web build as an artifact for review.

To add a package, use `npx expo install <package>` so its version matches the Expo SDK.

## Project layout

```
src/
  app/            Screens (Expo Router: every file is a route)
  components/     Shared UI: fields, buttons, screen layout, visit form
  api/
    empower/      EmPOWER client interface, in-memory mock, HTTP skeleton
    visits.tsx    Loads and saves the participant's visits
  domain/         Records, validation rules (Zod) and cost summary
  data/           Visit types, Ontario hospitals, medications, questionnaire options
  theme/          Design tokens from the prototype
prototype/        The original design prototype, unchanged (see below)
```

## Backend: EmPOWER

Participant sign-in and storage will be provided by **EmPOWER**. Screens never call it directly:
they use the `EmpowerClient` interface in `src/api/empower/types.ts`.

- With no configuration the app uses `createMockEmpowerClient()`, an in-memory stand-in that starts
  signed in as a demo participant.
- Setting `EXPO_PUBLIC_EMPOWER_API_URL` switches to `createHttpEmpowerClient()`. Its endpoint paths
  are **placeholders** until EmPOWER's API documentation is available. The URL may include a
  path, such as `https://example.org/api/v1`; endpoint paths are added after it.
- Money is saved as a whole number of cents (`amountCents: 1250` is $12.50), so totals are
  exact. If EmPOWER expects dollars, convert in the HTTP client, not in screens.
- Every reply from EmPOWER is checked against the schemas in `src/domain/visit.ts` before the
  app uses it. A saved visit the app can't read is left out, and Home says how many couldn't
  be shown; the record stays on the server. If EmPOWER's format differs from ours, convert it
  in the HTTP client before checking.

Open questions for EmPOWER: how sign-in works (OAuth/OpenID Connect redirect or credentials),
whether it can send reminders or push notifications, whether it accepts photo uploads and
location-derived visit data, and whether the app must work offline and sync later.

## The design prototype

`prototype/` holds the hand-off prototype as received (minus a hosting config file for another
tool): a browser-only mockup built from Figma SVG exports with HTML controls on top. Open
`prototype/index.html` in a browser to compare. Its `README.md` documents every design decision
and feedback round; `hospital-sources.md` and `hospital-maps-verification.md` document the
hospital list.

Carried over into the app so far:

- Visit categories and types, cost coverage, tests/procedures and expense types
- 51 Ontario hospitals with name/city/alias search, and the 25 medication suggestions
- Questionnaire option lists (employment, income)
- Colour, spacing and radius tokens, and the Inter font
- Home cost summary and recent entries, and the healthcare-visit flow with the prototype's rules:
  questions start unanswered, follow-ups appear only after Yes, all visible questions are
  required, pharmacy skips the paid-employment question, and an empty cost is "not answered",
  never zero

## Still to build

From the prototype:

- Medication and refill entry (with label photo preview)
- Assistance-hours questions on the expenses step
- Initial questionnaire and three-month check-in, with Home reminder cards
- Calendar date picker (dates are typed as YYYY-MM-DD for now)
- Detected-visit confirmation flow

Before study use (from the handoff document):

- Participant accounts and sign-in, and secure persistent storage (EmPOWER)
- Reminders on the study schedule (notifications)
- Location-based visit detection (needs a development build, not Expo Go)
- Medication label photo upload
- Cost history over time, once categories and periods are agreed

Study decisions still open: what counts as a reportable cost, whose expenses and time are
included, amounts before or after reimbursement, avoiding double counting, how to tell zero from
unknown or not applicable, replacing the knee-replacement placeholder questions, and the scope of
pharmacy visit questions.
