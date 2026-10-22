# Connect Iwons to Judge0

MongoDB is configured locally. Judge0 is a separate code execution service;
MongoDB cannot compile or run Java. The app already proxies Judge0 through its
own APIs, so learners will not need to enter an endpoint or API key for the new
server exercise.

## Free hosted service (current configuration)

[OnlineCompiler.io](https://onlinecompiler.io/pricing) currently provides a free
plan with 10,000 executions per month, no credit card and no automatic overage
charges. Each test case counts as one execution; it is not unlimited. The free
plan allows 30 submissions per minute, eight pending cases, and two running at
once. Its [Judge0-compatible API](https://onlinecompiler.io/docs/judge0) lets us
retain the same server job and polling architecture.

The current local environment is configured with:

```dotenv
JUDGE0_PROVIDER=onlinecompiler
JUDGE0_URL=https://api.onlinecompiler.io/api/judge0
JUDGE0_AUTH_HEADER=X-Auth-Token
JUDGE0_AUTH_TOKEN=your-free-api-key
```

The actual key is saved only in ignored `.env.local`. The user chose free-only
hosting; RapidAPI entries have been removed from that file and no paid plan was
activated. To configure another environment, create a free account, create an
API key, choose a per-key monthly limit if wanted, and save the key server-side.
Never use a `NEXT_PUBLIC_*` credential.

The profile enforces eight cases per job and a MongoDB-backed account-wide
30-case-per-minute budget. Provider HTTP 429 stops new work gracefully rather
than upgrading the plan. Its sandbox disables networking; its compatibility
API rejects even `enable_network=false`, so that field is omitted only for the
validated official endpoint. The service fixes memory at 512 MB and ignores
some CE resource overrides. Java/Python syntax failures may be reported as NZEC
with stderr rather than CE's Compilation Error; this remains a provider
compatibility limitation. Language IDs are still discovered by name.

```sh
npm run judge0:smoke
```

It must show status 3 and Hello World for Java, Python and JavaScript. Do not
count each Submit as just one execution when estimating the free quota.

For Vercel, copy the private environment values to the deployment's environment
settings, configure Atlas network access for its egress, and redeploy. Learners
do not enter credentials. If the free quota runs out, show an availability
message and keep their draft. Keep JavaScript/TypeScript and Python local for
ordinary guest lessons to preserve quota. The live Phase 1 guest verification
has passed for all three languages. Optional accounts and leaderboards are
implemented; live sign-in verification still requires OAuth credentials.

## Self-hosted service

Use a dedicated Linux host with Docker and Docker Compose and follow the
[official Judge0 CE deployment instructions](https://github.com/judge0/judge0/releases/tag/v1.13.1).
The official release has Linux/cgroup requirements; a generic serverless
function is not a suitable host for its execution workers. Configure its
database/Redis credentials and API authentication, then put its API behind
HTTPS. Keep network execution disabled and restrict direct API access to the
application's server as appropriate for your host.

For the app, set:

```dotenv
JUDGE0_URL=https://your-judge-host.example
JUDGE0_AUTH_HEADER=X-Auth-Token
JUDGE0_AUTH_TOKEN=your-private-judge-token
```

Use `npm run judge0:smoke` and the same guest exercise to verify it. The app's
MongoDB job queue remains separate from Judge0's own internal services. The
existing local Java worker is a legacy path; it is not the new server proxy.

Docker Desktop is installed on the current Windows machine, but its Linux
engine was not running during setup. Local containers can be evaluated for
development after starting it and checking Linux/cgroup compatibility. Do not
treat local Windows testing as a production Judge0 deployment.
