# Fork maintenance

This repository tracks the original React Grab project and publishes fork packages under the `@fuadnafiz98` npm scope.

## Upstream updates

Configure the original repository once:

```bash
git remote add upstream https://github.com/aidenybai/react-grab.git
```

Update the fork from upstream:

```bash
git fetch upstream
git merge upstream/main
```

Fork-only browser features live under `packages/react-grab/src/fork`. Keep integration changes outside that directory small and stable.

## npm publishing

The release workflow keeps upstream package names inside the workspace. It builds temporary release artifacts with these names:

- `@fuadnafiz98/react-grab`
- `@fuadnafiz98/react-grab-cli`
- `@fuadnafiz98/grab`

For the first publish, create a granular npm access token with package read/write access and Bypass 2FA enabled. Add it as the `NPM_TOKEN` GitHub Actions secret. Legacy automation tokens are no longer supported.

After the packages exist, configure each package's npm trusted publisher with these values:

- Organization or user: `fuadnafiz98`
- Repository: `react-grab`
- Workflow filename: `publish.yml`
- Allowed action: `npm publish`

Verify one OIDC release. Then revoke the granular token and remove `NPM_TOKEN`. The workflow uses a GitHub-hosted runner, npm 11, and `id-token: write`, so npm can publish with short-lived credentials and automatic provenance.

Changesets create the version pull request. Merging that pull request publishes the scoped packages. Every commit also gets a `pkg-pr-new` preview package, and every main-branch commit gets a `dev` snapshot.
