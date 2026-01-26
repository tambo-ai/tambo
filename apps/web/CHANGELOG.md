# Changelog

## [0.128.0](https://github.com/tambo-ai/tambo/compare/web-v0.127.0...web-v0.128.0) (2026-01-22)


### Features

* **web:** add context key support for Tambo user isolation ([#1894](https://github.com/tambo-ai/tambo/issues/1894)) ([c3c05ce](https://github.com/tambo-ai/tambo/commit/c3c05ce533c36e21af946f58f7becf6ab7548c76))


### Miscellaneous Chores

* **react:** bump to new @tambo-ai/typescript-sdk ([#1864](https://github.com/tambo-ai/tambo/issues/1864)) ([7643415](https://github.com/tambo-ai/tambo/commit/76434157aeaa2f4fb6501702403262025614931b))
* **sdk:** Bump again: get SSE streaming types ([#1870](https://github.com/tambo-ai/tambo/issues/1870)) ([e6fbb44](https://github.com/tambo-ai/tambo/commit/e6fbb4432bc3ba07fe8b660206a1c514ffb98ea8))


### Code Refactoring

* **ui-registry:** migrate consumers to centralized component registry ([#1872](https://github.com/tambo-ai/tambo/issues/1872)) ([1a74aeb](https://github.com/tambo-ai/tambo/commit/1a74aeb1255e612a651cfa303cd972c7eb8df115))

## [0.127.0](https://github.com/tambo-ai/tambo/compare/web-v0.126.0...web-v0.127.0) (2026-01-21)


### Features

* **analytics:** PostHog cross-subdomain tracking (Phase 1) ([#1842](https://github.com/tambo-ai/tambo/issues/1842)) ([ed80eb0](https://github.com/tambo-ai/tambo/commit/ed80eb0c6a6d15a4be844ff895f983788a6d9fba))


### Bug Fixes

* correct OAuth callback URL construction for MCP server authoriza… [#1837](https://github.com/tambo-ai/tambo/issues/1837) ([#1839](https://github.com/tambo-ai/tambo/issues/1839)) ([cb7299c](https://github.com/tambo-ai/tambo/commit/cb7299c6ba5c34082ebb8a28c839c77a7581cf3a))
* **web:** add guard for SLACK_OAUTH_TOKEN in callSlackAPI ([#1841](https://github.com/tambo-ai/tambo/issues/1841)) ([facf620](https://github.com/tambo-ai/tambo/commit/facf620a94ecd424c2c586c5678877f3577c9bab))
* **web:** prevent optional env vars from failing validation when empty ([#1821](https://github.com/tambo-ai/tambo/issues/1821)) ([b95735b](https://github.com/tambo-ai/tambo/commit/b95735bd1b4611402bb131bd90253fa88c77d9ec))


### Miscellaneous Chores

* **deps:** bump resend from 6.6.0 to 6.7.0 ([#1836](https://github.com/tambo-ai/tambo/issues/1836)) ([0410860](https://github.com/tambo-ai/tambo/commit/0410860a01fe73e51cb403f0b261f9cf760c987b))
* **deps:** bump the sentry group with 3 updates ([#1832](https://github.com/tambo-ai/tambo/issues/1832)) ([bdbee36](https://github.com/tambo-ai/tambo/commit/bdbee3643f2cc90a5094365545e939633422a962))
* **deps:** bump the small-safe-packages group with 8 updates ([#1831](https://github.com/tambo-ai/tambo/issues/1831)) ([a5965b4](https://github.com/tambo-ai/tambo/commit/a5965b4f9d1cf502eaf185cc8b1e26a93f847de0))
* **test:** bump coverage thresholds (2026-01-19) ([#1822](https://github.com/tambo-ai/tambo/issues/1822)) ([acf34a5](https://github.com/tambo-ai/tambo/commit/acf34a58b3cda7d8ed0b1313998ecf53e8463ad3))

## [0.126.0](https://github.com/tambo-ai/tambo/compare/web-v0.125.0...web-v0.126.0) (2026-01-16)


### Features

* **api:** implement v1 API phase 1 - foundation & schema ([#1767](https://github.com/tambo-ai/tambo/issues/1767)) ([e4dad06](https://github.com/tambo-ai/tambo/commit/e4dad061f22d2b6378846949beac1449f8c8b5c4))
* **react-sdk:** Add streaming hint to enable tool streaming on the client ([#1685](https://github.com/tambo-ai/tambo/issues/1685)) ([c38f046](https://github.com/tambo-ai/tambo/commit/c38f046fda8a5ba2a3287ceab65ca10432be48fa))
* **web,cli:** redirect auth from tambo.co to app.tambo.co ([#1791](https://github.com/tambo-ai/tambo/issues/1791)) ([2d2b975](https://github.com/tambo-ai/tambo/commit/2d2b9750b6b1346b08949e2925ac1af774b9ea9c))
* **web:** add API key callout on project page ([#1755](https://github.com/tambo-ai/tambo/issues/1755)) ([d771f84](https://github.com/tambo-ai/tambo/commit/d771f84b0b315f729cbc45b90257ec6d50346f3f))
* **web:** add Docs link to dashboard header ([#1757](https://github.com/tambo-ai/tambo/issues/1757)) ([0396733](https://github.com/tambo-ai/tambo/commit/03967335d289f215581e0b77c6a1e8c46fdd02e7))
* **web:** make project names clickable in projects table ([#1754](https://github.com/tambo-ai/tambo/issues/1754)) ([3e992ab](https://github.com/tambo-ai/tambo/commit/3e992ab6b25158c7dd1dfe4a2b2e764d952a7a76))


### Bug Fixes

* **web:** avoid 'Invalid Date' for project createdAt ([#1768](https://github.com/tambo-ai/tambo/issues/1768)) ([77f2265](https://github.com/tambo-ai/tambo/commit/77f226500102a76f869fc2dba786e246ec9d9292))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 22.19.1 to 22.19.5 ([#1746](https://github.com/tambo-ai/tambo/issues/1746)) ([aa0ca84](https://github.com/tambo-ai/tambo/commit/aa0ca84eb3e5cc582290e6aa0df6672f4b404969))
* **deps:** bump the small-safe-packages group with 5 updates ([#1742](https://github.com/tambo-ai/tambo/issues/1742)) ([2056c5c](https://github.com/tambo-ai/tambo/commit/2056c5c424310b103ec0a93bedc59f774c532a5b))
* **deps:** bump the tiptap group with 8 updates ([#1743](https://github.com/tambo-ai/tambo/issues/1743)) ([f3059ae](https://github.com/tambo-ai/tambo/commit/f3059ae231a4d19f799e6513c561695073c0e311))
* **web:** shorten starter calls banner copy ([#1756](https://github.com/tambo-ai/tambo/issues/1756)) ([4f26716](https://github.com/tambo-ai/tambo/commit/4f267169f67b98132fed79df6681b06e84cfb6a3))


### Code Refactoring

* **cli:** remove unused children prop from MessageThreadPanel ([#1750](https://github.com/tambo-ai/tambo/issues/1750)) ([b6f0e34](https://github.com/tambo-ai/tambo/commit/b6f0e348c2c1174cecc01834e85125e0b2558b55))

## [0.125.0](https://github.com/tambo-ai/tambo/compare/web-v0.124.0...web-v0.125.0) (2026-01-07)


### Features

* **cli:** implement device authentication flow and session management ([#1599](https://github.com/tambo-ai/tambo/issues/1599)) ([b22355f](https://github.com/tambo-ai/tambo/commit/b22355f7d3599af87de0f22b96980830142c3b8c))
* **db:** add anon role and RLS policies for device auth flow ([#1647](https://github.com/tambo-ai/tambo/issues/1647)) ([5e19a04](https://github.com/tambo-ai/tambo/commit/5e19a04a31fe95e3f43cbac253d78f51b35e3c8e))


### Bug Fixes

* **web:** restore Resend audience subscription on user signup ([#1665](https://github.com/tambo-ai/tambo/issues/1665)) ([f4b8add](https://github.com/tambo-ai/tambo/commit/f4b8addf95e4d4e0e82e4e9931ad9fc157983410))


### Miscellaneous Chores

* add cspell settings and correct a few spleling mistaeks ([#1586](https://github.com/tambo-ai/tambo/issues/1586)) ([f5cef2b](https://github.com/tambo-ai/tambo/commit/f5cef2b36d33076f2188f4a663bcebddd9679a9f))
* **deps:** bump @modelcontextprotocol/sdk from 1.24.3 to 1.25.1 ([#1643](https://github.com/tambo-ai/tambo/issues/1643)) ([fca2a86](https://github.com/tambo-ai/tambo/commit/fca2a8648ed50cf8cd96f713b4a1ce74ce8e9b12))
* **deps:** bump @tanstack/react-query from 5.90.10 to 5.90.12 ([#1633](https://github.com/tambo-ai/tambo/issues/1633)) ([3f997f5](https://github.com/tambo-ai/tambo/commit/3f997f5d9b63c2fa9a3a038c1ab29103361fad35))
* **deps:** bump @tanstack/react-query from 5.90.12 to 5.90.16 ([#1674](https://github.com/tambo-ai/tambo/issues/1674)) ([72d1c08](https://github.com/tambo-ai/tambo/commit/72d1c08f0520a94287b6100782919b58272096d3))
* **deps:** bump @vercel/analytics from 1.5.0 to 1.6.1 ([#1646](https://github.com/tambo-ai/tambo/issues/1646)) ([1a65b10](https://github.com/tambo-ai/tambo/commit/1a65b10031e61fd080de57bf9d654b78ef6133b7))
* **deps:** bump autoprefixer from 10.4.22 to 10.4.23 ([#1679](https://github.com/tambo-ai/tambo/issues/1679)) ([b4c9942](https://github.com/tambo-ai/tambo/commit/b4c9942e7ddc32c655a2aef63f2f58d4c76f2d15))
* **deps:** bump framer-motion from 12.23.24 to 12.23.26 ([#1644](https://github.com/tambo-ai/tambo/issues/1644)) ([34cc795](https://github.com/tambo-ai/tambo/commit/34cc795100121f8b1a4469b9a34a3113ba7bd424))
* **deps:** bump posthog-js from 1.310.1 to 1.311.0 in the small-safe-packages group across 1 directory ([#1636](https://github.com/tambo-ai/tambo/issues/1636)) ([67d8ba3](https://github.com/tambo-ai/tambo/commit/67d8ba3fdbf22a25e91d0ed624e4ca7272f6b2dd))
* **deps:** bump recharts from 3.5.1 to 3.6.0 ([#1642](https://github.com/tambo-ai/tambo/issues/1642)) ([bd84e15](https://github.com/tambo-ai/tambo/commit/bd84e1514bafb7a5e835c4395035228b502898ff))
* **deps:** bump shiki from 3.19.0 to 3.20.0 ([#1675](https://github.com/tambo-ai/tambo/issues/1675)) ([3ff08ed](https://github.com/tambo-ai/tambo/commit/3ff08ede0e7f39641df72b3933d3497434418270))
* **deps:** bump the sentry group with 3 updates ([#1630](https://github.com/tambo-ai/tambo/issues/1630)) ([b6f4402](https://github.com/tambo-ai/tambo/commit/b6f44021cb714d903a05dbe2a4ec8ed598e943d0))
* **deps:** bump the small-safe-packages group with 2 updates ([#1629](https://github.com/tambo-ai/tambo/issues/1629)) ([7655ca7](https://github.com/tambo-ai/tambo/commit/7655ca77bfa5843e30c0d1447cc705c572c5fe41))
* **deps:** bump the small-safe-packages group with 2 updates ([#1641](https://github.com/tambo-ai/tambo/issues/1641)) ([154b264](https://github.com/tambo-ai/tambo/commit/154b2647a3ba3ee836a521d4a23a20e80d68e497))
* **deps:** bump the small-safe-packages group with 5 updates ([#1614](https://github.com/tambo-ai/tambo/issues/1614)) ([0f9843b](https://github.com/tambo-ai/tambo/commit/0f9843beae591605144054a7b17f1c9ad9830857))
* **deps:** bump the tiptap group with 8 updates ([#1632](https://github.com/tambo-ai/tambo/issues/1632)) ([7aba2f8](https://github.com/tambo-ai/tambo/commit/7aba2f8859371e72b7ee3aa5443b1fe19bb6b361))
* **deps:** Support multiple tools for managing project tool versions ([#1603](https://github.com/tambo-ai/tambo/issues/1603)) ([31a09c3](https://github.com/tambo-ai/tambo/commit/31a09c32a25c440b16a705804a9b2341b0883514))


### Tests

* **react-sdk:** improve test coverage with behavioral tests ([#1607](https://github.com/tambo-ai/tambo/issues/1607)) ([9ec425a](https://github.com/tambo-ai/tambo/commit/9ec425a07bfcc4da7d7ef258ca5aeeb6aa8ba06f))

## [0.124.0](https://github.com/tambo-ai/tambo/compare/web-v0.123.4...web-v0.124.0) (2025-12-08)


### Features

* **cli:** bring wysiwyg editor into main message-input component ([#1415](https://github.com/tambo-ai/tambo/issues/1415)) ([6d0a89d](https://github.com/tambo-ai/tambo/commit/6d0a89dfa75c953279b56771209c74c4b3bcc58d))
* **mcp-resources:** Enable @-resource and /-command inline completion ([#1464](https://github.com/tambo-ai/tambo/issues/1464)) ([775ca87](https://github.com/tambo-ai/tambo/commit/775ca8789341de492bd084e1fbede76ffd3d1f8c))
* **web:** register dashboard components with Tambo ([#1467](https://github.com/tambo-ai/tambo/issues/1467)) ([0cd2f6e](https://github.com/tambo-ai/tambo/commit/0cd2f6eec4587385da8c9ecb725d25d79ead4c21))


### Bug Fixes

* **deps:** upgrade to zod v3 subpath imports and MCP SDK 1.24 ([#1465](https://github.com/tambo-ai/tambo/issues/1465)) ([c8b7f07](https://github.com/tambo-ai/tambo/commit/c8b7f079560d423082c005018a103b9eb3cf6993))
* **web:** clarify OpenAI-compatible base URL hint ([#1455](https://github.com/tambo-ai/tambo/issues/1455)) ([1da60e2](https://github.com/tambo-ai/tambo/commit/1da60e24887c9dfa3eb6dffc0156d11996a61b7d))


### Miscellaneous Chores

* **deps:** Bump @tambo-ai/typescript-sdk to get updated enum ([#1445](https://github.com/tambo-ai/tambo/issues/1445)) ([7bee1f3](https://github.com/tambo-ai/tambo/commit/7bee1f32b7864d381eb2b5f346ec050ed61358a3))
* **deps:** bump next from 15.5.6 to 15.5.7 ([#1473](https://github.com/tambo-ai/tambo/issues/1473)) ([d8c7f1e](https://github.com/tambo-ai/tambo/commit/d8c7f1e0e8bab619daccf774822c421891ac3e5f))
* **deps:** bump recharts from 3.4.1 to 3.5.0 ([#1439](https://github.com/tambo-ai/tambo/issues/1439)) ([f2d2200](https://github.com/tambo-ai/tambo/commit/f2d220039cee70670c2740d46d192eed42e3894e))
* **deps:** bump shiki from 2.5.0 to 3.15.0 ([#1373](https://github.com/tambo-ai/tambo/issues/1373)) ([b2734e5](https://github.com/tambo-ai/tambo/commit/b2734e5817d6b85edd0829bd86199563613edaf3))
* **deps:** bump the small-safe-packages group with 5 updates ([#1436](https://github.com/tambo-ai/tambo/issues/1436)) ([5974a87](https://github.com/tambo-ai/tambo/commit/5974a87c06577da92cd6ef9a500ebc9226f46fec))
* **deps:** bump the trpc group with 3 updates ([#1427](https://github.com/tambo-ai/tambo/issues/1427)) ([500f3bf](https://github.com/tambo-ai/tambo/commit/500f3bf70be85a7b0c9fc99385ebd24efede6bbc))


### Documentation

* Update / add some AGENTS.md and README.md as per some code audits I ran... ([#1451](https://github.com/tambo-ai/tambo/issues/1451)) ([600e862](https://github.com/tambo-ai/tambo/commit/600e8628be591748d19df31adbe8dac14c572207))
* **web:** link generative UI blog post to Hacker News ([#1476](https://github.com/tambo-ai/tambo/issues/1476)) ([71c83c8](https://github.com/tambo-ai/tambo/commit/71c83c85c6cf082e1381093012daa88bdbdeb4ac))


### Styles

* **web-app:** update UI for tambo.co ([#1453](https://github.com/tambo-ai/tambo/issues/1453)) ([095284e](https://github.com/tambo-ai/tambo/commit/095284ec96fcbbaf44937767893f972ec0e0c59c))


### Tests

* simplify coverage thresholds and fix CI coverage ([#1458](https://github.com/tambo-ai/tambo/issues/1458)) ([719b9e6](https://github.com/tambo-ai/tambo/commit/719b9e660700b5eb420b288cab52cbc11c83028d))

## [0.123.4](https://github.com/tambo-ai/tambo/compare/web-v0.123.3...web-v0.123.4) (2025-11-26)

### Miscellaneous Chores

- **deps:** Bump @tambo-ai/typescript-sdk to 0.78.0 to pick up mcp token API ([#1406](https://github.com/tambo-ai/tambo/issues/1406)) ([dd16776](https://github.com/tambo-ai/tambo/commit/dd16776acba4902da239e479c62a7bfcc29e5c6d))
- **deps:** bump @tiptap/extension-mention from 3.10.8 to 3.11.0 ([#1397](https://github.com/tambo-ai/tambo/issues/1397)) ([5e4ecee](https://github.com/tambo-ai/tambo/commit/5e4ecee32f0ff90269fbbf5624053f4af18038ad))
- **deps:** bump @tiptap/extension-placeholder from 3.10.8 to 3.11.0 ([#1370](https://github.com/tambo-ai/tambo/issues/1370)) ([d113d16](https://github.com/tambo-ai/tambo/commit/d113d167536e18f1789424b79b22e9fcc28c757b))
- **deps:** bump @tiptap/starter-kit from 3.10.8 to 3.11.0 ([#1395](https://github.com/tambo-ai/tambo/issues/1395)) ([5b30fd9](https://github.com/tambo-ai/tambo/commit/5b30fd9afaa1b5b5fd86c9032b9a037ee818f0b7))
- **deps:** bump streamdown from 1.4.0 to 1.5.1 ([#1393](https://github.com/tambo-ai/tambo/issues/1393)) ([9b3ec7d](https://github.com/tambo-ai/tambo/commit/9b3ec7d1362a242af22b0c2b1453635958fb432d))
- **deps:** bump the sentry group with 3 updates ([#1367](https://github.com/tambo-ai/tambo/issues/1367)) ([a4112c7](https://github.com/tambo-ai/tambo/commit/a4112c7e4c8d62368bf29366fbb5a12d34a3ed9c))
- **deps:** bump the small-safe-packages group with 4 updates ([#1366](https://github.com/tambo-ai/tambo/issues/1366)) ([422376c](https://github.com/tambo-ai/tambo/commit/422376c7b3cc1cc153b81c3e8eacee2b5681a473))
- **deps:** bump tldts from 7.0.18 to 7.0.19 ([#1394](https://github.com/tambo-ai/tambo/issues/1394)) ([0c4aefb](https://github.com/tambo-ai/tambo/commit/0c4aefb109aa1e9f3a13ff8a649fccecacde87ec))
- **repo:** update docker build images and related scripts to work in monorepo ([#1357](https://github.com/tambo-ai/tambo/issues/1357)) ([ad4997e](https://github.com/tambo-ai/tambo/commit/ad4997edb13ce431ec744c95d4ae1a7cfd85d239))

### Documentation

- add generative UI blog post ([#1358](https://github.com/tambo-ai/tambo/issues/1358)) ([44b87a9](https://github.com/tambo-ai/tambo/commit/44b87a9837a60be4475da5a4a9f4afdca44b1be4))

### Code Refactoring

- consolidate config packages and improve async error handling ([#1401](https://github.com/tambo-ai/tambo/issues/1401)) ([c9e0dd3](https://github.com/tambo-ai/tambo/commit/c9e0dd37d5bdeee79ac8ff8ddb3f6f4aae5aa5fb))

## [0.123.3](https://github.com/tambo-ai/tambo/compare/web-v0.123.2...web-v0.123.3) (2025-11-21)

### Miscellaneous Chores

- **release:** Split "tambo-cloud" release into 2 packages ([#1350](https://github.com/tambo-ai/tambo/issues/1350)) ([5891a6b](https://github.com/tambo-ai/tambo/commit/5891a6b8af86382f87f1de1afd8fe75262de4b0b))
- **repo:** move stuff out of tambo-cloud/ ([#1347](https://github.com/tambo-ai/tambo/issues/1347)) ([82185c8](https://github.com/tambo-ai/tambo/commit/82185c81e741891853852f50605cf49295afe074))
