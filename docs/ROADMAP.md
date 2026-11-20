# Development roadmap

A phased plan for taking the app from the current setup (Home cost summary and healthcare-visit
flow on a mock EmPOWER client) to something ready for a clinical study.

**Assumptions**

- One developer, about **4.5 hours a week**. Week 1 is the week of 23 November 2026.
- Estimates are for focused hours and include tests, lint/type fixes and opening a PR. They are
  rough: treat them as ±30%, and expect the first task of any new kind (first native module,
  first EAS build) to run long.
- Most tasks are sized to fit in one week, so each week ends with one merged PR. If a task runs
  past 1.5× its estimate, stop, split what's left into a new task, and merge what works.
- Work that is blocked on EmPOWER or on study decisions comes later in the plan. Everything in
  Phases 0–2 can go ahead with what we have today.

## At a glance

| Phase                                  | Hours    | Weeks (at 4.5 h) | Blocked by                         |
| -------------------------------------- | -------- | ---------------- | ---------------------------------- |
| 0. Get comfortable with the codebase   | 4.5      | 1                | Nothing                            |
| 1. Finish the prototype's flows (mock) | 52       | ~12              | Nothing (some study decisions)     |
| 2. Development build and device work   | 24       | ~5               | Phone for testing; Apple account   |
| 3. Connect to EmPOWER                  | 28 (+16) | ~6 (+4)          | **EmPOWER API docs and a sandbox** |
| 4. Features that need study decisions  | 22       | ~5               | PI/study team decisions; ethics    |
| 5. Get ready for the study             | 30       | ~7               | Store accounts; ethics approval    |
| **Total**                              | **~160** | **~36**          |                                    |

With a 20% buffer and a two-week break over the holidays, that is roughly **45 weeks, finishing
around October 2027**. The bracketed numbers in Phase 3 are optional work (offline sync,
server push) that depend on EmPOWER's answers.

**If the study needs to start sooner**, the smallest study-ready version is Phases 0, 1 and 3,
local reminders (2.1–2.2) and Phase 5: about 127 hours, or **around June 2027 (August with the 20% buffer)**. That leaves out
location-based visit detection, the detected-visit flow and the cost-history chart, which are the
largest and riskiest items, and could follow in a later app update.

## Phase 0 — Get comfortable with the codebase (week 1, 4.5 h)

| #   | Task                                                                                                                  | Hours |
| --- | --------------------------------------------------------------------------------------------------------------------- | ----- |
| 0.1 | Run the app in the browser and on your phone with Expo Go                                                             | 1     |
| 0.2 | Follow one visit end to end: `src/app/visit/` → `visit-form.tsx` → `domain/visit.ts` → `api/visits.tsx` → mock client | 1.5   |
| 0.3 | Send the EmPOWER and study-team questions below, so answers arrive while Phase 1 is under way                         | 0.5   |
| 0.4 | First small PR: delete a visit from Home (the client already has `deleteVisit`), with a test                          | 1.5   |

**Done when:** you have merged one PR through CI and the questions are sent.

## Phase 1 — Finish the prototype's flows on the mock (weeks 2–13, ~52 h)

Brings the app to parity with `prototype/` so patient partners can review a real build. Port
behaviour from the prototype, but keep the rules in `AGENTS.md`: questions start unanswered,
follow-ups only after Yes, an empty cost is "not answered", never zero.

| #    | Task                                                                                                                                | Hours | Depends on |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------- |
| 1.1  | Assistance-hours questions on the expenses step (schema, form, tests)                                                               | 3     | 0          |
| 1.2  | Calendar date picker instead of typed YYYY-MM-DD, working on iOS, Android and web                                                   | 5     | 0          |
| 1.3  | Medication records: Zod schema, rules and tests; add medication methods to `EmpowerClient` and the mock                             | 4     | 0          |
| 1.4  | New-medication flow: name suggestions, details, review, confirmation                                                                | 7     | 1.2, 1.3   |
| 1.5  | Refill flow, linked to a saved medication                                                                                           | 4     | 1.4        |
| 1.6  | Label photo: take or choose a photo with a local preview only (`expo-image-picker`; nothing uploaded yet)                           | 3     | 1.4        |
| 1.7  | Costs screen: list, view, edit and delete entries; Home summary includes medications                                                | 5     | 1.4        |
| 1.8  | Questionnaire foundation: steps and questions defined as data, conditional follow-ups, Zod validation, drafts kept between steps    | 6     | 0          |
| 1.9  | Initial questionnaire (prototype intake 1.0–1.3), including medication entry from inside it                                         | 4     | 1.4, 1.8   |
| 1.10 | Three-month check-in (prototype 2.0–2.6)                                                                                            | 4     | 1.8        |
| 1.11 | Home reminder cards: questionnaire due (Start/Continue), and "record your visit" on a test/procedure appointment day                | 4     | 1.9, 1.10  |
| 1.12 | Review build: share the CI web build with patient partners, check small screens (320 px) and screen-reader labels, fix what's found | 3     | 1.11       |

