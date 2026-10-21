# Authentication

## Scope

This feature implements sign-in, authenticated profile retrieval, browser
session handling, protected navigation, and sign-out. The test account is
`johndoe` with password `susiairtest`, as specified in the recruitment brief.
It is a deliberately public demonstration account, not a production credential.

The dashboard, documents, flight-hour summaries, and schedule are separate
features. The authenticated landing screen currently displays the seeded
pilot profile. Its avatar is a neutral local placeholder. Brand artwork and
local typography are described in the interface guide.

## API boundary

| Endpoint | Behavior |
| --- | --- |
| Nest `GET /health` | Minimal public deployment health response |
| Nest `POST /auth/login` | Validates credentials and returns a bearer token |
| Nest `GET /pilot/me` | Returns the seeded profile after token verification |
| Nuxt `POST /api/auth/login` | Exchanges credentials and sets the HttpOnly cookie |
| Nuxt `GET /api/auth/session` | Forwards the cookie token privately to Nest |
| Nuxt `POST /api/auth/logout` | Clears the browser session cookie |

The Nest login endpoint and minimal deployment health endpoint are marked
public. A global guard protects every registered pilot-data endpoint. The
starter welcome endpoint has been removed.
DTO validation rejects unknown properties, non-string fields, and excessive
credential lengths. A global exception filter gives errors the shape:

```json
{
  "statusCode": 401,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Please sign in to continue."
  },
  "path": "/pilot/me"
}
```

The password comparison uses an asynchronous scrypt derivation and a
constant-time hash comparison, including for unknown usernames. Login permits
five attempts per minute per peer IP. Forwarded client-IP headers are not
trusted. The in-memory limiter is suitable for this single-instance test;
multiple backend replicas would need shared rate-limit storage and an explicit
trusted-proxy policy.

## Tokens and the business clock

Tokens use HS256, a fixed issuer and audience, the expected pilot identity,
and a 30-minute expiry. Verification rejects alternate algorithms, foreign
identities, invalid signatures, and expired tokens. Security expiry uses actual
wall-clock time, while the application's business date remains `2026-05-15`.

`JWT_SECRET` is required in production and must contain at least 32 characters
after trimming. Generate it with `openssl rand -hex 32` and configure it in the
hosting provider. A missing development secret is generated per process; a
backend restart therefore invalidates development sessions.

## Browser session

Nuxt stores the token in a host-only `pilot_session` cookie with HttpOnly,
SameSite=Strict, Path=/, and a matching 30-minute lifetime. Secure is enabled
for HTTPS. Production configuration rejects an HTTP application origin except
for loopback addresses used by local production tests.

Set `NUXT_APP_ORIGIN` to the exact public frontend origin, such as
`https://pilot.example.com`. Login and logout require a matching Origin header;
login also requires JSON. `NUXT_API_BASE` is private server configuration.
The browser never receives a token in the login JSON, Pinia state, SSR payload,
or browser storage. Both applications mark authentication responses private
and non-cacheable.

The SSR sign-in form uses POST and keeps its fields and buttons disabled until
client mounting completes. This prevents an early native form submission from
putting credentials in a GET query string. Controls also remain disabled while
a sign-in request is pending. With JavaScript disabled, the form stays disabled
and visibly explains the requirement. The API still accepts only same-origin
JSON login requests.

The adapter calls fixed backend paths with a five-second timeout and no
automatic retries. Backend 401 responses clear the cookie. Transport faults
and 5xx responses preserve it, return a safe 503 message, and omit internal
diagnostics. SSR forwards cookie-deletion headers to the browser before
redirecting an invalid session.

Pinia contains profile data only. Store instances are scoped to each Nuxt
application/request. Session reads coalesce while in flight, and an earlier
response cannot repopulate state after sign-in or sign-out. Navigation checks
the backend session; initial hydration reuses the server-verified profile
instead of fetching it twice. Sensitive pages use `Cache-Control: private,
no-store`.

The sign-in route is guest-only. A valid session redirects `/login` to Home
before the form renders, including direct requests and browser-back navigation.
The guard uses the named login route, including trailing-slash and case variants.
The middleware validates the session rather than trusting an existing client
profile or the mere presence of a cookie. Rejected sessions can still open the
form, with cookie cleanup forwarded during SSR. A session-validation outage
returns the existing safe service error and preserves the cookie. The login
response is private and non-cacheable and varies by Cookie.

The standalone error screen deliberately uses a native "Back to Home" link.
Nuxt's default error recovery could navigate to Home while the error guard was
still active, leaving the new client session store empty and the dashboard
hidden. A fresh document runs normal SSR session validation again. Valid sessions
receive the complete dashboard; missing, expired, or invalid sessions return to
sign-in. The error screen never includes protected workspace navigation.

Sign-out clears the browser cookie and client profile. It does not revoke a
previously copied bearer token, which remains valid until expiry. Immediate
server-side revocation, refresh-token rotation, and real account management
are outside this one-account, no-database test and would be needed according
to production requirements.

## Verification

`npm run check` runs both application checks, Nest unit/HTTP tests, production
builds, production HTTP smoke checks, and native Node tests of adapter failure
boundaries. To run the real-browser journeys after building both applications:

```sh
cd nuxt
npx --no-install playwright install chromium
cd ..
npm run test:e2e
```

The browser suite starts its own production servers on ports 4310 and 4311.
The workspace and error-recovery projects run in separate invocations with fresh
servers, retaining production rate limits without exhausting a shared quota.
It exercises disabled JavaScript, delayed hydration, bad credentials, repeated
submit events, private cookie behavior, cross-origin writes, SSR reload and
cookie cleanup, session isolation, guest-only login redirects, browser-back
navigation, expired sessions, error-page recovery with and without JavaScript,
sessions removed during an error, and logout. Server adapter checks also cover
login redirects and session-validation outages. Test artifacts are ignored by
Git. GitHub Actions runs the same browser suite after both application jobs pass.
