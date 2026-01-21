# Changelog

## [0.35.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.34.1...showcase-v0.35.0) (2026-01-21)


### Features

* **analytics:** PostHog cross-subdomain tracking (Phase 1) ([#1842](https://github.com/tambo-ai/tambo/issues/1842)) ([ed80eb0](https://github.com/tambo-ai/tambo/commit/ed80eb0c6a6d15a4be844ff895f983788a6d9fba))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 4 updates ([#1829](https://github.com/tambo-ai/tambo/issues/1829)) ([eab7100](https://github.com/tambo-ai/tambo/commit/eab7100dc3c4e4e63a68c76dade3fb8189a9a734))

## [0.34.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.34.0...showcase-v0.34.1) (2025-12-17)


### Bug Fixes

* **react-sdk:** update tests and components for contextKey refactor ([#1575](https://github.com/tambo-ai/tambo/issues/1575)) ([2e0ddcc](https://github.com/tambo-ai/tambo/commit/2e0ddccac6d946a82e461398a414e74a8993cb5f))
* **web:** allow Enter key to select items from TipTap suggestion popover ([#1571](https://github.com/tambo-ai/tambo/issues/1571)) ([dcb153c](https://github.com/tambo-ai/tambo/commit/dcb153c675a1f0689b2b048fd48970d160c82a94))


### Miscellaneous Chores

* add LICENSE files across workspaces ([#1532](https://github.com/tambo-ai/tambo/issues/1532)) ([6e41be5](https://github.com/tambo-ai/tambo/commit/6e41be55b85be629f9b23d5688d058ccd2bd57f8))
* **deps-dev:** bump the eslint group with 5 updates ([#1541](https://github.com/tambo-ai/tambo/issues/1541)) ([6329a46](https://github.com/tambo-ai/tambo/commit/6329a461e8b9f036e111e24890c27a98925f4d15))
* **deps:** bump @tiptap/extension-paragraph from 3.11.1 to 3.13.0 ([#1554](https://github.com/tambo-ai/tambo/issues/1554)) ([bec8c0e](https://github.com/tambo-ai/tambo/commit/bec8c0e155c35be63923e8b072a46b7d5d67df16))
* **deps:** bump @vercel/og from 0.8.5 to 1.0.0 ([#1562](https://github.com/tambo-ai/tambo/issues/1562)) ([03ca0f4](https://github.com/tambo-ai/tambo/commit/03ca0f494bca97deac07d44bafa665bf5eb2583d))
* **deps:** bump dompurify from 3.3.0 to 3.3.1 ([#1555](https://github.com/tambo-ai/tambo/issues/1555)) ([cbc3328](https://github.com/tambo-ai/tambo/commit/cbc332845171e87d4f04c11429af8acbf1e4b0d3))
* **deps:** bump the next group with 2 updates ([#1543](https://github.com/tambo-ai/tambo/issues/1543)) ([86e399f](https://github.com/tambo-ai/tambo/commit/86e399fbb3b10aacfb626af96bfd0e5880e1d78a))
* **deps:** bump the small-safe-packages group with 3 updates ([#1546](https://github.com/tambo-ai/tambo/issues/1546)) ([462d2c8](https://github.com/tambo-ai/tambo/commit/462d2c8f23f11512ccd3de6caa89c6d9cbb5bf69))
* **deps:** bump the tiptap group with 7 updates ([#1558](https://github.com/tambo-ai/tambo/issues/1558)) ([664709a](https://github.com/tambo-ai/tambo/commit/664709a5ef24464dccb1078b0ddacb9ea1f5f989))

## [0.34.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.33.1...showcase-v0.34.0) (2025-12-15)


### Features

* add EditWithTamboButton page to showcase site ([#1508](https://github.com/tambo-ai/tambo/issues/1508)) ([57e2594](https://github.com/tambo-ai/tambo/commit/57e2594214bcf0035531923fb2cc252b7e73e090))


### Bug Fixes

* import paths in showcase examples ([#1510](https://github.com/tambo-ai/tambo/issues/1510)) ([e164d5a](https://github.com/tambo-ai/tambo/commit/e164d5ad94c5f146201e2f9da13e61b5b97d677d))
* **react:** correct schema parsing logic ([#1513](https://github.com/tambo-ai/tambo/issues/1513)) ([bf7a54a](https://github.com/tambo-ai/tambo/commit/bf7a54ae5515fa6386950a65b6eb03ca891ad250))


### Miscellaneous Chores

* **deps:** Bump @tambo-ai/typescript-sdk to get tool maxCalls ([#1533](https://github.com/tambo-ai/tambo/issues/1533)) ([97e85ba](https://github.com/tambo-ai/tambo/commit/97e85ba0eb334a8b3b482a0cff368d2528b91d74))
* don't show EditWithTamboButton when component is in thread ([#1519](https://github.com/tambo-ai/tambo/issues/1519)) ([5e814e4](https://github.com/tambo-ai/tambo/commit/5e814e4c439f4f4869614035dcf61a9684d16689))

## [0.33.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.33.0...showcase-v0.33.1) (2025-12-11)


### Code Refactoring

* **cli:** migrate text-editor from tippy.js to Radix Popover ([#1506](https://github.com/tambo-ai/tambo/issues/1506)) ([554ce9e](https://github.com/tambo-ai/tambo/commit/554ce9eb1e2e4ee463af7a9a2157aa7ad4c4debb))

## [0.33.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.32.1...showcase-v0.33.0) (2025-12-10)


### Features

* integrate EditWithTambo component for inline component editing ([#1477](https://github.com/tambo-ai/tambo/issues/1477)) ([390c204](https://github.com/tambo-ai/tambo/commit/390c2045148c63dfb85f1988861e1cf6ad7f021e))
* **react-sdk:** add local resource registration to TamboRegistryProvider ([#1504](https://github.com/tambo-ai/tambo/issues/1504)) ([59c94a9](https://github.com/tambo-ai/tambo/commit/59c94a9214c165cbc6728d5a17f39697e4d4c370))


### Bug Fixes

* **editor:** Clean up message-input and text-editor to only expose a limited set of capabilities in the editor ([#1502](https://github.com/tambo-ai/tambo/issues/1502)) ([2938064](https://github.com/tambo-ai/tambo/commit/2938064b2ff4b4504af1e13de24117192a6dc811))
* **resources:** Make sure to show resource names in text editor and user messages ([#1497](https://github.com/tambo-ai/tambo/issues/1497)) ([b2d8013](https://github.com/tambo-ai/tambo/commit/b2d8013c0b4bf5fbf7801eca20e97fcf98b5ae55))


### Documentation

* **cli:** document useMergeRefs React 19 cleanup ([#1470](https://github.com/tambo-ai/tambo/issues/1470)) ([e215716](https://github.com/tambo-ai/tambo/commit/e21571673b4c92c6fedbb6e74dceb27b921d0a19))

## [0.32.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.32.0...showcase-v0.32.1) (2025-12-08)


### Bug Fixes

* **showcase:** do not render components twice in full screen mode ([#1490](https://github.com/tambo-ai/tambo/issues/1490)) ([331ede1](https://github.com/tambo-ai/tambo/commit/331ede1e3476cf704e929a7cfdb69d9181416608))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 4 updates ([#1483](https://github.com/tambo-ai/tambo/issues/1483)) ([892f7a4](https://github.com/tambo-ai/tambo/commit/892f7a4ed55beb99c5b540f2cb6139bb62dcd880))

## [0.32.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.31.0...showcase-v0.32.0) (2025-12-08)


### Features

* **cli:** bring wysiwyg editor into main message-input component ([#1415](https://github.com/tambo-ai/tambo/issues/1415)) ([6d0a89d](https://github.com/tambo-ai/tambo/commit/6d0a89dfa75c953279b56771209c74c4b3bcc58d))
* **mcp-resources:** Enable @-resource and /-command inline completion ([#1464](https://github.com/tambo-ai/tambo/issues/1464)) ([775ca87](https://github.com/tambo-ai/tambo/commit/775ca8789341de492bd084e1fbede76ffd3d1f8c))


### Bug Fixes

* **deps:** upgrade to zod v3 subpath imports and MCP SDK 1.24 ([#1465](https://github.com/tambo-ai/tambo/issues/1465)) ([c8b7f07](https://github.com/tambo-ai/tambo/commit/c8b7f079560d423082c005018a103b9eb3cf6993))
* **showcase:** improve header hierarchy on home and get-started ([#1421](https://github.com/tambo-ai/tambo/issues/1421)) ([93a590e](https://github.com/tambo-ai/tambo/commit/93a590e5c718b35f46618c2d2066ce93880bfc91))
* **showcase:** include all pages in sitemap ([#1417](https://github.com/tambo-ai/tambo/issues/1417)) ([49b4fa0](https://github.com/tambo-ai/tambo/commit/49b4fa07cb80e794472ccc5d437f243d2b2c4cc7))
* **showcase:** update robots.txt for TAM-559 ([#1418](https://github.com/tambo-ai/tambo/issues/1418)) ([c625fd9](https://github.com/tambo-ai/tambo/commit/c625fd916e845195092bb4f44b09e3c8939ef44c))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 4 updates ([#1431](https://github.com/tambo-ai/tambo/issues/1431)) ([50e1f34](https://github.com/tambo-ai/tambo/commit/50e1f3446320d3319339eef233fe3347576fff08))
* **deps:** Bump @tambo-ai/typescript-sdk to get updated enum ([#1445](https://github.com/tambo-ai/tambo/issues/1445)) ([7bee1f3](https://github.com/tambo-ai/tambo/commit/7bee1f32b7864d381eb2b5f346ec050ed61358a3))
* **deps:** bump next from 15.5.6 to 15.5.7 ([#1473](https://github.com/tambo-ai/tambo/issues/1473)) ([d8c7f1e](https://github.com/tambo-ai/tambo/commit/d8c7f1e0e8bab619daccf774822c421891ac3e5f))
* **deps:** bump recharts from 3.4.1 to 3.5.0 ([#1439](https://github.com/tambo-ai/tambo/issues/1439)) ([f2d2200](https://github.com/tambo-ai/tambo/commit/f2d220039cee70670c2740d46d192eed42e3894e))
* **deps:** bump the small-safe-packages group with 5 updates ([#1436](https://github.com/tambo-ai/tambo/issues/1436)) ([5974a87](https://github.com/tambo-ai/tambo/commit/5974a87c06577da92cd6ef9a500ebc9226f46fec))
* sync iconsize changes ([#1426](https://github.com/tambo-ai/tambo/issues/1426)) ([19d0528](https://github.com/tambo-ai/tambo/commit/19d052843d78c0b18134c89c2cfa7669b028e4f4))

## [0.31.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.30.0...showcase-v0.31.0) (2025-11-20)


### Features

* **mcp-resources:** Handle inline mcp resource references with correct prefix behavior, transforming to resource content nodes ([#1308](https://github.com/tambo-ai/tambo/issues/1308)) ([ae90e4a](https://github.com/tambo-ai/tambo/commit/ae90e4af67ea732dac7b795ba3ed873701e2cca8))
* merge cloud repo into mono repo ([#1314](https://github.com/tambo-ai/tambo/issues/1314)) ([6b88f60](https://github.com/tambo-ai/tambo/commit/6b88f609b3b7ba1b243a2be9a4bb426038e9e596))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 4 updates ([#1299](https://github.com/tambo-ai/tambo/issues/1299)) ([a5a7ecd](https://github.com/tambo-ai/tambo/commit/a5a7ecddb7e8fada5d4abf5ac4fd516e24d67b85))
* **deps-dev:** bump the eslint group with 4 updates ([#1299](https://github.com/tambo-ai/tambo/issues/1299)) ([3287eaf](https://github.com/tambo-ai/tambo/commit/3287eaf83e6068fe5d2e0774506da3acf29eeba3))
* **deps:** bump @modelcontextprotocol/sdk from 1.21.1 to 1.22.0 ([#1307](https://github.com/tambo-ai/tambo/issues/1307)) ([1242270](https://github.com/tambo-ai/tambo/commit/1242270c2e4949e2b4e342ed12da99dc29086a67))
* **deps:** bump @modelcontextprotocol/sdk from 1.21.1 to 1.22.0 ([#1307](https://github.com/tambo-ai/tambo/issues/1307)) ([3351269](https://github.com/tambo-ai/tambo/commit/3351269f793be2ef261de55f979f32d672f2b6eb))
* **deps:** bump recharts from 3.3.0 to 3.4.1 ([#1322](https://github.com/tambo-ai/tambo/issues/1322)) ([9fd3710](https://github.com/tambo-ai/tambo/commit/9fd37107757192f3d00462e542d60cf694d6eb04))
* **deps:** bump the small-safe-packages group with 7 updates ([#1319](https://github.com/tambo-ai/tambo/issues/1319)) ([5dfadc0](https://github.com/tambo-ai/tambo/commit/5dfadc07e9a13fcae9569cf5d939aa81a459df36))

## [0.30.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.29.0...showcase-v0.30.0) (2025-11-07)


### Features

* Add dictation to showcase ([#1261](https://github.com/tambo-ai/tambo/issues/1261)) ([3adf26c](https://github.com/tambo-ai/tambo/commit/3adf26c65f72e93cfc82cab6e1bece92729c8584))
* **mcp:** Add support for MCP Resources ([#1268](https://github.com/tambo-ai/tambo/issues/1268)) ([99b4f87](https://github.com/tambo-ai/tambo/commit/99b4f8748021a3333a1b772b6e280ad22ed389bc))


### Bug Fixes

* **mcp:** Update default transport type from SSE to HTTP for MCP ([#1250](https://github.com/tambo-ai/tambo/issues/1250)) ([679f508](https://github.com/tambo-ai/tambo/commit/679f508a38b1c77eb643712d97a3c5da039b682a))


### Miscellaneous Chores

* **lint:** Proactively fix some React 19 issues ([#1251](https://github.com/tambo-ai/tambo/issues/1251)) ([b1984ed](https://github.com/tambo-ai/tambo/commit/b1984ed6d97631f342677826232a10fb0a87cd51))

## [0.29.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.28.0...showcase-v0.29.0) (2025-11-04)


### Features

* Add showcase for elicitation ui ([#1233](https://github.com/tambo-ai/tambo/issues/1233)) ([89a91ab](https://github.com/tambo-ai/tambo/commit/89a91ab000722041ca8c183b7afdb5f8491b5ee3))
* **ui:** Update Design Token Usage in Component Library ([#1221](https://github.com/tambo-ai/tambo/issues/1221)) ([b2d16f6](https://github.com/tambo-ai/tambo/commit/b2d16f67df80a6cf28cfbec66a5e76d9297cf131))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 2 updates ([#1237](https://github.com/tambo-ai/tambo/issues/1237)) ([dc476b3](https://github.com/tambo-ai/tambo/commit/dc476b321bb4b351ea21b34386611ed1ecd02a82))
* **deps:** bump @tambo-ai/typescript-sdk from 0.75.1 to 0.76.0 ([#1241](https://github.com/tambo-ai/tambo/issues/1241)) ([62d792e](https://github.com/tambo-ai/tambo/commit/62d792e38cd34832e729219a4f1ea28424d85433))
* **deps:** bump lucide-react from 0.546.0 to 0.548.0 ([#1242](https://github.com/tambo-ai/tambo/issues/1242)) ([5824e0b](https://github.com/tambo-ai/tambo/commit/5824e0b1a8c6362cb476ee62959748ea85c31953))
* **showcase:** Simplify color system to neutral palette ([#1219](https://github.com/tambo-ai/tambo/issues/1219)) ([26f600f](https://github.com/tambo-ai/tambo/commit/26f600f643f0596d30d23ab18c7dc2fdadc7d5ca))


### Documentation

* **mcp-features:** Add docs for Prompts and Sampling ([#1247](https://github.com/tambo-ai/tambo/issues/1247)) ([599faaf](https://github.com/tambo-ai/tambo/commit/599faaf4ad7669423a4f9d89dc5758c7b3917c42))

## [0.28.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.27.0...showcase-v0.28.0) (2025-10-31)


### Features

* Add validation UI to elicitation ([#1220](https://github.com/tambo-ai/tambo/issues/1220)) ([417209d](https://github.com/tambo-ai/tambo/commit/417209de0edad1a17d42f527ed9320913b541a2d))

## [0.27.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.26.1...showcase-v0.27.0) (2025-10-31)


### Features

* add context badge for images ([#1192](https://github.com/tambo-ai/tambo/issues/1192)) ([020cd5e](https://github.com/tambo-ai/tambo/commit/020cd5e19285921bf0ef3086d3d84777bf694685))
* bump showcase components for sampling ui ([#1170](https://github.com/tambo-ai/tambo/issues/1170)) ([e205d93](https://github.com/tambo-ai/tambo/commit/e205d932f7bcf5df077ae61a08cc22f8e6086318))
* **mcp:** add prompts button, if there are prompts ([#1212](https://github.com/tambo-ai/tambo/issues/1212)) ([c4af432](https://github.com/tambo-ai/tambo/commit/c4af4323d0698d1a400ef3e07a2bcfd6bb3c390f))
* **mcp:** Elicitation support + default UI in showcase ([#1217](https://github.com/tambo-ai/tambo/issues/1217)) ([7e9c54a](https://github.com/tambo-ai/tambo/commit/7e9c54a0a968a76b1e61612fe90de8909d949676))


### Bug Fixes

* update tambo components in the showcase ([#1206](https://github.com/tambo-ai/tambo/issues/1206)) ([a93c96b](https://github.com/tambo-ai/tambo/commit/a93c96b8a4b7b0376d8752e387791a3e68804815))


### Miscellaneous Chores

* **config:** Align tsconfigs and eslint configs between docs, showcase, and base ([#1216](https://github.com/tambo-ai/tambo/issues/1216)) ([ab61266](https://github.com/tambo-ai/tambo/commit/ab61266f89f14084d9f9f8abc2098bc3a3cb3adf))
* **deps-dev:** bump @types/leaflet from 1.9.20 to 1.9.21 ([#1161](https://github.com/tambo-ai/tambo/issues/1161)) ([2e50825](https://github.com/tambo-ai/tambo/commit/2e5082517be1d135bc4a04ac28d09cf9f38d1e40))
* **deps-dev:** bump the eslint group across 1 directory with 5 updates ([#1203](https://github.com/tambo-ai/tambo/issues/1203)) ([5c44450](https://github.com/tambo-ai/tambo/commit/5c444508e2309ef8b4ec9c9050e408e19a8a6e48))
* **deps:** bump @tambo-ai/typescript-sdk from 0.73.0 to 0.75.0 ([#1179](https://github.com/tambo-ai/tambo/issues/1179)) ([e781957](https://github.com/tambo-ai/tambo/commit/e781957a758cdd3f5e820b24f8fe9266b3c86baf))
* **deps:** bump @tambo-ai/typescript-sdk from 0.75.0 to 0.75.1 ([#1208](https://github.com/tambo-ai/tambo/issues/1208)) ([76640d7](https://github.com/tambo-ai/tambo/commit/76640d7eab0202555ba699039152be7b656d40ef))
* **deps:** bump dompurify from 3.2.7 to 3.3.0 ([#1175](https://github.com/tambo-ai/tambo/issues/1175)) ([ffd2ec1](https://github.com/tambo-ai/tambo/commit/ffd2ec1b2eb56eaf92f2d7eb68a9529cc3da4f92))
* **deps:** bump framer-motion from 12.23.22 to 12.23.24 ([#1160](https://github.com/tambo-ai/tambo/issues/1160)) ([6dab68f](https://github.com/tambo-ai/tambo/commit/6dab68f916d255174b37c09c041ede244f9f8c4a))
* **deps:** bump lucide-react from 0.545.0 to 0.546.0 ([#1174](https://github.com/tambo-ai/tambo/issues/1174)) ([49dc23f](https://github.com/tambo-ai/tambo/commit/49dc23f7ae1b0d4a88a2cea38aaccab189afa023))
* **deps:** bump recharts from 3.2.1 to 3.3.0 ([#1199](https://github.com/tambo-ai/tambo/issues/1199)) ([1c5427c](https://github.com/tambo-ai/tambo/commit/1c5427c9a60145b67165c1a8247668c768ce438d))
* **deps:** bump streamdown from 1.3.0 to 1.4.0 ([#1181](https://github.com/tambo-ai/tambo/issues/1181)) ([441d3e0](https://github.com/tambo-ai/tambo/commit/441d3e0587d71fdfb63f2365c52d0aa88bfdbb21))
* **deps:** bump the next group with 2 updates ([#1172](https://github.com/tambo-ai/tambo/issues/1172)) ([61f92b6](https://github.com/tambo-ai/tambo/commit/61f92b6ee158f8f8b62f316d7c138937d851d132))
* update CLAUDE.md files to reference AGENTS.md properly ([#1214](https://github.com/tambo-ai/tambo/issues/1214)) ([22d6ea2](https://github.com/tambo-ai/tambo/commit/22d6ea28fd18c073b3f739d901121bb1e1e59e31))


### Code Refactoring

* **message:** simplify tool call request retrieval and enhance status message handling ([#1152](https://github.com/tambo-ai/tambo/issues/1152)) ([c866b67](https://github.com/tambo-ai/tambo/commit/c866b674e8fcc8524cf0de9e347902ac31efe81f))

## [0.26.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.26.0...showcase-v0.26.1) (2025-10-09)


### Bug Fixes

* **ui:** text pasting in the message input and update message component to use role instead of actionType ([#1139](https://github.com/tambo-ai/tambo/issues/1139)) ([48b9e5a](https://github.com/tambo-ai/tambo/commit/48b9e5ae11040f86a4a558c3c89e0b22bb8a6af4))

## [0.26.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.25.0...showcase-v0.26.0) (2025-10-08)


### Features

* **sidebar:** highlight active link ([#1121](https://github.com/tambo-ai/tambo/issues/1121)) ([6fe4682](https://github.com/tambo-ai/tambo/commit/6fe4682b2527f7cde53f29bb324f4b1b3495a084))


### Miscellaneous Chores

* **deps-dev:** bump the tailwind group with 2 updates ([#1126](https://github.com/tambo-ai/tambo/issues/1126)) ([0cb24a0](https://github.com/tambo-ai/tambo/commit/0cb24a0199da76e8283aafa7cf835c710c19db91))
* **deps:** bump @tambo-ai/typescript-sdk from 0.72.0 to 0.72.1 ([#1129](https://github.com/tambo-ai/tambo/issues/1129)) ([8d8cf9f](https://github.com/tambo-ai/tambo/commit/8d8cf9f2fe5c0661a576f8f77192d8b9c20ca62f))
* **deps:** bump @tambo-ai/typescript-sdk from 0.72.1 to 0.73.0 ([#1146](https://github.com/tambo-ai/tambo/issues/1146)) ([47432e7](https://github.com/tambo-ai/tambo/commit/47432e735d7ed3f6d6c99ac1cb727e86936d9c88))
* **deps:** bump lucide-react from 0.544.0 to 0.545.0 ([#1145](https://github.com/tambo-ai/tambo/issues/1145)) ([dae817d](https://github.com/tambo-ai/tambo/commit/dae817d5e0eb279cbb5d0f0a1ed10e98d38bf93b))

## [0.25.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.24.0...showcase-v0.25.0) (2025-10-02)


### Features

* add reasoning UI, smart autoscroll with UI improvements and update component paths to use /tambo ([#1101](https://github.com/tambo-ai/tambo/issues/1101)) ([9ec66c3](https://github.com/tambo-ai/tambo/commit/9ec66c37493eb636d5778e51ca8553ffb9982fc4))


### Bug Fixes

* **thread-history:** improve sidebar animation smoothness ([#1115](https://github.com/tambo-ai/tambo/issues/1115)) ([d65319e](https://github.com/tambo-ai/tambo/commit/d65319eb9078e248d4ca6bf649b2fb736b4d7022))


### Miscellaneous Chores

* add agents.md & claude.md to monorepo. ([#1116](https://github.com/tambo-ai/tambo/issues/1116)) ([fe911d4](https://github.com/tambo-ai/tambo/commit/fe911d4613b301cf9a68a6a95ebc2b7a6a294dd5))
* **deps-dev:** bump @types/leaflet.markercluster from 1.5.5 to 1.5.6 ([#1089](https://github.com/tambo-ai/tambo/issues/1089)) ([f0f09c8](https://github.com/tambo-ai/tambo/commit/f0f09c83e0415c1ac8ec40d022442fa140ac60a7))
* **deps-dev:** bump the eslint group across 1 directory with 6 updates ([#1097](https://github.com/tambo-ai/tambo/issues/1097)) ([a6fb6f1](https://github.com/tambo-ai/tambo/commit/a6fb6f1597380bb03f4700a2757edf1009095c6f))
* **deps:** bump @tambo-ai/typescript-sdk to 0.72 for reasoning shape ([#1072](https://github.com/tambo-ai/tambo/issues/1072)) ([a103b5f](https://github.com/tambo-ai/tambo/commit/a103b5fa250b334edaa4d81ba8fe82d36995ae7c))
* **deps:** bump @vercel/og from 0.6.8 to 0.8.5 ([#1086](https://github.com/tambo-ai/tambo/issues/1086)) ([d11379b](https://github.com/tambo-ai/tambo/commit/d11379b0cd77c680cbf0ffdf3ebf05c3dee83467))
* **deps:** bump dompurify from 3.2.6 to 3.2.7 ([#1111](https://github.com/tambo-ai/tambo/issues/1111)) ([024a6ca](https://github.com/tambo-ai/tambo/commit/024a6ca703652cdb1b014ef293e6a07a4eea2269))
* **deps:** bump framer-motion from 12.23.12 to 12.23.22 ([#1107](https://github.com/tambo-ai/tambo/issues/1107)) ([3c0ab4b](https://github.com/tambo-ai/tambo/commit/3c0ab4b9875e2d12166fceb98915a8ef34505118))
* **deps:** bump geist from 1.4.2 to 1.5.1 ([#1106](https://github.com/tambo-ai/tambo/issues/1106)) ([ef6f463](https://github.com/tambo-ai/tambo/commit/ef6f463d86d2e3dbd6b490cd24a08acaf531421c))
* **deps:** bump lucide-react from 0.542.0 to 0.544.0 ([#1105](https://github.com/tambo-ai/tambo/issues/1105)) ([8b5a36b](https://github.com/tambo-ai/tambo/commit/8b5a36b772300f164351443dafe2692432981cff))
* **deps:** bump next from 15.5.3 to 15.5.4 in the next group ([#1110](https://github.com/tambo-ai/tambo/issues/1110)) ([dd1a35d](https://github.com/tambo-ai/tambo/commit/dd1a35d669023d0440a885237e73d2109e247144))
* **deps:** bump recharts from 3.1.2 to 3.2.1 ([#1090](https://github.com/tambo-ai/tambo/issues/1090)) ([2ba7a11](https://github.com/tambo-ai/tambo/commit/2ba7a114b5e3c769cf846858e308928579491345))
* **deps:** bump streamdown from 1.2.0 to 1.3.0 ([#1093](https://github.com/tambo-ai/tambo/issues/1093)) ([761f213](https://github.com/tambo-ai/tambo/commit/761f213340ea0b611d8c712d1b5ca8fb744a8ace))

## [0.24.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.23.0...showcase-v0.24.0) (2025-09-19)


### Features

* **sdk:** Update to the new "typescript sdk" from stainless ([#1061](https://github.com/tambo-ai/tambo/issues/1061)) ([22dd7e3](https://github.com/tambo-ai/tambo/commit/22dd7e392cbf005a2d8bb7f43a813d53eee51611))


### Bug Fixes

* **react-sdk:** refetch thread list on new thread creation ([#1059](https://github.com/tambo-ai/tambo/issues/1059)) ([b2739ab](https://github.com/tambo-ai/tambo/commit/b2739abd46ff2cb786ef81b9a6efbb5180e17df6))


### Miscellaneous Chores

* **deps-dev:** bump @types/leaflet.heat from 0.2.4 to 0.2.5 ([#1053](https://github.com/tambo-ai/tambo/issues/1053)) ([cecfc79](https://github.com/tambo-ai/tambo/commit/cecfc796a9fea6bf4e1c1f94a94d814e9b18e066))
* **deps-dev:** bump the eslint group with 3 updates ([#1044](https://github.com/tambo-ai/tambo/issues/1044)) ([34d4b83](https://github.com/tambo-ai/tambo/commit/34d4b83660d1b8d3833d6c480ef236c44ac8a398))
* **deps:** bump next from 15.5.2 to 15.5.3 in the next group across 1 directory ([#1055](https://github.com/tambo-ai/tambo/issues/1055)) ([d21ecdb](https://github.com/tambo-ai/tambo/commit/d21ecdbc498ca018f2763b9f4f1df87fd2edafcc))
* **deps:** bump streamdown from 1.1.5 to 1.2.0 ([#1050](https://github.com/tambo-ai/tambo/issues/1050)) ([f78ae45](https://github.com/tambo-ai/tambo/commit/f78ae4545c1714df7a954ff513da47ef8bd8958e))
* **lint:** fix eslint config to make cursor/vscode happy ([#1069](https://github.com/tambo-ai/tambo/issues/1069)) ([6e84c6e](https://github.com/tambo-ai/tambo/commit/6e84c6e7cade904b74bc2491c5d7e023f89f15b0))
* remove producthunt banners, bubbles and widget ([#1065](https://github.com/tambo-ai/tambo/issues/1065)) ([7ceff06](https://github.com/tambo-ai/tambo/commit/7ceff06f312e404a0e1d3c81efec569139e6f847))
* **showcase:** generate and update sitemap ([#1023](https://github.com/tambo-ai/tambo/issues/1023)) ([04fb9ea](https://github.com/tambo-ai/tambo/commit/04fb9ea3a039bad159ba0cb4cd64bc7c2382476f))

## [0.23.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.22.0...showcase-v0.23.0) (2025-09-12)


### Features

* **image:** add image attachment support ([#1001](https://github.com/tambo-ai/tambo/issues/1001)) ([5a8e9a2](https://github.com/tambo-ai/tambo/commit/5a8e9a2267801feb1d24dd43e3bacd4fcc368b53))
* Replace TamboHackBanner with ProductHuntBanner ([#1035](https://github.com/tambo-ai/tambo/issues/1035)) ([7af2f53](https://github.com/tambo-ai/tambo/commit/7af2f5394c5d3d85ee7e0ec03b4b767df946d249))
* **sdk:** Add onCallUnregisteredTool callback for handling unexpected tool callbacks ([#1030](https://github.com/tambo-ai/tambo/issues/1030)) ([993405b](https://github.com/tambo-ai/tambo/commit/993405b6593b622f6ec755cf93d65c5272a49127))


### Miscellaneous Chores

* **showcase:** add robots.txt and sitemap link ([#1020](https://github.com/tambo-ai/tambo/issues/1020)) ([762f0cd](https://github.com/tambo-ai/tambo/commit/762f0cdc10d41e702b2964d86b1bf0eda3149656))
* **showcase:** Update meta and implement og and twitter image ([#1025](https://github.com/tambo-ai/tambo/issues/1025)) ([34a0be0](https://github.com/tambo-ai/tambo/commit/34a0be06e0479894a581b47d6e63a1523a64c64b))

## [0.22.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.21.0...showcase-v0.22.0) (2025-09-09)


### Features

* streamline type definition across all generative components ([#996](https://github.com/tambo-ai/tambo/issues/996)) ([896306f](https://github.com/tambo-ai/tambo/commit/896306f1a5544d0cd88f8f88bdf9285ca6e9b6a8))

## [0.21.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.20.1...showcase-v0.21.0) (2025-09-05)


### Features

* **docs:** setup ai page actions ([#943](https://github.com/tambo-ai/tambo/issues/943)) ([836d7a3](https://github.com/tambo-ai/tambo/commit/836d7a3c88edea65fc6441519cc574f53372e01b))

## [0.20.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.20.0...showcase-v0.20.1) (2025-09-04)


### Bug Fixes

* fixed the year on the sidebar ([#973](https://github.com/tambo-ai/tambo/issues/973)) ([e89127a](https://github.com/tambo-ai/tambo/commit/e89127a9782e563e46be153a65c618eaa8f443ae))


### Miscellaneous Chores

* **deps:** bump next from 15.5.1 to 15.5.2 in the next group across 1 directory ([#955](https://github.com/tambo-ai/tambo/issues/955)) ([c1b99f4](https://github.com/tambo-ai/tambo/commit/c1b99f4eb19edcd18456d1d2cf43df724129d6e9))

## [0.20.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.19.1...showcase-v0.20.0) (2025-08-28)


### Features

* migrate from react-markdown to streamdown ([#927](https://github.com/tambo-ai/tambo/issues/927)) ([fe5648e](https://github.com/tambo-ai/tambo/commit/fe5648e1e15d0181bc3bfc48bebdc556bb4be6b9))


### Miscellaneous Chores

* **deps-dev:** bump eslint-config-next from 15.5.0 to 15.5.2 in the eslint group ([#949](https://github.com/tambo-ai/tambo/issues/949)) ([61eba78](https://github.com/tambo-ai/tambo/commit/61eba784bac5c1b84eb7f7ba0acb4a0a8ab908fd))
* **deps-dev:** bump the eslint group with 5 updates ([#917](https://github.com/tambo-ai/tambo/issues/917)) ([ee0ee2e](https://github.com/tambo-ai/tambo/commit/ee0ee2e541d6a37322131a15cc02f6694436ceb3))
* **deps:** bump @tambo-ai/typescript-sdk to get deprecated ActionType ([#928](https://github.com/tambo-ai/tambo/issues/928)) ([0b316e6](https://github.com/tambo-ai/tambo/commit/0b316e6d842241069e8b17d5823b8b8df60cbaf8))
* **deps:** bump lucide-react from 0.540.0 to 0.541.0 ([#916](https://github.com/tambo-ai/tambo/issues/916)) ([50da283](https://github.com/tambo-ai/tambo/commit/50da2833e2e451211377cde13abd28d5835e2b7c))
* **deps:** bump next from 15.4.7 to 15.5.0 ([#914](https://github.com/tambo-ai/tambo/issues/914)) ([4c4ff85](https://github.com/tambo-ai/tambo/commit/4c4ff85c219e8018f743d5fbe32d8a2b111819dc))
* **deps:** bump streamdown from 1.1.3 to 1.1.5 ([#950](https://github.com/tambo-ai/tambo/issues/950)) ([5aff96d](https://github.com/tambo-ai/tambo/commit/5aff96daf6685b7b9198819aba3cb1576d9622a0))
* Fix react/mcp subpackage path ([#946](https://github.com/tambo-ai/tambo/issues/946)) ([180ed1b](https://github.com/tambo-ai/tambo/commit/180ed1be9c04dc58c256d1183cdfc812fb3b961b))
* fix tsconfig paths for react-sdk ([#945](https://github.com/tambo-ai/tambo/issues/945)) ([14dab2f](https://github.com/tambo-ai/tambo/commit/14dab2f4ae96e1a3c7b24cc84b0d15d74106f9a5))

## [0.19.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.19.0...showcase-v0.19.1) (2025-08-23)


### Miscellaneous Chores

* update dependencies and update message input handling ([#905](https://github.com/tambo-ai/tambo/issues/905)) ([8015195](https://github.com/tambo-ai/tambo/commit/80151952ea321f8cf65a5e9b447b84ea6986125e))

## [0.19.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.18.3...showcase-v0.19.0) (2025-08-22)


### Features

* **api:** stop using contextKey returned from API ([#868](https://github.com/tambo-ai/tambo/issues/868)) ([75e0bbb](https://github.com/tambo-ai/tambo/commit/75e0bbba441695aa7038f242e7ec4ed62b76e91c))
* useTamboThreadInput context return reactquery values ([#897](https://github.com/tambo-ai/tambo/issues/897)) ([13aeff6](https://github.com/tambo-ai/tambo/commit/13aeff669bd5760e4f8f93e9ff77dae301f4ba83))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 4 updates ([#846](https://github.com/tambo-ai/tambo/issues/846)) ([8675209](https://github.com/tambo-ai/tambo/commit/867520964bd1b4ad058281712e86defaeb195fd2))
* **deps:** bump lucide-react from 0.539.0 to 0.540.0 ([#849](https://github.com/tambo-ai/tambo/issues/849)) ([52f4804](https://github.com/tambo-ai/tambo/commit/52f48045cc051882c990b353c3ef9152717abe2a))
* **deps:** bump next from 15.4.6 to 15.4.7 ([#862](https://github.com/tambo-ai/tambo/issues/862)) ([7abc4f9](https://github.com/tambo-ai/tambo/commit/7abc4f97337d08adc5bd132dd4e6f44dfaea6b35))
* **deps:** bump recharts from 3.1.0 to 3.1.2 ([#864](https://github.com/tambo-ai/tambo/issues/864)) ([5cae69c](https://github.com/tambo-ai/tambo/commit/5cae69c5f8ce81809199d5c6a4671f257dc233a3))
* **deps:** bump the radix-ui group with 2 updates ([#847](https://github.com/tambo-ai/tambo/issues/847)) ([e8a3304](https://github.com/tambo-ai/tambo/commit/e8a3304bba7e8602c4a552b032cc3c7c29620545))
* **deps:** Fix some duplicated/misaligned [@types](https://github.com/types) versions ([#867](https://github.com/tambo-ai/tambo/issues/867)) ([0c3fcfe](https://github.com/tambo-ai/tambo/commit/0c3fcfe4a7356966e74104b5c60397aab7eb7848))
* fix message input demo in showcase ([#893](https://github.com/tambo-ai/tambo/issues/893)) ([3521d44](https://github.com/tambo-ai/tambo/commit/3521d44bf4ae2f9323597e9a0b2b29975ea439c7))

## [0.18.3](https://github.com/tambo-ai/tambo/compare/showcase-v0.18.2...showcase-v0.18.3) (2025-08-15)


### Bug Fixes

* split out provider values to prevent re-renders ([#816](https://github.com/tambo-ai/tambo/issues/816)) ([3360e9a](https://github.com/tambo-ai/tambo/commit/3360e9ab491c03a1a1da7101679ad88764dd6205))


### Miscellaneous

* **deps-dev:** bump the eslint group with 5 updates ([#826](https://github.com/tambo-ai/tambo/issues/826)) ([342097e](https://github.com/tambo-ai/tambo/commit/342097e15ae1503c3d3df5cffb0d96a829fd7f5f))
* **deps:** bump lucide-react from 0.536.0 to 0.539.0 ([#830](https://github.com/tambo-ai/tambo/issues/830)) ([1dfe483](https://github.com/tambo-ai/tambo/commit/1dfe483dc92ec6a3e043f9d15f958d183f87e557))
* **deps:** bump next from 15.4.4 to 15.4.6 ([#828](https://github.com/tambo-ai/tambo/issues/828)) ([a073604](https://github.com/tambo-ai/tambo/commit/a0736041c951d21c84c23979b617dc47d62648bd))

## [0.18.2](https://github.com/tambo-ai/tambo/compare/showcase-v0.18.1...showcase-v0.18.2) (2025-08-09)


### Miscellaneous

* **packages:** pin npm to 11.5.2, rereun npm install, npm dedupe ([#810](https://github.com/tambo-ai/tambo/issues/810)) ([e657057](https://github.com/tambo-ai/tambo/commit/e657057af2f3396dfa61d30670544a480ff97a24))

## [0.18.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.18.0...showcase-v0.18.1) (2025-08-07)


### Miscellaneous

* **deps-dev:** bump the eslint group across 1 directory with 2 updates ([#798](https://github.com/tambo-ai/tambo/issues/798)) ([a935277](https://github.com/tambo-ai/tambo/commit/a935277e2cfb6d9ff01c7a3084b6900d31855d45))
* **deps:** bump framer-motion from 12.23.11 to 12.23.12 ([#787](https://github.com/tambo-ai/tambo/issues/787)) ([ec2a0df](https://github.com/tambo-ai/tambo/commit/ec2a0dffd760c664a54bb086ed050e924a9c26c2))
* **deps:** bump lucide-react from 0.532.0 to 0.536.0 ([#781](https://github.com/tambo-ai/tambo/issues/781)) ([9f80a50](https://github.com/tambo-ai/tambo/commit/9f80a50c9359c3df741f329584608c35f7fbee58))

## [0.18.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.17.1...showcase-v0.18.0) (2025-08-05)


### Features

* add pre-built context helpers ([#769](https://github.com/tambo-ai/tambo/issues/769)) ([757448b](https://github.com/tambo-ai/tambo/commit/757448b949f33a89ad0bc25b56918d95748da5ab))

## [0.17.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.17.0...showcase-v0.17.1) (2025-08-04)


### Miscellaneous

* replace Server icon with custom MCPIcon in message input component ([#770](https://github.com/tambo-ai/tambo/issues/770)) ([865eaa3](https://github.com/tambo-ai/tambo/commit/865eaa3516d5e491ac27ee7c77dc13eef61e5ce0))

## [0.17.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.16.0...showcase-v0.17.0) (2025-07-31)


### Features

* move additional context to message request ([#740](https://github.com/tambo-ai/tambo/issues/740)) ([09386ba](https://github.com/tambo-ai/tambo/commit/09386babf964ccdb3f447242ab4b042b1cd3dac6))

## [0.16.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.15.1...showcase-v0.16.0) (2025-07-29)


### Features

* Add InteractiveMap component using react‑leaflet ([#678](https://github.com/tambo-ai/tambo/issues/678)) ([22b3862](https://github.com/tambo-ai/tambo/commit/22b3862cdefbe5d53425da0f7ad0167698847d09))
* **cli:** add mcpconfigbutton in message-input and remove mcp template ([#738](https://github.com/tambo-ai/tambo/issues/738)) ([7b29a20](https://github.com/tambo-ai/tambo/commit/7b29a20de9abbd450c931f9ce0fa63b3c923757d))


### Bug Fixes

* update thread-history search to search for thread name ([#717](https://github.com/tambo-ai/tambo/issues/717)) ([1deeec5](https://github.com/tambo-ai/tambo/commit/1deeec567c9df8eb5d312a24072d193189756312))


### Miscellaneous

* **deps-dev:** bump @types/recharts from 1.8.29 to 2.0.1 ([#729](https://github.com/tambo-ai/tambo/issues/729)) ([400dc89](https://github.com/tambo-ai/tambo/commit/400dc895653b487b3f3b0aad56145577557a8450))
* **deps-dev:** bump the eslint group with 4 updates ([#720](https://github.com/tambo-ai/tambo/issues/720)) ([fcfcb6c](https://github.com/tambo-ai/tambo/commit/fcfcb6c8f7e2c98139279cbb0fe41057f45f2f2a))
* **deps:** bump framer-motion from 12.23.6 to 12.23.11 ([#737](https://github.com/tambo-ai/tambo/issues/737)) ([e19f1e1](https://github.com/tambo-ai/tambo/commit/e19f1e1ab78484f73b64427ac6a39bfdc88d6c23))
* **deps:** bump lucide-react from 0.525.0 to 0.532.0 ([#721](https://github.com/tambo-ai/tambo/issues/721)) ([669a64d](https://github.com/tambo-ai/tambo/commit/669a64db44b1a87a078395b203b6327836fb857f))
* **deps:** bump next from 15.3.5 to 15.4.4 ([#724](https://github.com/tambo-ai/tambo/issues/724)) ([bcbc50a](https://github.com/tambo-ai/tambo/commit/bcbc50a4e7cea5fcf720ca6d0ffbe57c5897cf54))

## [0.15.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.15.0...showcase-v0.15.1) (2025-07-25)


### Bug Fixes

* small update to trigger release ([#711](https://github.com/tambo-ai/tambo/issues/711)) ([c153a02](https://github.com/tambo-ai/tambo/commit/c153a0277848430b1b9b20358abc6aa864bf6d91))

## [0.15.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.14.2...showcase-v0.15.0) (2025-07-25)


### Features

* add additionalContext support ([#702](https://github.com/tambo-ai/tambo/issues/702)) ([f269b31](https://github.com/tambo-ai/tambo/commit/f269b313053490dc417dc18cd6ab673f07f2fb74))


### Miscellaneous

* **deps-dev:** bump the eslint group with 5 updates ([#680](https://github.com/tambo-ai/tambo/issues/680)) ([846cf38](https://github.com/tambo-ai/tambo/commit/846cf38012985f02958cdec43d970be27e6d0f02))
* **deps:** bump framer-motion from 12.23.5 to 12.23.6 ([#685](https://github.com/tambo-ai/tambo/issues/685)) ([2730806](https://github.com/tambo-ai/tambo/commit/27308067a8241081f468eab8ea0588b867d8abfa))
* **deps:** bump next from 15.4.1 to 15.4.2 ([#684](https://github.com/tambo-ai/tambo/issues/684)) ([f2959f7](https://github.com/tambo-ai/tambo/commit/f2959f75841ba49947174379d9dc99a51fd8e360))
* **deps:** bump recharts from 3.0.2 to 3.1.0 ([#688](https://github.com/tambo-ai/tambo/issues/688)) ([99ba8d2](https://github.com/tambo-ai/tambo/commit/99ba8d2096cb07095888d84cb30ff1b3ad24161a))

## [0.14.2](https://github.com/tambo-ai/tambo/compare/showcase-v0.14.1...showcase-v0.14.2) (2025-07-18)


### Miscellaneous

* **deps-dev:** bump the eslint group across 1 directory with 5 updates ([#672](https://github.com/tambo-ai/tambo/issues/672)) ([28a6d93](https://github.com/tambo-ai/tambo/commit/28a6d93a686eebf8e102f74ddf989a8627d98e53))
* **deps:** bump framer-motion from 12.23.0 to 12.23.5 ([#662](https://github.com/tambo-ai/tambo/issues/662)) ([76ef846](https://github.com/tambo-ai/tambo/commit/76ef846ab6e7384c4ad55c1b2ee988a0680c2c33))
* **deps:** bump next from 15.3.5 to 15.4.1 ([#665](https://github.com/tambo-ai/tambo/issues/665)) ([649eb97](https://github.com/tambo-ai/tambo/commit/649eb9780612e59c9217de5d07894ec130994d4f))

## [0.14.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.14.0...showcase-v0.14.1) (2025-07-15)


### Bug Fixes

* with correct types, remove cast ([#652](https://github.com/tambo-ai/tambo/issues/652)) ([ccbd42e](https://github.com/tambo-ai/tambo/commit/ccbd42edd850fb79603f6ea26894b8bbc6278c63))


### Miscellaneous

* **deps-dev:** bump the eslint group with 5 updates ([#647](https://github.com/tambo-ai/tambo/issues/647)) ([32077e3](https://github.com/tambo-ai/tambo/commit/32077e36e194d712c7b1c7b8446ddd12aa7d1fe3))
* **deps:** bump framer-motion from 12.20.1 to 12.23.0 ([#637](https://github.com/tambo-ai/tambo/issues/637)) ([9b28c6b](https://github.com/tambo-ai/tambo/commit/9b28c6b9866eaaa0bc80a535844831e543eab087))
* **deps:** bump next from 15.3.4 to 15.3.5 ([#635](https://github.com/tambo-ai/tambo/issues/635)) ([63787c6](https://github.com/tambo-ai/tambo/commit/63787c6d582ad399229417d921248415be40b723))

## [0.14.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.13.0...showcase-v0.14.0) (2025-07-03)


### Features

* support accessToken ([#624](https://github.com/tambo-ai/tambo/issues/624)) ([2134cdc](https://github.com/tambo-ai/tambo/commit/2134cdc3c26aa319d5f77bec6dd779564284edfe))


### Bug Fixes

* showcase thread renaming and component variants ([#631](https://github.com/tambo-ai/tambo/issues/631)) ([cf3638e](https://github.com/tambo-ai/tambo/commit/cf3638e848afdb9a37e068f46c877a12900c716f))


### Miscellaneous

* update CLI init command with showcase link and add control bar to showcase ([#630](https://github.com/tambo-ai/tambo/issues/630)) ([63a381c](https://github.com/tambo-ai/tambo/commit/63a381cc9dbd9f5ba445012b71e8653c9e3d4bff))

## [0.13.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.12.0...showcase-v0.13.0) (2025-07-02)


### Features

* update components to show tool results ([#622](https://github.com/tambo-ai/tambo/issues/622)) ([b68ca9a](https://github.com/tambo-ai/tambo/commit/b68ca9ab7f0b5a0dea43357715ad6ffbaadffcb6))


### Miscellaneous

* **deps:** bump framer-motion from 12.19.1 to 12.20.1 ([#598](https://github.com/tambo-ai/tambo/issues/598)) ([71a4918](https://github.com/tambo-ai/tambo/commit/71a49184d586f755cfdd12590841feed5ab290eb))
* **deps:** bump lucide-react from 0.522.0 to 0.525.0 ([#608](https://github.com/tambo-ai/tambo/issues/608)) ([9330086](https://github.com/tambo-ai/tambo/commit/93300861b86cb04d2d45f958b734e38aa21794ea))
* **deps:** bump recharts from 2.15.3 to 3.0.2 ([#603](https://github.com/tambo-ai/tambo/issues/603)) ([62d8b0d](https://github.com/tambo-ai/tambo/commit/62d8b0d5831438312e7e05bf2f25f71ecb5607dd))
* **deps:** Manually bump typescript-sdk to 0.58 ([#612](https://github.com/tambo-ai/tambo/issues/612)) ([217c383](https://github.com/tambo-ai/tambo/commit/217c38395e82edebb4b01baa9b259363c7a7325d))

## [0.12.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.11.3...showcase-v0.12.0) (2025-06-26)


### Features

* add and expose `cancel` function to 'cancel' a generation ([#594](https://github.com/tambo-ai/tambo/issues/594)) ([661f31e](https://github.com/tambo-ai/tambo/commit/661f31ed3898e083e740f3975a6040966887324b))
* update showcase with updated ui components ([#597](https://github.com/tambo-ai/tambo/issues/597)) ([e27b28d](https://github.com/tambo-ai/tambo/commit/e27b28d0ba6ecf134bc3f0cd7b2c2b67648e3cfd))


### Miscellaneous

* **deps-dev:** bump prettier from 3.5.3 to 3.6.0 ([#591](https://github.com/tambo-ai/tambo/issues/591)) ([d678b2d](https://github.com/tambo-ai/tambo/commit/d678b2d8a64dd410ac95dd621614be24664f4447))
* **deps:** bump framer-motion from 12.18.1 to 12.19.1 ([#586](https://github.com/tambo-ai/tambo/issues/586)) ([d67604c](https://github.com/tambo-ai/tambo/commit/d67604c0933ed106952d6f166122311118de6ad2))
* **deps:** bump lucide-react from 0.518.0 to 0.522.0 ([#584](https://github.com/tambo-ai/tambo/issues/584)) ([a16d10a](https://github.com/tambo-ai/tambo/commit/a16d10a20134fd9a9bac321aa21ee4c0c1341abf))

## [0.11.3](https://github.com/tambo-ai/tambo/compare/showcase-v0.11.2...showcase-v0.11.3) (2025-06-19)


### Bug Fixes

* convert ThreadOptionsDropdown from forwardRef to regular function component ([#560](https://github.com/tambo-ai/tambo/issues/560)) ([7255a29](https://github.com/tambo-ai/tambo/commit/7255a2902a221d8f0f905b6a9f0fcd0a8e29d952))


### Miscellaneous

* bump dev to node 22 ([#569](https://github.com/tambo-ai/tambo/issues/569)) ([fd5209e](https://github.com/tambo-ai/tambo/commit/fd5209e74a88dd4676f663bf0161e0030e41a943))
* **deps-dev:** bump the eslint group with 2 updates ([#571](https://github.com/tambo-ai/tambo/issues/571)) ([80a95b7](https://github.com/tambo-ai/tambo/commit/80a95b7ee5e73f597c1d30c4a8f37bda1a31550e))
* **deps:** bump lucide-react from 0.516.0 to 0.518.0 ([#573](https://github.com/tambo-ai/tambo/issues/573)) ([066cafc](https://github.com/tambo-ai/tambo/commit/066cafc5e5e3538d93b695f4b0f43c627a226a3c))
* **deps:** bump next from 15.3.3 to 15.3.4 ([#575](https://github.com/tambo-ai/tambo/issues/575)) ([3108ded](https://github.com/tambo-ai/tambo/commit/3108ded8b1c317d1fb509974fdb59afb2095740b))

## [0.11.2](https://github.com/tambo-ai/tambo/compare/showcase-v0.11.1...showcase-v0.11.2) (2025-06-18)


### Bug Fixes

* update typescript-sdk to get updated component decision type ([#562](https://github.com/tambo-ai/tambo/issues/562)) ([9075b6e](https://github.com/tambo-ai/tambo/commit/9075b6e257e68d2b604b2450537cb16c67697719))

## [0.11.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.11.0...showcase-v0.11.1) (2025-06-17)


### Bug Fixes

* show tool calls even if they're run on the server ([#555](https://github.com/tambo-ai/tambo/issues/555)) ([3592614](https://github.com/tambo-ai/tambo/commit/35926149e7da38cbb4529f36e66b250bdbbdbcf2))


### Miscellaneous

* **deps-dev:** bump postcss from 8.5.4 to 8.5.6 ([#554](https://github.com/tambo-ai/tambo/issues/554)) ([65606ab](https://github.com/tambo-ai/tambo/commit/65606abe4475dfb60b27ddef2b128fe8298ee1a4))
* **deps-dev:** bump tailwind-merge from 3.3.0 to 3.3.1 ([#543](https://github.com/tambo-ai/tambo/issues/543)) ([508ca23](https://github.com/tambo-ai/tambo/commit/508ca2317517ca8a6d29202a8fa3225bfca5c4bf))
* **deps:** bump framer-motion from 12.16.0 to 12.18.1 ([#551](https://github.com/tambo-ai/tambo/issues/551)) ([087dce1](https://github.com/tambo-ai/tambo/commit/087dce14b653dfca5a2707a073bcd707c586ee29))
* **deps:** bump lucide-react from 0.513.0 to 0.516.0 ([#545](https://github.com/tambo-ai/tambo/issues/545)) ([a66372c](https://github.com/tambo-ai/tambo/commit/a66372c6f3dae1bca55fb3cfe3115e3c4abdfb0b))

## [0.11.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.10.0...showcase-v0.11.0) (2025-06-13)


### Features

* update thread-history in showcase ([#530](https://github.com/tambo-ai/tambo/issues/530)) ([00ed677](https://github.com/tambo-ai/tambo/commit/00ed677964c3b7f36c9278f1c54ec901f50cdda8))

## [0.10.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.9.0...showcase-v0.10.0) (2025-06-11)


### Features

* add threads to showcase, add stub to sdk ([#523](https://github.com/tambo-ai/tambo/issues/523)) ([5c3a194](https://github.com/tambo-ai/tambo/commit/5c3a1944aebc67732ca347fc74714d2fe7a27ac4))

## [0.9.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.8.3...showcase-v0.9.0) (2025-06-11)


### Features

* document primitives, elevate install instructions ([#520](https://github.com/tambo-ai/tambo/issues/520)) ([0fe0e11](https://github.com/tambo-ai/tambo/commit/0fe0e11e37941fb48be279b6046f53aed9620cfd))


### Miscellaneous

* **deps:** bump framer-motion from 12.15.0 to 12.16.0 ([#515](https://github.com/tambo-ai/tambo/issues/515)) ([0ee9692](https://github.com/tambo-ai/tambo/commit/0ee9692a4885adc7220add0a3fa21e238eb7fda9))
* **deps:** bump lucide-react from 0.511.0 to 0.513.0 ([#509](https://github.com/tambo-ai/tambo/issues/509)) ([0621840](https://github.com/tambo-ai/tambo/commit/06218400fd31482a8e45c9c81e30b2f754d10604))

## [0.8.3](https://github.com/tambo-ai/tambo/compare/showcase-v0.8.2...showcase-v0.8.3) (2025-06-02)


### Bug Fixes

* use proper whitespace wrapping and format tool params correctly ([#505](https://github.com/tambo-ai/tambo/issues/505)) ([2346610](https://github.com/tambo-ai/tambo/commit/23466105ae4a9c89c0a4fc3f37e7f2705393e8a4))


### Miscellaneous

* **deps-dev:** bump postcss from 8.5.3 to 8.5.4 ([#497](https://github.com/tambo-ai/tambo/issues/497)) ([9bc9ae3](https://github.com/tambo-ai/tambo/commit/9bc9ae3764342ac91e25dfa3e411cec9639e05ff))
* **deps-dev:** bump the eslint group with 6 updates ([#492](https://github.com/tambo-ai/tambo/issues/492)) ([9efc361](https://github.com/tambo-ai/tambo/commit/9efc3611ab68d4a38709d6f6b148f28f25258716))
* **deps:** bump framer-motion from 12.14.0 to 12.15.0 ([#494](https://github.com/tambo-ai/tambo/issues/494)) ([698a204](https://github.com/tambo-ai/tambo/commit/698a204e7e208f809b0476741bfca02f3baef296))
* **deps:** bump next from 15.3.2 to 15.3.3 ([#501](https://github.com/tambo-ai/tambo/issues/501)) ([29ea278](https://github.com/tambo-ai/tambo/commit/29ea2787fc38496dca5393f1c2e1088380d297a6))

## [0.8.2](https://github.com/tambo-ai/tambo/compare/showcase-v0.8.1...showcase-v0.8.2) (2025-05-31)


### Bug Fixes

* default to "fetching data" instead of "Choosing component" ([#475](https://github.com/tambo-ai/tambo/issues/475)) ([7a062e5](https://github.com/tambo-ai/tambo/commit/7a062e5f85702e5590326c2ce314c0414d2e4316))


### Miscellaneous

* add json-stringify-pretty-compact and ExternalLink component; enhance message styling ([#485](https://github.com/tambo-ai/tambo/issues/485)) ([644ab74](https://github.com/tambo-ai/tambo/commit/644ab74e5502f2d8f393e7b25de774f4c0900d95))

## [0.8.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.8.0...showcase-v0.8.1) (2025-05-30)


### Miscellaneous

* upgrade showcase message component ([#478](https://github.com/tambo-ai/tambo/issues/478)) ([7b57458](https://github.com/tambo-ai/tambo/commit/7b57458a25564b547d7690941898ffdb7693918c))

## [0.8.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.7.0...showcase-v0.8.0) (2025-05-28)


### Features

* improve ThreadContent component alignment and width TAM-141 ([#447](https://github.com/tambo-ai/tambo/issues/447)) ([a25ea61](https://github.com/tambo-ai/tambo/commit/a25ea61e9d23050f0a0da736be9db0caa9af3e8f))
* update showcase message component to show toolcall errors ([#425](https://github.com/tambo-ai/tambo/issues/425)) ([29ad9dd](https://github.com/tambo-ai/tambo/commit/29ad9dd23cf99f6d73d7d9864bb636b640fbaff1))
* update ThreadHistory to default to collapsed sidebar ([#427](https://github.com/tambo-ai/tambo/issues/427)) ([efa0894](https://github.com/tambo-ai/tambo/commit/efa0894b254c672cd5d2cb154c1e2a3eed8a274e))


### Bug Fixes

* **scrollable-message-container:** increase auto-scroll timeout to 250ms ([#449](https://github.com/tambo-ai/tambo/issues/449)) ([b09dbf1](https://github.com/tambo-ai/tambo/commit/b09dbf1b9da170795c18d841346e69639976a149))


### Miscellaneous

* **deps-dev:** bump tailwind-merge from 3.2.0 to 3.3.0 ([#431](https://github.com/tambo-ai/tambo/issues/431)) ([8945796](https://github.com/tambo-ai/tambo/commit/89457965415ce6cbaf14fc45adecd18804b7e2b4))
* **deps:** bump dompurify from 3.2.5 to 3.2.6 ([#435](https://github.com/tambo-ai/tambo/issues/435)) ([468e359](https://github.com/tambo-ai/tambo/commit/468e3599950cb917054bcbe8454f3d6cb66f1afa))
* **deps:** bump framer-motion from 12.11.0 to 12.12.1 ([#439](https://github.com/tambo-ai/tambo/issues/439)) ([5cc4d71](https://github.com/tambo-ai/tambo/commit/5cc4d71bf0d8bcd2337821b9082bf62e16c6af35))
* **deps:** bump framer-motion from 12.12.1 to 12.14.0 ([#456](https://github.com/tambo-ai/tambo/issues/456)) ([d3633fd](https://github.com/tambo-ai/tambo/commit/d3633fd855875133598fe6e2e97fd10a3c032140))
* **deps:** bump lucide-react from 0.510.0 to 0.511.0 ([#430](https://github.com/tambo-ai/tambo/issues/430)) ([c365176](https://github.com/tambo-ai/tambo/commit/c3651760e9bee10c51085d6dd76f48e2baa33c61))
* **deps:** bump next from 15.3.1 to 15.3.2 ([#440](https://github.com/tambo-ai/tambo/issues/440)) ([00af592](https://github.com/tambo-ai/tambo/commit/00af592e49360ae98d9bc8d7abab465004019ea4))
* **deps:** bump the radix-ui group with 3 updates ([#454](https://github.com/tambo-ai/tambo/issues/454)) ([25d9305](https://github.com/tambo-ai/tambo/commit/25d93059914e1b9c228523ac47cde7280d029402))
* update components, remove unused dependencies and improve TamboProvider integration in showcase components ([#472](https://github.com/tambo-ai/tambo/issues/472)) ([5e0a2af](https://github.com/tambo-ai/tambo/commit/5e0a2af28979e2319319655ae0a4b38527fdfc0d))

## [0.7.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.6.0...showcase-v0.7.0) (2025-05-13)


### Features

* enhance Graph component with Zod type included and better loading ([#409](https://github.com/tambo-ai/tambo/issues/409)) ([9f7078c](https://github.com/tambo-ai/tambo/commit/9f7078c66fa20b419780464ac771e4c755dbe0fb))


### Bug Fixes

* showcase component sidebar issues and update of form component ([#412](https://github.com/tambo-ai/tambo/issues/412)) ([bb3da9c](https://github.com/tambo-ai/tambo/commit/bb3da9c1085b61f655adeca958995b46f3f72b83))


### Miscellaneous

* **deps-dev:** bump the eslint group with 5 updates ([#401](https://github.com/tambo-ai/tambo/issues/401)) ([8e2439e](https://github.com/tambo-ai/tambo/commit/8e2439e2887bc7e13fa0cca09512a9a5d751b190))
* **deps:** bump framer-motion from 12.9.7 to 12.11.0 ([#402](https://github.com/tambo-ai/tambo/issues/402)) ([ecf0d62](https://github.com/tambo-ai/tambo/commit/ecf0d62bc83e743159026b1e5f4241906a61ba94))
* **deps:** bump geist from 1.4.1 to 1.4.2 ([#400](https://github.com/tambo-ai/tambo/issues/400)) ([6403e95](https://github.com/tambo-ai/tambo/commit/6403e95d423aeabc50e76b2a3fcfb6fb4f962512))
* **deps:** bump highlight.js from 10.7.3 to 11.11.1 ([#405](https://github.com/tambo-ai/tambo/issues/405)) ([157fbbb](https://github.com/tambo-ai/tambo/commit/157fbbb88d5bc4d44f57f6555a078e32c4b84bc3))
* **deps:** bump lucide-react from 0.507.0 to 0.510.0 ([#403](https://github.com/tambo-ai/tambo/issues/403)) ([78dfef1](https://github.com/tambo-ai/tambo/commit/78dfef131eef48339fdc3db6458d8e2ebb18fdbe))
* **deps:** bump the radix-ui group with 3 updates ([#399](https://github.com/tambo-ai/tambo/issues/399)) ([a068e9b](https://github.com/tambo-ai/tambo/commit/a068e9bc556d2311d66d1d40a9f0053ff873151c))

## [0.6.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.5.2...showcase-v0.6.0) (2025-05-08)


### Features

* add full-screen button to demos ([#388](https://github.com/tambo-ai/tambo/issues/388)) ([c9a5fc6](https://github.com/tambo-ai/tambo/commit/c9a5fc6d8d3f8789b46dcee0c1a52c17979dde0f))

## [0.5.2](https://github.com/tambo-ai/tambo/compare/showcase-v0.5.1...showcase-v0.5.2) (2025-05-07)


### Bug Fixes

* sidebar and message input resizing issues ([#386](https://github.com/tambo-ai/tambo/issues/386)) ([09a20dc](https://github.com/tambo-ai/tambo/commit/09a20dc53dd58b8723022b5d66e970dea8387ce2))

## [0.5.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.5.0...showcase-v0.5.1) (2025-05-07)


### Code Refactoring

* replace hardcoded context keys with useUserContextKey in message thread components ([#382](https://github.com/tambo-ai/tambo/issues/382)) ([57b900a](https://github.com/tambo-ai/tambo/commit/57b900a523dc77a36db3ce2f9f443f0c629dd248))

## [0.5.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.4.2...showcase-v0.5.0) (2025-05-07)


### Features

* update showcase with new components ([#367](https://github.com/tambo-ai/tambo/issues/367)) ([581359a](https://github.com/tambo-ai/tambo/commit/581359adc7f85433c08f7a3c5da7af65cb8529fc))


### Miscellaneous

* **deps:** bump framer-motion from 12.9.2 to 12.9.7 ([#371](https://github.com/tambo-ai/tambo/issues/371)) ([694e3f4](https://github.com/tambo-ai/tambo/commit/694e3f4032b0fcc2b77e9509c67ef139e64c05ea))
* **deps:** bump geist from 1.3.1 to 1.4.1 ([#374](https://github.com/tambo-ai/tambo/issues/374)) ([db2b2f6](https://github.com/tambo-ai/tambo/commit/db2b2f64bd26e47679ea3a866243afd62f0508be))
* **deps:** bump lucide-react from 0.503.0 to 0.507.0 ([#373](https://github.com/tambo-ai/tambo/issues/373)) ([ce4d1cf](https://github.com/tambo-ai/tambo/commit/ce4d1cfc6efef79ed45374899e8ee09b157391f0))
* **deps:** bump radix-ui from 1.2.0 to 1.3.3 in the radix-ui group ([#330](https://github.com/tambo-ai/tambo/issues/330)) ([27cbcc8](https://github.com/tambo-ai/tambo/commit/27cbcc86177dae5628c5e3389e15d10d8702c76a))
* **deps:** bump the radix-ui group with 2 updates ([#372](https://github.com/tambo-ai/tambo/issues/372)) ([9031420](https://github.com/tambo-ai/tambo/commit/90314200a15666d6df4c98402b7d47463b865ffa))

## [0.4.2](https://github.com/tambo-ai/tambo/compare/showcase-v0.4.1...showcase-v0.4.2) (2025-04-30)


### Miscellaneous

* **deps-dev:** bump eslint-config-next from 15.2.4 to 15.3.0 ([#317](https://github.com/tambo-ai/tambo/issues/317)) ([c5098cf](https://github.com/tambo-ai/tambo/commit/c5098cf66e2d0aec5cae4d606d13124bbe68d8d4))
* **deps-dev:** bump the eslint group with 4 updates ([#331](https://github.com/tambo-ai/tambo/issues/331)) ([7db258c](https://github.com/tambo-ai/tambo/commit/7db258c858f80c08e49625e3c90f89899282c574))
* **deps:** bump @radix-ui/react-slot from 1.1.2 to 1.2.0 in the radix-ui group ([#310](https://github.com/tambo-ai/tambo/issues/310)) ([fb16322](https://github.com/tambo-ai/tambo/commit/fb163225436c04e5ce1abd2d29a72b86c8a22d38))
* **deps:** bump framer-motion from 12.6.3 to 12.7.2 ([#315](https://github.com/tambo-ai/tambo/issues/315)) ([f464b13](https://github.com/tambo-ai/tambo/commit/f464b1310bd14500b592ccaceac49c748425b297))
* **deps:** bump framer-motion from 12.7.2 to 12.7.3 ([#328](https://github.com/tambo-ai/tambo/issues/328)) ([157a05b](https://github.com/tambo-ai/tambo/commit/157a05bd1bdb410a67c6bc1dd950c324f0bc7799))
* **deps:** bump framer-motion from 12.7.3 to 12.7.4 ([#336](https://github.com/tambo-ai/tambo/issues/336)) ([cad74cb](https://github.com/tambo-ai/tambo/commit/cad74cb2c403062ff23616e7323dab1afdec2ba1))
* **deps:** bump framer-motion from 12.7.4 to 12.9.2 ([#349](https://github.com/tambo-ai/tambo/issues/349)) ([c52e23a](https://github.com/tambo-ai/tambo/commit/c52e23a7abb69617d34f9b0124ab3e6a8da2f50f))
* **deps:** bump lucide-react from 0.487.0 to 0.488.0 ([#324](https://github.com/tambo-ai/tambo/issues/324)) ([e46f69c](https://github.com/tambo-ai/tambo/commit/e46f69c8193ef52b09903521d99b6fc3fcff5f65))
* **deps:** bump lucide-react from 0.488.0 to 0.503.0 ([#338](https://github.com/tambo-ai/tambo/issues/338)) ([15154ae](https://github.com/tambo-ai/tambo/commit/15154ae116df41f535b80c72e4489ea26358fd5a))
* **deps:** bump next from 15.2.4 to 15.3.0 ([#312](https://github.com/tambo-ai/tambo/issues/312)) ([9a68a8f](https://github.com/tambo-ai/tambo/commit/9a68a8ffe5ea622c10eed061ed2ac4e4df289f0c))
* **deps:** bump next from 15.3.0 to 15.3.1 ([#332](https://github.com/tambo-ai/tambo/issues/332)) ([d1b6d88](https://github.com/tambo-ai/tambo/commit/d1b6d883197a40af27adc91abd9e34692aa97044))
* **deps:** bump radix-ui from 1.1.3 to 1.2.0 ([#323](https://github.com/tambo-ai/tambo/issues/323)) ([784247e](https://github.com/tambo-ai/tambo/commit/784247e04ca27fbc38078f9a79a92cbd0cc1598d))
* **deps:** bump recharts from 2.15.2 to 2.15.3 ([#333](https://github.com/tambo-ai/tambo/issues/333)) ([65c3ca9](https://github.com/tambo-ai/tambo/commit/65c3ca9e47b82e4df51b92ef33054e9814151943))

## [0.4.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.4.0...showcase-v0.4.1) (2025-04-08)


### Bug Fixes

* add default value for showcase graph during streaming ([#304](https://github.com/tambo-ai/tambo/issues/304)) ([a1eb7bc](https://github.com/tambo-ai/tambo/commit/a1eb7bcf58312a18492b61dc2f5ff3ec5e22dacc))


### Miscellaneous

* **deps-dev:** bump tailwind-merge from 3.1.0 to 3.2.0 ([#302](https://github.com/tambo-ai/tambo/issues/302)) ([fb63160](https://github.com/tambo-ai/tambo/commit/fb63160467e861a6634a6ae0013c83b8284b98d3))

## [0.4.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.3.1...showcase-v0.4.0) (2025-04-07)


### Features

* **showcase:** re-design of showcase fixed TAM-51 ([#291](https://github.com/tambo-ai/tambo/issues/291)) ([f069608](https://github.com/tambo-ai/tambo/commit/f0696082fee5809a922e4fbd60b3712feca844bd))


### Miscellaneous

* **deps:** bump lucide-react from 0.486.0 to 0.487.0 ([#280](https://github.com/tambo-ai/tambo/issues/280)) ([4a36b58](https://github.com/tambo-ai/tambo/commit/4a36b5814b7590efa4fb13ac95c3f2e2d6dfaf90))
* **deps:** bump recharts from 2.15.1 to 2.15.2 ([#287](https://github.com/tambo-ai/tambo/issues/287)) ([cd139ba](https://github.com/tambo-ai/tambo/commit/cd139bafdbb24fadb9e96eb0f7791c0add541cef))

## [0.3.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.3.0...showcase-v0.3.1) (2025-04-03)


### Bug Fixes

* **showcase:** enable client-side rendering in AI elements section ([#265](https://github.com/tambo-ai/tambo/issues/265)) ([d360642](https://github.com/tambo-ai/tambo/commit/d360642531c8fecb5d7d3d9ea2d77d0410b47be4))
* **showcase:** handle not found page rendering in template component ([#268](https://github.com/tambo-ai/tambo/issues/268)) ([7713730](https://github.com/tambo-ai/tambo/commit/77137309c41b9c19112a8cb195d6accccc01c35d))

## [0.3.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.2.0...showcase-v0.3.0) (2025-04-02)


### Features

* useTamboThreads -&gt; useTamboThreadList ([#200](https://github.com/tambo-ai/tambo/issues/200)) ([4a32eda](https://github.com/tambo-ai/tambo/commit/4a32eda20b6564465b69bccda8ed94f65ea56b01))


### Bug Fixes

* allow for workspace version ([#213](https://github.com/tambo-ai/tambo/issues/213)) ([915d018](https://github.com/tambo-ai/tambo/commit/915d0182a54587e2a1293f3a4317968c3b799b73))
* minor component cleanups: stop using useEffect/etc ([#242](https://github.com/tambo-ai/tambo/issues/242)) ([7c6d334](https://github.com/tambo-ai/tambo/commit/7c6d334d500d909038469132123c9d163f2f7c5b))
* more mac kbd cleanup: quiet down hydration warnings ([#248](https://github.com/tambo-ai/tambo/issues/248)) ([bcf13e7](https://github.com/tambo-ai/tambo/commit/bcf13e72890c0bf0cfdd4352a742a4adcb6f05dc))
* try using tsconfig paths to link to react package ([#237](https://github.com/tambo-ai/tambo/issues/237)) ([d583844](https://github.com/tambo-ai/tambo/commit/d58384486c50fb26321835b92e41a241432584df))


### Miscellaneous

* **deps-dev:** bump eslint-config-next from 15.2.3 to 15.2.4 ([#226](https://github.com/tambo-ai/tambo/issues/226)) ([50ae465](https://github.com/tambo-ai/tambo/commit/50ae46558d00835092bdcc3b7cfa8388bf4716f5))
* **deps-dev:** bump tailwind-merge from 3.0.2 to 3.1.0 ([#228](https://github.com/tambo-ai/tambo/issues/228)) ([7cfe22f](https://github.com/tambo-ai/tambo/commit/7cfe22ff232c2e44d92ac2d4145e027e8ebcf546))
* **deps:** bump framer-motion from 12.6.0 to 12.6.2 ([#230](https://github.com/tambo-ai/tambo/issues/230)) ([351bf43](https://github.com/tambo-ai/tambo/commit/351bf43c83571ac0d41389121e1bc9fdeb0a5de5))
* **deps:** bump lucide-react from 0.483.0 to 0.486.0 ([#233](https://github.com/tambo-ai/tambo/issues/233)) ([1c25e6a](https://github.com/tambo-ai/tambo/commit/1c25e6a68bc23e85e2529ee33050fa35fde50341))
* **deps:** bump next from 15.2.3 to 15.2.4 ([#234](https://github.com/tambo-ai/tambo/issues/234)) ([de676db](https://github.com/tambo-ai/tambo/commit/de676db247d5f64793b36280946e2c5cbf88e970))
* fix thread-history and updated showcase site ([#204](https://github.com/tambo-ai/tambo/issues/204)) ([26c70cd](https://github.com/tambo-ai/tambo/commit/26c70cd841ef5bdeba7f755225ba57fe100c4429))


### Documentation

* update README files for React SDK and CLI, fix links and enhance installation instructions ([#251](https://github.com/tambo-ai/tambo/issues/251)) ([fa85f17](https://github.com/tambo-ai/tambo/commit/fa85f1701fe27fdd59b4d7f0f6741c392c08808d))

## [0.2.0](https://github.com/tambo-ai/tambo/compare/showcase-v0.1.4...showcase-v0.2.0) (2025-03-26)


### Features

* **showcase:** update the showcase site to show updated components ([#193](https://github.com/tambo-ai/tambo/issues/193)) ([2680fba](https://github.com/tambo-ai/tambo/commit/2680fbaf51f833e8742d44388b69c451226e529d))

## [0.1.4](https://github.com/tambo-ai/tambo/compare/showcase-v0.1.3...showcase-v0.1.4) (2025-03-25)


### Bug Fixes

* update showcase to be more clear ([#145](https://github.com/tambo-ai/tambo/issues/145)) ([eeb30bd](https://github.com/tambo-ai/tambo/commit/eeb30bd6c0b482f6a3cc6579206e96d840679b62))


### Miscellaneous

* **deps-dev:** bump eslint-config-next from 15.2.2 to 15.2.3 ([#186](https://github.com/tambo-ai/tambo/issues/186)) ([bf08b48](https://github.com/tambo-ai/tambo/commit/bf08b48f4c2d30b7c1d6430205f552389a885979))
* **deps-dev:** bump rimraf from 5.0.10 to 6.0.1 ([#135](https://github.com/tambo-ai/tambo/issues/135)) ([e86c774](https://github.com/tambo-ai/tambo/commit/e86c7742ddf854028b291754bac4e4eb95761b85))
* **deps:** bump groq-sdk from 0.15.0 to 0.16.0 ([#134](https://github.com/tambo-ai/tambo/issues/134)) ([054d538](https://github.com/tambo-ai/tambo/commit/054d538fff31849ad21f667778f62132f28e3d8d))
* **deps:** bump lucide-react from 0.479.0 to 0.482.0 ([#131](https://github.com/tambo-ai/tambo/issues/131)) ([9ba7e68](https://github.com/tambo-ai/tambo/commit/9ba7e681fdeb5c5c526bdd3e135945963225ba98))
* **deps:** bump lucide-react from 0.482.0 to 0.483.0 ([#179](https://github.com/tambo-ai/tambo/issues/179)) ([9f0f03a](https://github.com/tambo-ai/tambo/commit/9f0f03aa2183f63f65c260a6c9f9396ab8735e2e))
* **deps:** bump next from 15.2.2 to 15.2.3 in the npm_and_yarn group ([#168](https://github.com/tambo-ai/tambo/issues/168)) ([267fde4](https://github.com/tambo-ai/tambo/commit/267fde43315f6a07ecaece238d45557099b73dbd))
* **deps:** bump next-themes from 0.4.5 to 0.4.6 ([#136](https://github.com/tambo-ai/tambo/issues/136)) ([81ecfa0](https://github.com/tambo-ai/tambo/commit/81ecfa0e823a6fef1ef260e88bec2d078ea95542))
* pin stuff down to node &gt;=20 ([#159](https://github.com/tambo-ai/tambo/issues/159)) ([169797b](https://github.com/tambo-ai/tambo/commit/169797bc2800b1e42903d358f8023f391898b33f))
* remove some unused dependencies ([#152](https://github.com/tambo-ai/tambo/issues/152)) ([02f3e0d](https://github.com/tambo-ai/tambo/commit/02f3e0d0d7708ddcf72216a90167938ed1aab78a))
* removes old files and update readmes ([#117](https://github.com/tambo-ai/tambo/issues/117)) ([94e6dde](https://github.com/tambo-ai/tambo/commit/94e6dded0d8abd15b7f2b19c0837cf9baf2f279d))

## [0.1.3](https://github.com/tambo-ai/tambo/compare/showcase-v0.1.2...showcase-v0.1.3) (2025-03-11)


### Bug Fixes

* add individual release-please manifests as a test ([#106](https://github.com/tambo-ai/tambo/issues/106)) ([60edfde](https://github.com/tambo-ai/tambo/commit/60edfde4e039fba60003ea8fc6185cd4cb44141c))
* get rid of individual manifests, they do not work ([#108](https://github.com/tambo-ai/tambo/issues/108)) ([83bce6e](https://github.com/tambo-ai/tambo/commit/83bce6e4b66267375c018ee7ac82e40d6784141f))
* remove excess eslint stuff from showcase ([#104](https://github.com/tambo-ai/tambo/issues/104)) ([c86ea37](https://github.com/tambo-ai/tambo/commit/c86ea37ef9d76fdc06f0be3b9aa755d38cce186e))

## [0.1.2](https://github.com/tambo-ai/tambo/compare/showcase-v0.1.1...showcase-v0.1.2) (2025-03-11)


### Bug Fixes

* move a bunch of showcase stuff over to use SSR ([#95](https://github.com/tambo-ai/tambo/issues/95)) ([197d933](https://github.com/tambo-ai/tambo/commit/197d933a1a40545ba3b6e91d49962a01eeec3e37))

## [0.1.1](https://github.com/tambo-ai/tambo/compare/showcase-v0.1.0...showcase-v0.1.1) (2025-03-11)


### Bug Fixes

* get release-please package names right ([#86](https://github.com/tambo-ai/tambo/issues/86)) ([319a10f](https://github.com/tambo-ai/tambo/commit/319a10fa9296a1ce1f2de17646b0da00bea9db61))


### Miscellaneous

* **deps-dev:** bump eslint-config-next from 15.1.7 to 15.2.2 ([#79](https://github.com/tambo-ai/tambo/issues/79)) ([8d23f22](https://github.com/tambo-ai/tambo/commit/8d23f22df62ce2cc2ecb7eb7dc247e0fa3bf3b77))
* **deps:** bump lucide-react from 0.475.0 to 0.479.0 ([#80](https://github.com/tambo-ai/tambo/issues/80)) ([bc83442](https://github.com/tambo-ai/tambo/commit/bc83442d2c0c05a0c13ea0f0a1d4278dcd20baba))
* let showcase have shared eslint config ([#90](https://github.com/tambo-ai/tambo/issues/90)) ([1eefcf9](https://github.com/tambo-ai/tambo/commit/1eefcf98dbf073ce0d5404b63d59da9e1e4f7d50))
* remove unused api route ([c22fcf7](https://github.com/tambo-ai/tambo/commit/c22fcf7bd5c98a343a8e5de2535ec5a23621fdee))
* setup turbo ([#75](https://github.com/tambo-ai/tambo/issues/75)) ([11c0833](https://github.com/tambo-ai/tambo/commit/11c0833bf54f8bd0368da97855f18ca2832f7b47))
