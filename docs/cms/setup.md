# Writing studio setup

The dashboard lives at https://www.bhupeshcholake.in/admin.

The implementation is ready, but production writing requires a GitHub App and server credentials. Until configured, `/admin` displays setup instructions and all content APIs deny access. No developer token is used in production.

## Storage

The private repository `RealBhupesh/website-writing` was created for drafts and media. It is initialized on `main`. Do not change its visibility.

The existing public repository `RealBhupesh/personal-website` receives publication commits. Its existing Vercel integration builds and deploys those commits. Editing or autosaving a published article only changes its private source. Select Publish changes to update the public copy.

Unpublishing removes the article in the next deployment, but cannot erase files from the public repository's history or copies readers already made.

## GitHub App

1. Open https://github.com/settings/apps/new as RealBhupesh.
2. Choose a unique name, such as `Bhupesh Writing Studio`.
3. Set the homepage to `https://www.bhupeshcholake.in`.
4. Set the user authorization callback to `https://www.bhupeshcholake.in/api/auth/callback/github`.
5. Disable webhooks. This application does not use them.
6. Give the app Repository Contents read/write and Commit statuses read-only. Metadata read access is implicit. Do not grant administration, workflows, or organization permissions.
7. Install it only on `website-writing` and `personal-website`.
8. Generate a client secret and an app private key. Keep both private.
9. Record the App ID, Client ID, and installation ID. The installation ID is the numeric suffix of `https://github.com/settings/installations/ID`.

The GitHub sign-in flow permits only account ID `76155786`, login `RealBhupesh`. Renaming the account requires updating that allowlist. The app's server-side installation token accesses the two repositories; the sign-in token is not sent to the browser.

## Environment variables

Add these to the **Vercel project serving www.bhupeshcholake.in**, then redeploy:

| Name                         | Value                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| `AUTH_SECRET`                | Generate locally with `openssl rand -base64 32`             |
| `AUTH_GITHUB_ID`             | GitHub App Client ID                                        |
| `AUTH_GITHUB_SECRET`         | GitHub App client secret                                    |
| `CMS_GITHUB_APP_ID`          | Numeric GitHub App ID                                       |
| `CMS_GITHUB_PRIVATE_KEY`     | Entire generated PEM private key, including BEGIN/END lines |
| `CMS_GITHUB_INSTALLATION_ID` | Numeric installation ID                                     |
| `CMS_CONTENT_REPOSITORY`     | `RealBhupesh/website-writing`                               |

`CMS_CONTENT_BRANCH` is optional and defaults to `main`. Auth.js detects Vercel's host. Never put `CMS_LOCAL_MODE` in the deployed environment. It is also forcibly disabled when NODE_ENV is production.

Never put app credentials in `NEXT_PUBLIC_*` variables, Git files, screenshots, article bodies, or chat messages.

After redeployment, open `/admin`, sign in, and choose **Import existing posts**. Your Jostraca article retains its URL, code, and custom diagrams.

Sign-in submits a same-origin POST to `/admin/sign-in` and returns a normal HTTP redirect to GitHub. This works without JavaScript and does not depend on React's external Server Action navigation. `CMS_TEST_URL=https://www.bhupeshcholake.in npm run test:cms-auth` checks the deployed form, redirect, authorization cookies, and unauthenticated API protection without signing in or changing content. The default target is port 3101 for a local server configured with test GitHub credentials and local mode disabled.

## Local workspace

Run `npm run cms:dev`, then open http://127.0.0.1:3000/admin.

This explicitly enables a loopback-only development workspace, with private data under ignored `.cms/`. It requires no GitHub credentials. Local Publish writes to this checkout, not GitHub or the live website. The application displays that distinction. Do not run this mode on a shared machine or expose the development port through a tunnel.

`npm run test:cms-http` exercises this local server and removes its own temporary articles afterward. `npm test` covers the content model, editor round trips, GitHub commit protocol, conflicts, and publication failure recovery.

## Operating notes

- Autosave runs after 15 seconds of idle time. Save immediately with Cmd/Ctrl+S.
- A local device recovery copy protects unsaved text. After an unsuccessful save, export your text or compare the saved version before retrying.
- Unpublished draft media are authenticated. Referenced assets become public only when the article is published.
- Raster uploads support PNG, JPEG, WebP, and GIF, up to 2 MB and 40 megapixels. SVG upload is intentionally excluded.
- Markdown and the known Figure/JostracaDiagram components are supported. Arbitrary JavaScript/HTML is rejected before preview and publication.
- Posts containing custom MDX stay in Markdown mode to preserve unknown formatting rather than silently rewriting it.
- Published slugs are locked. Scheduling and collaborative editing are outside this release.
- GitHub commit statuses show deployment progress. They are distinct from draft save status; check the live URL after the deployment succeeds.
- GitHub branch protection must allow the installed app to publish content commits, or publication will correctly fail without overwriting the branch.
