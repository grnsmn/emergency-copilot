# Emergency Copilot

Helps a person collect their own health history so it's ready and readable in
an emergency. Upload health documents, extract key data, review it yourself,
and generate a personal Emergency Card.

## Product scope — read before contributing

This is a permanent product constraint, not a temporary MVP limitation. The
app must **never** include:

- an open chatbot over the user's health history
- free-form clinical Q&A
- diagnostic advice
- therapeutic advice
- automated triage

AI is used **only** for structured extraction from documents and short,
non-prescriptive summaries with source citations. The Emergency Card in the
MVP is for the patient only (no sharing, no clinician view).

## Stack

- Expo + React Native + TypeScript
- Expo Router (file-based routing, iOS / Android / Web)
- Supabase: Postgres, Auth (passwordless email OTP), Storage, Edge Functions
- i18n: i18next / react-i18next, IT + EN from day one

## Project structure

```
app/                      Expo Router routes
  _layout.tsx             Root layout (providers, Stack)
  index.tsx                Splash / session redirect
  auth.tsx                  Passwordless email sign-in (placeholder)
  home.tsx                  Home (placeholder)
  documents.tsx              Documents list (placeholder)
  emergency-card.tsx          Emergency Card, patient-only (placeholder)
components/ui/            Small reusable UI components
lib/                       Supabase client, i18n setup
locales/                    it.json, en.json
theme/                      Colors, spacing, typography tokens
supabase/
  migrations/               SQL schema + RLS
  functions/                Edge Functions (placeholders, no OCR/AI logic yet)
```

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run start
```

Then press `i` / `a` / `w` in the Expo CLI, or scan the QR code with Expo Go.

## Environment variables

| Variable                        | Where                  | Notes                            |
| ------------------------------- | ---------------------- | -------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | `.env`                 | Public, safe in client bundle    |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env`                 | Public, safe in client bundle    |
| Edge Function secrets (future)  | `supabase secrets set` | Never committed, never in `.env` |

## Backend (Supabase)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push          # applies supabase/migrations/*.sql
```

Schema (`supabase/migrations/0001_init.sql`), all owner-scoped via RLS:

| Table              | Purpose                                                       | Client can write         |
| ------------------ | ------------------------------------------------------------- | ------------------------ |
| `profiles`         | App user (1:1 with `auth.users`), locale                      | update own               |
| `patient_profiles` | The person on the Emergency Card (1 per user in MVP)          | update own               |
| `documents`        | Uploaded file metadata, status, OCR text                      | insert / delete own      |
| `extractions`      | Facts extracted from a document, with source page/excerpt     | review fields only       |
| `summaries`        | Short non-prescriptive summaries citing confirmed extractions | no (Edge Functions only) |
| `audit_events`     | Append-only log of sensitive actions                          | insert own               |

Files live in the private `documents` Storage bucket under
`<user_id>/<document_id>.<ext>`.

### Edge Functions

| Function                | Caller                          | Status                                  |
| ----------------------- | ------------------------------- | --------------------------------------- |
| `process-document`      | App (user JWT)                  | Ownership check + status, OCR is a TODO |
| `extract-medical-facts` | `process-document` (secret key) | Returns `501`, AI is a TODO             |

OCR (OCRmyPDF + Tesseract) needs native binaries, so it can't run in the
Edge Runtime. It will run as a small separate worker behind
`supabase/functions/_shared/ocr.ts`. The AI provider is swappable behind
`supabase/functions/_shared/ai.ts`. Both currently ship a
`NotImplemented*` adapter only.

```bash
npx supabase functions serve          # local
npx supabase functions deploy         # deploy all
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
```

## Contributing

### Branch naming

`<type>/<linear-issue-id>-<short-slug>`, e.g. `feat/EME-12-document-upload`,
`fix/EME-31-auth-redirect-loop`.

Types: `feat`, `fix`, `chore`, `refactor`, `docs`.

### Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), with the Linear
issue ID in the subject so Linear auto-links the commit:

```
feat(EME-12): add document upload screen
fix(EME-31): prevent redirect loop on expired session
```

### Linear

Team key: `EME`. The repo ships a `.linear.toml` (workspace + default team,
no secrets) for [linear-cli](https://github.com/schpet/linear-cli):

```bash
brew install schpet/tap/linear
linear auth login                 # personal API key, stored outside the repo
linear issue query --all-assignees
linear issue start EME-12         # creates the correctly named branch
```


1. Create a Linear team/project for Emergency Copilot.
2. In Linear → Settings → this team → connect the **GitHub** integration and
   link this repository.
3. Use the issue's identifier (e.g. `EME-12`) in branch names and commit
   subjects as shown above — Linear picks these up automatically and links
   the PR/commit to the issue, and moves the issue on merge if configured.