**Milestone M1 (about early March 2027):** every prototype flow works on the mock, and there
is a web build patient partners can open without installing anything.

## Phase 2 — Development build and on-device features (weeks 14–19, ~24 h)

Expo Go can't run background location, and reminders are much easier to test in a development
build, so this phase sets one up. None of it needs EmPOWER.

| #   | Task                                                                                                                                                                     | Hours | Depends on |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ---------- |
| 2.1 | EAS account and `development` build profile; install a development build on your phone                                                                                   | 4     | 0          |
| 2.2 | Local reminders (`expo-notifications`): permission prompt, questionnaire reminders from the enrolment date, appointment-day reminders, cancel when the task is done      | 8     | 1.11, 2.1  |
| 2.3 | Visit-detection spike, time-boxed: geofence 2–3 test places on your own phone (`expo-location` + `expo-task-manager`); write up permissions, battery and platform limits | 6     | 2.1        |
| 2.4 | Detected-visit confirmation flow on mock detections (prototype `detected-visits.js`): confirm, dismiss, or "this wasn't a visit"                                         | 6     | 1.7        |

The spike (2.3) is there to learn early whether detection is practical before committing ~14
hours to it. One known constraint: iOS lets an app watch at most 20 regions at once (Android
allows 100), so the real feature has to rotate to the nearest facilities.

**Milestone M2:** reminders fire on a real phone, and there is a written go/no-go on visit
detection.

## Phase 3 — Connect to EmPOWER (~28 h, plus up to 16 h optional)

**Blocked until EmPOWER's API documentation and a test environment are available.** All the
screens already go through `EmpowerClient`, so this phase should only touch `src/api/` and the
sign-in screens. If the docs arrive early, this phase can move ahead of Phase 2.

| #   | Task                                                                                                                                                                                 | Hours | Depends on |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ---------- |
| 3.1 | Map EmPOWER's API onto `EmpowerClient`, adjust `types.ts`, and write contract tests against their test environment                                                                   | 4     | docs       |
| 3.2 | Sign-in: redirect sign-in with `expo-auth-session` or a credentials form (whichever EmPOWER uses), token in `expo-secure-store`, expiry and refresh, sign-out, signed-out navigation | 8     | 3.1        |
| 3.3 | Real HTTP client for visits, medications and questionnaires, with loading, error and retry states in the UI                                                                          | 8     | 3.1, 1.10  |
| 3.4 | Upload label photos to EmPOWER                                                                                                                                                       | 4     | 3.3, 1.6   |
| 3.5 | Test and production EmPOWER URLs through EAS environment variables                                                                                                                   | 2     | 2.1, 3.1   |
| 3.6 | Version stored records so later question changes don't break older entries                                                                                                           | 2     | 3.3        |
| 3.7 | _Optional, if the app must work offline:_ queue entries on the device and sync later                                                                                                 | 12    | 3.3        |
| 3.8 | _Optional, if EmPOWER sends push notifications:_ register the device's push token                                                                                                    | 4     | 2.2, 3.2   |

**Milestone M3:** a test participant can sign in, record entries, sign out and back in, and see
their entries again.

## Phase 4 — Features that need study decisions (~22 h)

| #   | Task                                                                                                                                                                                           | Hours | Depends on                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------- |
| 4.1 | Location-based visit detection: facility coordinates, nearest-20 rotation, minimum time on site, opt-in and opt-out, handling of wrong or missed detections, feeding the 2.4 confirmation flow | 14    | 2.3 go, 2.4, ethics answer |
| 4.2 | Cost history over time (chart), with the agreed categories and periods                                                                                                                         | 6     | 1.7, PI decision           |
| 4.3 | Replace the knee-replacement placeholder questions with the study's own                                                                                                                        | 2     | PI decision                |

**Slot in when decided:** the cost rules (what counts as a reportable cost, whose expenses and
time, before or after reimbursement, double counting, zero vs unknown vs not applicable) and the
pharmacy question scope. They change the Zod schemas in `src/domain/` and their tests; budget 2–6
hours depending on the answers, and do them as soon as they're known, because every later phase
builds on those schemas.

## Phase 5 — Get ready for the study (~30 h)

