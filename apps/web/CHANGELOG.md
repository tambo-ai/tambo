# Changelog

## [0.124.1](https://github.com/tambo-ai/tambo/compare/web-v0.124.0...web-v0.124.1) (2025-12-24)


### Bug Fixes

* **react-sdk:** fetch client-side MCP resource content before sending ([#1574](https://github.com/tambo-ai/tambo/issues/1574)) ([bb2e987](https://github.com/tambo-ai/tambo/commit/bb2e9877c2688878b51b913d5ba79ddf79c26814))
* **react-sdk:** update tests and components for contextKey refactor ([#1575](https://github.com/tambo-ai/tambo/issues/1575)) ([2e0ddcc](https://github.com/tambo-ai/tambo/commit/2e0ddccac6d946a82e461398a414e74a8993cb5f))
* refactor ContextAttachmentProvider and allow Interactable selection ([#1588](https://github.com/tambo-ai/tambo/issues/1588)) ([40a6af4](https://github.com/tambo-ai/tambo/commit/40a6af45323e73f1cc400df0665f45793d98de5b))
* thread stuck in loading state after tool call failures/refresh ([#1579](https://github.com/tambo-ai/tambo/issues/1579)) ([e138b40](https://github.com/tambo-ai/tambo/commit/e138b40dcffc5e6b87f5aa1d31bfcec29e40878f))
* **web:** allow Enter key to select items from TipTap suggestion popover ([#1571](https://github.com/tambo-ai/tambo/issues/1571)) ([dcb153c](https://github.com/tambo-ai/tambo/commit/dcb153c675a1f0689b2b048fd48970d160c82a94))


### Miscellaneous Chores

* add cspell settings and correct a few spleling mistaeks ([#1586](https://github.com/tambo-ai/tambo/issues/1586)) ([f5cef2b](https://github.com/tambo-ai/tambo/commit/f5cef2b36d33076f2188f4a663bcebddd9679a9f))
* add LICENSE files across workspaces ([#1532](https://github.com/tambo-ai/tambo/issues/1532)) ([6e41be5](https://github.com/tambo-ai/tambo/commit/6e41be55b85be629f9b23d5688d058ccd2bd57f8))
* **deps-dev:** bump @testing-library/react from 16.3.0 to 16.3.1 in the testing group ([#1610](https://github.com/tambo-ai/tambo/issues/1610)) ([f8d30aa](https://github.com/tambo-ai/tambo/commit/f8d30aaf912649b4f49a8431e51b6a67b3f58fe7))
* **deps:** bump @t3-oss/env-nextjs from 0.13.8 to 0.13.10 in the t3-oss group ([#1613](https://github.com/tambo-ai/tambo/issues/1613)) ([341cba4](https://github.com/tambo-ai/tambo/commit/341cba4649fd43f41b83791ebc6599c35e0eb143))
* **deps:** bump @trpc/server from 11.7.2 to 11.8.0 ([#1617](https://github.com/tambo-ai/tambo/issues/1617)) ([98aee7c](https://github.com/tambo-ai/tambo/commit/98aee7c74cf13cc1d42ab53c9d4a7e6cb5bde978))
* **deps:** bump @vercel/og from 0.8.5 to 1.0.0 ([#1562](https://github.com/tambo-ai/tambo/issues/1562)) ([03ca0f4](https://github.com/tambo-ai/tambo/commit/03ca0f494bca97deac07d44bafa665bf5eb2583d))
* **deps:** bump superjson from 2.2.5 to 2.2.6 ([#1567](https://github.com/tambo-ai/tambo/issues/1567)) ([ef27dc8](https://github.com/tambo-ai/tambo/commit/ef27dc8b63739d1b96b86230a719506d8183c592))
* **deps:** bump the sentry group with 3 updates ([#1615](https://github.com/tambo-ai/tambo/issues/1615)) ([8ebc981](https://github.com/tambo-ai/tambo/commit/8ebc981dd424fe7fa94a1897890d2f0bc59a3dab))
* **deps:** bump the small-safe-packages group with 5 updates ([#1614](https://github.com/tambo-ai/tambo/issues/1614)) ([0f9843b](https://github.com/tambo-ai/tambo/commit/0f9843beae591605144054a7b17f1c9ad9830857))
* **deps:** bump the tailwind group with 2 updates ([#1557](https://github.com/tambo-ai/tambo/issues/1557)) ([89a3b63](https://github.com/tambo-ai/tambo/commit/89a3b63f9eaa66e5295588bb3f277052f889b514))
* **repo:** add settings for vscode-jest extension ([#1591](https://github.com/tambo-ai/tambo/issues/1591)) ([a714303](https://github.com/tambo-ai/tambo/commit/a7143037ccf05ada73a5a7a6fc9a0227ba653a48))
* **test:** bump coverage thresholds (2025-12-22) ([#1605](https://github.com/tambo-ai/tambo/issues/1605)) ([37639b3](https://github.com/tambo-ai/tambo/commit/37639b31a43e0027474a9b61f902c0e0fdb1f388))


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
