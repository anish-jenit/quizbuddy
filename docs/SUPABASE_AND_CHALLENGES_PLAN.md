# Supabase, Email Authentication, and Friend Challenges

## Recommended product decisions

- Keep guest play for public quizzes, but require an authenticated email account to create or accept a friend challenge.
- Use Supabase Auth email + password with email confirmation first. Magic-link or email OTP can be added later without changing the profile schema.
- Treat `player` as the product label while retaining a stable database role value such as `player`, `mentor`, or `admin`.
- Store a quiz version on every challenge so both players always receive the same questions even if a mentor edits the quiz later.
- Start with asynchronous challenges. Real-time head-to-head play adds clock synchronisation, disconnect recovery, and anti-cheat concerns and should be a later phase.

## Phase 1: Supabase foundation

1. Create development and production Supabase projects.
2. Add frontend environment variables for the project URL and publishable/anon key.
3. Keep the service-role key only in a trusted server or Supabase Edge Function; never expose it in React.
4. Create migrations for:
   - `profiles`: auth user ID, email, nickname, role, mentor approval status.
   - `genres`: the five core genres.
   - `groups` and `group_memberships`.
   - `quizzes`, `quiz_versions`, `questions`, and `question_options`.
   - `attempts` and `attempt_answers`.
   - `challenges` and `challenge_participants`.
5. Enable Row Level Security on every application table before exposing it to the browser.

## Phase 2: Email authentication

1. Replace the custom JWT login with Supabase Auth.
2. Registration collects first name, last name, optional nickname, email, and password.
3. Supabase sends an email-confirmation link. The callback route exchanges the session and creates/updates `profiles`.
4. Player accounts become active after email confirmation.
5. Mentor registrations create a player profile with `requested_role = mentor` and `approval_status = pending`; an admin approval promotes the role.
6. Password reset uses Supabase's recovery-email flow.
7. The frontend listens for auth state changes and removes the current local JWT store.

## Phase 3: Durable quiz and score migration

1. Import the current default question banks into `genres`, `quizzes`, `quiz_versions`, and `questions` through an idempotent seed migration.
2. Move CSV import to a protected server endpoint or Edge Function that validates all rows before a transaction inserts anything.
3. Public quizzes require `genre_id`; a database check/trigger prevents untagged public records.
4. Private quizzes may have no genre, but a visibility-changing function rejects publication until a genre is set.
5. Save every started attempt immediately and every answer as it is submitted.
6. Build leaderboard queries from completed attempts and the profile nickname, falling back to the player's name.
7. Retire demo in-memory state only after auth, quiz browsing, attempts, and leaderboards pass production smoke tests.

## Phase 4: Asynchronous friend challenges

### Challenge flow

1. An authenticated player opens a public quiz and selects **Challenge a Friend**.
2. They enter the friend's email and an optional message.
3. A trusted function:
   - verifies the quiz is public and active;
   - snapshots or references the current immutable quiz version;
   - creates a challenge with `pending` status and an expiry date;
   - stores the invited email in normalised form;
   - creates a cryptographically random invitation token and stores only its hash;
   - emails a link such as `/challenge/accept?token=...`.
4. The recipient signs in or registers using the invited email.
5. The accept function verifies token hash, expiry, email match, and challenge capacity before attaching the recipient profile.
6. Each participant gets one scored attempt against the same quiz version.
7. When both finish—or the challenge expires—the result page shows scores, completion times, winner, or tie.

### Suggested challenge fields

- `id`, `quiz_version_id`, `created_by`, `invited_email`, `invite_token_hash`.
- `status`: `pending`, `accepted`, `completed`, `expired`, `cancelled`.
- `expires_at`, `created_at`, `accepted_at`, `completed_at`.
- Participant rows contain `profile_id`, `attempt_id`, `score`, `duration_seconds`, and `finished_at`.

### Security rules

- Only the creator and accepted recipient can read a private challenge.
- Invitation acceptance must be performed server-side and locked transactionally to prevent token reuse.
- Never store raw invitation tokens.
- Rate-limit invitation creation by user and destination email.
- Do not reveal whether an email already has an account.
- Question answers remain hidden until an attempt is completed.

## Phase 5: Notifications and real-time enhancements

1. Send challenge invitations and completion notices from an Edge Function using a transactional email provider.
2. Use Supabase Realtime only for status updates such as **friend accepted** or **friend finished**.
3. Add in-app challenge inbox, rematch, cancellation, and expiration handling.
4. Consider synchronous play only after asynchronous challenges are stable.

## Delivery order

1. Supabase schema + RLS tests.
2. Email registration/login/reset + mentor approval.
3. Quiz/question migration and CSV import.
4. Durable attempts and leaderboards.
5. Challenge creation/acceptance/result flow.
6. Email delivery and Realtime status updates.
7. Production cutover and removal of the in-memory demo backend.

## Official references

- [Supabase password-based authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Realtime Postgres changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