| #   | Task                                                                                                                                             | Hours | Depends on    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------------- |
| 5.1 | Privacy and security pass: no participant data in logs or crash reports, what stays on the phone after sign-out, screenshots in the app switcher | 4     | 3.3           |
| 5.2 | Accessibility: VoiceOver and TalkBack, large text, contrast, touch targets                                                                       | 5     | 1.12          |
| 5.3 | First-run screens: welcome, consent and privacy text, help and study contact                                                                     | 4     | text from PI  |
| 5.4 | Distribution with `eas build` and `eas submit`: TestFlight and Google Play internal testing, store privacy forms                                 | 6     | 2.1, accounts |
| 5.5 | Pilot with patient partners or test participants on their own phones; collect and sort feedback                                                  | 3     | 5.4           |
| 5.6 | Fix pilot feedback (buffer)                                                                                                                      | 8     | 5.5           |

**Milestone M4:** study build available through TestFlight and Google Play testing, piloted, with
feedback addressed.

## Dependencies on others

| Who                     | What                                                                   | Blocks                 | Needed by (approx.)  |
| ----------------------- | ---------------------------------------------------------------------- | ---------------------- | -------------------- |
| EmPOWER                 | API documentation, a test environment, and test participant accounts   | Phase 3                | March 2027           |
| EmPOWER                 | Sign-in method, push support, photo upload, location data, offline     | 3.2, 3.4, 3.7–3.8, 4.1 | March 2027           |
| PI / study team         | Cost rules and pharmacy question scope                                 | Domain schemas         | As early as possible |
| PI / study team         | Replacement for the knee-replacement questions; questionnaire options  | 4.3, 1.9–1.10          | February 2027        |
| PI / study team         | Study schedule: when questionnaires and reminders are due              | 2.2                    | March 2027           |
| PI / study team         | Cost-history categories and periods; medication details to collect     | 4.2, 1.4               | 1.4: December 2026   |
| Ethics / privacy office | Whether location tracking is acceptable, and the consent wording       | 4.1, 5.3               | May 2027             |
| Institution             | Apple Developer and Google Play accounts (whose name the app is under) | 2.1 (iOS), 5.4         | March 2027           |

## Questions to send

**To EmPOWER**

1. How do participants sign in: a redirect (OAuth/OpenID Connect), username and password, or
   something else? Is there a test environment and test accounts?
2. What does the API look like for saving and reading a participant's records? Is there a
   schema we fit into, or can we store our own JSON?
3. Can EmPOWER send reminders or push notifications, or should the app schedule them itself?
4. Does it accept file uploads (medication label photos)? Size limits, formats, retention?
5. Is it acceptable to send location-derived data (for example "possible visit at hospital X")?
6. Does the app need to work offline and sync later, or can we require a connection to save?
7. Where is data stored, and what privacy rules (for example PHIPA) apply to the app's side?

**To the PI / study team**: the "Dependencies on others" rows above, plus whether participants
use their own phones, and which platforms (iOS, Android, or both) the study must support.

## Jira

Every task is a story under the **Healthcare Cost App** epic
([MSKIF-3](https://uwo-mskif.atlassian.net/browse/MSKIF-3)), titled `HCA <task #>: …` with its
estimate in the title. Labels: `healthcare-cost-app` on all of them, `hca-phase-0` to
`hca-phase-5` by phase, `hca-blocked-empower` / `hca-blocked-decision` where they wait on others,
and `hca-optional` for 3.7 and 3.8. The cost-rules "slot in when decided" item is story 4.4.

| Phase                  | Jira keys                                                                   |
| ---------------------- | --------------------------------------------------------------------------- |
| 0                      | MSKIF-102 to MSKIF-105 (tasks 0.1–0.4)                                      |
| 1                      | MSKIF-106 to MSKIF-117 (tasks 1.1–1.12)                                     |
| 2                      | MSKIF-118 to MSKIF-121 (tasks 2.1–2.4)                                      |
| 3                      | MSKIF-122 to MSKIF-129 (tasks 3.1–3.8)                                      |
| 4                      | MSKIF-130 to MSKIF-133 (tasks 4.1–4.3, and 4.4 cost rules)                  |
| 5                      | MSKIF-134 to MSKIF-139 (tasks 5.1–5.6)                                      |
| Dependencies on others | MSKIF-140 to MSKIF-146 (tasks titled `HCA needed: …`, label `hca-external`) |

Useful filter: `parent = MSKIF-3 AND labels = healthcare-cost-app ORDER BY key`.

## Keeping this plan up to date

Jira is where progress is tracked. Re-estimate the remaining work at each milestone, and update
this file when tasks are added, split or dropped, so the two stay in step.
