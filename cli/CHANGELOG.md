# Changelog

## [0.48.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.47.0...tambo-v0.48.0) (2026-01-21)


### Features

* **ui-registry:** create centralized component registry package ([#1793](https://github.com/tambo-ai/tambo/issues/1793)) ([ac0dd75](https://github.com/tambo-ai/tambo/commit/ac0dd75a35cc2f37f0635cba48b6983c544c70a4))


### Bug Fixes

* **cli:** allow git clone in non-interactive mode ([#1811](https://github.com/tambo-ai/tambo/issues/1811)) ([68035e2](https://github.com/tambo-ai/tambo/commit/68035e27becd6669bfca1c8e77e0cc374ae2dda2))


### Miscellaneous Chores

* **test:** bump coverage thresholds (2026-01-19) ([#1822](https://github.com/tambo-ai/tambo/issues/1822)) ([acf34a5](https://github.com/tambo-ai/tambo/commit/acf34a58b3cda7d8ed0b1313998ecf53e8463ad3))

## [0.47.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.46.1...tambo-v0.47.0) (2026-01-16)


### Features

* **ui:** add aria-labels to dictation button ([#1715](https://github.com/tambo-ai/tambo/issues/1715)) ([001e75b](https://github.com/tambo-ai/tambo/commit/001e75b03a969b228621c7b3f8c51a8952116954))
* **web,cli:** redirect auth from tambo.co to app.tambo.co ([#1791](https://github.com/tambo-ai/tambo/issues/1791)) ([2d2b975](https://github.com/tambo-ai/tambo/commit/2d2b9750b6b1346b08949e2925ac1af774b9ea9c))


### Bug Fixes

* **cli:** add GenerationStage enum to components and Jest mock ([#1728](https://github.com/tambo-ai/tambo/issues/1728)) ([5b0eaf4](https://github.com/tambo-ai/tambo/commit/5b0eaf48ccf0cc80ff426457ca1b6121da4b6dad))
* **message-input:** clean up paste handling ([#1732](https://github.com/tambo-ai/tambo/issues/1732)) ([29fd5c9](https://github.com/tambo-ai/tambo/commit/29fd5c9df7e7cb9ff4b3166a7f6194a0a88e228b))


### Miscellaneous Chores

* **deps:** bump diff from 8.0.2 to 8.0.3 ([#1780](https://github.com/tambo-ai/tambo/issues/1780)) ([86f03a5](https://github.com/tambo-ai/tambo/commit/86f03a500044ca24b64539e2f475ce6a511106f2))

## [0.46.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.46.0...tambo-v0.46.1) (2026-01-14)


### Bug Fixes

* **cli:** add missing date-fns dependency ([#1761](https://github.com/tambo-ai/tambo/issues/1761)) ([e502652](https://github.com/tambo-ai/tambo/commit/e502652120a4cbc09cc435b5690860dac6dffdbe))
* **cli:** add missing postcss dependency ([#1763](https://github.com/tambo-ai/tambo/issues/1763)) ([3690ae7](https://github.com/tambo-ai/tambo/commit/3690ae717f653ca582e8b223d076d68015bf79e0))

## [0.46.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.45.0...tambo-v0.46.0) (2026-01-13)


### Features

* **cli:** add framework detection for automatic env var prefix selection ([#1734](https://github.com/tambo-ai/tambo/issues/1734)) ([5445ab2](https://github.com/tambo-ai/tambo/commit/5445ab22ab63722091cd87ed62cc0f212f8e9595))
* **cli:** Detect and use project's package manager (pnpm/yarn/npm) ([#1684](https://github.com/tambo-ai/tambo/issues/1684)) ([473a872](https://github.com/tambo-ai/tambo/commit/473a87208b53486851f51aa0b4cf5d6a20243f9a))
* **db:** add anon role and RLS policies for device auth flow ([#1647](https://github.com/tambo-ai/tambo/issues/1647)) ([5e19a04](https://github.com/tambo-ai/tambo/commit/5e19a04a31fe95e3f43cbac253d78f51b35e3c8e))
* **showcase/message-input:** persist user input via session storage … ([#1259](https://github.com/tambo-ai/tambo/issues/1259)) ([0130917](https://github.com/tambo-ai/tambo/commit/013091741d78dfd3ae81ea6255bba26d1fd7786b))


### Bug Fixes

* **ui:** Error handling for clipboard operations in markdown-components [#1698](https://github.com/tambo-ai/tambo/issues/1698) ([#1726](https://github.com/tambo-ai/tambo/issues/1726)) ([dd34f5c](https://github.com/tambo-ai/tambo/commit/dd34f5c32b2bad92a16f62f0f66499623a323880))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 22.19.1 to 22.19.5 ([#1746](https://github.com/tambo-ai/tambo/issues/1746)) ([aa0ca84](https://github.com/tambo-ai/tambo/commit/aa0ca84eb3e5cc582290e6aa0df6672f4b404969))
* **deps:** bump clipboardy from 5.0.1 to 5.0.2 ([#1696](https://github.com/tambo-ai/tambo/issues/1696)) ([7e08037](https://github.com/tambo-ai/tambo/commit/7e0803777a3034b608f85d54731899fd5b7acfc6))
* **deps:** bump inquirer from 13.0.2 to 13.1.0 ([#1694](https://github.com/tambo-ai/tambo/issues/1694)) ([e33615e](https://github.com/tambo-ai/tambo/commit/e33615eda60386ae34c0368a905639559f624e99))
* **test:** bump coverage thresholds (2026-01-12) ([#1729](https://github.com/tambo-ai/tambo/issues/1729)) ([5a54f2f](https://github.com/tambo-ai/tambo/commit/5a54f2f80c1167c2458ca5d49705b4b45e99825f))


### Code Refactoring

* **cli:** make registry components framework-agnostic ([#1737](https://github.com/tambo-ai/tambo/issues/1737)) ([2a35797](https://github.com/tambo-ai/tambo/commit/2a35797333c64f328b8794bf38d6246f1fe43a09))
* **cli:** remove unused children prop from MessageThreadPanel ([#1750](https://github.com/tambo-ai/tambo/issues/1750)) ([b6f0e34](https://github.com/tambo-ai/tambo/commit/b6f0e348c2c1174cecc01834e85125e0b2558b55))

## [0.45.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.44.1...tambo-v0.45.0) (2025-12-18)


### Features

* **showcase:** add dark mode to showcase and fix css ([#1527](https://github.com/tambo-ai/tambo/issues/1527)) ([6fa757d](https://github.com/tambo-ai/tambo/commit/6fa757ddbadbbaa5fb243207c0ae12ef5520d4a6))


### Bug Fixes

* **react-sdk:** fetch client-side MCP resource content before sending ([#1574](https://github.com/tambo-ai/tambo/issues/1574)) ([bb2e987](https://github.com/tambo-ai/tambo/commit/bb2e9877c2688878b51b913d5ba79ddf79c26814))
* **resources:** Use default streamdown configuration, drop explicit `rehype-harden` configuration ([#1593](https://github.com/tambo-ai/tambo/issues/1593)) ([55801f8](https://github.com/tambo-ai/tambo/commit/55801f87a93d9fa8e96b451bff2ed3347516f8e5))
* thread stuck in loading state after tool call failures/refresh ([#1579](https://github.com/tambo-ai/tambo/issues/1579)) ([e138b40](https://github.com/tambo-ai/tambo/commit/e138b40dcffc5e6b87f5aa1d31bfcec29e40878f))

## [0.44.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.44.0...tambo-v0.44.1) (2025-12-17)


### Bug Fixes

* **react-sdk:** update tests and components for contextKey refactor ([#1575](https://github.com/tambo-ai/tambo/issues/1575)) ([2e0ddcc](https://github.com/tambo-ai/tambo/commit/2e0ddccac6d946a82e461398a414e74a8993cb5f))
* **web:** allow Enter key to select items from TipTap suggestion popover ([#1571](https://github.com/tambo-ai/tambo/issues/1571)) ([dcb153c](https://github.com/tambo-ai/tambo/commit/dcb153c675a1f0689b2b048fd48970d160c82a94))


### Miscellaneous Chores

* add LICENSE files across workspaces ([#1532](https://github.com/tambo-ai/tambo/issues/1532)) ([6e41be5](https://github.com/tambo-ai/tambo/commit/6e41be55b85be629f9b23d5688d058ccd2bd57f8))
* **deps:** bump inquirer from 12.9.4 to 13.0.2 ([#1549](https://github.com/tambo-ai/tambo/issues/1549)) ([90a68ea](https://github.com/tambo-ai/tambo/commit/90a68eaf81ea81b1e51462e19917253e58a87125))

## [0.44.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.43.1...tambo-v0.44.0) (2025-12-15)


### Features

* add EditWithTamboButton page to showcase site ([#1508](https://github.com/tambo-ai/tambo/issues/1508)) ([57e2594](https://github.com/tambo-ai/tambo/commit/57e2594214bcf0035531923fb2cc252b7e73e090))
* integrate EditWithTambo component for inline component editing ([#1477](https://github.com/tambo-ai/tambo/issues/1477)) ([390c204](https://github.com/tambo-ai/tambo/commit/390c2045148c63dfb85f1988861e1cf6ad7f021e))
* **react-sdk:** add local resource registration to TamboRegistryProvider ([#1504](https://github.com/tambo-ai/tambo/issues/1504)) ([59c94a9](https://github.com/tambo-ai/tambo/commit/59c94a9214c165cbc6728d5a17f39697e4d4c370))


### Bug Fixes

* **cli:** Fixed cli logs typos on self-hosted flow ([#1528](https://github.com/tambo-ai/tambo/issues/1528)) ([783af2d](https://github.com/tambo-ai/tambo/commit/783af2d927a5b81e9b799eb9dcb1ce4204f8eb32))
* **editor:** Clean up message-input and text-editor to only expose a limited set of capabilities in the editor ([#1502](https://github.com/tambo-ai/tambo/issues/1502)) ([2938064](https://github.com/tambo-ai/tambo/commit/2938064b2ff4b4504af1e13de24117192a6dc811))
* **resources:** Make sure to show resource names in text editor and user messages ([#1497](https://github.com/tambo-ai/tambo/issues/1497)) ([b2d8013](https://github.com/tambo-ai/tambo/commit/b2d8013c0b4bf5fbf7801eca20e97fcf98b5ae55))


### Miscellaneous Chores

* **deps-dev:** bump ts-jest from 29.4.5 to 29.4.6 in the testing group ([#1484](https://github.com/tambo-ai/tambo/issues/1484)) ([07a1253](https://github.com/tambo-ai/tambo/commit/07a125380a847816424b4dae304075b3726e1816))
* **deps:** Bump @tambo-ai/typescript-sdk to get tool maxCalls ([#1533](https://github.com/tambo-ai/tambo/issues/1533)) ([97e85ba](https://github.com/tambo-ai/tambo/commit/97e85ba0eb334a8b3b482a0cff368d2528b91d74))
* don't show EditWithTamboButton when component is in thread ([#1519](https://github.com/tambo-ai/tambo/issues/1519)) ([5e814e4](https://github.com/tambo-ai/tambo/commit/5e814e4c439f4f4869614035dcf61a9684d16689))


### Documentation

* **cli:** document useMergeRefs React 19 cleanup ([#1470](https://github.com/tambo-ai/tambo/issues/1470)) ([e215716](https://github.com/tambo-ai/tambo/commit/e21571673b4c92c6fedbb6e74dceb27b921d0a19))
* **web:** document color handling in graph component ([#1469](https://github.com/tambo-ai/tambo/issues/1469)) ([d60e788](https://github.com/tambo-ai/tambo/commit/d60e788582df22f5f2bc47c59bbdae9ead37afee))


### Code Refactoring

* **cli:** migrate text-editor from tippy.js to Radix Popover ([#1506](https://github.com/tambo-ai/tambo/issues/1506)) ([554ce9e](https://github.com/tambo-ai/tambo/commit/554ce9eb1e2e4ee463af7a9a2157aa7ad4c4debb))

## [0.43.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.43.0...tambo-v0.43.1) (2025-12-04)


### Bug Fixes

* **cli:** fix build output structure for correct dist/cli.js location ([#1460](https://github.com/tambo-ai/tambo/issues/1460)) ([3281637](https://github.com/tambo-ai/tambo/commit/32816371f4da7c83af9eea166e5b3188307fc195))

## [0.43.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.42.0...tambo-v0.43.0) (2025-12-04)


### Features

* **cli:** add agent docs guardrails and cursor rules migration ([#1400](https://github.com/tambo-ai/tambo/issues/1400)) ([350b39a](https://github.com/tambo-ai/tambo/commit/350b39a44c95a0c7d1acf543320d34362a897f02))
* **cli:** bring wysiwyg editor into main message-input component ([#1415](https://github.com/tambo-ai/tambo/issues/1415)) ([6d0a89d](https://github.com/tambo-ai/tambo/commit/6d0a89dfa75c953279b56771209c74c4b3bcc58d))
* per-thread and threadless MCP token management with contextKey support ([#1408](https://github.com/tambo-ai/tambo/issues/1408)) ([463bf67](https://github.com/tambo-ai/tambo/commit/463bf672d9207f1c52f13763744a3ed03627d5b5))


### Miscellaneous Chores

* **deps:** Bump @tambo-ai/typescript-sdk to 0.78.0 to pick up mcp token API ([#1406](https://github.com/tambo-ai/tambo/issues/1406)) ([dd16776](https://github.com/tambo-ai/tambo/commit/dd16776acba4902da239e479c62a7bfcc29e5c6d))
* **deps:** Bump @tambo-ai/typescript-sdk to get updated enum ([#1445](https://github.com/tambo-ai/tambo/issues/1445)) ([7bee1f3](https://github.com/tambo-ai/tambo/commit/7bee1f32b7864d381eb2b5f346ec050ed61358a3))
* **deps:** bump the small-safe-packages group with 5 updates ([#1436](https://github.com/tambo-ai/tambo/issues/1436)) ([5974a87](https://github.com/tambo-ai/tambo/commit/5974a87c06577da92cd6ef9a500ebc9226f46fec))
* **lint:** Make sure lint-staged is localized to the docs/showcase directory like the other packages ([#1411](https://github.com/tambo-ai/tambo/issues/1411)) ([d6323ee](https://github.com/tambo-ai/tambo/commit/d6323ee6a0725772e735149f928f861428e8ccf9))
* **repo:** standardize test layout ([#1409](https://github.com/tambo-ai/tambo/issues/1409)) ([126d6ee](https://github.com/tambo-ai/tambo/commit/126d6eec32c8a828fb0c3071dd3ba793d624d1db))
* sync iconsize changes ([#1426](https://github.com/tambo-ai/tambo/issues/1426)) ([19d0528](https://github.com/tambo-ai/tambo/commit/19d052843d78c0b18134c89c2cfa7669b028e4f4))


### Code Refactoring

* consolidate config packages and improve async error handling ([#1401](https://github.com/tambo-ai/tambo/issues/1401)) ([c9e0dd3](https://github.com/tambo-ai/tambo/commit/c9e0dd37d5bdeee79ac8ff8ddb3f6f4aae5aa5fb))


### Tests

* **cli:** add registry component tests ([#1416](https://github.com/tambo-ai/tambo/issues/1416)) ([79705a2](https://github.com/tambo-ai/tambo/commit/79705a2d7ee605a1f8c20e467848a3a1d77792a6))

## [0.42.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.41.0...tambo-v0.42.0) (2025-11-22)


### Features

* automate component sync from CLI registry to showcase ([#1292](https://github.com/tambo-ai/tambo/issues/1292)) ([ae309fc](https://github.com/tambo-ai/tambo/commit/ae309fcb832ecdbc376247435eb2176c82f3093b))
* **cli:** detect non-interactive environments and fail with helpful errors ([#1311](https://github.com/tambo-ai/tambo/issues/1311)) ([e294390](https://github.com/tambo-ai/tambo/commit/e2943902bcee1444952a63d88c7a4bd897afdb74))

## [0.41.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.40.0...tambo-v0.41.0) (2025-11-20)


### Features

* merge cloud repo into mono repo ([#1314](https://github.com/tambo-ai/tambo/issues/1314)) ([6b88f60](https://github.com/tambo-ai/tambo/commit/6b88f609b3b7ba1b243a2be9a4bb426038e9e596))


### Bug Fixes

* **cli:** use base package name for mcp-components dependency ([#1312](https://github.com/tambo-ai/tambo/issues/1312)) ([83b987f](https://github.com/tambo-ai/tambo/commit/83b987ff8c0dfbd3c74c21bae5fd121c26c1012d))


### Miscellaneous Chores

* **deps-dev:** bump memfs from 4.50.0 to 4.51.0 ([#1304](https://github.com/tambo-ai/tambo/issues/1304)) ([3ee4d20](https://github.com/tambo-ai/tambo/commit/3ee4d20a790797784349576765061363932ea731))
* **deps-dev:** bump memfs from 4.50.0 to 4.51.0 ([#1304](https://github.com/tambo-ai/tambo/issues/1304)) ([d1332f4](https://github.com/tambo-ai/tambo/commit/d1332f402bfcb6cf4a4614aa131be93ce7f481f6))
* **deps-dev:** bump the eslint group with 4 updates ([#1299](https://github.com/tambo-ai/tambo/issues/1299)) ([a5a7ecd](https://github.com/tambo-ai/tambo/commit/a5a7ecddb7e8fada5d4abf5ac4fd516e24d67b85))
* **deps-dev:** bump the eslint group with 4 updates ([#1299](https://github.com/tambo-ai/tambo/issues/1299)) ([3287eaf](https://github.com/tambo-ai/tambo/commit/3287eaf83e6068fe5d2e0774506da3acf29eeba3))
* **deps:** bump @modelcontextprotocol/sdk from 1.21.1 to 1.22.0 ([#1307](https://github.com/tambo-ai/tambo/issues/1307)) ([1242270](https://github.com/tambo-ai/tambo/commit/1242270c2e4949e2b4e342ed12da99dc29086a67))
* **deps:** bump @modelcontextprotocol/sdk from 1.21.1 to 1.22.0 ([#1307](https://github.com/tambo-ai/tambo/issues/1307)) ([3351269](https://github.com/tambo-ai/tambo/commit/3351269f793be2ef261de55f979f32d672f2b6eb))
* **deps:** bump @tambo-ai/typescript-sdk from 0.76.0 to 0.77.0 ([#1278](https://github.com/tambo-ai/tambo/issues/1278)) ([5f46a57](https://github.com/tambo-ai/tambo/commit/5f46a576be373e7dac7f076a7c844db5faae27d8))
* **deps:** bump @tambo-ai/typescript-sdk from 0.76.0 to 0.77.0 ([#1278](https://github.com/tambo-ai/tambo/issues/1278)) ([e4e880e](https://github.com/tambo-ai/tambo/commit/e4e880ea83b1e8f17d401dab8a9b4ef07bce86bf))
* **showcase:** redesign of showcase site ([f081612](https://github.com/tambo-ai/tambo/commit/f0816127d3b0396c2f64b4cc6aa208098a5ae8a8))
* **showcase:** redesign of showcase site ([4950523](https://github.com/tambo-ai/tambo/commit/49505239b63dc655bea338fcefb6cdc8386914ca))

## [0.40.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.39.0...tambo-v0.40.0) (2025-11-07)


### Features

* Add dictation to showcase ([#1261](https://github.com/tambo-ai/tambo/issues/1261)) ([3adf26c](https://github.com/tambo-ai/tambo/commit/3adf26c65f72e93cfc82cab6e1bece92729c8584))
* **mcp:** Add support for MCP Resources ([#1268](https://github.com/tambo-ai/tambo/issues/1268)) ([99b4f87](https://github.com/tambo-ai/tambo/commit/99b4f8748021a3333a1b772b6e280ad22ed389bc))


### Code Refactoring

* **cli:** Clean up the `tambo init` code and add tests for  it ([#1264](https://github.com/tambo-ai/tambo/issues/1264)) ([523d2e8](https://github.com/tambo-ai/tambo/commit/523d2e823124ce39e1ca4dc430d9987c9b5fa4f4))

## [0.39.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.38.0...tambo-v0.39.0) (2025-11-05)


### Features

* add voice input ([#1234](https://github.com/tambo-ai/tambo/issues/1234)) ([88863aa](https://github.com/tambo-ai/tambo/commit/88863aa144572513261a2bd67e8c300c640298f1))

## [0.38.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.37.0...tambo-v0.38.0) (2025-11-04)


### Features

* Add showcase for elicitation ui ([#1233](https://github.com/tambo-ai/tambo/issues/1233)) ([89a91ab](https://github.com/tambo-ai/tambo/commit/89a91ab000722041ca8c183b7afdb5f8491b5ee3))
* **ui:** Update Design Token Usage in Component Library ([#1221](https://github.com/tambo-ai/tambo/issues/1221)) ([b2d16f6](https://github.com/tambo-ai/tambo/commit/b2d16f67df80a6cf28cfbec66a5e76d9297cf131))


### Bug Fixes

* **cli-update:** Make sure cli `update` adds dependent components (like elicitation-ui) ([#1246](https://github.com/tambo-ai/tambo/issues/1246)) ([cf0126a](https://github.com/tambo-ai/tambo/commit/cf0126ac99e7db9183124a58e58657bda9ae0dfd))
* **mcp:** Update default transport type from SSE to HTTP for MCP ([#1250](https://github.com/tambo-ai/tambo/issues/1250)) ([679f508](https://github.com/tambo-ai/tambo/commit/679f508a38b1c77eb643712d97a3c5da039b682a))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/typescript-sdk from 0.75.1 to 0.76.0 ([#1241](https://github.com/tambo-ai/tambo/issues/1241)) ([62d792e](https://github.com/tambo-ai/tambo/commit/62d792e38cd34832e729219a4f1ea28424d85433))
* **lint:** Proactively fix some React 19 issues ([#1251](https://github.com/tambo-ai/tambo/issues/1251)) ([b1984ed](https://github.com/tambo-ai/tambo/commit/b1984ed6d97631f342677826232a10fb0a87cd51))


### Documentation

* **mcp-features:** Add docs for Prompts and Sampling ([#1247](https://github.com/tambo-ai/tambo/issues/1247)) ([599faaf](https://github.com/tambo-ai/tambo/commit/599faaf4ad7669423a4f9d89dc5758c7b3917c42))


### Tests

* **cli:** Add testing infra for cli, test some simple commands ([#1248](https://github.com/tambo-ai/tambo/issues/1248)) ([cc20842](https://github.com/tambo-ai/tambo/commit/cc208425505cb1893a061ecf50d89685127a216a))

## [0.37.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.36.0...tambo-v0.37.0) (2025-10-31)


### Features

* Add validation UI to elicitation ([#1220](https://github.com/tambo-ai/tambo/issues/1220)) ([417209d](https://github.com/tambo-ai/tambo/commit/417209de0edad1a17d42f527ed9320913b541a2d))

## [0.36.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.35.1...tambo-v0.36.0) (2025-10-31)


### Features

* add context badge for images ([#1192](https://github.com/tambo-ai/tambo/issues/1192)) ([020cd5e](https://github.com/tambo-ai/tambo/commit/020cd5e19285921bf0ef3086d3d84777bf694685))
* **mcp:** add prompts button, if there are prompts ([#1212](https://github.com/tambo-ai/tambo/issues/1212)) ([c4af432](https://github.com/tambo-ai/tambo/commit/c4af4323d0698d1a400ef3e07a2bcfd6bb3c390f))
* **mcp:** Elicitation support + default UI in showcase ([#1217](https://github.com/tambo-ai/tambo/issues/1217)) ([7e9c54a](https://github.com/tambo-ai/tambo/commit/7e9c54a0a968a76b1e61612fe90de8909d949676))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group across 1 directory with 5 updates ([#1203](https://github.com/tambo-ai/tambo/issues/1203)) ([5c44450](https://github.com/tambo-ai/tambo/commit/5c444508e2309ef8b4ec9c9050e408e19a8a6e48))
* **deps:** bump @tambo-ai/typescript-sdk from 0.75.0 to 0.75.1 ([#1208](https://github.com/tambo-ai/tambo/issues/1208)) ([76640d7](https://github.com/tambo-ai/tambo/commit/76640d7eab0202555ba699039152be7b656d40ef))
* update CLAUDE.md files to reference AGENTS.md properly ([#1214](https://github.com/tambo-ai/tambo/issues/1214)) ([22d6ea2](https://github.com/tambo-ai/tambo/commit/22d6ea28fd18c073b3f739d901121bb1e1e59e31))

## [0.35.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.35.0...tambo-v0.35.1) (2025-10-21)


### Bug Fixes

* Update cli help behavior + show better docs ([#1166](https://github.com/tambo-ai/tambo/issues/1166)) ([f10732f](https://github.com/tambo-ai/tambo/commit/f10732f7a599872db92c187f89c0662b19fc97e8))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/typescript-sdk from 0.73.0 to 0.75.0 ([#1179](https://github.com/tambo-ai/tambo/issues/1179)) ([e781957](https://github.com/tambo-ai/tambo/commit/e781957a758cdd3f5e820b24f8fe9266b3c86baf))
* **deps:** bump streamdown from 1.3.0 to 1.4.0 ([#1181](https://github.com/tambo-ai/tambo/issues/1181)) ([441d3e0](https://github.com/tambo-ai/tambo/commit/441d3e0587d71fdfb63f2365c52d0aa88bfdbb21))
* **deps:** bump ts-morph from 27.0.0 to 27.0.2 ([#1177](https://github.com/tambo-ai/tambo/issues/1177)) ([e19d7c1](https://github.com/tambo-ai/tambo/commit/e19d7c1d0ec0ecefd75967f609e87883e9c1cd47))

## [0.35.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.34.1...tambo-v0.35.0) (2025-10-18)


### Features

* (ui) add ui for displaying MCP sampling requests ([#1167](https://github.com/tambo-ai/tambo/issues/1167)) ([ecdb9b1](https://github.com/tambo-ai/tambo/commit/ecdb9b1415cc6abe77ddaa44faff977c15159ae0))
* (ui)show 'thought for x seconds' ([#1165](https://github.com/tambo-ai/tambo/issues/1165)) ([12d0ee1](https://github.com/tambo-ai/tambo/commit/12d0ee1edd8e1f132f00cb6e7f64216b80b9f090))


### Bug Fixes

* filter out system message from UI ([#1162](https://github.com/tambo-ai/tambo/issues/1162)) ([8852980](https://github.com/tambo-ai/tambo/commit/8852980ae6b0271fc1bde42168bb4d0085057ffd))
* show 'done thinking' when reasoning message completes ([#1164](https://github.com/tambo-ai/tambo/issues/1164)) ([dd0e67d](https://github.com/tambo-ai/tambo/commit/dd0e67d3655a5f6c855bb5d913eee22c8991d39d))


### Code Refactoring

* **message:** simplify tool call request retrieval and enhance status message handling ([#1152](https://github.com/tambo-ai/tambo/issues/1152)) ([c866b67](https://github.com/tambo-ai/tambo/commit/c866b674e8fcc8524cf0de9e347902ac31efe81f))

## [0.34.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.34.0...tambo-v0.34.1) (2025-10-09)


### Bug Fixes

* **ui:** text pasting in the message input and update message component to use role instead of actionType ([#1139](https://github.com/tambo-ai/tambo/issues/1139)) ([48b9e5a](https://github.com/tambo-ai/tambo/commit/48b9e5ae11040f86a4a558c3c89e0b22bb8a6af4))


### Miscellaneous Chores

* **deps-dev:** bump typescript from 5.9.2 to 5.9.3 ([#1132](https://github.com/tambo-ai/tambo/issues/1132)) ([94b23a4](https://github.com/tambo-ai/tambo/commit/94b23a47d2d347033a15a2232b7c04216c982ad3))
* **deps:** bump @tambo-ai/typescript-sdk from 0.72.0 to 0.72.1 ([#1129](https://github.com/tambo-ai/tambo/issues/1129)) ([8d8cf9f](https://github.com/tambo-ai/tambo/commit/8d8cf9f2fe5c0661a576f8f77192d8b9c20ca62f))
* **deps:** bump @tambo-ai/typescript-sdk from 0.72.1 to 0.73.0 ([#1146](https://github.com/tambo-ai/tambo/issues/1146)) ([47432e7](https://github.com/tambo-ai/tambo/commit/47432e735d7ed3f6d6c99ac1cb727e86936d9c88))
* **deps:** bump dotenv from 17.2.2 to 17.2.3 ([#1128](https://github.com/tambo-ai/tambo/issues/1128)) ([c18bf58](https://github.com/tambo-ai/tambo/commit/c18bf583c55fdbfe1925367076a737471f743db4))
* **deps:** bump semver from 7.7.2 to 7.7.3 ([#1147](https://github.com/tambo-ai/tambo/issues/1147)) ([f448a98](https://github.com/tambo-ai/tambo/commit/f448a9857a559691ff384d780b1c5f816c942ff3))

## [0.34.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.33.0...tambo-v0.34.0) (2025-10-02)


### Features

* add reasoning UI, smart autoscroll with UI improvements and update component paths to use /tambo ([#1101](https://github.com/tambo-ai/tambo/issues/1101)) ([9ec66c3](https://github.com/tambo-ai/tambo/commit/9ec66c37493eb636d5778e51ca8553ffb9982fc4))


### Bug Fixes

* **mcp:** Handle cases where the server list changes ([#1080](https://github.com/tambo-ai/tambo/issues/1080)) ([86bf03e](https://github.com/tambo-ai/tambo/commit/86bf03eac65fef399abf0e02283c47c2aa166e00))
* **thread-history:** improve sidebar animation smoothness ([#1115](https://github.com/tambo-ai/tambo/issues/1115)) ([d65319e](https://github.com/tambo-ai/tambo/commit/d65319eb9078e248d4ca6bf649b2fb736b4d7022))


### Miscellaneous Chores

* add agents.md & claude.md to monorepo. ([#1116](https://github.com/tambo-ai/tambo/issues/1116)) ([fe911d4](https://github.com/tambo-ai/tambo/commit/fe911d4613b301cf9a68a6a95ebc2b7a6a294dd5))
* **deps:** bump @tambo-ai/typescript-sdk to 0.72 for reasoning shape ([#1072](https://github.com/tambo-ai/tambo/issues/1072)) ([a103b5f](https://github.com/tambo-ai/tambo/commit/a103b5fa250b334edaa4d81ba8fe82d36995ae7c))
* **deps:** bump clipboardy from 4.0.0 to 5.0.0 ([#1112](https://github.com/tambo-ai/tambo/issues/1112)) ([841ca31](https://github.com/tambo-ai/tambo/commit/841ca310dac872e833f15e291f85d299f1b8a895))
* **deps:** bump fast-equals from 5.2.2 to 5.3.2 ([#1103](https://github.com/tambo-ai/tambo/issues/1103)) ([2a5a6b4](https://github.com/tambo-ai/tambo/commit/2a5a6b4e1e941816a0e035ee4efab9dd8312db10))
* **deps:** bump ora from 8.2.0 to 9.0.0 ([#1091](https://github.com/tambo-ai/tambo/issues/1091)) ([b7333d6](https://github.com/tambo-ai/tambo/commit/b7333d6230515ba83c77618183779b7b4e92b2af))
* **deps:** bump streamdown from 1.2.0 to 1.3.0 ([#1093](https://github.com/tambo-ai/tambo/issues/1093)) ([761f213](https://github.com/tambo-ai/tambo/commit/761f213340ea0b611d8c712d1b5ca8fb744a8ace))

## [0.33.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.32.0...tambo-v0.33.0) (2025-09-19)


### Features

* **sdk:** Update to the new "typescript sdk" from stainless ([#1061](https://github.com/tambo-ai/tambo/issues/1061)) ([22dd7e3](https://github.com/tambo-ai/tambo/commit/22dd7e392cbf005a2d8bb7f43a813d53eee51611))


### Miscellaneous Chores

* **deps:** bump meow from 13.2.0 to 14.0.0 ([#1049](https://github.com/tambo-ai/tambo/issues/1049)) ([b49dfdf](https://github.com/tambo-ai/tambo/commit/b49dfdf7d68d46434270d3a7cdb928365de516c3))
* **deps:** bump streamdown from 1.1.5 to 1.2.0 ([#1050](https://github.com/tambo-ai/tambo/issues/1050)) ([f78ae45](https://github.com/tambo-ai/tambo/commit/f78ae4545c1714df7a954ff513da47ef8bd8958e))
* **lint:** fix eslint config to make cursor/vscode happy ([#1069](https://github.com/tambo-ai/tambo/issues/1069)) ([6e84c6e](https://github.com/tambo-ai/tambo/commit/6e84c6e7cade904b74bc2491c5d7e023f89f15b0))

## [0.32.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.31.0...tambo-v0.32.0) (2025-09-12)


### Features

* **image:** add image attachment support ([#1001](https://github.com/tambo-ai/tambo/issues/1001)) ([5a8e9a2](https://github.com/tambo-ai/tambo/commit/5a8e9a2267801feb1d24dd43e3bacd4fcc368b53))
* **sdk:** Add onCallUnregisteredTool callback for handling unexpected tool callbacks ([#1030](https://github.com/tambo-ai/tambo/issues/1030)) ([993405b](https://github.com/tambo-ai/tambo/commit/993405b6593b622f6ec755cf93d65c5272a49127))


### Bug Fixes

* **ui:** When tool calls are big, allow scrolling ([#1034](https://github.com/tambo-ai/tambo/issues/1034)) ([8149f6b](https://github.com/tambo-ai/tambo/commit/8149f6bd3f2513861bd699649a0500376388e0c4))


### Miscellaneous Chores

* **deps:** bump inquirer to fix tmp vulnerability ([#1029](https://github.com/tambo-ai/tambo/issues/1029)) ([4a0c28e](https://github.com/tambo-ai/tambo/commit/4a0c28e9598473d8cf39515305c262c42720b248))

## [0.31.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.30.1...tambo-v0.31.0) (2025-09-09)


### Features

* **cli:** add analytics template and update related commands and docs ([#978](https://github.com/tambo-ai/tambo/issues/978)) ([5431386](https://github.com/tambo-ai/tambo/commit/5431386a79d3933725c4d395bcf4548869a7c23f))
* streamline type definition across all generative components ([#996](https://github.com/tambo-ai/tambo/issues/996)) ([896306f](https://github.com/tambo-ai/tambo/commit/896306f1a5544d0cd88f8f88bdf9285ca6e9b6a8))


### Miscellaneous Chores

* **deps-dev:** bump @types/semver from 7.7.0 to 7.7.1 ([#1005](https://github.com/tambo-ai/tambo/issues/1005)) ([0d168f8](https://github.com/tambo-ai/tambo/commit/0d168f8a97c7eb86688541c3f40e4d08dabd871f))
* **deps:** bump dotenv from 17.2.1 to 17.2.2 ([#1009](https://github.com/tambo-ai/tambo/issues/1009)) ([4b0e3f3](https://github.com/tambo-ai/tambo/commit/4b0e3f3d523858de18a98792b7bb29edade0ad5c))
* **deps:** bump ts-morph from 26.0.0 to 27.0.0 ([#1012](https://github.com/tambo-ai/tambo/issues/1012)) ([b53efc0](https://github.com/tambo-ai/tambo/commit/b53efc0721fdf26d2823aa579276e1836b3f3102))

## [0.30.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.30.0...tambo-v0.30.1) (2025-09-04)


### Miscellaneous Chores

* update upgrade command to filter known safe packages ([#959](https://github.com/tambo-ai/tambo/issues/959)) ([3e57bd5](https://github.com/tambo-ai/tambo/commit/3e57bd593e78991664cf66eed2367a47168c65b3))

## [0.30.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.29.0...tambo-v0.30.0) (2025-08-30)


### Features

* migrate from react-markdown to streamdown ([#927](https://github.com/tambo-ai/tambo/issues/927)) ([fe5648e](https://github.com/tambo-ai/tambo/commit/fe5648e1e15d0181bc3bfc48bebdc556bb4be6b9))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/typescript-sdk to get deprecated ActionType ([#928](https://github.com/tambo-ai/tambo/issues/928)) ([0b316e6](https://github.com/tambo-ai/tambo/commit/0b316e6d842241069e8b17d5823b8b8df60cbaf8))
* **deps:** bump streamdown from 1.1.3 to 1.1.5 ([#950](https://github.com/tambo-ai/tambo/issues/950)) ([5aff96d](https://github.com/tambo-ai/tambo/commit/5aff96daf6685b7b9198819aba3cb1576d9622a0))
* remove conversational-form template from CLI and documentation ([#908](https://github.com/tambo-ai/tambo/issues/908)) ([3f24f2b](https://github.com/tambo-ai/tambo/commit/3f24f2be17819e338df031ea26d3c27f4caf9637))

## [0.29.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.28.0...tambo-v0.29.0) (2025-08-23)


### Features

* **api:** stop using contextKey returned from API ([#868](https://github.com/tambo-ai/tambo/issues/868)) ([75e0bbb](https://github.com/tambo-ai/tambo/commit/75e0bbba441695aa7038f242e7ec4ed62b76e91c))
* useTamboThreadInput context return reactquery values ([#897](https://github.com/tambo-ai/tambo/issues/897)) ([13aeff6](https://github.com/tambo-ai/tambo/commit/13aeff669bd5760e4f8f93e9ff77dae301f4ba83))


### Miscellaneous Chores

* **deps:** bump chalk from 5.5.0 to 5.6.0 ([#853](https://github.com/tambo-ai/tambo/issues/853)) ([7f2d0d7](https://github.com/tambo-ai/tambo/commit/7f2d0d7c993dc2b86323bf5ffc7e97e4e2bb7a52))
* update dependencies and update message input handling ([#905](https://github.com/tambo-ai/tambo/issues/905)) ([8015195](https://github.com/tambo-ai/tambo/commit/80151952ea321f8cf65a5e9b447b84ea6986125e))

## [0.28.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.27.3...tambo-v0.28.0) (2025-08-18)


### Features

* **init:** add self-hosting instructions to init command ([#844](https://github.com/tambo-ai/tambo/issues/844)) ([28c0670](https://github.com/tambo-ai/tambo/commit/28c0670accc4fde66dd3e6ad9ee7f1f0aa249891))

## [0.27.3](https://github.com/tambo-ai/tambo/compare/tambo-v0.27.2...tambo-v0.27.3) (2025-08-14)


### Bug Fixes

* **auth:** update authentication URL to include return path for CLI login ([#836](https://github.com/tambo-ai/tambo/issues/836)) ([4f118a6](https://github.com/tambo-ai/tambo/commit/4f118a68dd8327a876fb6da74b81826d827db194))
* split out provider values to prevent re-renders ([#816](https://github.com/tambo-ai/tambo/issues/816)) ([3360e9a](https://github.com/tambo-ai/tambo/commit/3360e9ab491c03a1a1da7101679ad88764dd6205))


### Miscellaneous

* **deps-dev:** bump @types/node-fetch from 2.6.12 to 2.6.13 ([#822](https://github.com/tambo-ai/tambo/issues/822)) ([f151657](https://github.com/tambo-ai/tambo/commit/f151657cf0e5a765f4968f63c37fe9d07b2bf7e6))

## [0.27.2](https://github.com/tambo-ai/tambo/compare/tambo-v0.27.1...tambo-v0.27.2) (2025-08-08)


### Miscellaneous

* **packages:** pin npm to 11.5.2, rereun npm install, npm dedupe ([#810](https://github.com/tambo-ai/tambo/issues/810)) ([e657057](https://github.com/tambo-ai/tambo/commit/e657057af2f3396dfa61d30670544a480ff97a24))

## [0.27.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.27.0...tambo-v0.27.1) (2025-08-07)


### Miscellaneous

* **deps-dev:** bump typescript from 5.8.3 to 5.9.2 ([#790](https://github.com/tambo-ai/tambo/issues/790)) ([49b86a0](https://github.com/tambo-ai/tambo/commit/49b86a0ba3198419054b7b75af9970321224b997))

## [0.27.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.26.1...tambo-v0.27.0) (2025-08-05)


### Features

* add pre-built context helpers ([#769](https://github.com/tambo-ai/tambo/issues/769)) ([757448b](https://github.com/tambo-ai/tambo/commit/757448b949f33a89ad0bc25b56918d95748da5ab))

## [0.26.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.26.0...tambo-v0.26.1) (2025-08-04)


### Miscellaneous

* replace Server icon with custom MCPIcon in message input component ([#770](https://github.com/tambo-ai/tambo/issues/770)) ([865eaa3](https://github.com/tambo-ai/tambo/commit/865eaa3516d5e491ac27ee7c77dc13eef61e5ce0))

## [0.26.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.25.0...tambo-v0.26.0) (2025-07-31)


### Features

* move additional context to message request ([#740](https://github.com/tambo-ai/tambo/issues/740)) ([09386ba](https://github.com/tambo-ai/tambo/commit/09386babf964ccdb3f447242ab4b042b1cd3dac6))

## [0.25.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.24.0...tambo-v0.25.0) (2025-07-29)


### Features

* **cli:** add mcpconfigbutton in message-input and remove mcp template ([#738](https://github.com/tambo-ai/tambo/issues/738)) ([7b29a20](https://github.com/tambo-ai/tambo/commit/7b29a20de9abbd450c931f9ce0fa63b3c923757d))

## [0.24.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.23.0...tambo-v0.24.0) (2025-07-29)


### Features

* Add InteractiveMap component using react‑leaflet ([#678](https://github.com/tambo-ai/tambo/issues/678)) ([22b3862](https://github.com/tambo-ai/tambo/commit/22b3862cdefbe5d53425da0f7ad0167698847d09))


### Bug Fixes

* update thread-history search to search for thread name ([#717](https://github.com/tambo-ai/tambo/issues/717)) ([1deeec5](https://github.com/tambo-ai/tambo/commit/1deeec567c9df8eb5d312a24072d193189756312))


### Miscellaneous

* **deps-dev:** bump @types/recharts from 1.8.29 to 2.0.1 ([#729](https://github.com/tambo-ai/tambo/issues/729)) ([400dc89](https://github.com/tambo-ai/tambo/commit/400dc895653b487b3f3b0aad56145577557a8450))
* **deps:** bump dotenv from 17.2.0 to 17.2.1 ([#734](https://github.com/tambo-ai/tambo/issues/734)) ([6436a9f](https://github.com/tambo-ai/tambo/commit/6436a9f61b21b1b6e8ee52dbe3c4cd864b84afc0))

## [0.23.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.22.1...tambo-v0.23.0) (2025-07-25)


### Features

* add additionalContext support ([#702](https://github.com/tambo-ai/tambo/issues/702)) ([f269b31](https://github.com/tambo-ai/tambo/commit/f269b313053490dc417dc18cd6ab673f07f2fb74))


### Bug Fixes

* overflow of tool info in message component ([#694](https://github.com/tambo-ai/tambo/issues/694)) ([4120efd](https://github.com/tambo-ai/tambo/commit/4120efdd02cfdcd92833b4637897614a21cddb68))


### Miscellaneous

* update CLI based on user feedback ([#696](https://github.com/tambo-ai/tambo/issues/696)) ([0ecda05](https://github.com/tambo-ai/tambo/commit/0ecda05ed68b059637e43a817fdecea3f4e36a6f))
* update documentation links to new domain and update dev command filter ([#698](https://github.com/tambo-ai/tambo/issues/698)) ([23946de](https://github.com/tambo-ai/tambo/commit/23946de0d4a67919e119f7188731f83bcc2e86a0))

## [0.22.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.22.0...tambo-v0.22.1) (2025-07-18)


### Miscellaneous

* **deps:** bump dotenv from 17.0.1 to 17.2.0 ([#660](https://github.com/tambo-ai/tambo/issues/660)) ([4dc5e6f](https://github.com/tambo-ai/tambo/commit/4dc5e6f6e3b697e87b857569799aac3662556dd2))
* **deps:** bump open from 10.1.2 to 10.2.0 ([#667](https://github.com/tambo-ai/tambo/issues/667)) ([867f425](https://github.com/tambo-ai/tambo/commit/867f425cee3ac9c48c3fe9187976123896e4e132))


### Code Refactoring

* **UI:** adjust padding and gap in message and thread content components ([#676](https://github.com/tambo-ai/tambo/issues/676)) ([b10fb04](https://github.com/tambo-ai/tambo/commit/b10fb049218b4604382992de84d265bab9ca9868))

## [0.22.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.21.1...tambo-v0.22.0) (2025-07-15)


### Features

* implement Tailwind CSS v3 and v4 support in CLI ([#653](https://github.com/tambo-ai/tambo/issues/653)) ([52664bc](https://github.com/tambo-ai/tambo/commit/52664bcda72fae2c16b9cc63c2d31b6bbf8bf072))


### Bug Fixes

* with correct types, remove cast ([#652](https://github.com/tambo-ai/tambo/issues/652)) ([ccbd42e](https://github.com/tambo-ai/tambo/commit/ccbd42edd850fb79603f6ea26894b8bbc6278c63))


### Miscellaneous

* **deps:** bump dotenv from 17.0.0 to 17.0.1 ([#639](https://github.com/tambo-ai/tambo/issues/639)) ([81afd5f](https://github.com/tambo-ai/tambo/commit/81afd5ff8f24bff859fd80dc48b0c543b0d95efc))

## [0.21.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.21.0...tambo-v0.21.1) (2025-07-05)


### Bug Fixes

* update tool result scrolling ([#633](https://github.com/tambo-ai/tambo/issues/633)) ([941e456](https://github.com/tambo-ai/tambo/commit/941e4568c06a7596a1d2094c5078b89f70c0000a))

## [0.21.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.20.0...tambo-v0.21.0) (2025-07-03)


### Features

* support accessToken ([#624](https://github.com/tambo-ai/tambo/issues/624)) ([2134cdc](https://github.com/tambo-ai/tambo/commit/2134cdc3c26aa319d5f77bec6dd779564284edfe))


### Bug Fixes

* showcase thread renaming and component variants ([#631](https://github.com/tambo-ai/tambo/issues/631)) ([cf3638e](https://github.com/tambo-ai/tambo/commit/cf3638e848afdb9a37e068f46c877a12900c716f))


### Miscellaneous

* update CLI init command with showcase link and add control bar to showcase ([#630](https://github.com/tambo-ai/tambo/issues/630)) ([63a381c](https://github.com/tambo-ai/tambo/commit/63a381cc9dbd9f5ba445012b71e8653c9e3d4bff))
* update CLI with the new feedback ([#615](https://github.com/tambo-ai/tambo/issues/615)) ([66fd8d0](https://github.com/tambo-ai/tambo/commit/66fd8d0c968bb27249362d48f08bfd42047d8701))

## [0.20.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.19.0...tambo-v0.20.0) (2025-07-02)

### Features

- update components to show tool results ([#622](https://github.com/tambo-ai/tambo/issues/622)) ([b68ca9a](https://github.com/tambo-ai/tambo/commit/b68ca9ab7f0b5a0dea43357715ad6ffbaadffcb6))

## [0.19.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.18.0...tambo-v0.19.0) (2025-07-02)

### Features

- update registry message component to show tool results ([#619](https://github.com/tambo-ai/tambo/issues/619)) ([b80effd](https://github.com/tambo-ai/tambo/commit/b80effd956557d6aad41e07c12802ccc7aebbba9))

### Miscellaneous

- **deps:** bump dotenv from 16.5.0 to 17.0.0 ([#611](https://github.com/tambo-ai/tambo/issues/611)) ([bbc08a2](https://github.com/tambo-ai/tambo/commit/bbc08a238cfaedb5da965225fb10351d1e64653d))
- **deps:** Manually bump typescript-sdk to 0.58 ([#612](https://github.com/tambo-ai/tambo/issues/612)) ([217c383](https://github.com/tambo-ai/tambo/commit/217c38395e82edebb4b01baa9b259363c7a7325d))

## [0.18.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.17.1...tambo-v0.18.0) (2025-06-26)

### Features

- add and expose `cancel` function to 'cancel' a generation ([#594](https://github.com/tambo-ai/tambo/issues/594)) ([661f31e](https://github.com/tambo-ai/tambo/commit/661f31ed3898e083e740f3975a6040966887324b))
- Add cancellation UI ([#596](https://github.com/tambo-ai/tambo/issues/596)) ([97e7927](https://github.com/tambo-ai/tambo/commit/97e7927057c42dbb81e45a01215dc6043a107aac))

## [0.17.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.17.0...tambo-v0.17.1) (2025-06-19)

### Bug Fixes

- convert ThreadOptionsDropdown from forwardRef to regular function component ([#560](https://github.com/tambo-ai/tambo/issues/560)) ([7255a29](https://github.com/tambo-ai/tambo/commit/7255a2902a221d8f0f905b6a9f0fcd0a8e29d952))

### Miscellaneous

- bump dev to node 22 ([#569](https://github.com/tambo-ai/tambo/issues/569)) ([fd5209e](https://github.com/tambo-ai/tambo/commit/fd5209e74a88dd4676f663bf0161e0030e41a943))

## [0.17.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.16.1...tambo-v0.17.0) (2025-06-18)

### Features

- add -y and --prefix flags to cli ([#561](https://github.com/tambo-ai/tambo/issues/561)) ([49574cd](https://github.com/tambo-ai/tambo/commit/49574cdd857a8caaa807728249b41aad9c33f718))

### Bug Fixes

- update typescript-sdk to get updated component decision type ([#562](https://github.com/tambo-ai/tambo/issues/562)) ([9075b6e](https://github.com/tambo-ai/tambo/commit/9075b6e257e68d2b604b2450537cb16c67697719))

## [0.16.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.16.0...tambo-v0.16.1) (2025-06-17)

### Bug Fixes

- show tool calls even if they're run on the server ([#555](https://github.com/tambo-ai/tambo/issues/555)) ([3592614](https://github.com/tambo-ai/tambo/commit/35926149e7da38cbb4529f36e66b250bdbbdbcf2))

## [0.16.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.15.0...tambo-v0.16.0) (2025-06-13)

### Features

- add ui for thread renaming ([#528](https://github.com/tambo-ai/tambo/issues/528)) ([3d58533](https://github.com/tambo-ai/tambo/commit/3d5853343103222f23e87a9c164162ec3e641ca3))

## [0.15.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.14.0...tambo-v0.15.0) (2025-06-11)

### Features

- add threads to showcase, add stub to sdk ([#523](https://github.com/tambo-ai/tambo/issues/523)) ([5c3a194](https://github.com/tambo-ai/tambo/commit/5c3a1944aebc67732ca347fc74714d2fe7a27ac4))

## [0.14.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.13.2...tambo-v0.14.0) (2025-06-10)

### Features

- allow multiple components to add / update command ([#518](https://github.com/tambo-ai/tambo/issues/518)) ([a39d2af](https://github.com/tambo-ai/tambo/commit/a39d2af83d1576e93dcf0eb827e6c3948ed02da7))

## [0.13.2](https://github.com/tambo-ai/tambo/compare/tambo-v0.13.1...tambo-v0.13.2) (2025-06-02)

### Bug Fixes

- use proper whitespace wrapping and format tool params correctly ([#505](https://github.com/tambo-ai/tambo/issues/505)) ([2346610](https://github.com/tambo-ai/tambo/commit/23466105ae4a9c89c0a4fc3f37e7f2705393e8a4))

## [0.13.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.13.0...tambo-v0.13.1) (2025-05-31)

### Miscellaneous

- add json-stringify-pretty-compact and ExternalLink component; enhance message styling ([#485](https://github.com/tambo-ai/tambo/issues/485)) ([644ab74](https://github.com/tambo-ai/tambo/commit/644ab74e5502f2d8f393e7b25de774f4c0900d95))

## [0.13.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.12.0...tambo-v0.13.0) (2025-05-31)

### Features

- show threadname in history ([#488](https://github.com/tambo-ai/tambo/issues/488)) ([9fa1a5d](https://github.com/tambo-ai/tambo/commit/9fa1a5d776de4480b60838afb1b8d7fa351ffee5))

### Bug Fixes

- default to "fetching data" instead of "Choosing component" ([#475](https://github.com/tambo-ai/tambo/issues/475)) ([7a062e5](https://github.com/tambo-ai/tambo/commit/7a062e5f85702e5590326c2ce314c0414d2e4316))

## [0.12.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.11.1...tambo-v0.12.0) (2025-05-30)

### Features

- show toolcall name and params under status ([#476](https://github.com/tambo-ai/tambo/issues/476)) ([7fefe78](https://github.com/tambo-ai/tambo/commit/7fefe783262731f61e5100891110fc57b2fbe468))

## [0.11.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.11.0...tambo-v0.11.1) (2025-05-29)

### Miscellaneous

- update upgrade command to let users choose which components to update ([#473](https://github.com/tambo-ai/tambo/issues/473)) ([50f20d1](https://github.com/tambo-ai/tambo/commit/50f20d1295af80b7bacce41d82fc9af2a4ec2973))

## [0.11.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.10.1...tambo-v0.11.0) (2025-05-28)

### Features

- improve ThreadContent component alignment and width TAM-141 ([#447](https://github.com/tambo-ai/tambo/issues/447)) ([a25ea61](https://github.com/tambo-ai/tambo/commit/a25ea61e9d23050f0a0da736be9db0caa9af3e8f))
- update ThreadHistory to default to collapsed sidebar ([#427](https://github.com/tambo-ai/tambo/issues/427)) ([efa0894](https://github.com/tambo-ai/tambo/commit/efa0894b254c672cd5d2cb154c1e2a3eed8a274e))

### Bug Fixes

- **scrollable-message-container:** increase auto-scroll timeout to 250ms ([#449](https://github.com/tambo-ai/tambo/issues/449)) ([b09dbf1](https://github.com/tambo-ai/tambo/commit/b09dbf1b9da170795c18d841346e69639976a149))

### Miscellaneous

- **deps:** bump ts-morph from 25.0.1 to 26.0.0 ([#458](https://github.com/tambo-ai/tambo/issues/458)) ([b7656cd](https://github.com/tambo-ai/tambo/commit/b7656cd226fbd2dae0035530168cfa38d63f65a6))
- improve upgrade command, update dependencies and improve UI responsiveness ([#471](https://github.com/tambo-ai/tambo/issues/471)) ([e09d740](https://github.com/tambo-ai/tambo/commit/e09d740d9ac1bfb30dfd2ebb5776f0de98921718))
- update components, remove unused dependencies and improve TamboProvider integration in showcase components ([#472](https://github.com/tambo-ai/tambo/issues/472)) ([5e0a2af](https://github.com/tambo-ai/tambo/commit/5e0a2af28979e2319319655ae0a4b38527fdfc0d))

## [0.10.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.10.0...tambo-v0.10.1) (2025-05-19)

### Bug Fixes

- **cli:** a few more dev tweaks to allow listing components, not crashing on add, etc ([#442](https://github.com/tambo-ai/tambo/issues/442)) ([3a79f60](https://github.com/tambo-ai/tambo/commit/3a79f606cf116a8924129a426f87362121757b6c))
- small devex tweaks ([#429](https://github.com/tambo-ai/tambo/issues/429)) ([b42caaa](https://github.com/tambo-ai/tambo/commit/b42caaab3f0e9d98adaea625891e0a2a1f146f83))

### Miscellaneous

- **deps:** bump sanitize-html from 2.16.0 to 2.17.0 ([#436](https://github.com/tambo-ai/tambo/issues/436)) ([2e3153d](https://github.com/tambo-ai/tambo/commit/2e3153d8d34145d35014799b96ed943a48cf0d68))

## [0.10.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.9.0...tambo-v0.10.0) (2025-05-15)

### Features

- **cli:** add upgrade command with accept-all option for whole template upgrades ([#419](https://github.com/tambo-ai/tambo/issues/419)) ([5081dcd](https://github.com/tambo-ai/tambo/commit/5081dcd7a08b8e3ce632e0978a478f7410edec5f))
- handle toolcall failures ([#420](https://github.com/tambo-ai/tambo/issues/420)) ([8a8bd27](https://github.com/tambo-ai/tambo/commit/8a8bd276dfcea261d9f7c6f1171829ef3682ffef))

## [0.9.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.8.0...tambo-v0.9.0) (2025-05-13)

### Features

- add template selection for create-app command ([#411](https://github.com/tambo-ai/tambo/issues/411)) ([1e75289](https://github.com/tambo-ai/tambo/commit/1e75289649dcc27da8e19813b825ccb55818724c))

### Miscellaneous

- **deps:** bump semver from 7.7.1 to 7.7.2 ([#407](https://github.com/tambo-ai/tambo/issues/407)) ([60bcd53](https://github.com/tambo-ai/tambo/commit/60bcd530ea4c85cc8779fe75b42ef7cb405e9dda))

## [0.8.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.7.0...tambo-v0.8.0) (2025-05-13)

### Features

- enhance Graph component with Zod type included and better loading ([#409](https://github.com/tambo-ai/tambo/issues/409)) ([9f7078c](https://github.com/tambo-ai/tambo/commit/9f7078c66fa20b419780464ac771e4c755dbe0fb))

### Bug Fixes

- remove unused animation and use isIdle ([#397](https://github.com/tambo-ai/tambo/issues/397)) ([0897067](https://github.com/tambo-ai/tambo/commit/0897067925f8880b147139a9d9c88160df0dbf89))
- showcase component sidebar issues and update of form component ([#412](https://github.com/tambo-ai/tambo/issues/412)) ([bb3da9c](https://github.com/tambo-ai/tambo/commit/bb3da9c1085b61f655adeca958995b46f3f72b83))

## [0.7.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.6.0...tambo-v0.7.0) (2025-05-07)

### Features

- allow env to override tambo URL, for local dev ([#379](https://github.com/tambo-ai/tambo/issues/379)) ([2a79b55](https://github.com/tambo-ai/tambo/commit/2a79b55864134dd89a86f089537e90ddfb834752))
- update showcase with new components ([#367](https://github.com/tambo-ai/tambo/issues/367)) ([581359a](https://github.com/tambo-ai/tambo/commit/581359adc7f85433c08f7a3c5da7af65cb8529fc))

### Miscellaneous

- **deps:** bump open from 10.1.1 to 10.1.2 ([#370](https://github.com/tambo-ai/tambo/issues/370)) ([72df9ad](https://github.com/tambo-ai/tambo/commit/72df9ad2c5ddce8c07be3e095c8ed2220eb6d4ba))

## [0.6.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.5.1...tambo-v0.6.0) (2025-05-01)

### Features

- **UI:** add loading indicator and tool status messages to message component ([#361](https://github.com/tambo-ai/tambo/issues/361)) ([54bf5fb](https://github.com/tambo-ai/tambo/commit/54bf5fb11a61ab33d2f2aec29c31bfdc3b0a2ffe))

## [0.5.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.5.0...tambo-v0.5.1) (2025-04-30)

### Miscellaneous

- **deps:** bump dotenv from 16.4.7 to 16.5.0 ([#313](https://github.com/tambo-ai/tambo/issues/313)) ([cffc541](https://github.com/tambo-ai/tambo/commit/cffc5416718bd11e8346aa26e426f892a467bbb9))
- **deps:** bump inquirer from 9.3.7 to 10.2.2 ([#327](https://github.com/tambo-ai/tambo/issues/327)) ([7e7f7e7](https://github.com/tambo-ai/tambo/commit/7e7f7e72beca07af4c6afed982782a32caeb1332))
- **deps:** bump open from 10.1.0 to 10.1.1 ([#326](https://github.com/tambo-ai/tambo/issues/326)) ([fb7b9cd](https://github.com/tambo-ai/tambo/commit/fb7b9cd4012b2dc895663ef941777a851fe24f20))
- **deps:** bump sanitize-html from 2.15.0 to 2.16.0 ([#334](https://github.com/tambo-ai/tambo/issues/334)) ([f5b38d6](https://github.com/tambo-ai/tambo/commit/f5b38d61af1bee74354cf04fc3b66351d20aba93))

### Code Refactoring

- **UI:** update UI components and styles for improved usability and integration ([#343](https://github.com/tambo-ai/tambo/issues/343)) ([b07b7e3](https://github.com/tambo-ai/tambo/commit/b07b7e3c8433e1dcfcae7ea466d7130bdfcf4639))

## [0.5.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.4.0...tambo-v0.5.0) (2025-04-09)

### Features

- remove borders from thread-full and suggestions ([#308](https://github.com/tambo-ai/tambo/issues/308)) ([917f1ee](https://github.com/tambo-ai/tambo/commit/917f1ee5adbfdb36cb2ba6eb0c5e6614bf92f211))

## [0.4.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.3.3...tambo-v0.4.0) (2025-04-09)

### Features

- **cli:** update message-input component style ([#306](https://github.com/tambo-ai/tambo/issues/306)) ([0454392](https://github.com/tambo-ai/tambo/commit/0454392c7ed07e7404605ae399b9a864f52438a2))

### Miscellaneous

- **deps-dev:** bump typescript from 5.8.2 to 5.8.3 ([#282](https://github.com/tambo-ai/tambo/issues/282)) ([0c1fc63](https://github.com/tambo-ai/tambo/commit/0c1fc631be3212e7c3b82c696306d7fac36d5f56))
- **deps:** bump inquirer from 9.3.7 to 10.2.2 ([#284](https://github.com/tambo-ai/tambo/issues/284)) ([7a3f5f5](https://github.com/tambo-ai/tambo/commit/7a3f5f51e43e885406058f63c9ca40061fdf348a))

## [0.3.3](https://github.com/tambo-ai/tambo/compare/tambo-v0.3.2...tambo-v0.3.3) (2025-04-04)

### Bug Fixes

- **cli:** add --init-git flag to create-app command and fix message-input auto-focus ([#273](https://github.com/tambo-ai/tambo/issues/273)) ([46ff832](https://github.com/tambo-ai/tambo/commit/46ff8328d4a3547bac3469389fdf018198ac077a))

### Code Refactoring

- **cli:** remove tambo.ts from init command (only full-send) ([#269](https://github.com/tambo-ai/tambo/issues/269)) ([96d65d2](https://github.com/tambo-ai/tambo/commit/96d65d27253de637a0b83e0050359ab71416a054))

## [0.3.2](https://github.com/tambo-ai/tambo/compare/tambo-v0.3.1...tambo-v0.3.2) (2025-04-03)

### Miscellaneous

- **cli:** change the appname in package.json while installing template ([#263](https://github.com/tambo-ai/tambo/issues/263)) ([a769bbf](https://github.com/tambo-ai/tambo/commit/a769bbf8baac23c0c38daafb64539162445c1355))

## [0.3.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.3.0...tambo-v0.3.1) (2025-04-03)

### Bug Fixes

- **cli:** add displayName to MessageSuggestions and ThreadHistory components ([#260](https://github.com/tambo-ai/tambo/issues/260)) ([0f07571](https://github.com/tambo-ai/tambo/commit/0f07571ae6df627d34dda621772b6bc704d408cf))

## [0.3.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.2.2...tambo-v0.3.0) (2025-04-02)

### Features

- add tambo.ts for registering components & simplify code ([#257](https://github.com/tambo-ai/tambo/issues/257)) ([139d727](https://github.com/tambo-ai/tambo/commit/139d727daf53c652a9ee39ce68492a35e381dc12))
- **cli:** add 'create-tambo-app' command to CLI for app creation from template ([#256](https://github.com/tambo-ai/tambo/issues/256)) ([4e116ce](https://github.com/tambo-ai/tambo/commit/4e116ce7e4f02a6dbf4e95e645035068b3a96594))

### Bug Fixes

- only run npm install twice ([#254](https://github.com/tambo-ai/tambo/issues/254)) ([ca2c8f4](https://github.com/tambo-ai/tambo/commit/ca2c8f4b73c53a710599d5fa9772a65e39c174c0))

### Documentation

- add a bunch of jsdocs for components ([#253](https://github.com/tambo-ai/tambo/issues/253)) ([f5fa2ec](https://github.com/tambo-ai/tambo/commit/f5fa2ec57378b2383c3b14fd6f9c79dbfdfc0b1e))

## [0.2.2](https://github.com/tambo-ai/tambo/compare/tambo-v0.2.1...tambo-v0.2.2) (2025-04-02)

### Bug Fixes

- improved CLI commands with user feedback and component location handling ([#247](https://github.com/tambo-ai/tambo/issues/247)) ([d90c1ba](https://github.com/tambo-ai/tambo/commit/d90c1bacf5b890e3b6941f6fa5345b8a737350ac))
- minor component cleanups: stop using useEffect/etc ([#242](https://github.com/tambo-ai/tambo/issues/242)) ([7c6d334](https://github.com/tambo-ai/tambo/commit/7c6d334d500d909038469132123c9d163f2f7c5b))
- more mac kbd cleanup: quiet down hydration warnings ([#248](https://github.com/tambo-ai/tambo/issues/248)) ([bcf13e7](https://github.com/tambo-ai/tambo/commit/bcf13e72890c0bf0cfdd4352a742a4adcb6f05dc))

### Documentation

- update README files for React SDK and CLI, fix links and enhance installation instructions ([#251](https://github.com/tambo-ai/tambo/issues/251)) ([fa85f17](https://github.com/tambo-ai/tambo/commit/fa85f1701fe27fdd59b4d7f0f6741c392c08808d))

## [0.2.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.2.0...tambo-v0.2.1) (2025-04-01)

### Bug Fixes

- show list of component if component is missing ([#241](https://github.com/tambo-ai/tambo/issues/241)) ([e971b10](https://github.com/tambo-ai/tambo/commit/e971b1021dbfd622dda304af2b33186e8608e235))
- warn about latest version, better src/ messaging ([#240](https://github.com/tambo-ai/tambo/issues/240)) ([60bb430](https://github.com/tambo-ai/tambo/commit/60bb43086accefcc5af67510b3a60cf602041492))
- warn users if they are using old tambo cli ([#238](https://github.com/tambo-ai/tambo/issues/238)) ([6070464](https://github.com/tambo-ai/tambo/commit/6070464ff2aeb4a84aef4643784bcefb041044fc))

### Miscellaneous

- fix thread-history and updated showcase site ([#204](https://github.com/tambo-ai/tambo/issues/204)) ([26c70cd](https://github.com/tambo-ai/tambo/commit/26c70cd841ef5bdeba7f755225ba57fe100c4429))

## [0.2.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.5...tambo-v0.2.0) (2025-03-28)

### Features

- useTamboThreads -&gt; useTamboThreadList ([#200](https://github.com/tambo-ai/tambo/issues/200)) ([4a32eda](https://github.com/tambo-ai/tambo/commit/4a32eda20b6564465b69bccda8ed94f65ea56b01))

### Bug Fixes

- **cli:** add API key check; update component installation logic, update component UI ([#198](https://github.com/tambo-ai/tambo/issues/198)) ([bdfbe7e](https://github.com/tambo-ai/tambo/commit/bdfbe7ecefd0231fa9801b5b5b77059206d6aabd))

## [0.1.5](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.4...tambo-v0.1.5) (2025-03-25)

### Miscellaneous

- **deps-dev:** bump @types/chalk from 0.4.31 to 2.2.4 ([#181](https://github.com/tambo-ai/tambo/issues/181)) ([855e618](https://github.com/tambo-ai/tambo/commit/855e6180966a6cef88b9142924350938479c501f))
- **deps-dev:** bump @types/ora from 3.1.0 to 3.2.0 ([#192](https://github.com/tambo-ai/tambo/issues/192)) ([911e4ed](https://github.com/tambo-ai/tambo/commit/911e4ed4cd30f960e5de9351ed6aa4605b7ec2a8))
- **deps-dev:** bump the eslint group with 4 updates ([#178](https://github.com/tambo-ai/tambo/issues/178)) ([52bcaca](https://github.com/tambo-ai/tambo/commit/52bcaca7c06141955d2185a84f1647cf40847a38))
- **deps:** bump sanitize-html from 2.14.0 to 2.15.0 ([#191](https://github.com/tambo-ai/tambo/issues/191)) ([88e2019](https://github.com/tambo-ai/tambo/commit/88e201920be820f08d9cdcc850f8ed9ae8ea8596))

## [0.1.4](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.3...tambo-v0.1.4) (2025-03-24)

### Bug Fixes

- **cli:** component path fix for message-suggestions ([#176](https://github.com/tambo-ai/tambo/issues/176)) ([d11d856](https://github.com/tambo-ai/tambo/commit/d11d85618338e348967fa54334c6e35f9349c8fb))

## [0.1.3](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.2...tambo-v0.1.3) (2025-03-22)

### Miscellaneous

- **cli:** update components UI and add update command ([#167](https://github.com/tambo-ai/tambo/issues/167)) ([a675c7d](https://github.com/tambo-ai/tambo/commit/a675c7d12bce6fde19752eebdeb148dbc65630eb))

## [0.1.2](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.1...tambo-v0.1.2) (2025-03-19)

### Bug Fixes

- **cli:** improve overall component ui ([#163](https://github.com/tambo-ai/tambo/issues/163)) ([bad4d07](https://github.com/tambo-ai/tambo/commit/bad4d07bb25458dd0e81382f6476afb307e57928))

### Miscellaneous

- pin stuff down to node &gt;=20 ([#159](https://github.com/tambo-ai/tambo/issues/159)) ([169797b](https://github.com/tambo-ai/tambo/commit/169797bc2800b1e42903d358f8023f391898b33f))
- show renderedComponent in Message component ([#160](https://github.com/tambo-ai/tambo/issues/160)) ([7a6a44a](https://github.com/tambo-ai/tambo/commit/7a6a44a7368d898e9fc1f4540f0ae11e7110b672))

## [0.1.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.0...tambo-v0.1.1) (2025-03-18)

### Bug Fixes

- **cli:** remove full-send flag and add it as a command instead ([#155](https://github.com/tambo-ai/tambo/issues/155)) ([2b0797a](https://github.com/tambo-ai/tambo/commit/2b0797a2fad8e8c2d47d943f5ad35e6b09ad885f))

## [0.1.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.0.3...tambo-v0.1.0) (2025-03-18)

### Features

- migration of tambo cli ([#119](https://github.com/tambo-ai/tambo/issues/119)) ([bbe2cbf](https://github.com/tambo-ai/tambo/commit/bbe2cbf2fbf6c25d0c2ae3a1aec69d5885a80569))

### Bug Fixes

- unpin cli from old version of @tambo-ai/react ([#150](https://github.com/tambo-ai/tambo/issues/150)) ([25ad800](https://github.com/tambo-ai/tambo/commit/25ad800d4402dd6db314321715bd48fcaa0df6f8))

### Miscellaneous

- **cli:** update release configuration and CLI version to 0.0.3 ([#153](https://github.com/tambo-ai/tambo/issues/153)) ([11831f2](https://github.com/tambo-ai/tambo/commit/11831f232169af428209d2d5eac69bcc82e45353))
- remove some unused dependencies ([#152](https://github.com/tambo-ai/tambo/issues/152)) ([02f3e0d](https://github.com/tambo-ai/tambo/commit/02f3e0d0d7708ddcf72216a90167938ed1aab78a))
