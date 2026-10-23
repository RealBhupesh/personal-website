import Link from "next/link";
export function SetupGuide({ missing }: { missing: string[] }) {
  return (
    <div className="studio-setup">
      <Link href="/">Bhupesh Cholake</Link>
      <header>
        <p className="studio-muted">Writing studio</p>
        <h1>
          Your writing desk is ready.
          <br />
          Connect its private storage.
        </h1>
        <p>
          The dashboard uses GitHub sign-in and a private repository for
          unfinished work. These credentials must be configured before anyone
          can access drafts.
        </p>
      </header>
      <ol>
        <li>
          <h2>Private content repository</h2>
          <p>
            The private repository <strong>RealBhupesh/website-writing</strong>{" "}
            has been created with a README and a main branch. Keep it private.
            Your website repository stays public.
          </p>
          <a
            href="https://github.com/RealBhupesh/website-writing"
            target="_blank"
            rel="noreferrer"
          >
            Open private repository ↗
          </a>
        </li>
        <li>
          <h2>Register a GitHub App</h2>
          <p>
            Use <strong>https://www.bhupeshcholake.in</strong> as the homepage
            and{" "}
            <strong>
              https://www.bhupeshcholake.in/api/auth/callback/github
            </strong>{" "}
            as the callback URL. Disable webhooks. Request repository Contents
            read/write and Commit statuses read-only. Install it only on the
            website and private writing repositories.
          </p>
          <a
            href="https://github.com/settings/apps/new"
            target="_blank"
            rel="noreferrer"
          >
            Register app ↗
          </a>
        </li>
        <li>
          <h2>Add the server credentials</h2>
          <p>
            In the website&apos;s Vercel project, add the App ID, Client ID,
            client secret, installation ID, generated private key, private
            repository name, and an Auth.js secret. Generate the Auth.js secret
            locally with <code>openssl rand -base64 32</code>. Never paste
            secrets into an article.
          </p>
          <details>
            <summary>Required environment variables</summary>
            <dl>
              {[
                "AUTH_SECRET",
                "AUTH_GITHUB_ID",
                "AUTH_GITHUB_SECRET",
                "CMS_GITHUB_APP_ID",
                "CMS_GITHUB_PRIVATE_KEY",
                "CMS_GITHUB_INSTALLATION_ID",
                "CMS_CONTENT_REPOSITORY",
              ].map((key) => (
                <div key={key}>
                  <dt>
                    <code>{key}</code>
                  </dt>
                  <dd>
                    {missing.includes(key) ? "Not configured" : "Configured"}
                  </dd>
                </div>
              ))}
            </dl>
            <p>
              CMS_CONTENT_REPOSITORY should be RealBhupesh/website-writing.
              Paste the PEM key as a multiline value. The installation ID is the
              number in github.com/settings/installations/ID.
            </p>
          </details>
        </li>
        <li>
          <h2>Redeploy and sign in</h2>
          <p>
            Redeploy the website, return to <strong>/admin</strong>, and sign in
            as RealBhupesh. Use Import existing posts to bring your essay into
            the library. Publishing creates a website commit and starts a
            deployment.
          </p>
          <a href="/admin">Check configuration again ↻</a>
        </li>
      </ol>
      <footer>
        Drafts remain private. Publishing is available only after GitHub
        authentication and repository access are configured.
      </footer>
    </div>
  );
}
