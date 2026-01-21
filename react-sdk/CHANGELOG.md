# Changelog

## [0.69.1](https://github.com/tambo-ai/tambo/compare/react-v0.69.0...react-v0.69.1) (2026-01-16)


### Bug Fixes

* Allow multiple messages in response stream ([#1801](https://github.com/tambo-ai/tambo/issues/1801)) ([2bd74cf](https://github.com/tambo-ai/tambo/commit/2bd74cf201499c62273e73a2aa8cc6a22f62d95b))

## [0.69.0](https://github.com/tambo-ai/tambo/compare/react-v0.68.0...react-v0.69.0) (2026-01-15)


### Features

* **react-sdk:** Add streaming hint to enable tool streaming on the client ([#1685](https://github.com/tambo-ai/tambo/issues/1685)) ([c38f046](https://github.com/tambo-ai/tambo/commit/c38f046fda8a5ba2a3287ceab65ca10432be48fa))
* **showcase/message-input:** persist user input via session storage … ([#1259](https://github.com/tambo-ai/tambo/issues/1259)) ([0130917](https://github.com/tambo-ai/tambo/commit/013091741d78dfd3ae81ea6255bba26d1fd7786b))


### Bug Fixes

* don't send initialMessages on toolresponse ([#1783](https://github.com/tambo-ai/tambo/issues/1783)) ([16cb197](https://github.com/tambo-ai/tambo/commit/16cb19798ede07625b97701ce078552d03f76e55))
* **react-sdk:** replace any types with unknown in context helpers ([#1733](https://github.com/tambo-ai/tambo/issues/1733)) ([bfcf7cd](https://github.com/tambo-ai/tambo/commit/bfcf7cd873b387af02d9023fc000d153a7ff50fb))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 22.19.1 to 22.19.5 ([#1746](https://github.com/tambo-ai/tambo/issues/1746)) ([aa0ca84](https://github.com/tambo-ai/tambo/commit/aa0ca84eb3e5cc582290e6aa0df6672f4b404969))
* **deps-dev:** bump the eslint group with 2 updates ([#1739](https://github.com/tambo-ai/tambo/issues/1739)) ([c9818e2](https://github.com/tambo-ai/tambo/commit/c9818e2254c8a33bd1096d82846f2a4f09961923))


### Documentation

* update all port references from 3000/3001 to new ports ([#1725](https://github.com/tambo-ai/tambo/issues/1725)) ([db075e5](https://github.com/tambo-ai/tambo/commit/db075e5cb4cc2090ee5b372518f2a39980c153a0))


### Tests

* **react-sdk:** add test for is-promise.ts ([#1731](https://github.com/tambo-ai/tambo/issues/1731)) ([8ebad70](https://github.com/tambo-ai/tambo/commit/8ebad70e75b489cb460667677550950735a642d6))
* **react-sdk:** add tests for resource-validators.ts ([#1748](https://github.com/tambo-ai/tambo/issues/1748)) ([02f0471](https://github.com/tambo-ai/tambo/commit/02f04711f0aa6144e8ceae204c3ca19f142f353e))
* **react-sdk:** add tests for validate-component-name.ts-1657 ([#1764](https://github.com/tambo-ai/tambo/issues/1764)) ([c543064](https://github.com/tambo-ai/tambo/commit/c543064c9988a377107124d7cde931f57165b7cf))

## [0.68.0](https://github.com/tambo-ai/tambo/compare/react-v0.67.1...react-v0.68.0) (2025-12-18)


### Features

* **react-sdk:** add tools to update interactable component state ([#1580](https://github.com/tambo-ai/tambo/issues/1580)) ([d29c79e](https://github.com/tambo-ai/tambo/commit/d29c79e4a08683a42549985eed1363d8c981e767))


### Bug Fixes

* **react-sdk:** fetch client-side MCP resource content before sending ([#1574](https://github.com/tambo-ai/tambo/issues/1574)) ([bb2e987](https://github.com/tambo-ai/tambo/commit/bb2e9877c2688878b51b913d5ba79ddf79c26814))

## [0.67.1](https://github.com/tambo-ai/tambo/compare/react-v0.67.0...react-v0.67.1) (2025-12-17)


### Bug Fixes

* **react-sdk:** propagate resources stuff from TamboProvider -&gt; registry ([#1568](https://github.com/tambo-ai/tambo/issues/1568)) ([03ed3c2](https://github.com/tambo-ai/tambo/commit/03ed3c281070ed91a7e44415f4924b0bb497b295))
* **react-sdk:** update tests and components for contextKey refactor ([#1575](https://github.com/tambo-ai/tambo/issues/1575)) ([2e0ddcc](https://github.com/tambo-ai/tambo/commit/2e0ddccac6d946a82e461398a414e74a8993cb5f))


### Miscellaneous Chores

* add LICENSE files across workspaces ([#1532](https://github.com/tambo-ai/tambo/issues/1532)) ([6e41be5](https://github.com/tambo-ai/tambo/commit/6e41be55b85be629f9b23d5688d058ccd2bd57f8))
* **deps-dev:** bump the eslint group with 5 updates ([#1541](https://github.com/tambo-ai/tambo/issues/1541)) ([6329a46](https://github.com/tambo-ai/tambo/commit/6329a461e8b9f036e111e24890c27a98925f4d15))

## [0.67.0](https://github.com/tambo-ai/tambo/compare/react-v0.66.2...react-v0.67.0) (2025-12-15)


### Features

* send interactables internal state to tambo ([#1495](https://github.com/tambo-ai/tambo/issues/1495)) ([b5ff541](https://github.com/tambo-ai/tambo/commit/b5ff54181a1dbca84e318b59b828e66b1b4586d6))


### Bug Fixes

* **react-sdk:** inline reused Zod schemas in JSON Schema conversion ([#1536](https://github.com/tambo-ai/tambo/issues/1536)) ([eab83dc](https://github.com/tambo-ai/tambo/commit/eab83dcb2bec9191a3a69d39e3948f0390700115))


### Miscellaneous Chores

* **deps:** Bump @tambo-ai/typescript-sdk to get tool maxCalls ([#1533](https://github.com/tambo-ai/tambo/issues/1533)) ([97e85ba](https://github.com/tambo-ai/tambo/commit/97e85ba0eb334a8b3b482a0cff368d2528b91d74))

## [0.66.2](https://github.com/tambo-ai/tambo/compare/react-v0.66.1...react-v0.66.2) (2025-12-12)


### Bug Fixes

* **react:** correct inputSchema tool interface ([#1526](https://github.com/tambo-ai/tambo/issues/1526)) ([dcf3f81](https://github.com/tambo-ai/tambo/commit/dcf3f8141f1e613e851a651f63481581e7dc1ec6))
* **react:** prefer peer dep and zod 3 over zod 4 from peer ([#1524](https://github.com/tambo-ai/tambo/issues/1524)) ([4fcc5a8](https://github.com/tambo-ai/tambo/commit/4fcc5a8969bcf1243d2572e947c5f1f8a35a58d6))


### Miscellaneous Chores

* don't show EditWithTamboButton when component is in thread ([#1519](https://github.com/tambo-ai/tambo/issues/1519)) ([5e814e4](https://github.com/tambo-ai/tambo/commit/5e814e4c439f4f4869614035dcf61a9684d16689))

## [0.66.1](https://github.com/tambo-ai/tambo/compare/react-v0.66.0...react-v0.66.1) (2025-12-12)


### Bug Fixes

* **react:** correct schema parsing logic ([#1513](https://github.com/tambo-ai/tambo/issues/1513)) ([bf7a54a](https://github.com/tambo-ai/tambo/commit/bf7a54ae5515fa6386950a65b6eb03ca891ad250))

## [0.66.0](https://github.com/tambo-ai/tambo/compare/react-v0.65.3...react-v0.66.0) (2025-12-11)


### Features

* integrate EditWithTambo component for inline component editing ([#1477](https://github.com/tambo-ai/tambo/issues/1477)) ([390c204](https://github.com/tambo-ai/tambo/commit/390c2045148c63dfb85f1988861e1cf6ad7f021e))
* **react-sdk:** add local resource registration to TamboRegistryProvider ([#1504](https://github.com/tambo-ai/tambo/issues/1504)) ([59c94a9](https://github.com/tambo-ai/tambo/commit/59c94a9214c165cbc6728d5a17f39697e4d4c370))
* **react:** migrate to Standard Schema for schema conversion ([#1446](https://github.com/tambo-ai/tambo/issues/1446)) ([be5f2a0](https://github.com/tambo-ai/tambo/commit/be5f2a0052c0114ddf5ae2f2124e533c1cceaa7d))


### Bug Fixes

* **resources:** Make sure to show resource names in text editor and user messages ([#1497](https://github.com/tambo-ai/tambo/issues/1497)) ([b2d8013](https://github.com/tambo-ai/tambo/commit/b2d8013c0b4bf5fbf7801eca20e97fcf98b5ae55))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 4 updates ([#1483](https://github.com/tambo-ai/tambo/issues/1483)) ([892f7a4](https://github.com/tambo-ai/tambo/commit/892f7a4ed55beb99c5b540f2cb6139bb62dcd880))
* **deps-dev:** bump ts-jest from 29.4.5 to 29.4.6 in the testing group ([#1484](https://github.com/tambo-ai/tambo/issues/1484)) ([07a1253](https://github.com/tambo-ai/tambo/commit/07a125380a847816424b4dae304075b3726e1816))
* **deps:** bump the small-safe-packages group with 3 updates ([#1487](https://github.com/tambo-ai/tambo/issues/1487)) ([2178c32](https://github.com/tambo-ai/tambo/commit/2178c32ed7c962a915aa80694cc8e3c4a7f434ba))


### Code Refactoring

* **sdk:** Clean up registry provider in anticipation of registering local resources ([#1503](https://github.com/tambo-ai/tambo/issues/1503)) ([8180272](https://github.com/tambo-ai/tambo/commit/8180272206a761eaa2d8d61980a9c0d51f356783))

## [0.65.3](https://github.com/tambo-ai/tambo/compare/react-v0.65.2...react-v0.65.3) (2025-12-08)


### Bug Fixes

* **deps:** upgrade to zod v3 subpath imports and MCP SDK 1.24 ([#1465](https://github.com/tambo-ai/tambo/issues/1465)) ([c8b7f07](https://github.com/tambo-ai/tambo/commit/c8b7f079560d423082c005018a103b9eb3cf6993))
* **react-sdk,docs:** address streaming docs review feedback ([#1459](https://github.com/tambo-ai/tambo/issues/1459)) ([3fb4ed2](https://github.com/tambo-ai/tambo/commit/3fb4ed269c8ad13bd04c142743c2268ae8a29fec))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 4 updates ([#1431](https://github.com/tambo-ai/tambo/issues/1431)) ([50e1f34](https://github.com/tambo-ai/tambo/commit/50e1f3446320d3319339eef233fe3347576fff08))
* **deps:** Bump @tambo-ai/typescript-sdk to get updated enum ([#1445](https://github.com/tambo-ai/tambo/issues/1445)) ([7bee1f3](https://github.com/tambo-ai/tambo/commit/7bee1f32b7864d381eb2b5f346ec050ed61358a3))
* **deps:** bump the small-safe-packages group with 5 updates ([#1436](https://github.com/tambo-ai/tambo/issues/1436)) ([5974a87](https://github.com/tambo-ai/tambo/commit/5974a87c06577da92cd6ef9a500ebc9226f46fec))


### Documentation

* **react-sdk:** document streaming components pattern ([#1457](https://github.com/tambo-ai/tambo/issues/1457)) ([d0beb5a](https://github.com/tambo-ai/tambo/commit/d0beb5a9efe992137407c00481f342d38be9c293))
* **readme:** simplify and streamline README content ([#1450](https://github.com/tambo-ai/tambo/issues/1450)) ([9aed4de](https://github.com/tambo-ai/tambo/commit/9aed4dea2424f14ceef4d6747fe894895a21f3c9))


### Tests

* simplify coverage thresholds and fix CI coverage ([#1458](https://github.com/tambo-ai/tambo/issues/1458)) ([719b9e6](https://github.com/tambo-ai/tambo/commit/719b9e660700b5eb420b288cab52cbc11c83028d))

## [0.65.2](https://github.com/tambo-ai/tambo/compare/react-v0.65.1...react-v0.65.2) (2025-11-21)


### Documentation

* update MCP provider API usage to reflect v0.65.0 changes ([#1332](https://github.com/tambo-ai/tambo/issues/1332)) ([4dc2cc2](https://github.com/tambo-ai/tambo/commit/4dc2cc22a3d8b141c57fa8439b1f478b15ed4b9c))

## [0.65.1](https://github.com/tambo-ai/tambo/compare/react-v0.65.0...react-v0.65.1) (2025-11-21)

### Bug Fixes

- **react-sdk:** remove duplicate UseTamboThreadListConfig interface ([#1343](https://github.com/tambo-ai/tambo/issues/1343)) ([fd70897](https://github.com/tambo-ai/tambo/commit/fd7089787d7393b2198c41e7b496f7841ca482be))

## [0.65.0](https://github.com/tambo-ai/tambo/compare/react-v0.64.1...react-v0.65.0) (2025-11-20)

### Features

- **mcp-resources:** Handle inline mcp resource references with correct prefix behavior, transforming to resource content nodes ([#1308](https://github.com/tambo-ai/tambo/issues/1308)) ([ae90e4a](https://github.com/tambo-ai/tambo/commit/ae90e4af67ea732dac7b795ba3ed873701e2cca8))
- merge cloud repo into mono repo ([#1314](https://github.com/tambo-ai/tambo/issues/1314)) ([6b88f60](https://github.com/tambo-ai/tambo/commit/6b88f609b3b7ba1b243a2be9a4bb426038e9e596))

### Bug Fixes

- unnecessary edge case cannot be hit ([#1313](https://github.com/tambo-ai/tambo/issues/1313)) ([f317997](https://github.com/tambo-ai/tambo/commit/f317997c83d64511e20e2e8ad3ecfa00eee9bb2c))

### Miscellaneous Chores

- **deps-dev:** bump the eslint group with 4 updates ([#1299](https://github.com/tambo-ai/tambo/issues/1299)) ([a5a7ecd](https://github.com/tambo-ai/tambo/commit/a5a7ecddb7e8fada5d4abf5ac4fd516e24d67b85))
- **deps-dev:** bump the eslint group with 4 updates ([#1299](https://github.com/tambo-ai/tambo/issues/1299)) ([3287eaf](https://github.com/tambo-ai/tambo/commit/3287eaf83e6068fe5d2e0774506da3acf29eeba3))
- **deps:** bump @modelcontextprotocol/sdk from 1.21.0 to 1.21.1 ([#1286](https://github.com/tambo-ai/tambo/issues/1286)) ([90fb98c](https://github.com/tambo-ai/tambo/commit/90fb98cc3ba41b1a7d7baf501d8e96a81cb721f7))
- **deps:** bump @modelcontextprotocol/sdk from 1.21.0 to 1.21.1 ([#1286](https://github.com/tambo-ai/tambo/issues/1286)) ([dd1da5b](https://github.com/tambo-ai/tambo/commit/dd1da5b8a7f8343ee9ff3a9f8908f302fc4edca8))
- **deps:** bump @modelcontextprotocol/sdk from 1.21.1 to 1.22.0 ([#1307](https://github.com/tambo-ai/tambo/issues/1307)) ([1242270](https://github.com/tambo-ai/tambo/commit/1242270c2e4949e2b4e342ed12da99dc29086a67))
- **deps:** bump @modelcontextprotocol/sdk from 1.21.1 to 1.22.0 ([#1307](https://github.com/tambo-ai/tambo/issues/1307)) ([3351269](https://github.com/tambo-ai/tambo/commit/3351269f793be2ef261de55f979f32d672f2b6eb))
- **deps:** bump @tanstack/react-query from 5.90.7 to 5.90.9 ([#1305](https://github.com/tambo-ai/tambo/issues/1305)) ([5e97eee](https://github.com/tambo-ai/tambo/commit/5e97eeed16c05a1e2b12ee41e13ae2a2b547dfa9))
- **deps:** bump @tanstack/react-query from 5.90.7 to 5.90.9 ([#1305](https://github.com/tambo-ai/tambo/issues/1305)) ([616ba46](https://github.com/tambo-ai/tambo/commit/616ba465a9b5d23deb0c2b175210fb56c631b610))
- **readme:** improve readme nov 2025 v2 ([#1284](https://github.com/tambo-ai/tambo/issues/1284)) ([23f3670](https://github.com/tambo-ai/tambo/commit/23f3670ec8473a26ab5af611c8d6a7d1c635ca86))
- **readme:** improve readme nov 2025 v2 ([#1284](https://github.com/tambo-ai/tambo/issues/1284)) ([50ee523](https://github.com/tambo-ai/tambo/commit/50ee523dd379ffb1af6c48bb55b80ce3b7729d8a))

### Code Refactoring

- **mcp:** move MCP metadata and serverKey derivation to registry ([#1297](https://github.com/tambo-ai/tambo/issues/1297)) ([c284b9f](https://github.com/tambo-ai/tambo/commit/c284b9fbc08eb20a7da4890aeca4dc0a68757218))
- **mcp:** move MCP metadata and serverKey derivation to registry ([#1297](https://github.com/tambo-ai/tambo/issues/1297)) ([1bc4d46](https://github.com/tambo-ai/tambo/commit/1bc4d46b3bdd084e04265904df8777e871e792c4))

## [0.64.1](https://github.com/tambo-ai/tambo/compare/react-v0.64.0...react-v0.64.1) (2025-11-07)

### Miscellaneous Chores

- **deps-dev:** bump the eslint group with 6 updates ([#1272](https://github.com/tambo-ai/tambo/issues/1272)) ([39eafea](https://github.com/tambo-ai/tambo/commit/39eafea6fb20f5b4a7c262cf6ec8353d486dde13))
- **deps:** bump @modelcontextprotocol/sdk from 1.20.2 to 1.21.0 ([#1275](https://github.com/tambo-ai/tambo/issues/1275)) ([dd10756](https://github.com/tambo-ai/tambo/commit/dd107567963303382ea1cbe360c9217040b52250))
- **deps:** bump @tambo-ai/typescript-sdk from 0.76.0 to 0.77.0 ([#1278](https://github.com/tambo-ai/tambo/issues/1278)) ([5f46a57](https://github.com/tambo-ai/tambo/commit/5f46a576be373e7dac7f076a7c844db5faae27d8))
- **deps:** bump @tanstack/react-query from 5.90.6 to 5.90.7 ([#1273](https://github.com/tambo-ai/tambo/issues/1273)) ([b2669d1](https://github.com/tambo-ai/tambo/commit/b2669d196f646a42f7b1ad35ddc8fd11113d7968))

## [0.64.0](https://github.com/tambo-ai/tambo/compare/react-v0.63.0...react-v0.64.0) (2025-11-07)

### Features

- Add dictation to showcase ([#1261](https://github.com/tambo-ai/tambo/issues/1261)) ([3adf26c](https://github.com/tambo-ai/tambo/commit/3adf26c65f72e93cfc82cab6e1bece92729c8584))
- **mcp:** add prefixing to tools/prompts if there is &gt; 1 mcp server ([#1265](https://github.com/tambo-ai/tambo/issues/1265)) ([415d986](https://github.com/tambo-ai/tambo/commit/415d9868fff420286e2757f8bd580fa6b12f24f3))
- **mcp:** Add support for MCP Resources ([#1268](https://github.com/tambo-ai/tambo/issues/1268)) ([99b4f87](https://github.com/tambo-ai/tambo/commit/99b4f8748021a3333a1b772b6e280ad22ed389bc))

### Code Refactoring

- optimize currentIds lookup and ignore generated sitemaps ([#1262](https://github.com/tambo-ai/tambo/issues/1262)) ([48ad0f6](https://github.com/tambo-ai/tambo/commit/48ad0f68aba709975747d0122b5396154750a889))

## [0.63.0](https://github.com/tambo-ai/tambo/compare/react-v0.62.0...react-v0.63.0) (2025-11-05)

### Features

- add tambo context attachment provider ([#1258](https://github.com/tambo-ai/tambo/issues/1258)) ([eb20883](https://github.com/tambo-ai/tambo/commit/eb2088322ff4a3d1efabd5621cf29e6f9563e963))

## [0.62.0](https://github.com/tambo-ai/tambo/compare/react-v0.61.0...react-v0.62.0) (2025-11-05)

### Features

- add voice input ([#1234](https://github.com/tambo-ai/tambo/issues/1234)) ([88863aa](https://github.com/tambo-ai/tambo/commit/88863aa144572513261a2bd67e8c300c640298f1))
- add ZodLazy schema support to assertNoZodRecord validation (attempt 2) ([#1245](https://github.com/tambo-ai/tambo/issues/1245)) ([73d6361](https://github.com/tambo-ai/tambo/commit/73d636178c7ef3ad8b5782e44ed520b79dacdd46))

### Bug Fixes

- Make sure to error-out on z.record inside z.function() ([#1255](https://github.com/tambo-ai/tambo/issues/1255)) ([bbc3097](https://github.com/tambo-ai/tambo/commit/bbc3097bdafdb9caa720c735442a0792b883f7ed))
- **mcp:** Update default transport type from SSE to HTTP for MCP ([#1250](https://github.com/tambo-ai/tambo/issues/1250)) ([679f508](https://github.com/tambo-ai/tambo/commit/679f508a38b1c77eb643712d97a3c5da039b682a))

## [0.61.0](https://github.com/tambo-ai/tambo/compare/react-v0.60.0...react-v0.61.0) (2025-11-04)

### Features

- **react-sdk:** auto generate thread name ([#1185](https://github.com/tambo-ai/tambo/issues/1185)) ([991a567](https://github.com/tambo-ai/tambo/commit/991a567e3591c735f55022d5aae194eda88bd8f5))

### Miscellaneous Chores

- **deps-dev:** bump the eslint group with 2 updates ([#1237](https://github.com/tambo-ai/tambo/issues/1237)) ([dc476b3](https://github.com/tambo-ai/tambo/commit/dc476b321bb4b351ea21b34386611ed1ecd02a82))
- **deps:** bump @tambo-ai/typescript-sdk from 0.75.1 to 0.76.0 ([#1241](https://github.com/tambo-ai/tambo/issues/1241)) ([62d792e](https://github.com/tambo-ai/tambo/commit/62d792e38cd34832e729219a4f1ea28424d85433))
- **deps:** bump @tanstack/react-query from 5.90.5 to 5.90.6 ([#1240](https://github.com/tambo-ai/tambo/issues/1240)) ([40d9f21](https://github.com/tambo-ai/tambo/commit/40d9f2147e1926b86bf71942fc38208ae9fed48f))

## [0.60.0](https://github.com/tambo-ai/tambo/compare/react-v0.59.0...react-v0.60.0) (2025-10-30)

### Features

- **mcp:** add prompts button, if there are prompts ([#1212](https://github.com/tambo-ai/tambo/issues/1212)) ([c4af432](https://github.com/tambo-ai/tambo/commit/c4af4323d0698d1a400ef3e07a2bcfd6bb3c390f))
- **mcp:** Elicitation support + default UI in showcase ([#1217](https://github.com/tambo-ai/tambo/issues/1217)) ([7e9c54a](https://github.com/tambo-ai/tambo/commit/7e9c54a0a968a76b1e61612fe90de8909d949676))

### Bug Fixes

- better caching of prompts from mcp servers ([#1211](https://github.com/tambo-ai/tambo/issues/1211)) ([daebe5a](https://github.com/tambo-ai/tambo/commit/daebe5a70f96ffd49463009b9409edc93a199260))
- clean up mcp provider lifetime management, add more tests ([#1202](https://github.com/tambo-ai/tambo/issues/1202)) ([564f247](https://github.com/tambo-ai/tambo/commit/564f247832f0d91d6e5137f506762f07e9affe97))
- throw error when registered interactable's name is too long ([#1207](https://github.com/tambo-ai/tambo/issues/1207)) ([31fec80](https://github.com/tambo-ai/tambo/commit/31fec80d91100f7ca6dcb907ac30bf89b6245f6e))

### Miscellaneous Chores

- **deps-dev:** bump lint-staged from 16.2.4 to 16.2.6 ([#1201](https://github.com/tambo-ai/tambo/issues/1201)) ([b15e044](https://github.com/tambo-ai/tambo/commit/b15e044e755975eeec09903f2aac4f2292b65990))
- **deps-dev:** bump the eslint group across 1 directory with 5 updates ([#1203](https://github.com/tambo-ai/tambo/issues/1203)) ([5c44450](https://github.com/tambo-ai/tambo/commit/5c444508e2309ef8b4ec9c9050e408e19a8a6e48))
- **deps:** bump @modelcontextprotocol/sdk from 1.20.1 to 1.20.2 ([#1205](https://github.com/tambo-ai/tambo/issues/1205)) ([dd7db23](https://github.com/tambo-ai/tambo/commit/dd7db233ad6d992a5cb1db4bd3461f924f376e28))
- **deps:** bump @tambo-ai/typescript-sdk from 0.75.0 to 0.75.1 ([#1208](https://github.com/tambo-ai/tambo/issues/1208)) ([76640d7](https://github.com/tambo-ai/tambo/commit/76640d7eab0202555ba699039152be7b656d40ef))
- remove error log about tambo in browser ([#1215](https://github.com/tambo-ai/tambo/issues/1215)) ([7d2469b](https://github.com/tambo-ai/tambo/commit/7d2469b4622ca1612913e437e7edfbda263446ea))
- update CLAUDE.md files to reference AGENTS.md properly ([#1214](https://github.com/tambo-ai/tambo/issues/1214)) ([22d6ea2](https://github.com/tambo-ai/tambo/commit/22d6ea28fd18c073b3f739d901121bb1e1e59e31))

## [0.59.0](https://github.com/tambo-ai/tambo/compare/react-v0.58.1...react-v0.59.0) (2025-10-27)

### Features

- allow passing in elicitation/sampling handlers to provider ([#1196](https://github.com/tambo-ai/tambo/issues/1196)) ([119f8c5](https://github.com/tambo-ai/tambo/commit/119f8c537b4d6a8660aeac2f668394920afc1285))
- Dynamically add/remove the tambo MCP server as mcpAccessToken gets set ([#1182](https://github.com/tambo-ai/tambo/issues/1182)) ([7fd96e5](https://github.com/tambo-ai/tambo/commit/7fd96e5151daa7f2096127baac517a75d793fe3f))

## [0.58.1](https://github.com/tambo-ai/tambo/compare/react-v0.58.0...react-v0.58.1) (2025-10-22)

### Bug Fixes

- run transformToContent for streaming requests too ([#1184](https://github.com/tambo-ai/tambo/issues/1184)) ([42d8a82](https://github.com/tambo-ai/tambo/commit/42d8a82eff25836d021480ff3b9ca0fb3b9793cb))

## [0.58.0](https://github.com/tambo-ai/tambo/compare/react-v0.57.0...react-v0.58.0) (2025-10-21)

### Features

- (ui)show 'thought for x seconds' ([#1165](https://github.com/tambo-ai/tambo/issues/1165)) ([12d0ee1](https://github.com/tambo-ai/tambo/commit/12d0ee1edd8e1f132f00cb6e7f64216b80b9f090))
- **sdk:** Add client-side transformToContent callback in tool registration ([#1169](https://github.com/tambo-ai/tambo/issues/1169)) ([651dc01](https://github.com/tambo-ai/tambo/commit/651dc01649e17fce4bcfb778a041e7b7ef830dbf))

### Miscellaneous Chores

- **deps-dev:** bump lint-staged from 16.2.3 to 16.2.4 ([#1158](https://github.com/tambo-ai/tambo/issues/1158)) ([5bada01](https://github.com/tambo-ai/tambo/commit/5bada01943c582d7f1d4498a9c2e8d3cc15ca1ea))
- **deps-dev:** bump ts-jest from 29.4.4 to 29.4.5 in the testing group ([#1156](https://github.com/tambo-ai/tambo/issues/1156)) ([4387b93](https://github.com/tambo-ai/tambo/commit/4387b932f370212788fa135c5f261f25ccccdd22))
- **deps:** bump @modelcontextprotocol/sdk from 1.19.1 to 1.20.0 ([#1159](https://github.com/tambo-ai/tambo/issues/1159)) ([e586d2b](https://github.com/tambo-ai/tambo/commit/e586d2b79707707ac6e49c4c6dddfe0c30d05300))
- **deps:** bump @modelcontextprotocol/sdk from 1.20.0 to 1.20.1 ([#1180](https://github.com/tambo-ai/tambo/issues/1180)) ([629deb3](https://github.com/tambo-ai/tambo/commit/629deb3e3bfceb7024e0afa99e7ead7588233ff4))
- **deps:** bump @tambo-ai/typescript-sdk from 0.73.0 to 0.75.0 ([#1179](https://github.com/tambo-ai/tambo/issues/1179)) ([e781957](https://github.com/tambo-ai/tambo/commit/e781957a758cdd3f5e820b24f8fe9266b3c86baf))
- **deps:** bump @tanstack/react-query from 5.90.2 to 5.90.5 ([#1176](https://github.com/tambo-ai/tambo/issues/1176)) ([4a975ea](https://github.com/tambo-ai/tambo/commit/4a975ea296460887c2aa56f11a728ce88ba7f660))

## [0.57.0](https://github.com/tambo-ai/tambo/compare/react-v0.56.0...react-v0.57.0) (2025-10-09)

### Features

- initial messages ([#1000](https://github.com/tambo-ai/tambo/issues/1000)) ([7d7a52a](https://github.com/tambo-ai/tambo/commit/7d7a52ab45f8d230b428cb83cace36cc1037152f))

## [0.56.0](https://github.com/tambo-ai/tambo/compare/react-v0.55.0...react-v0.56.0) (2025-10-07)

### Features

- **mcp:** Add support for sampling + elicitations to internal MCPClient ([#1119](https://github.com/tambo-ai/tambo/issues/1119)) ([c9ba1a3](https://github.com/tambo-ai/tambo/commit/c9ba1a3be36666163f2cdfb5f5705854d388046d))

### Miscellaneous Chores

- **api:** remove includeInternal - we always pass true anyway ([#1138](https://github.com/tambo-ai/tambo/issues/1138)) ([44eadfb](https://github.com/tambo-ai/tambo/commit/44eadfbd261c2aea87bd0b708852b960fe21f5b9))
- **deps-dev:** bump @testing-library/jest-dom from 6.8.0 to 6.9.1 in the testing group ([#1125](https://github.com/tambo-ai/tambo/issues/1125)) ([09a7caa](https://github.com/tambo-ai/tambo/commit/09a7caa92044ce6c11c1c40a9f724870ad7dcc54))
- **deps-dev:** bump the eslint group with 5 updates ([#1123](https://github.com/tambo-ai/tambo/issues/1123)) ([59e0892](https://github.com/tambo-ai/tambo/commit/59e0892044036c974ae121ab35b98093ec66cfd4))
- **deps-dev:** bump typescript from 5.9.2 to 5.9.3 ([#1132](https://github.com/tambo-ai/tambo/issues/1132)) ([94b23a4](https://github.com/tambo-ai/tambo/commit/94b23a47d2d347033a15a2232b7c04216c982ad3))
- **deps:** bump @modelcontextprotocol/sdk from 1.18.2 to 1.19.1 ([#1127](https://github.com/tambo-ai/tambo/issues/1127)) ([77cf12a](https://github.com/tambo-ai/tambo/commit/77cf12a1706b9dcdf29260f4d0ff11ab3a72a7f5))
- **deps:** bump @tambo-ai/typescript-sdk from 0.72.0 to 0.72.1 ([#1129](https://github.com/tambo-ai/tambo/issues/1129)) ([8d8cf9f](https://github.com/tambo-ai/tambo/commit/8d8cf9f2fe5c0661a576f8f77192d8b9c20ca62f))

## [0.55.0](https://github.com/tambo-ai/tambo/compare/react-v0.54.1...react-v0.55.0) (2025-10-01)

### Features

- **mcp:** add very early session support ([#1117](https://github.com/tambo-ai/tambo/issues/1117)) ([0a441b7](https://github.com/tambo-ai/tambo/commit/0a441b7d2d1dc68a43fbe265bb806864ad9f9544))

### Miscellaneous Chores

- add agents.md & claude.md to monorepo. ([#1116](https://github.com/tambo-ai/tambo/issues/1116)) ([fe911d4](https://github.com/tambo-ai/tambo/commit/fe911d4613b301cf9a68a6a95ebc2b7a6a294dd5))
- **deps-dev:** bump the eslint group across 1 directory with 6 updates ([#1097](https://github.com/tambo-ai/tambo/issues/1097)) ([a6fb6f1](https://github.com/tambo-ai/tambo/commit/a6fb6f1597380bb03f4700a2757edf1009095c6f))
- **deps-dev:** bump the eslint group with 2 updates ([#1102](https://github.com/tambo-ai/tambo/issues/1102)) ([81b6601](https://github.com/tambo-ai/tambo/commit/81b6601df999b36bc51958a36c9164ef897734a4))
- **deps-dev:** bump the testing group with 2 updates ([#1108](https://github.com/tambo-ai/tambo/issues/1108)) ([28b2c0f](https://github.com/tambo-ai/tambo/commit/28b2c0fe293c4fb437c2d105c8cc41154b4e135a))
- **deps-dev:** bump ts-jest from 29.4.2 to 29.4.4 in the testing group ([#1087](https://github.com/tambo-ai/tambo/issues/1087)) ([625384c](https://github.com/tambo-ai/tambo/commit/625384c0bc2130e76fb637d889aa25667543970a))
- **deps:** bump @modelcontextprotocol/sdk from 1.17.4 to 1.18.2 ([#1104](https://github.com/tambo-ai/tambo/issues/1104)) ([3e436b9](https://github.com/tambo-ai/tambo/commit/3e436b9721044b1e7668afcb997705e262f4dba4))
- **deps:** bump @tanstack/react-query from 5.87.4 to 5.90.1 ([#1092](https://github.com/tambo-ai/tambo/issues/1092)) ([4ac242f](https://github.com/tambo-ai/tambo/commit/4ac242fbf306cee31135dd422a3115bb05b4a223))
- **deps:** bump @tanstack/react-query from 5.90.1 to 5.90.2 ([#1113](https://github.com/tambo-ai/tambo/issues/1113)) ([97049af](https://github.com/tambo-ai/tambo/commit/97049af0246f19fc114b26a1f35fda7a1c8bfbc0))
- **deps:** bump fast-equals from 5.2.2 to 5.3.2 ([#1103](https://github.com/tambo-ai/tambo/issues/1103)) ([2a5a6b4](https://github.com/tambo-ai/tambo/commit/2a5a6b4e1e941816a0e035ee4efab9dd8312db10))

### Documentation

- Fix react-sdk docs for typos ([#1082](https://github.com/tambo-ai/tambo/issues/1082)) ([3943de1](https://github.com/tambo-ai/tambo/commit/3943de15bce557efce2cb2016fe203dd89a7ad1c))

## [0.54.1](https://github.com/tambo-ai/tambo/compare/react-v0.54.0...react-v0.54.1) (2025-09-20)

### Bug Fixes

- add validation to prevent spaces in component and tool names ([#1079](https://github.com/tambo-ai/tambo/issues/1079)) ([0ede1eb](https://github.com/tambo-ai/tambo/commit/0ede1eb88fa22476c2662cdab3ef91b07b7ad5d6))
- **mcp:** Handle cases where the server list changes ([#1080](https://github.com/tambo-ai/tambo/issues/1080)) ([86bf03e](https://github.com/tambo-ai/tambo/commit/86bf03eac65fef399abf0e02283c47c2aa166e00))
- update typo ([#1078](https://github.com/tambo-ai/tambo/issues/1078)) ([1a8fb47](https://github.com/tambo-ai/tambo/commit/1a8fb473d49f74aea0211ce5c1acb21f75e7a38e))

### Miscellaneous Chores

- **deps:** bump @tambo-ai/typescript-sdk to 0.72 for reasoning shape ([#1072](https://github.com/tambo-ai/tambo/issues/1072)) ([a103b5f](https://github.com/tambo-ai/tambo/commit/a103b5fa250b334edaa4d81ba8fe82d36995ae7c))

## [0.54.0](https://github.com/tambo-ai/tambo/compare/react-v0.53.2...react-v0.54.0) (2025-09-19)

### Features

- **mcp:** Add hook to get at MCP servers for reconnection ([#1066](https://github.com/tambo-ai/tambo/issues/1066)) ([23e4767](https://github.com/tambo-ai/tambo/commit/23e476735cd2e59a61f1f766532e8fb6b7c97b1b))

## [0.53.2](https://github.com/tambo-ai/tambo/compare/react-v0.53.1...react-v0.53.2) (2025-09-19)

### Miscellaneous Chores

- **lint:** fix eslint config to make cursor/vscode happy ([#1069](https://github.com/tambo-ai/tambo/issues/1069)) ([6e84c6e](https://github.com/tambo-ai/tambo/commit/6e84c6e7cade904b74bc2491c5d7e023f89f15b0))

## [0.53.1](https://github.com/tambo-ai/tambo/compare/react-v0.53.0...react-v0.53.1) (2025-09-19)

### Bug Fixes

- **react-sdk:** refetch thread list on new thread creation ([#1059](https://github.com/tambo-ai/tambo/issues/1059)) ([b2739ab](https://github.com/tambo-ai/tambo/commit/b2739abd46ff2cb786ef81b9a6efbb5180e17df6))

## [0.53.0](https://github.com/tambo-ai/tambo/compare/react-v0.52.0...react-v0.53.0) (2025-09-17)

### Features

- **sdk:** Update to the new "typescript sdk" from stainless ([#1061](https://github.com/tambo-ai/tambo/issues/1061)) ([22dd7e3](https://github.com/tambo-ai/tambo/commit/22dd7e392cbf005a2d8bb7f43a813d53eee51611))

## [0.52.0](https://github.com/tambo-ai/tambo/compare/react-v0.51.0...react-v0.52.0) (2025-09-17)

### Features

- **mcp:** Add reconnection logic + method to MCP Client ([#1060](https://github.com/tambo-ai/tambo/issues/1060)) ([3759258](https://github.com/tambo-ai/tambo/commit/37592580be8977c0dcc2002211e7bc7053a3b673))

## [0.51.0](https://github.com/tambo-ai/tambo/compare/react-v0.50.0...react-v0.51.0) (2025-09-17)

### Features

- **sdk:** partial updates for interactables + auto tools + new docs ([#1036](https://github.com/tambo-ai/tambo/issues/1036)) ([7352f12](https://github.com/tambo-ai/tambo/commit/7352f1274c399215bfc99b4bbd69b3db4b7364cc))

### Miscellaneous Chores

- **deps-dev:** bump lint-staged from 16.1.5 to 16.1.6 ([#1048](https://github.com/tambo-ai/tambo/issues/1048)) ([3791b74](https://github.com/tambo-ai/tambo/commit/3791b749feb6a62be4157c1f40100aeecbb3d0a1))
- **deps-dev:** bump the eslint group with 3 updates ([#1044](https://github.com/tambo-ai/tambo/issues/1044)) ([34d4b83](https://github.com/tambo-ai/tambo/commit/34d4b83660d1b8d3833d6c480ef236c44ac8a398))
- **deps-dev:** bump ts-jest from 29.4.1 to 29.4.2 in the testing group ([#1047](https://github.com/tambo-ai/tambo/issues/1047)) ([3ca8153](https://github.com/tambo-ai/tambo/commit/3ca8153eaadd74abb2608eba2d6953f01437b6f8))
- **deps:** bump @tanstack/react-query from 5.85.5 to 5.87.4 ([#1052](https://github.com/tambo-ai/tambo/issues/1052)) ([42010df](https://github.com/tambo-ai/tambo/commit/42010df6bee9236e7077795668d6990cc183ca87))

## [0.50.0](https://github.com/tambo-ai/tambo/compare/react-v0.49.0...react-v0.50.0) (2025-09-11)

### Features

- **image:** add image attachment support ([#1001](https://github.com/tambo-ai/tambo/issues/1001)) ([5a8e9a2](https://github.com/tambo-ai/tambo/commit/5a8e9a2267801feb1d24dd43e3bacd4fcc368b53))

## [0.49.0](https://github.com/tambo-ai/tambo/compare/react-v0.48.0...react-v0.49.0) (2025-09-10)

### Features

- **sdk:** Add onCallUnregisteredTool callback for handling unexpected tool callbacks ([#1030](https://github.com/tambo-ai/tambo/issues/1030)) ([993405b](https://github.com/tambo-ai/tambo/commit/993405b6593b622f6ec755cf93d65c5272a49127))

## [0.48.0](https://github.com/tambo-ai/tambo/compare/react-v0.47.0...react-v0.48.0) (2025-09-09)

### Features

- **interactables:** Add automatic context injection for interactable components that sends their current state to the AI by default. ([#977](https://github.com/tambo-ai/tambo/issues/977)) ([bdec8f9](https://github.com/tambo-ai/tambo/commit/bdec8f9a3097d7bae52086b6ff0699e0e6759e12))

### Bug Fixes

- Extract error messages from mcp tool response content array ([#1016](https://github.com/tambo-ai/tambo/issues/1016)) ([5a7057e](https://github.com/tambo-ai/tambo/commit/5a7057eae1649da1f6debb2582153ba24f8613d7))

### Miscellaneous Chores

- **deps-dev:** bump the eslint group with 4 updates ([#1004](https://github.com/tambo-ai/tambo/issues/1004)) ([d24edce](https://github.com/tambo-ai/tambo/commit/d24edceb6a297f174108c0b4f7d43376a57819a3))
- **deps-dev:** bump the testing group with 2 updates ([#1007](https://github.com/tambo-ai/tambo/issues/1007)) ([4f8bd5c](https://github.com/tambo-ai/tambo/commit/4f8bd5cfcdcc2773116cee5a4f862ea73ead5925))
- **deps:** bump use-debounce from 10.0.5 to 10.0.6 ([#1010](https://github.com/tambo-ai/tambo/issues/1010)) ([b973105](https://github.com/tambo-ai/tambo/commit/b973105b281c6b109165304b1633dabd60815742))
- remove unused file ([#1017](https://github.com/tambo-ai/tambo/issues/1017)) ([f9f6062](https://github.com/tambo-ai/tambo/commit/f9f60626b119bdc3b8bb0d11063076d062036890))

## [0.47.0](https://github.com/tambo-ai/tambo/compare/react-v0.46.5...react-v0.47.0) (2025-09-05)

### Features

- **context-helpers:** remove global context helper registry ([#975](https://github.com/tambo-ai/tambo/issues/975)) ([b643495](https://github.com/tambo-ai/tambo/commit/b6434956ad1f3e4e34e658e569014799a77cb73a))

### Bug Fixes

- register interactable components tools only when there is any interactable component ([#974](https://github.com/tambo-ai/tambo/issues/974)) ([864f76c](https://github.com/tambo-ai/tambo/commit/864f76c91140a9f0ac4915aaed37d2904e1e8bc8))

## [0.46.5](https://github.com/tambo-ai/tambo/compare/react-v0.46.4...react-v0.46.5) (2025-09-04)

### Miscellaneous Chores

- **deps-dev:** bump the testing group with 2 updates ([#948](https://github.com/tambo-ai/tambo/issues/948)) ([e92b501](https://github.com/tambo-ai/tambo/commit/e92b501faa45552861ed7c3d6d791c139da55c1e))

## [0.46.4](https://github.com/tambo-ai/tambo/compare/react-v0.46.3...react-v0.46.4) (2025-08-27)

### Bug Fixes

- update useTamboComponentState ([#912](https://github.com/tambo-ai/tambo/issues/912)) ([4f0061c](https://github.com/tambo-ai/tambo/commit/4f0061c54dfffde4c86201716176dd96960e1079))

### Miscellaneous Chores

- **deps-dev:** bump @testing-library/jest-dom from 6.7.0 to 6.8.0 ([#929](https://github.com/tambo-ai/tambo/issues/929)) ([7a22c3e](https://github.com/tambo-ai/tambo/commit/7a22c3e707de982f93fdf2e54e2a50f0ef240892))
- **deps-dev:** bump concurrently from 9.2.0 to 9.2.1 ([#931](https://github.com/tambo-ai/tambo/issues/931)) ([d8bd714](https://github.com/tambo-ai/tambo/commit/d8bd714ed58ded81e7e340ede4dd0303602daf54))
- **deps-dev:** bump the eslint group with 5 updates ([#917](https://github.com/tambo-ai/tambo/issues/917)) ([ee0ee2e](https://github.com/tambo-ai/tambo/commit/ee0ee2e541d6a37322131a15cc02f6694436ceb3))
- **deps:** bump @modelcontextprotocol/sdk from 1.17.3 to 1.17.4 ([#920](https://github.com/tambo-ai/tambo/issues/920)) ([daca967](https://github.com/tambo-ai/tambo/commit/daca967cf2bc07bd0b9600e3fb4e123c7b2c217e))
- **deps:** bump @tambo-ai/typescript-sdk to get deprecated ActionType ([#928](https://github.com/tambo-ai/tambo/issues/928)) ([0b316e6](https://github.com/tambo-ai/tambo/commit/0b316e6d842241069e8b17d5823b8b8df60cbaf8))
- **deps:** bump @tanstack/react-query from 5.85.3 to 5.85.5 ([#922](https://github.com/tambo-ai/tambo/issues/922)) ([7fdfdc7](https://github.com/tambo-ai/tambo/commit/7fdfdc718272240d20d8368666aa8dc9018f16db))

## [0.46.3](https://github.com/tambo-ai/tambo/compare/react-v0.46.2...react-v0.46.3) (2025-08-25)

### Miscellaneous Chores

- remove conversational-form template from CLI and documentation ([#908](https://github.com/tambo-ai/tambo/issues/908)) ([3f24f2b](https://github.com/tambo-ai/tambo/commit/3f24f2be17819e338df031ea26d3c27f4caf9637))

## [0.46.2](https://github.com/tambo-ai/tambo/compare/react-v0.46.1...react-v0.46.2) (2025-08-22)

### Miscellaneous Chores

- export useIsTamboTokenUpdating hook ([#903](https://github.com/tambo-ai/tambo/issues/903)) ([0efa067](https://github.com/tambo-ai/tambo/commit/0efa067b74ef8b58975c2febc3ffcde481eeb720))

## [0.46.1](https://github.com/tambo-ai/tambo/compare/react-v0.46.0...react-v0.46.1) (2025-08-22)

### Miscellaneous Chores

- export tokenupdating hook ([#901](https://github.com/tambo-ai/tambo/issues/901)) ([5fd3881](https://github.com/tambo-ai/tambo/commit/5fd38815f6a586935915709df029d109126b41a9))

## [0.46.0](https://github.com/tambo-ai/tambo/compare/react-v0.45.0...react-v0.46.0) (2025-08-22)

### Features

- expose isUpdating from useTamboSessionToken ([#875](https://github.com/tambo-ai/tambo/issues/875)) ([a4631fe](https://github.com/tambo-ai/tambo/commit/a4631feb112903b8a46611b67a0fb14a5b4c5dd5))
- useTamboThreadInput context return reactquery values ([#897](https://github.com/tambo-ai/tambo/issues/897)) ([13aeff6](https://github.com/tambo-ai/tambo/commit/13aeff669bd5760e4f8f93e9ff77dae301f4ba83))

### Bug Fixes

- create context/provider for threadInput so all consumers share state ([#876](https://github.com/tambo-ai/tambo/issues/876)) ([da5d3d3](https://github.com/tambo-ai/tambo/commit/da5d3d311d8cf3e0a4052ef8a1348a34c4158a53))

### Documentation

- add docs header and chatwithtambo ([#838](https://github.com/tambo-ai/tambo/issues/838)) ([8509f26](https://github.com/tambo-ai/tambo/commit/8509f26180ca1f3d53333b61321c3fa6c54f263a))

## [0.45.0](https://github.com/tambo-ai/tambo/compare/react-v0.44.1...react-v0.45.0) (2025-08-20)

### Features

- **api:** stop using contextKey returned from API ([#868](https://github.com/tambo-ai/tambo/issues/868)) ([75e0bbb](https://github.com/tambo-ai/tambo/commit/75e0bbba441695aa7038f242e7ec4ed62b76e91c))

## [0.44.1](https://github.com/tambo-ai/tambo/compare/react-v0.44.0...react-v0.44.1) (2025-08-19)

### Bug Fixes

- set thread stage to 'error' when api request fails ([#866](https://github.com/tambo-ai/tambo/issues/866)) ([a38e668](https://github.com/tambo-ai/tambo/commit/a38e668f3be48a49f555ab43c4ba59fba501915a))

### Miscellaneous

- **deps-dev:** bump @testing-library/jest-dom from 6.6.4 to 6.7.0 ([#851](https://github.com/tambo-ai/tambo/issues/851)) ([5c7db5b](https://github.com/tambo-ai/tambo/commit/5c7db5b9eaeb9b52f86cdb13130851526945dcd2))
- **deps-dev:** bump the eslint group with 4 updates ([#846](https://github.com/tambo-ai/tambo/issues/846)) ([8675209](https://github.com/tambo-ai/tambo/commit/867520964bd1b4ad058281712e86defaeb195fd2))
- **deps:** bump @modelcontextprotocol/sdk from 1.17.2 to 1.17.3 ([#861](https://github.com/tambo-ai/tambo/issues/861)) ([871f7cd](https://github.com/tambo-ai/tambo/commit/871f7cd1e0adee0b1ef073a1f4cced9844d73508))
- **deps:** bump @tanstack/react-query from 5.84.2 to 5.85.3 ([#848](https://github.com/tambo-ai/tambo/issues/848)) ([e816601](https://github.com/tambo-ai/tambo/commit/e816601d06b97599dec477fc691c8f686e80b416))
- **deps:** Fix some duplicated/misaligned [@types](https://github.com/types) versions ([#867](https://github.com/tambo-ai/tambo/issues/867)) ([0c3fcfe](https://github.com/tambo-ai/tambo/commit/0c3fcfe4a7356966e74104b5c60397aab7eb7848))

## [0.44.0](https://github.com/tambo-ai/tambo/compare/react-v0.43.1...react-v0.44.0) (2025-08-14)

### Features

- **duplicate-hooks:** useTamboMessageContext was identical to useTamboCurrentMessage, so removed old one ([#833](https://github.com/tambo-ai/tambo/issues/833)) ([33427ab](https://github.com/tambo-ai/tambo/commit/33427ab041bc570ded3c5bb809d6ba3657f2dc06))

### Bug Fixes

- split out provider values to prevent re-renders ([#816](https://github.com/tambo-ai/tambo/issues/816)) ([3360e9a](https://github.com/tambo-ai/tambo/commit/3360e9ab491c03a1a1da7101679ad88764dd6205))

### Miscellaneous

- **deps-dev:** bump lint-staged from 16.1.4 to 16.1.5 ([#827](https://github.com/tambo-ai/tambo/issues/827)) ([e7e0633](https://github.com/tambo-ai/tambo/commit/e7e0633feadedd6a2cc850464b9ecd89e2af4133))
- **deps-dev:** bump the eslint group with 5 updates ([#826](https://github.com/tambo-ai/tambo/issues/826)) ([342097e](https://github.com/tambo-ai/tambo/commit/342097e15ae1503c3d3df5cffb0d96a829fd7f5f))
- **deps:** bump @modelcontextprotocol/sdk from 1.17.1 to 1.17.2 ([#823](https://github.com/tambo-ai/tambo/issues/823)) ([d2ec114](https://github.com/tambo-ai/tambo/commit/d2ec1141a80c2e636918b38f3cb6ac405aa9a510))
- **deps:** bump @tanstack/react-query from 5.83.0 to 5.84.2 ([#831](https://github.com/tambo-ai/tambo/issues/831)) ([5640d58](https://github.com/tambo-ai/tambo/commit/5640d58167998dad63660aefbea7f6b41198b215))

### Code Refactoring

- update useGenerationStage to useTamboGenerationStage ([#820](https://github.com/tambo-ai/tambo/issues/820)) ([23ab48f](https://github.com/tambo-ai/tambo/commit/23ab48ffd464050c05855a79ce3b050bc4d5c781))

## [0.43.1](https://github.com/tambo-ai/tambo/compare/react-v0.43.0...react-v0.43.1) (2025-08-08)

### Miscellaneous

- **packages:** pin npm to 11.5.2, rereun npm install, npm dedupe ([#810](https://github.com/tambo-ai/tambo/issues/810)) ([e657057](https://github.com/tambo-ai/tambo/commit/e657057af2f3396dfa61d30670544a480ff97a24))

## [0.43.0](https://github.com/tambo-ai/tambo/compare/react-v0.42.1...react-v0.43.0) (2025-08-07)

### Features

- add custom context helpers for additional context ([#801](https://github.com/tambo-ai/tambo/issues/801)) ([2e33769](https://github.com/tambo-ai/tambo/commit/2e3376962c096e965266a9db96b0dcdc5c930b43))

### Miscellaneous

- **deps-dev:** bump the eslint group across 1 directory with 2 updates ([#798](https://github.com/tambo-ai/tambo/issues/798)) ([a935277](https://github.com/tambo-ai/tambo/commit/a935277e2cfb6d9ff01c7a3084b6900d31855d45))
- remove extra properties from context helpers ([#796](https://github.com/tambo-ai/tambo/issues/796)) ([ad91eb3](https://github.com/tambo-ai/tambo/commit/ad91eb3394c64682781ea7d666b76155b3bdfdf6))

## [0.42.1](https://github.com/tambo-ai/tambo/compare/react-v0.42.0...react-v0.42.1) (2025-08-05)

### Bug Fixes

- update interactables tool description ([#797](https://github.com/tambo-ai/tambo/issues/797)) ([6c7f251](https://github.com/tambo-ai/tambo/commit/6c7f251c3b031b7f68b0acf5e0d69a516cb8c9fd))

### Miscellaneous

- **deps-dev:** bump lint-staged from 16.1.2 to 16.1.4 ([#788](https://github.com/tambo-ai/tambo/issues/788)) ([1ccd19b](https://github.com/tambo-ai/tambo/commit/1ccd19b467da4405721123036bbb4d8c5dd37c37))
- **deps-dev:** bump ts-jest from 29.4.0 to 29.4.1 ([#789](https://github.com/tambo-ai/tambo/issues/789)) ([56d1293](https://github.com/tambo-ai/tambo/commit/56d12931263875eb505f7979a9fdafba74337e5c))
- **deps-dev:** bump typescript from 5.8.3 to 5.9.2 ([#790](https://github.com/tambo-ai/tambo/issues/790)) ([49b86a0](https://github.com/tambo-ai/tambo/commit/49b86a0ba3198419054b7b75af9970321224b997))
- **deps:** bump @modelcontextprotocol/sdk from 1.17.0 to 1.17.1 ([#784](https://github.com/tambo-ai/tambo/issues/784)) ([61b825e](https://github.com/tambo-ai/tambo/commit/61b825e17383c092b277fc0ad54a1309ae3bc17b))

## [0.42.0](https://github.com/tambo-ai/tambo/compare/react-v0.41.2...react-v0.42.0) (2025-08-05)

### Features

- add pre-built context helpers ([#769](https://github.com/tambo-ai/tambo/issues/769)) ([757448b](https://github.com/tambo-ai/tambo/commit/757448b949f33a89ad0bc25b56918d95748da5ab))

## [0.41.2](https://github.com/tambo-ai/tambo/compare/react-v0.41.1...react-v0.41.2) (2025-08-01)

### Bug Fixes

- bump ([#762](https://github.com/tambo-ai/tambo/issues/762)) ([ada97ec](https://github.com/tambo-ai/tambo/commit/ada97ec8cce2256f973247ff1ccae7f8eabd7117))

### Miscellaneous

- trigger release ([#760](https://github.com/tambo-ai/tambo/issues/760)) ([6abd8bc](https://github.com/tambo-ai/tambo/commit/6abd8bc0ea7ab6cb66d1bf8ae00653c5568059eb))

## [0.41.1](https://github.com/tambo-ai/tambo/compare/react-v0.41.0...react-v0.41.1) (2025-08-01)

### Bug Fixes

- update sdk readme ([#757](https://github.com/tambo-ai/tambo/issues/757)) ([9db3533](https://github.com/tambo-ai/tambo/commit/9db3533258182c175c6556da728a91233a7d5040))

## [0.41.0](https://github.com/tambo-ai/tambo/compare/react-v0.40.1...react-v0.41.0) (2025-07-31)

### Features

- move additional context to message request ([#740](https://github.com/tambo-ai/tambo/issues/740)) ([09386ba](https://github.com/tambo-ai/tambo/commit/09386babf964ccdb3f447242ab4b042b1cd3dac6))

## [0.40.1](https://github.com/tambo-ai/tambo/compare/react-v0.40.0...react-v0.40.1) (2025-07-29)

### Miscellaneous

- **deps-dev:** bump @testing-library/jest-dom from 6.6.3 to 6.6.4 ([#730](https://github.com/tambo-ai/tambo/issues/730)) ([aacc7e9](https://github.com/tambo-ai/tambo/commit/aacc7e9f8ac38e8a86a4385998902b915512573a))
- **deps-dev:** bump the eslint group with 4 updates ([#720](https://github.com/tambo-ai/tambo/issues/720)) ([fcfcb6c](https://github.com/tambo-ai/tambo/commit/fcfcb6c8f7e2c98139279cbb0fe41057f45f2f2a))
- **deps:** bump @modelcontextprotocol/sdk from 1.16.0 to 1.17.0 ([#723](https://github.com/tambo-ai/tambo/issues/723)) ([958b20a](https://github.com/tambo-ai/tambo/commit/958b20add4af78991962f7e1a9780fc4a5acbd5e))

## [0.40.0](https://github.com/tambo-ai/tambo/compare/react-v0.39.0...react-v0.40.0) (2025-07-28)

### Features

- Add InteractiveMap component using react‑leaflet ([#678](https://github.com/tambo-ai/tambo/issues/678)) ([22b3862](https://github.com/tambo-ai/tambo/commit/22b3862cdefbe5d53425da0f7ad0167698847d09))

### Bug Fixes

- cleanup TamboPropStreamProvider ([#713](https://github.com/tambo-ai/tambo/issues/713)) ([d486d0a](https://github.com/tambo-ai/tambo/commit/d486d0aeef52930fb531d15fbe3e662af09ad254))

## [0.39.0](https://github.com/tambo-ai/tambo/compare/react-v0.38.1...react-v0.39.0) (2025-07-25)

### Features

- add additionalContext support ([#702](https://github.com/tambo-ai/tambo/issues/702)) ([f269b31](https://github.com/tambo-ai/tambo/commit/f269b313053490dc417dc18cd6ab673f07f2fb74))

### Miscellaneous

- **deps-dev:** bump jest from 30.0.4 to 30.0.5 ([#683](https://github.com/tambo-ai/tambo/issues/683)) ([16d9937](https://github.com/tambo-ai/tambo/commit/16d99378b60c149decbc7e4432791477acbe8d46))
- **deps-dev:** bump jest-environment-jsdom from 30.0.4 to 30.0.5 ([#687](https://github.com/tambo-ai/tambo/issues/687)) ([e44295f](https://github.com/tambo-ai/tambo/commit/e44295f3359e4a3887dd94430d0ff70794206a1d))
- **deps-dev:** bump the eslint group with 5 updates ([#680](https://github.com/tambo-ai/tambo/issues/680)) ([846cf38](https://github.com/tambo-ai/tambo/commit/846cf38012985f02958cdec43d970be27e6d0f02))
- **deps:** add back ts-node to make jest happy ([#703](https://github.com/tambo-ai/tambo/issues/703)) ([523f244](https://github.com/tambo-ai/tambo/commit/523f2442b3ab08fd9870003badeafd29426dd590))
- **deps:** bump @modelcontextprotocol/sdk from 1.15.1 to 1.16.0 ([#682](https://github.com/tambo-ai/tambo/issues/682)) ([5ec155d](https://github.com/tambo-ai/tambo/commit/5ec155d7b38fc54ee67b2ca93a0d59bf670ee80c))
- **deps:** bump zod from 3.25.75 to 3.25.76 ([#681](https://github.com/tambo-ai/tambo/issues/681)) ([457291a](https://github.com/tambo-ai/tambo/commit/457291a72efbc9402cafeca561e33e6e5d2c1e5f))
- update documentation links to new domain and update dev command filter ([#698](https://github.com/tambo-ai/tambo/issues/698)) ([23946de](https://github.com/tambo-ai/tambo/commit/23946de0d4a67919e119f7188731f83bcc2e86a0))

## [0.38.1](https://github.com/tambo-ai/tambo/compare/react-v0.38.0...react-v0.38.1) (2025-07-18)

### Bug Fixes

- update exports for tambo stream provider ([#677](https://github.com/tambo-ai/tambo/issues/677)) ([0fe1e80](https://github.com/tambo-ai/tambo/commit/0fe1e8087ec1b8bb87185816e7747f583f7e86d2))

### Miscellaneous

- **deps-dev:** bump jest-environment-jsdom from 30.0.2 to 30.0.4 ([#636](https://github.com/tambo-ai/tambo/issues/636)) ([896add9](https://github.com/tambo-ai/tambo/commit/896add99bfd89d8a6b08e5064868f525fce2e9bc))
- **deps-dev:** bump the eslint group across 1 directory with 5 updates ([#672](https://github.com/tambo-ai/tambo/issues/672)) ([28a6d93](https://github.com/tambo-ai/tambo/commit/28a6d93a686eebf8e102f74ddf989a8627d98e53))
- **deps:** bump @modelcontextprotocol/sdk from 1.15.0 to 1.15.1 ([#661](https://github.com/tambo-ai/tambo/issues/661)) ([3ad2102](https://github.com/tambo-ai/tambo/commit/3ad21028e2accbe075e93fff501b620ae5cc24ed))
- **deps:** bump @tanstack/react-query from 5.81.5 to 5.83.0 ([#663](https://github.com/tambo-ai/tambo/issues/663)) ([96d98bf](https://github.com/tambo-ai/tambo/commit/96d98bfa41c56fefa8df27d099e8dfad0f8fe7b1))

## [0.38.0](https://github.com/tambo-ai/tambo/compare/react-v0.37.3...react-v0.38.0) (2025-07-14)

### Features

- **sdk:** Add TamboPropStreamProvider ([#654](https://github.com/tambo-ai/tambo/issues/654)) ([049dd93](https://github.com/tambo-ai/tambo/commit/049dd93aee4d52a058ccb5a8bdc4c3e5f477b41d))
- tambo interactable dev-placed components ([#655](https://github.com/tambo-ai/tambo/issues/655)) ([b693818](https://github.com/tambo-ai/tambo/commit/b6938185cdb299425609bda6fefb44f0b2f2f191))

## [0.37.3](https://github.com/tambo-ai/tambo/compare/react-v0.37.2...react-v0.37.3) (2025-07-10)

### Bug Fixes

- send toolcall counts ([#650](https://github.com/tambo-ai/tambo/issues/650)) ([c18650a](https://github.com/tambo-ai/tambo/commit/c18650a82fd69e1718bffee3331f55fda548f060))
- with correct types, remove cast ([#652](https://github.com/tambo-ai/tambo/issues/652)) ([ccbd42e](https://github.com/tambo-ai/tambo/commit/ccbd42edd850fb79603f6ea26894b8bbc6278c63))

## [0.37.2](https://github.com/tambo-ai/tambo/compare/react-v0.37.1...react-v0.37.2) (2025-07-08)

### Miscellaneous

- **deps-dev:** bump jest from 30.0.3 to 30.0.4 ([#640](https://github.com/tambo-ai/tambo/issues/640)) ([d8d9dee](https://github.com/tambo-ai/tambo/commit/d8d9dee4fe7eb75c5ca794749c190c52b8c7f575))
- **deps-dev:** bump the eslint group with 5 updates ([#647](https://github.com/tambo-ai/tambo/issues/647)) ([32077e3](https://github.com/tambo-ai/tambo/commit/32077e36e194d712c7b1c7b8446ddd12aa7d1fe3))
- **deps:** bump @modelcontextprotocol/sdk from 1.13.2 to 1.15.0 ([#641](https://github.com/tambo-ai/tambo/issues/641)) ([04011d4](https://github.com/tambo-ai/tambo/commit/04011d4cbce865206b7c9072ba2b1631ec249648))
- **deps:** bump zod from 3.25.67 to 3.25.75 ([#643](https://github.com/tambo-ai/tambo/issues/643)) ([ba8525e](https://github.com/tambo-ai/tambo/commit/ba8525e2e97f5acd69f529c98d7b05439622a698))
- trying to set package URL so dependabot picks up versioning ([#648](https://github.com/tambo-ai/tambo/issues/648)) ([66634ef](https://github.com/tambo-ai/tambo/commit/66634ef719423d80aa9a19d406e16606025f625b))

## [0.37.1](https://github.com/tambo-ai/tambo/compare/react-v0.37.0...react-v0.37.1) (2025-07-03)

### Miscellaneous

- update CLI with the new feedback ([#615](https://github.com/tambo-ai/tambo/issues/615)) ([66fd8d0](https://github.com/tambo-ai/tambo/commit/66fd8d0c968bb27249362d48f08bfd42047d8701))

### Tests

- add tests for auth token handling ([#628](https://github.com/tambo-ai/tambo/issues/628)) ([eee05fe](https://github.com/tambo-ai/tambo/commit/eee05fe54f274963efb238f841ce980222633e6c))

## [0.37.0](https://github.com/tambo-ai/tambo/compare/react-v0.36.0...react-v0.37.0) (2025-07-03)

### Features

- support accessToken ([#624](https://github.com/tambo-ai/tambo/issues/624)) ([2134cdc](https://github.com/tambo-ai/tambo/commit/2134cdc3c26aa319d5f77bec6dd779564284edfe))

## [0.36.0](https://github.com/tambo-ai/tambo/compare/react-v0.35.0...react-v0.36.0) (2025-07-02)

### Features

- fetch threads with internal messages by default ([#620](https://github.com/tambo-ai/tambo/issues/620)) ([ed28ce2](https://github.com/tambo-ai/tambo/commit/ed28ce249599b4b2e8fdb2231c6d0b84c130e5b9))

## [0.35.0](https://github.com/tambo-ai/tambo/compare/react-v0.34.0...react-v0.35.0) (2025-07-02)

### Features

- add client toolresponse to local thread state ([#616](https://github.com/tambo-ai/tambo/issues/616)) ([e6f4436](https://github.com/tambo-ai/tambo/commit/e6f4436a01ccacd37ea3d819b4c1dd6afecf6f3c))

### Bug Fixes

- update local toolrequestmessage before running toolcall ([#618](https://github.com/tambo-ai/tambo/issues/618)) ([3188a80](https://github.com/tambo-ai/tambo/commit/3188a80af661d4c41ca9d4c0792d8e08e3090bb8))

## [0.34.0](https://github.com/tambo-ai/tambo/compare/react-v0.33.0...react-v0.34.0) (2025-07-01)

### Features

- implement useTamboStreamStatus hook with generation vs prop streaming distinction ([#581](https://github.com/tambo-ai/tambo/issues/581)) ([dae15ca](https://github.com/tambo-ai/tambo/commit/dae15caf71f12cec1397d495034a69b755c0b6b6))

### Miscellaneous

- **deps-dev:** bump jest from 30.0.2 to 30.0.3 ([#606](https://github.com/tambo-ai/tambo/issues/606)) ([0808872](https://github.com/tambo-ai/tambo/commit/0808872744cfc3e98dce4c12489874a4e963b6ea))
- **deps-dev:** bump prettier from 3.6.0 to 3.6.2 ([#607](https://github.com/tambo-ai/tambo/issues/607)) ([7baee41](https://github.com/tambo-ai/tambo/commit/7baee41445557496e4d9a697b9bbdf8276658ebf))
- **deps-dev:** bump the eslint group with 4 updates ([#602](https://github.com/tambo-ai/tambo/issues/602)) ([00832a8](https://github.com/tambo-ai/tambo/commit/00832a88e5440afbfe9033322090ed7914d5ae98))
- **deps:** bump @modelcontextprotocol/sdk from 1.13.1 to 1.13.2 ([#601](https://github.com/tambo-ai/tambo/issues/601)) ([03c28cd](https://github.com/tambo-ai/tambo/commit/03c28cda4496f02b25d87d1a8a7b7bf2048e0da1))
- **deps:** bump @tanstack/react-query from 5.81.2 to 5.81.5 ([#600](https://github.com/tambo-ai/tambo/issues/600)) ([291b878](https://github.com/tambo-ai/tambo/commit/291b8784fd6f24823b5c4c11ffa1825e7fcade32))
- **deps:** bump zod-to-json-schema from 3.24.5 to 3.24.6 ([#610](https://github.com/tambo-ai/tambo/issues/610)) ([2fa1be5](https://github.com/tambo-ai/tambo/commit/2fa1be59cc8d69c9cab135f58afa192689f24d91))
- **deps:** Manually bump typescript-sdk to 0.58 ([#612](https://github.com/tambo-ai/tambo/issues/612)) ([217c383](https://github.com/tambo-ai/tambo/commit/217c38395e82edebb4b01baa9b259363c7a7325d))

## [0.33.0](https://github.com/tambo-ai/tambo/compare/react-v0.32.1...react-v0.33.0) (2025-06-26)

### Features

- add and expose `cancel` function to 'cancel' a generation ([#594](https://github.com/tambo-ai/tambo/issues/594)) ([661f31e](https://github.com/tambo-ai/tambo/commit/661f31ed3898e083e740f3975a6040966887324b))
- Add cancellation UI ([#596](https://github.com/tambo-ai/tambo/issues/596)) ([97e7927](https://github.com/tambo-ai/tambo/commit/97e7927057c42dbb81e45a01215dc6043a107aac))

### Miscellaneous

- **deps-dev:** bump prettier from 3.5.3 to 3.6.0 ([#591](https://github.com/tambo-ai/tambo/issues/591)) ([d678b2d](https://github.com/tambo-ai/tambo/commit/d678b2d8a64dd410ac95dd621614be24664f4447))

## [0.32.1](https://github.com/tambo-ai/tambo/compare/react-v0.32.0...react-v0.32.1) (2025-06-24)

### Miscellaneous

- **deps-dev:** bump concurrently from 9.1.2 to 9.2.0 ([#588](https://github.com/tambo-ai/tambo/issues/588)) ([04ed552](https://github.com/tambo-ai/tambo/commit/04ed5520354ef5ec4efcb69f130f1c8902e4ab48))
- **deps-dev:** bump the eslint group with 2 updates ([#585](https://github.com/tambo-ai/tambo/issues/585)) ([f49223d](https://github.com/tambo-ai/tambo/commit/f49223d888ba9b921e80825f2ff04ebde15f6f6a))
- **deps:** bump @modelcontextprotocol/sdk from 1.13.0 to 1.13.1 ([#583](https://github.com/tambo-ai/tambo/issues/583)) ([5d9638d](https://github.com/tambo-ai/tambo/commit/5d9638de9bbe756bfa0e19fe4edbdfb22799eaca))
- **deps:** bump @tanstack/react-query from 5.80.10 to 5.81.2 ([#592](https://github.com/tambo-ai/tambo/issues/592)) ([0f2599b](https://github.com/tambo-ai/tambo/commit/0f2599ba4212a8fceac3afed85fca696d59b8f26))

## [0.32.0](https://github.com/tambo-ai/tambo/compare/react-v0.31.3...react-v0.32.0) (2025-06-19)

### Features

- detect and disallow z.record in schema registration with descriptive errors TAM-147 ([#451](https://github.com/tambo-ai/tambo/issues/451)) ([ba31d63](https://github.com/tambo-ai/tambo/commit/ba31d63b2bb176272020de2f4cbfbf7c2515c397))

### Miscellaneous

- bump dev to node 22 ([#569](https://github.com/tambo-ai/tambo/issues/569)) ([fd5209e](https://github.com/tambo-ai/tambo/commit/fd5209e74a88dd4676f663bf0161e0030e41a943))
- **deps-dev:** bump jest and @types/jest ([#579](https://github.com/tambo-ai/tambo/issues/579)) ([46f006c](https://github.com/tambo-ai/tambo/commit/46f006c87d501d5a681b97ad147f324a67f89d95))
- **deps-dev:** bump jest-environment-jsdom from 30.0.0 to 30.0.2 ([#574](https://github.com/tambo-ai/tambo/issues/574)) ([e895e8f](https://github.com/tambo-ai/tambo/commit/e895e8f44dc330ebe2878b7d9a55c980fb01ab63))
- **deps-dev:** bump the eslint group with 2 updates ([#571](https://github.com/tambo-ai/tambo/issues/571)) ([80a95b7](https://github.com/tambo-ai/tambo/commit/80a95b7ee5e73f597c1d30c4a8f37bda1a31550e))
- **deps:** bump @modelcontextprotocol/sdk from 1.12.3 to 1.13.0 ([#578](https://github.com/tambo-ai/tambo/issues/578)) ([8fbc138](https://github.com/tambo-ai/tambo/commit/8fbc138d1fff456087afdaf221cbac8a72705ca7))
- **deps:** bump @tanstack/react-query from 5.80.7 to 5.80.10 ([#577](https://github.com/tambo-ai/tambo/issues/577)) ([fa8d83a](https://github.com/tambo-ai/tambo/commit/fa8d83a9db77d5db5179d8d7cb7c8339d48173a6))
- **deps:** bump zod from 3.25.65 to 3.25.67 ([#576](https://github.com/tambo-ai/tambo/issues/576)) ([86584a4](https://github.com/tambo-ai/tambo/commit/86584a495a62ae5269c0bf04b65ab3bc915a6750))

## [0.31.3](https://github.com/tambo-ai/tambo/compare/react-v0.31.2...react-v0.31.3) (2025-06-18)

### Bug Fixes

- update typescript-sdk to get updated component decision type ([#562](https://github.com/tambo-ai/tambo/issues/562)) ([9075b6e](https://github.com/tambo-ai/tambo/commit/9075b6e257e68d2b604b2450537cb16c67697719))

## [0.31.2](https://github.com/tambo-ai/tambo/compare/react-v0.31.1...react-v0.31.2) (2025-06-17)

### Miscellaneous

- add packagejson version to react headers ([#558](https://github.com/tambo-ai/tambo/issues/558)) ([bb840cd](https://github.com/tambo-ai/tambo/commit/bb840cdfd1a8281332bff61ac452adf7f520955f))
- **deps-dev:** bump the eslint group with 4 updates ([#538](https://github.com/tambo-ai/tambo/issues/538)) ([d3c054c](https://github.com/tambo-ai/tambo/commit/d3c054c73545835424f14ea022252a3996127fc3))
- **deps:** bump @tanstack/react-query from 5.80.6 to 5.80.7 ([#556](https://github.com/tambo-ai/tambo/issues/556)) ([8bf933e](https://github.com/tambo-ai/tambo/commit/8bf933ef30512a18a9b1944587625855b7e68048))

## [0.31.1](https://github.com/tambo-ai/tambo/compare/react-v0.31.0...react-v0.31.1) (2025-06-16)

### Bug Fixes

- make sendThreadMessage retain the current thread id ([#537](https://github.com/tambo-ai/tambo/issues/537)) ([cf87ec6](https://github.com/tambo-ai/tambo/commit/cf87ec6b605b44a8835cb42cf5522b5fcc4bb3ae))

### Miscellaneous

- **deps-dev:** bump jest-environment-jsdom from 29.7.0 to 30.0.0 ([#540](https://github.com/tambo-ai/tambo/issues/540)) ([779586d](https://github.com/tambo-ai/tambo/commit/779586db8a075faa706f7e6b3409d84e9a5f451b))
- **deps-dev:** bump lint-staged from 16.1.0 to 16.1.2 ([#542](https://github.com/tambo-ai/tambo/issues/542)) ([1582323](https://github.com/tambo-ai/tambo/commit/15823233079c1bf41b0ef7d529731ffd8bdd1f00))
- **deps-dev:** bump ts-jest from 29.3.4 to 29.4.0 ([#548](https://github.com/tambo-ai/tambo/issues/548)) ([1fcb19e](https://github.com/tambo-ai/tambo/commit/1fcb19e62a6a2a885d3124f7bef2d3e50cf8934f))
- **deps:** bump @modelcontextprotocol/sdk from 1.12.1 to 1.12.3 ([#539](https://github.com/tambo-ai/tambo/issues/539)) ([45c0c88](https://github.com/tambo-ai/tambo/commit/45c0c882be3af5ba8ab92556b6599d7584428b11))
- **deps:** bump ts-essentials from 10.1.0 to 10.1.1 ([#541](https://github.com/tambo-ai/tambo/issues/541)) ([2b9cec8](https://github.com/tambo-ai/tambo/commit/2b9cec8b268417633b0558522b1791cce9146330))
- **deps:** bump zod from 3.25.56 to 3.25.65 ([#549](https://github.com/tambo-ai/tambo/issues/549)) ([aeec9c7](https://github.com/tambo-ai/tambo/commit/aeec9c7a587ca17c138d1286b317652386659819))

## [0.31.0](https://github.com/tambo-ai/tambo/compare/react-v0.30.0...react-v0.31.0) (2025-06-16)

### Features

- add support for custom headers in client-side MCP ([#535](https://github.com/tambo-ai/tambo/issues/535)) ([39b0c38](https://github.com/tambo-ai/tambo/commit/39b0c385af106983c5ca41e734685d232250dfee))

## [0.30.0](https://github.com/tambo-ai/tambo/compare/react-v0.29.1...react-v0.30.0) (2025-06-11)

### Features

- add threads to showcase, add stub to sdk ([#523](https://github.com/tambo-ai/tambo/issues/523)) ([5c3a194](https://github.com/tambo-ai/tambo/commit/5c3a1944aebc67732ca347fc74714d2fe7a27ac4))

## [0.29.1](https://github.com/tambo-ai/tambo/compare/react-v0.29.0...react-v0.29.1) (2025-06-11)

### Miscellaneous

- **deps-dev:** bump @types/node from 20.17.50 to 20.17.57 ([#496](https://github.com/tambo-ai/tambo/issues/496)) ([ac42562](https://github.com/tambo-ai/tambo/commit/ac42562b44bd283881f465f60640b605d1f47bd5))
- **deps-dev:** bump @types/node from 20.17.57 to 20.19.0 ([#514](https://github.com/tambo-ai/tambo/issues/514)) ([e46ed6d](https://github.com/tambo-ai/tambo/commit/e46ed6ddada93879b46eb81e70c65f0d6114d47e))
- **deps-dev:** bump lint-staged from 16.0.0 to 16.1.0 ([#499](https://github.com/tambo-ai/tambo/issues/499)) ([381da89](https://github.com/tambo-ai/tambo/commit/381da8930c9cc355bec872741e7ce6ec02cb4555))
- **deps-dev:** bump the eslint group with 6 updates ([#492](https://github.com/tambo-ai/tambo/issues/492)) ([9efc361](https://github.com/tambo-ai/tambo/commit/9efc3611ab68d4a38709d6f6b148f28f25258716))
- **deps-dev:** bump typescript-eslint from 8.33.1 to 8.34.0 in the eslint group ([#507](https://github.com/tambo-ai/tambo/issues/507)) ([c662d2b](https://github.com/tambo-ai/tambo/commit/c662d2b5f006c553e6daef134a862b47a50fdd18))
- **deps:** bump @modelcontextprotocol/sdk from 1.12.0 to 1.12.1 ([#500](https://github.com/tambo-ai/tambo/issues/500)) ([2640927](https://github.com/tambo-ai/tambo/commit/26409279d2cd0f33ac8dd3ae6af51180743c8f80))
- **deps:** bump @tanstack/react-query from 5.77.2 to 5.79.2 ([#493](https://github.com/tambo-ai/tambo/issues/493)) ([572f536](https://github.com/tambo-ai/tambo/commit/572f53629771e3f0d8b73e2519bb94693f5f56b7))
- **deps:** bump @tanstack/react-query from 5.79.2 to 5.80.6 ([#511](https://github.com/tambo-ai/tambo/issues/511)) ([d67f3b4](https://github.com/tambo-ai/tambo/commit/d67f3b4b59f586ea0bc95ddce249aa2725482c0d))
- **deps:** bump ts-essentials from 10.0.4 to 10.1.0 ([#510](https://github.com/tambo-ai/tambo/issues/510)) ([f3ae491](https://github.com/tambo-ai/tambo/commit/f3ae491cf9fa06a937103039af772ca383609135))
- **deps:** bump use-debounce from 10.0.4 to 10.0.5 ([#508](https://github.com/tambo-ai/tambo/issues/508)) ([5b4c4ba](https://github.com/tambo-ai/tambo/commit/5b4c4ba913d41a26219b3068f43263115817daee))
- **deps:** bump zod from 3.25.28 to 3.25.48 ([#498](https://github.com/tambo-ai/tambo/issues/498)) ([707b2b8](https://github.com/tambo-ai/tambo/commit/707b2b805c9666bf8fdb48bba8e70775615acfb3))
- **deps:** bump zod from 3.25.48 to 3.25.56 ([#513](https://github.com/tambo-ai/tambo/issues/513)) ([347c23a](https://github.com/tambo-ai/tambo/commit/347c23aa8af481afbcecbb33b5556954a53e97c9))

### Documentation

- better README for @tambo-ai/react ([#521](https://github.com/tambo-ai/tambo/issues/521)) ([19ed356](https://github.com/tambo-ai/tambo/commit/19ed356ebf711b68473e2743465807cf72ffb1cf))

## [0.29.0](https://github.com/tambo-ai/tambo/compare/react-v0.28.0...react-v0.29.0) (2025-06-02)

### Features

- add method to auto-generate a thread's name based on its messages ([#490](https://github.com/tambo-ai/tambo/issues/490)) ([b584f63](https://github.com/tambo-ai/tambo/commit/b584f63b31fa1e486680a4df1d8e37d7d795bbd5))

## [0.28.0](https://github.com/tambo-ai/tambo/compare/react-v0.27.0...react-v0.28.0) (2025-05-31)

### Features

- add method for changing a thread's name ([#486](https://github.com/tambo-ai/tambo/issues/486)) ([f303dc1](https://github.com/tambo-ai/tambo/commit/f303dc1d422aed9ab8b5aac698c5d16bda776b5d))

## [0.27.0](https://github.com/tambo-ai/tambo/compare/react-v0.26.4...react-v0.27.0) (2025-05-31)

### Features

- add a streaming prop, turn it on by default ([#480](https://github.com/tambo-ai/tambo/issues/480)) ([f0454b3](https://github.com/tambo-ai/tambo/commit/f0454b3bfaf43142e328e49c230333e30266db6a))

### Bug Fixes

- default to "fetching data" instead of "Choosing component" ([#475](https://github.com/tambo-ai/tambo/issues/475)) ([7a062e5](https://github.com/tambo-ai/tambo/commit/7a062e5f85702e5590326c2ce314c0414d2e4316))
- make options optional in sendThreadMessage ([#481](https://github.com/tambo-ai/tambo/issues/481)) ([48b5e69](https://github.com/tambo-ai/tambo/commit/48b5e6915e350ab2bcc2ead96f452d59dd4aaad5))

## [0.26.4](https://github.com/tambo-ai/tambo/compare/react-v0.26.3...react-v0.26.4) (2025-05-29)

### Miscellaneous

- **deps:** bump @modelcontextprotocol/sdk from 1.11.2 to 1.12.0 ([#455](https://github.com/tambo-ai/tambo/issues/455)) ([a58555c](https://github.com/tambo-ai/tambo/commit/a58555ca9dacc762d9153ec9b39204972a9e71a8))

## [0.26.3](https://github.com/tambo-ai/tambo/compare/react-v0.26.2...react-v0.26.3) (2025-05-27)

### Bug Fixes

- export the full enum, not just the type ([#466](https://github.com/tambo-ai/tambo/issues/466)) ([6c4aaa4](https://github.com/tambo-ai/tambo/commit/6c4aaa427648ac55f4337db96c1af1d31b4af208))

## [0.26.2](https://github.com/tambo-ai/tambo/compare/react-v0.26.1...react-v0.26.2) (2025-05-27)

### Bug Fixes

- export some MCP types that are useful for clients ([#464](https://github.com/tambo-ai/tambo/issues/464)) ([d734c2e](https://github.com/tambo-ai/tambo/commit/d734c2e552cdc2cb0f5b1df67556ecdcbdf10ee0))
- update local thread with toolcallrequest messages ([#463](https://github.com/tambo-ai/tambo/issues/463)) ([b88f271](https://github.com/tambo-ai/tambo/commit/b88f2715f2a96468ccdbe1386ec2e928ff2859fd))

## [0.26.1](https://github.com/tambo-ai/tambo/compare/react-v0.26.0...react-v0.26.1) (2025-05-27)

### Miscellaneous

- **deps-dev:** bump @types/node from 20.17.37 to 20.17.50 ([#457](https://github.com/tambo-ai/tambo/issues/457)) ([85faaef](https://github.com/tambo-ai/tambo/commit/85faaef0246b5662dcfe937590f5a28bd55d9530))
- **deps-dev:** bump lint-staged from 15.5.1 to 16.0.0 ([#434](https://github.com/tambo-ai/tambo/issues/434)) ([e56b504](https://github.com/tambo-ai/tambo/commit/e56b5048df8cdbf2c25346c2d69a2061630f54ed))
- **deps-dev:** bump the eslint group with 3 updates ([#428](https://github.com/tambo-ai/tambo/issues/428)) ([7cb3700](https://github.com/tambo-ai/tambo/commit/7cb370038733289aff53d8033e533d39b7dcfe61))
- **deps-dev:** bump ts-jest from 29.3.2 to 29.3.4 ([#433](https://github.com/tambo-ai/tambo/issues/433)) ([78e7931](https://github.com/tambo-ai/tambo/commit/78e793196f32bdb8f67a30ac9bdce781f35218ec))
- **deps:** bump @tambo-ai/typescript-sdk ([#462](https://github.com/tambo-ai/tambo/issues/462)) ([5e65b67](https://github.com/tambo-ai/tambo/commit/5e65b67f2812adc5999a5ef1600d401e7ddca079))
- **deps:** bump @tanstack/react-query from 5.75.2 to 5.77.2 ([#460](https://github.com/tambo-ai/tambo/issues/460)) ([c34aa1c](https://github.com/tambo-ai/tambo/commit/c34aa1c988c6457d972bfccac3d211b366610991))
- **deps:** bump zod from 3.24.4 to 3.25.28 ([#461](https://github.com/tambo-ai/tambo/issues/461)) ([31cf9c6](https://github.com/tambo-ai/tambo/commit/31cf9c65914c7b736a067548747088b4b9cc3acc))

## [0.26.0](https://github.com/tambo-ai/tambo/compare/react-v0.25.1...react-v0.26.0) (2025-05-15)

### Features

- **cli:** add upgrade command with accept-all option for whole template upgrades ([#419](https://github.com/tambo-ai/tambo/issues/419)) ([5081dcd](https://github.com/tambo-ai/tambo/commit/5081dcd7a08b8e3ce632e0978a478f7410edec5f))

## [0.25.1](https://github.com/tambo-ai/tambo/compare/react-v0.25.0...react-v0.25.1) (2025-05-14)

### Documentation

- update README.md to reflect update to MCP ([#410](https://github.com/tambo-ai/tambo/issues/410)) ([400fbe5](https://github.com/tambo-ai/tambo/commit/400fbe58af81a43092e3bee3b547cb50055f58fb))

## [0.25.0](https://github.com/tambo-ai/tambo/compare/react-v0.24.0...react-v0.25.0) (2025-05-14)

### Features

- handle toolcall failures ([#420](https://github.com/tambo-ai/tambo/issues/420)) ([8a8bd27](https://github.com/tambo-ai/tambo/commit/8a8bd276dfcea261d9f7c6f1171829ef3682ffef))

## [0.24.0](https://github.com/tambo-ai/tambo/compare/react-v0.23.2...react-v0.24.0) (2025-05-13)

### Features

- add forceToolChoice param ([#417](https://github.com/tambo-ai/tambo/issues/417)) ([ecca673](https://github.com/tambo-ai/tambo/commit/ecca67398d4581ffcee013d130024528c4f7e315))

## [0.23.2](https://github.com/tambo-ai/tambo/compare/react-v0.23.1...react-v0.23.2) (2025-05-13)

### Miscellaneous

- **deps-dev:** bump the eslint group with 5 updates ([#401](https://github.com/tambo-ai/tambo/issues/401)) ([8e2439e](https://github.com/tambo-ai/tambo/commit/8e2439e2887bc7e13fa0cca09512a9a5d751b190))
- **deps:** bump @modelcontextprotocol/sdk from 1.11.0 to 1.11.2 ([#406](https://github.com/tambo-ai/tambo/issues/406)) ([c3ea0d1](https://github.com/tambo-ai/tambo/commit/c3ea0d1d78ce671af36d3789f8d66ea3da0e7de2))

## [0.23.1](https://github.com/tambo-ai/tambo/compare/react-v0.23.0...react-v0.23.1) (2025-05-08)

### Code Refactoring

- move MCP into separate import (@tambo-ai/react/mcp) ([#391](https://github.com/tambo-ai/tambo/issues/391)) ([a9231f6](https://github.com/tambo-ai/tambo/commit/a9231f6fc37ab0688a7cf55202cab8f6bec3f0bb))

## [0.23.0](https://github.com/tambo-ai/tambo/compare/react-v0.22.0...react-v0.23.0) (2025-05-08)

### Features

- add support for browser-visible MCP servers ([#383](https://github.com/tambo-ai/tambo/issues/383)) ([d6a4387](https://github.com/tambo-ai/tambo/commit/d6a43875e8e12b90fdf278613706c7a8aa9d13b4))

## [0.22.0](https://github.com/tambo-ai/tambo/compare/react-v0.21.4...react-v0.22.0) (2025-05-07)

### Features

- update showcase with new components ([#367](https://github.com/tambo-ai/tambo/issues/367)) ([581359a](https://github.com/tambo-ai/tambo/commit/581359adc7f85433c08f7a3c5da7af65cb8529fc))

### Bug Fixes

- get threadId from other hooks ([#363](https://github.com/tambo-ai/tambo/issues/363)) ([9c21c22](https://github.com/tambo-ai/tambo/commit/9c21c22c4f1b41b50fd5348fb81302c69ae7498d))

### Miscellaneous

- **deps-dev:** bump @types/node from 20.17.32 to 20.17.37 ([#368](https://github.com/tambo-ai/tambo/issues/368)) ([1c1d05f](https://github.com/tambo-ai/tambo/commit/1c1d05f52f703303ef5f5bf3cecd2be08c10c886))
- **deps-dev:** bump the eslint group with 3 updates ([#375](https://github.com/tambo-ai/tambo/issues/375)) ([03d2058](https://github.com/tambo-ai/tambo/commit/03d20581a4e254cff27cd99c6730497f6149b7a6))
- **deps:** bump @tanstack/react-query from 5.74.7 to 5.75.2 ([#376](https://github.com/tambo-ai/tambo/issues/376)) ([0999795](https://github.com/tambo-ai/tambo/commit/09997950fc73f3f5c9ca33750d4a815c75237623))
- **deps:** bump zod from 3.24.3 to 3.24.4 ([#369](https://github.com/tambo-ai/tambo/issues/369)) ([8da0336](https://github.com/tambo-ai/tambo/commit/8da033694b0fa9187f818d53ca8552ff5368be25))

## [0.21.4](https://github.com/tambo-ai/tambo/compare/react-v0.21.3...react-v0.21.4) (2025-04-30)

### Miscellaneous

- **deps:** bump typescript-sdk to get status messages ([#360](https://github.com/tambo-ai/tambo/issues/360)) ([48dc083](https://github.com/tambo-ai/tambo/commit/48dc083b0edfd5bef219046edd688e8b9a1e4643))
- **deps:** manually bump typescript-sdk ([#358](https://github.com/tambo-ai/tambo/issues/358)) ([e84d995](https://github.com/tambo-ai/tambo/commit/e84d995bb8d5fe24d2f78ecfc8a6f0669744778c))

## [0.21.3](https://github.com/tambo-ai/tambo/compare/react-v0.21.2...react-v0.21.3) (2025-04-29)

### Bug Fixes

- make sure to show each streamed message, even if new ones come in on the same stream ([#356](https://github.com/tambo-ai/tambo/issues/356)) ([04e4260](https://github.com/tambo-ai/tambo/commit/04e426043392e6ecd9dee1676706650dc3e4212f))

## [0.21.2](https://github.com/tambo-ai/tambo/compare/react-v0.21.1...react-v0.21.2) (2025-04-29)

### Bug Fixes

- Add `tools=` prop to register tools in provider ([#352](https://github.com/tambo-ai/tambo/issues/352)) ([18f6492](https://github.com/tambo-ai/tambo/commit/18f6492b43526316664cd9a0edf54cd84aaf7aa2))

## [0.21.1](https://github.com/tambo-ai/tambo/compare/react-v0.21.0...react-v0.21.1) (2025-04-28)

### Miscellaneous

- **deps-dev:** bump @types/node from 20.17.30 to 20.17.32 ([#350](https://github.com/tambo-ai/tambo/issues/350)) ([0ae1852](https://github.com/tambo-ai/tambo/commit/0ae1852f2df6eb09c4003ed7e6ffb13d0003166e))
- **deps-dev:** bump the eslint group with 3 updates ([#345](https://github.com/tambo-ai/tambo/issues/345)) ([72a9ef4](https://github.com/tambo-ai/tambo/commit/72a9ef43edb601b69a1c7a09825da3da90a87464))
- **deps:** bump @tambo-ai/typescript-sdk from 0.44.0 to 0.45.0 ([#347](https://github.com/tambo-ai/tambo/issues/347)) ([73b1f3a](https://github.com/tambo-ai/tambo/commit/73b1f3ac9c91ff0d15526ef9cf58f481c6a7b9c0))
- **deps:** bump @tanstack/react-query from 5.74.4 to 5.74.7 ([#346](https://github.com/tambo-ai/tambo/issues/346)) ([e0ee10b](https://github.com/tambo-ai/tambo/commit/e0ee10b940ab4572ebe41f28682b6570c7202d8c))

## [0.21.0](https://github.com/tambo-ai/tambo/compare/react-v0.20.4...react-v0.21.0) (2025-04-24)

### Features

- send all defined tools, even if they are not associated with a component ([#344](https://github.com/tambo-ai/tambo/issues/344)) ([1d3571a](https://github.com/tambo-ai/tambo/commit/1d3571a7b27bfda8f6198b380d3a1b3a3b8d8a04))

### Miscellaneous

- **deps-dev:** bump the eslint group with 4 updates ([#331](https://github.com/tambo-ai/tambo/issues/331)) ([7db258c](https://github.com/tambo-ai/tambo/commit/7db258c858f80c08e49625e3c90f89899282c574))
- **deps:** bump @tanstack/react-query from 5.74.3 to 5.74.4 ([#337](https://github.com/tambo-ai/tambo/issues/337)) ([e4d0d0a](https://github.com/tambo-ai/tambo/commit/e4d0d0a788b79fb43216ae874ab9c4cbd3f9124b))
- **deps:** bump zod from 3.24.2 to 3.24.3 ([#335](https://github.com/tambo-ai/tambo/issues/335)) ([b2296aa](https://github.com/tambo-ai/tambo/commit/b2296aa166e69bd01e82fdf34ca5cf41bf78b2c0))

## [0.20.4](https://github.com/tambo-ai/tambo/compare/react-v0.20.3...react-v0.20.4) (2025-04-22)

### Bug Fixes

- Show toolcall message in thread ([#340](https://github.com/tambo-ai/tambo/issues/340)) ([d1ad5aa](https://github.com/tambo-ai/tambo/commit/d1ad5aa5ccf38dcf1eae1d4e06ae1f9893ef6534))

## [0.20.3](https://github.com/tambo-ai/tambo/compare/react-v0.20.2...react-v0.20.3) (2025-04-16)

### Miscellaneous

- **deps-dev:** bump lint-staged from 15.5.0 to 15.5.1 ([#319](https://github.com/tambo-ai/tambo/issues/319)) ([e00ba1e](https://github.com/tambo-ai/tambo/commit/e00ba1e32363d36141f46f37b1707a707d38c6ad))
- **deps-dev:** bump ts-jest from 29.3.1 to 29.3.2 ([#316](https://github.com/tambo-ai/tambo/issues/316)) ([bea5531](https://github.com/tambo-ai/tambo/commit/bea5531da959d687042e636f6871eb680463c892))
- **deps-dev:** bump typescript-eslint from 8.29.0 to 8.29.1 in the eslint group ([#301](https://github.com/tambo-ai/tambo/issues/301)) ([e7ccd2b](https://github.com/tambo-ai/tambo/commit/e7ccd2b3d948ce82d1e81bb192980ab826b6393d))
- **deps-dev:** bump typescript-eslint from 8.29.1 to 8.30.1 in the eslint group ([#311](https://github.com/tambo-ai/tambo/issues/311)) ([d9b10e4](https://github.com/tambo-ai/tambo/commit/d9b10e408d8b87db1c88dcde5e72a66309c06580))
- **deps:** bump @tambo-ai/typescript-sdk from 0.42.1 to 0.43.0 ([#329](https://github.com/tambo-ai/tambo/issues/329)) ([e09bb2d](https://github.com/tambo-ai/tambo/commit/e09bb2df988f094443001455f88fe86f0d3d13a6))
- **deps:** bump @tanstack/react-query from 5.71.10 to 5.72.0 ([#300](https://github.com/tambo-ai/tambo/issues/300)) ([faddcdf](https://github.com/tambo-ai/tambo/commit/faddcdf50dc0470fccdaf0e331ad30719cac65af))
- **deps:** bump @tanstack/react-query from 5.72.0 to 5.74.3 ([#322](https://github.com/tambo-ai/tambo/issues/322)) ([f55642c](https://github.com/tambo-ai/tambo/commit/f55642c5fac7c13e17115d516ca7a0aac63234b7))

### Tests

- add some basic tests for the thread provider ([#299](https://github.com/tambo-ai/tambo/issues/299)) ([8f5186d](https://github.com/tambo-ai/tambo/commit/8f5186d4a57175d5daefe20c485f83babef0f562))
- enable tests in builds, fix suggestions test ([#294](https://github.com/tambo-ai/tambo/issues/294)) ([de9f06d](https://github.com/tambo-ai/tambo/commit/de9f06d04590088e211faa43af2bad1c87ee5b47))
- start wiring up hook tests ([#298](https://github.com/tambo-ai/tambo/issues/298)) ([8a3d0aa](https://github.com/tambo-ai/tambo/commit/8a3d0aa22dfc873472b40c3ca88ca42516c08ffc))

## [0.20.2](https://github.com/tambo-ai/tambo/compare/react-v0.20.1...react-v0.20.2) (2025-04-07)

### Bug Fixes

- force typescript-sdk to be the right version ([#295](https://github.com/tambo-ai/tambo/issues/295)) ([1660ebb](https://github.com/tambo-ai/tambo/commit/1660ebb54e79d8f4c299ca5c66879edb294aea02))

## [0.20.1](https://github.com/tambo-ai/tambo/compare/react-v0.20.0...react-v0.20.1) (2025-04-07)

### Bug Fixes

- make threadId optional in sendThreadMessage ([#292](https://github.com/tambo-ai/tambo/issues/292)) ([e043f35](https://github.com/tambo-ai/tambo/commit/e043f35310f125c0da4f2e90a523af2246c547a2))

## [0.20.0](https://github.com/tambo-ai/tambo/compare/react-v0.19.8...react-v0.20.0) (2025-04-05)

### Features

- enforce zod/json-ness of propSchema prop ([#276](https://github.com/tambo-ai/tambo/issues/276)) ([a717c9f](https://github.com/tambo-ai/tambo/commit/a717c9f375cad438cf7850bda62d856b7db3fde9))

### Miscellaneous

- **deps-dev:** bump @testing-library/react from 16.2.0 to 16.3.0 ([#286](https://github.com/tambo-ai/tambo/issues/286)) ([91d0986](https://github.com/tambo-ai/tambo/commit/91d098670a3be669a172594b17a38500cd37f92a))
- **deps-dev:** bump @types/node from 20.17.28 to 20.17.30 ([#279](https://github.com/tambo-ai/tambo/issues/279)) ([78f7ad2](https://github.com/tambo-ai/tambo/commit/78f7ad2ff4bf6dbdef9b26881c91893637a9d142))
- **deps-dev:** bump the eslint group with 5 updates ([#278](https://github.com/tambo-ai/tambo/issues/278)) ([88fcd49](https://github.com/tambo-ai/tambo/commit/88fcd49d32dc7a2e23077d81386cf6858089e708))
- **deps-dev:** bump typescript from 5.8.2 to 5.8.3 ([#282](https://github.com/tambo-ai/tambo/issues/282)) ([0c1fc63](https://github.com/tambo-ai/tambo/commit/0c1fc631be3212e7c3b82c696306d7fac36d5f56))
- **deps:** bump @tambo-ai/typescript-sdk from 0.42.0 to 0.42.1 ([#285](https://github.com/tambo-ai/tambo/issues/285)) ([e4820b4](https://github.com/tambo-ai/tambo/commit/e4820b436b7357c32b4f9d96640e6664e5affa02))
- **deps:** bump @tanstack/react-query from 5.71.1 to 5.71.10 ([#281](https://github.com/tambo-ai/tambo/issues/281)) ([bc90e94](https://github.com/tambo-ai/tambo/commit/bc90e946ec27d900a2eccee880de79b8297b2128))

## [0.19.8](https://github.com/tambo-ai/tambo/compare/react-v0.19.7...react-v0.19.8) (2025-04-04)

### Bug Fixes

- Don't throw error if TamboProvider used outside browser ([#271](https://github.com/tambo-ai/tambo/issues/271)) ([0390fb1](https://github.com/tambo-ai/tambo/commit/0390fb1e4b5bf1bba857125716633ac37667d73a))

## [0.19.7](https://github.com/tambo-ai/tambo/compare/react-v0.19.6...react-v0.19.7) (2025-04-02)

### Documentation

- update README files for React SDK and CLI, fix links and enhance installation instructions ([#251](https://github.com/tambo-ai/tambo/issues/251)) ([fa85f17](https://github.com/tambo-ai/tambo/commit/fa85f1701fe27fdd59b4d7f0f6741c392c08808d))

## [0.19.6](https://github.com/tambo-ai/tambo/compare/react-v0.19.5...react-v0.19.6) (2025-04-02)

### Bug Fixes

- Remove many uses of currentThreadId ([#246](https://github.com/tambo-ai/tambo/issues/246)) ([9da43ee](https://github.com/tambo-ai/tambo/commit/9da43ee045e0950d4ea63cf9dfe108b17a175433))

## [0.19.5](https://github.com/tambo-ai/tambo/compare/react-v0.19.4...react-v0.19.5) (2025-04-01)

### Bug Fixes

- minor component cleanups: stop using useEffect/etc ([#242](https://github.com/tambo-ai/tambo/issues/242)) ([7c6d334](https://github.com/tambo-ai/tambo/commit/7c6d334d500d909038469132123c9d163f2f7c5b))
- workaround turbopack bugs w/Stainless shims ([#243](https://github.com/tambo-ai/tambo/issues/243)) ([c3ef647](https://github.com/tambo-ai/tambo/commit/c3ef6478a47d0acb7f690fdb54d8298f3f7d63ca))

### Miscellaneous

- **deps-dev:** bump @types/node from 20.17.27 to 20.17.28 ([#231](https://github.com/tambo-ai/tambo/issues/231)) ([edee5d1](https://github.com/tambo-ai/tambo/commit/edee5d17860df15f4eb32eaa74afc309f97cbdcb))
- **deps-dev:** bump ts-jest from 29.2.6 to 29.3.1 ([#235](https://github.com/tambo-ai/tambo/issues/235)) ([bf683cf](https://github.com/tambo-ai/tambo/commit/bf683cf9c79429752b74db3d6adb1239989dcfdd))
- **deps-dev:** bump typescript-eslint from 8.28.0 to 8.29.0 in the eslint group ([#227](https://github.com/tambo-ai/tambo/issues/227)) ([58134f1](https://github.com/tambo-ai/tambo/commit/58134f16f5bbee49df3390cf7bd3b09ab0e00313))
- **deps:** bump @tanstack/react-query from 5.69.0 to 5.71.1 ([#232](https://github.com/tambo-ai/tambo/issues/232)) ([4a30da3](https://github.com/tambo-ai/tambo/commit/4a30da3afc057066fcb84da9b60805055572fc77))

## [0.19.4](https://github.com/tambo-ai/tambo/compare/react-v0.19.3...react-v0.19.4) (2025-03-28)

### Bug Fixes

- do not debounce local updates ([#224](https://github.com/tambo-ai/tambo/issues/224)) ([1ce2227](https://github.com/tambo-ai/tambo/commit/1ce22271b365f6ed07791a80e3337ea46d9e0982))

## [0.19.3](https://github.com/tambo-ai/tambo/compare/react-v0.19.2...react-v0.19.3) (2025-03-28)

### Bug Fixes

- now the debounce just stores the current user value and doesn't sync back also made it 500ms default ([#221](https://github.com/tambo-ai/tambo/issues/221)) ([1eabf10](https://github.com/tambo-ai/tambo/commit/1eabf1038348eeb4026906ebafbb8c0b1b72af12))

### Miscellaneous

- bump typescript-sdk version to get componentState changes ([#223](https://github.com/tambo-ai/tambo/issues/223)) ([2cff5e9](https://github.com/tambo-ai/tambo/commit/2cff5e99d440ee6c80ae716830de989b448abdfe))

## [0.19.2](https://github.com/tambo-ai/tambo/compare/react-v0.19.1...react-v0.19.2) (2025-03-27)

### Bug Fixes

- remove setState & currentState from dependency array in useTamboStreamingProps hook ([#218](https://github.com/tambo-ai/tambo/issues/218)) ([b1d5be2](https://github.com/tambo-ai/tambo/commit/b1d5be28302fe3706685ff9fe5a493a622b4da51))
- update dependency array in useTamboStreamingProps to only include streamingProps ([#220](https://github.com/tambo-ai/tambo/issues/220)) ([da153ac](https://github.com/tambo-ai/tambo/commit/da153ace1063ba0f622b02d83dd36b5e8b706eba))

## [0.19.1](https://github.com/tambo-ai/tambo/compare/react-v0.19.0...react-v0.19.1) (2025-03-26)

### Miscellaneous

- **deps:** bump @tambo-ai/typescript-sdk to 0.41 ([#217](https://github.com/tambo-ai/tambo/issues/217)) ([e55e76c](https://github.com/tambo-ai/tambo/commit/e55e76c58b4e5b16591bb4988e42691b1926128b))

### Documentation

- add even more jsdocs for public methods/hooks/etc ([#216](https://github.com/tambo-ai/tambo/issues/216)) ([4dcbdd1](https://github.com/tambo-ai/tambo/commit/4dcbdd1f29d407d7f3deeb1b4b220f4361b20787))
- add JSDocs to exported functions ([#215](https://github.com/tambo-ai/tambo/issues/215)) ([cc8714d](https://github.com/tambo-ai/tambo/commit/cc8714d63f30c5311b2e9cd306490c41abc25a1f))

### Code Refactoring

- use faster/pre-built isEqual, will be useful elsewhere ([#202](https://github.com/tambo-ai/tambo/issues/202)) ([a8bd035](https://github.com/tambo-ai/tambo/commit/a8bd03512a0988b087c38df012212e9b03b8d052))

## [0.19.0](https://github.com/tambo-ai/tambo/compare/react-v0.18.2...react-v0.19.0) (2025-03-26)

### Features

- add 'startNewThread' method ([#205](https://github.com/tambo-ai/tambo/issues/205)) ([d62e867](https://github.com/tambo-ai/tambo/commit/d62e8676c0d140faf648597341449be9328e589f))
- useTamboThreads -&gt; useTamboThreadList ([#200](https://github.com/tambo-ai/tambo/issues/200)) ([4a32eda](https://github.com/tambo-ai/tambo/commit/4a32eda20b6564465b69bccda8ed94f65ea56b01))

### Bug Fixes

- add period to update release please ([#207](https://github.com/tambo-ai/tambo/issues/207)) ([d4585fd](https://github.com/tambo-ai/tambo/commit/d4585fd775bbb8469051bb666a1ef6a02b41f415))

### Miscellaneous

- allow switch to placeholder as 'new thread' ([#201](https://github.com/tambo-ai/tambo/issues/201)) ([9061863](https://github.com/tambo-ai/tambo/commit/9061863dc2dd563b2e204b7ad10ad33237388d21))
- **deps:** bump @tambo-ai/typescript-sdk from 0.39.0 to 0.40.0 ([#209](https://github.com/tambo-ai/tambo/issues/209)) ([07406d8](https://github.com/tambo-ai/tambo/commit/07406d897a70064d2d34a25d691472531c1d9fb6))

## [0.18.2](https://github.com/tambo-ai/tambo/compare/react-v0.18.1...react-v0.18.2) (2025-03-26)

### Miscellaneous

- bump tambo/ts version ([#196](https://github.com/tambo-ai/tambo/issues/196)) ([d24918b](https://github.com/tambo-ai/tambo/commit/d24918b61acc78ae5f1d09a4f70f65c09ebd989d))

## [0.18.1](https://github.com/tambo-ai/tambo/compare/react-v0.18.0...react-v0.18.1) (2025-03-25)

### Bug Fixes

- suggestions to filter for assistant ([#188](https://github.com/tambo-ai/tambo/issues/188)) ([03b597d](https://github.com/tambo-ai/tambo/commit/03b597d3f1ec19e0c33be1b850c9284db3546d75))

### Miscellaneous

- **deps-dev:** bump @types/node from 20.17.25 to 20.17.27 ([#180](https://github.com/tambo-ai/tambo/issues/180)) ([9caede8](https://github.com/tambo-ai/tambo/commit/9caede80a7999afaf0d8e05521c290c204fb099d))
- **deps-dev:** bump the eslint group with 4 updates ([#178](https://github.com/tambo-ai/tambo/issues/178)) ([52bcaca](https://github.com/tambo-ai/tambo/commit/52bcaca7c06141955d2185a84f1647cf40847a38))
- **deps:** bump @tambo-ai/typescript-sdk from 0.37.0 to 0.38.0 ([#182](https://github.com/tambo-ai/tambo/issues/182)) ([e4222b1](https://github.com/tambo-ai/tambo/commit/e4222b132bc647d8216fec3e18df705c9afe8659))
- **deps:** bump @tanstack/react-query from 5.68.0 to 5.69.0 ([#183](https://github.com/tambo-ai/tambo/issues/183)) ([ba18fba](https://github.com/tambo-ai/tambo/commit/ba18fbab3680c89c62f4f05b5fa342d3798bbcc9))
- **deps:** bump zod-to-json-schema from 3.24.4 to 3.24.5 ([#187](https://github.com/tambo-ai/tambo/issues/187)) ([45e150f](https://github.com/tambo-ai/tambo/commit/45e150f5ec0224301e8eea160834920754eec6f8))

## [0.18.0](https://github.com/tambo-ai/tambo/compare/react-v0.17.0...react-v0.18.0) (2025-03-22)

### Features

- add support for propsSchema ([#174](https://github.com/tambo-ai/tambo/issues/174)) ([da0e049](https://github.com/tambo-ai/tambo/commit/da0e049295a1bba5c7aa13d137df2602f2ffd09f))

## [0.17.0](https://github.com/tambo-ai/tambo/compare/react-v0.16.2...react-v0.17.0) (2025-03-21)

### Features

- add debounce, optimistic updates, and helper functions for prop updates ([#169](https://github.com/tambo-ai/tambo/issues/169)) ([b1f5870](https://github.com/tambo-ai/tambo/commit/b1f587033596857ea0df00499a53caf85af89dc6))

## [0.16.2](https://github.com/tambo-ai/tambo/compare/react-v0.16.1...react-v0.16.2) (2025-03-21)

### Bug Fixes

- expose fetch param from switchthread ([#170](https://github.com/tambo-ai/tambo/issues/170)) ([83f41fe](https://github.com/tambo-ai/tambo/commit/83f41fe41672f4950346dedc7798c64d3849727e))

## [0.16.1](https://github.com/tambo-ai/tambo/compare/react-v0.16.0...react-v0.16.1) (2025-03-19)

### Bug Fixes

- only initialize component state value once ([#165](https://github.com/tambo-ai/tambo/issues/165)) ([316afcf](https://github.com/tambo-ai/tambo/commit/316afcf881435e694017ea06e00afd8f6dad5733))

## [0.16.0](https://github.com/tambo-ai/tambo/compare/react-v0.15.1...react-v0.16.0) (2025-03-19)

### Features

- add components= prop to pass static component list ([#164](https://github.com/tambo-ai/tambo/issues/164)) ([a78f6da](https://github.com/tambo-ai/tambo/commit/a78f6dae3ac6ca51ca5768c6ea0abe511ba999c0))

### Miscellaneous

- pin stuff down to node &gt;=20 ([#159](https://github.com/tambo-ai/tambo/issues/159)) ([169797b](https://github.com/tambo-ai/tambo/commit/169797bc2800b1e42903d358f8023f391898b33f))

## [0.15.1](https://github.com/tambo-ai/tambo/compare/react-v0.15.0...react-v0.15.1) (2025-03-18)

### Bug Fixes

- add explicit key= to work around subtle react caching behavior ([#157](https://github.com/tambo-ai/tambo/issues/157)) ([aaa1ce0](https://github.com/tambo-ai/tambo/commit/aaa1ce0f826afc00f45a2ed27d7b82524c8262a0))

## [0.15.0](https://github.com/tambo-ai/tambo/compare/react-v0.14.1...react-v0.15.0) (2025-03-18)

### Features

- send tool response in message content ([#149](https://github.com/tambo-ai/tambo/issues/149)) ([1e90186](https://github.com/tambo-ai/tambo/commit/1e90186ac12c35765441a0c136ca8f6ceb2b165e))

### Miscellaneous

- bump to new typescript-sdk ([#147](https://github.com/tambo-ai/tambo/issues/147)) ([2c4f0bc](https://github.com/tambo-ai/tambo/commit/2c4f0bc38ca62dcac6fb4b3de1f13eff199fe2ac))
- remove some unused dependencies ([#152](https://github.com/tambo-ai/tambo/issues/152)) ([02f3e0d](https://github.com/tambo-ai/tambo/commit/02f3e0d0d7708ddcf72216a90167938ed1aab78a))

## [0.14.1](https://github.com/tambo-ai/tambo/compare/react-v0.14.0...react-v0.14.1) (2025-03-17)

### Bug Fixes

- include tool_call_id in response, for full round-trip ([#143](https://github.com/tambo-ai/tambo/issues/143)) ([deb96ab](https://github.com/tambo-ai/tambo/commit/deb96abdbf606e51c573b3350005884993c2fee3))

## [0.14.0](https://github.com/tambo-ai/tambo/compare/react-v0.13.4...react-v0.14.0) (2025-03-17)

### Features

- add suggestionResult to useTamboSuggestions interface ([#125](https://github.com/tambo-ai/tambo/issues/125)) ([172c7d2](https://github.com/tambo-ai/tambo/commit/172c7d268527faf57668daf2dcd8c681cda14f57))
- bump typescript-sdk and fix react hooks lint ([#140](https://github.com/tambo-ai/tambo/issues/140)) ([0039327](https://github.com/tambo-ai/tambo/commit/0039327f1f7ade38c3da90fbdad17b686d600b03))

## [0.13.4](https://github.com/tambo-ai/tambo/compare/react-v0.13.3...react-v0.13.4) (2025-03-17)

### Bug Fixes

- correct repo url for dependabot references/etc ([#139](https://github.com/tambo-ai/tambo/issues/139)) ([514ca3a](https://github.com/tambo-ai/tambo/commit/514ca3ae8c19cd2e777e0683d6adc6e346492a57))

### Miscellaneous

- **deps-dev:** bump lint-staged from 15.4.3 to 15.5.0 ([#137](https://github.com/tambo-ai/tambo/issues/137)) ([46f5837](https://github.com/tambo-ai/tambo/commit/46f5837fe6cb446ac87df58e072cd4ade0527265))
- **deps:** bump @tanstack/react-query from 5.67.3 to 5.68.0 ([#132](https://github.com/tambo-ai/tambo/issues/132)) ([3e15aa2](https://github.com/tambo-ai/tambo/commit/3e15aa255fd36bcd629a74b4f98ec18e573d269d))
- **deps:** bump zod-to-json-schema from 3.24.3 to 3.24.4 ([#133](https://github.com/tambo-ai/tambo/issues/133)) ([755762d](https://github.com/tambo-ai/tambo/commit/755762dfd8cf75b977103a189e0f1301c865f03d))

## [0.13.3](https://github.com/tambo-ai/tambo/compare/react-v0.13.2...react-v0.13.3) (2025-03-13)

### Bug Fixes

- Send initial component state on render ([#124](https://github.com/tambo-ai/tambo/issues/124)) ([2cfa4b2](https://github.com/tambo-ai/tambo/commit/2cfa4b21274e71edb25a39ca5919ad4bf7c56954))

### Miscellaneous

- bump typescript-sdk to pick up required type ([#127](https://github.com/tambo-ai/tambo/issues/127)) ([0f4d4f4](https://github.com/tambo-ai/tambo/commit/0f4d4f485de97479371efb9880b52dad5a8bcec4))

## [0.13.2](https://github.com/tambo-ai/tambo/compare/react-v0.13.1...react-v0.13.2) (2025-03-12)

### Bug Fixes

- bump typescript-sdk to eliminate old apis ([#121](https://github.com/tambo-ai/tambo/issues/121)) ([9173a7d](https://github.com/tambo-ai/tambo/commit/9173a7d85863c2009205020c47ce1141b32d554e))
- during streaming fetch at complete ([#120](https://github.com/tambo-ai/tambo/issues/120)) ([246971a](https://github.com/tambo-ai/tambo/commit/246971afe74b6f06d1deb473d7e466f4c8ed3e03))
- rename `react` directory to `react-sdk` for name collision avoidance ([#113](https://github.com/tambo-ai/tambo/issues/113)) ([f6ac4c9](https://github.com/tambo-ai/tambo/commit/f6ac4c99892172650b58aad68585eb7aa35da9b2))
- renaming react suffix on package (as a test) ([#114](https://github.com/tambo-ai/tambo/issues/114)) ([dfe581d](https://github.com/tambo-ai/tambo/commit/dfe581dbb94e82284ac05b15e9e88d440fe87d87))

### Miscellaneous

- removes old files and update readmes ([#117](https://github.com/tambo-ai/tambo/issues/117)) ([94e6dde](https://github.com/tambo-ai/tambo/commit/94e6dded0d8abd15b7f2b19c0837cf9baf2f279d))

## [0.13.1](https://github.com/tambo-ai/tambo/compare/react-v0.13.0...react-v0.13.1) (2025-03-11)

### Bug Fixes

- add individual release-please manifests as a test ([#106](https://github.com/tambo-ai/tambo/issues/106)) ([60edfde](https://github.com/tambo-ai/tambo/commit/60edfde4e039fba60003ea8fc6185cd4cb44141c))
- explicitly update manifest to account for separate-pull-requests: true setting ([#102](https://github.com/tambo-ai/tambo/issues/102)) ([c441488](https://github.com/tambo-ai/tambo/commit/c441488bf8bd9623c2565089e823733fd9d28495))
- get rid of individual manifests, they do not work ([#108](https://github.com/tambo-ai/tambo/issues/108)) ([83bce6e](https://github.com/tambo-ai/tambo/commit/83bce6e4b66267375c018ee7ac82e40d6784141f))
- repo url with "npm pkg fix" ([#101](https://github.com/tambo-ai/tambo/issues/101)) ([7cbe27d](https://github.com/tambo-ai/tambo/commit/7cbe27da403aa95e6c571db01a568736adfce685))

## [0.13.0](https://github.com/tambo-ai/tambo/compare/react-v0.12.1...react-v0.13.0) (2025-03-11)

### Features

- support default prod/staging urls in react client ([#99](https://github.com/tambo-ai/tambo/issues/99)) ([8f61815](https://github.com/tambo-ai/tambo/commit/8f61815893a569742ed34c58a539b704f7d8d2e1))

### Bug Fixes

- avoid first message flicker ([#93](https://github.com/tambo-ai/tambo/issues/93)) ([87c78d3](https://github.com/tambo-ai/tambo/commit/87c78d3b7569d3b8f385aecdf0aef3487b70697c))

## [0.12.1](https://github.com/tambo-ai/tambo/compare/react-v0.12.0...react-v0.12.1) (2025-03-11)

### Bug Fixes

- remove toolcall message from localthread during streaming ([#88](https://github.com/tambo-ai/tambo/issues/88)) ([47c147b](https://github.com/tambo-ai/tambo/commit/47c147b86b5690238a72be55f0a560b274371d0d))

### Miscellaneous

- add param for streamResponse to input hook's submit ([#76](https://github.com/tambo-ai/tambo/issues/76)) ([c107a1b](https://github.com/tambo-ai/tambo/commit/c107a1b3d40bd9caa9290e630ebd74f64dd90203))
- **deps:** bump @tanstack/react-query from 5.67.2 to 5.67.3 ([#82](https://github.com/tambo-ai/tambo/issues/82)) ([48113b3](https://github.com/tambo-ai/tambo/commit/48113b3c85d7940d92442bd6964c8898a9984521))
- Expose thread generation stage/status values from threadsprovider ([#74](https://github.com/tambo-ai/tambo/issues/74)) ([9f60793](https://github.com/tambo-ai/tambo/commit/9f60793ecc9fc84ec2e82b446e1e1d1c82455fbc))
- Remove unused functions in react package ([#73](https://github.com/tambo-ai/tambo/issues/73)) ([1a6931f](https://github.com/tambo-ai/tambo/commit/1a6931fb0b5e9a21fc3cb225df05708c97b43ac1))
- setup turbo ([#75](https://github.com/tambo-ai/tambo/issues/75)) ([11c0833](https://github.com/tambo-ai/tambo/commit/11c0833bf54f8bd0368da97855f18ca2832f7b47))

## [0.12.0](https://github.com/tambo-ai/hydra-ai-react/compare/react-v0.11.1...react-v0.12.0) (2025-03-10)

### Features

- new package name, @tambo-ai/react ([#145](https://github.com/tambo-ai/hydra-ai-react/issues/145)) ([03f8856](https://github.com/tambo-ai/hydra-ai-react/commit/03f8856e89b6a814c712b2ce531626d330405e0e))

### Miscellaneous Chores

- **deps-dev:** bump @eslint/js from 9.21.0 to 9.22.0 ([#142](https://github.com/tambo-ai/hydra-ai-react/issues/142)) ([ccadc7f](https://github.com/tambo-ai/hydra-ai-react/commit/ccadc7fec4cf5695e204472a0e8c60c320284d0c))
- **deps-dev:** bump eslint from 9.21.0 to 9.22.0 ([#139](https://github.com/tambo-ai/hydra-ai-react/issues/139)) ([97e8046](https://github.com/tambo-ai/hydra-ai-react/commit/97e8046cc040e5fb564757cd8795586452409568))
- **deps:** bump @tanstack/react-query from 5.67.1 to 5.67.2 ([#140](https://github.com/tambo-ai/hydra-ai-react/issues/140)) ([a6ce5ba](https://github.com/tambo-ai/hydra-ai-react/commit/a6ce5ba29d8261e8e7164643c5c631127daca54b))
- use 'advance' function from threadprovider ([#144](https://github.com/tambo-ai/hydra-ai-react/issues/144)) ([4ee2453](https://github.com/tambo-ai/hydra-ai-react/commit/4ee2453d8c0ca59dca0c0e6e1b69d3ccd90ac0f1))

## [0.11.1](https://github.com/use-hydra-ai/hydra-ai-react/compare/react-v0.11.0...react-v0.11.1) (2025-03-08)

### Bug Fixes

- locally cache messages when we get new threads from the network ([#138](https://github.com/use-hydra-ai/hydra-ai-react/issues/138)) ([2017712](https://github.com/use-hydra-ai/hydra-ai-react/commit/2017712799e3a3757a0ab922553498822dd4b40c))

### Miscellaneous Chores

- catch some nullish issues by updating eslint config to use stylistic config ([#134](https://github.com/use-hydra-ai/hydra-ai-react/issues/134)) ([0ffc1dd](https://github.com/use-hydra-ai/hydra-ai-react/commit/0ffc1dded228840ca38e79f16b93e2b63a5c495b))

## [0.11.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/react-v0.10.0...react-v0.11.0) (2025-03-07)

### Features

- add 'advance' function to threads provider ([#124](https://github.com/use-hydra-ai/hydra-ai-react/issues/124)) ([9cbec03](https://github.com/use-hydra-ai/hydra-ai-react/commit/9cbec030d4121d0ec96b1e7459eb7a8701f12250))
- Add initial streaming ([#71](https://github.com/use-hydra-ai/hydra-ai-react/issues/71)) ([7372948](https://github.com/use-hydra-ai/hydra-ai-react/commit/7372948be65cc9f9c637292b9430b5b7b46b824f))
- Add useComponentState hook ([#86](https://github.com/use-hydra-ai/hydra-ai-react/issues/86)) ([f6f6f73](https://github.com/use-hydra-ai/hydra-ai-react/commit/f6f6f73902629cc787a682e2ffda4056640e08ed))
- add useTamboThreads hook ([#97](https://github.com/use-hydra-ai/hydra-ai-react/issues/97)) ([1322f61](https://github.com/use-hydra-ai/hydra-ai-react/commit/1322f61126ac454cdb9bb12d4d11c22cae94593f))
- adds suggestions and input hooks ([#55](https://github.com/use-hydra-ai/hydra-ai-react/issues/55)) ([6589249](https://github.com/use-hydra-ai/hydra-ai-react/commit/658924955c69478714dee5f0cece3613bdcbee79))
- bump client to 0.25 to get thread messaages ([#107](https://github.com/use-hydra-ai/hydra-ai-react/issues/107)) ([6530f40](https://github.com/use-hydra-ai/hydra-ai-react/commit/6530f40875c815787b9c4aeeb28e85d7dd79d05e))
- Bump to new generate2/hydrate2 apis ([#33](https://github.com/use-hydra-ai/hydra-ai-react/issues/33)) ([6aa6add](https://github.com/use-hydra-ai/hydra-ai-react/commit/6aa6addc8c422531ebeead32c4610cf69e0f0fed))
- Integrate react-query into suggestions and input ([#115](https://github.com/use-hydra-ai/hydra-ai-react/issues/115)) ([6e736c4](https://github.com/use-hydra-ai/hydra-ai-react/commit/6e736c4a2237157ccc06d8d701382fe6c491867a))
- make thread rehydration work ([#111](https://github.com/use-hydra-ai/hydra-ai-react/issues/111)) ([de0dcf8](https://github.com/use-hydra-ai/hydra-ai-react/commit/de0dcf88e5090073368d44f1811f9e1fd9e6bc00))
- Rename variables, types, etc from Hydra -&gt; Tambo ([#88](https://github.com/use-hydra-ai/hydra-ai-react/issues/88)) ([f77a1a8](https://github.com/use-hydra-ai/hydra-ai-react/commit/f77a1a834616b4a79df2a57d05eca2bcbafc5bab))
- update to @hydra-ai/client with Tambo naming ([#91](https://github.com/use-hydra-ai/hydra-ai-react/issues/91)) ([1d79bf4](https://github.com/use-hydra-ai/hydra-ai-react/commit/1d79bf473f0bf514a8c4ec7eb7074ec3b71c094f))

### Bug Fixes

- add github conventional commits action ([#30](https://github.com/use-hydra-ai/hydra-ai-react/issues/30)) ([a6a147e](https://github.com/use-hydra-ai/hydra-ai-react/commit/a6a147e0d36ad3dc9a20b11a6f251d1be95103fc))
- Add QueryClientProvider to TamboProvider ([#117](https://github.com/use-hydra-ai/hydra-ai-react/issues/117)) ([321de97](https://github.com/use-hydra-ai/hydra-ai-react/commit/321de97b76bf60d0c77ea3f91649fcb9a742348b))
- add repo for dependabot ([#69](https://github.com/use-hydra-ai/hydra-ai-react/issues/69)) ([37656cf](https://github.com/use-hydra-ai/hydra-ai-react/commit/37656cfa843ce91ae5f5d4873c6c6bb28c6e935d))
- Add separate tool registry and hooks ([#32](https://github.com/use-hydra-ai/hydra-ai-react/issues/32)) ([573ca6d](https://github.com/use-hydra-ai/hydra-ai-react/commit/573ca6d199b629b8d6637b3deed6ffda93ba4565))
- Add streaming generation stage ([#81](https://github.com/use-hydra-ai/hydra-ai-react/issues/81)) ([c7e5151](https://github.com/use-hydra-ai/hydra-ai-react/commit/c7e5151ca2b4827c2ba3ee000070147dfcd1d906))
- bump client to get disabled retries ([#129](https://github.com/use-hydra-ai/hydra-ai-react/issues/129)) ([d8ac7d2](https://github.com/use-hydra-ai/hydra-ai-react/commit/d8ac7d2b727a8d5f1a3fbdb08da1d893e83ba08a))
- bump client, messages are required now ([#40](https://github.com/use-hydra-ai/hydra-ai-react/issues/40)) ([a623667](https://github.com/use-hydra-ai/hydra-ai-react/commit/a62366798ea91b95dae3449f186619484f1a3b2d))
- bump to 0.15.0 to get environent var fix ([#53](https://github.com/use-hydra-ai/hydra-ai-react/issues/53)) ([1c375b3](https://github.com/use-hydra-ai/hydra-ai-react/commit/1c375b395393a05a576958d5cb4b7c1be1c52ee3))
- bump to version with new threads API ([#96](https://github.com/use-hydra-ai/hydra-ai-react/issues/96)) ([726d390](https://github.com/use-hydra-ai/hydra-ai-react/commit/726d390f6b0830cd0e54c2ec71f5bdd6a40334dc))
- **deps-dev:** bump eslint-plugin-react-hooks from 5.1.0 to 5.2.0 ([#103](https://github.com/use-hydra-ai/hydra-ai-react/issues/103)) ([ca0c769](https://github.com/use-hydra-ai/hydra-ai-react/commit/ca0c76935bfd481c42ecb44c667415a99dc38b04))
- **deps-dev:** bump prettier from 3.5.2 to 3.5.3 ([#101](https://github.com/use-hydra-ai/hydra-ai-react/issues/101)) ([bc68124](https://github.com/use-hydra-ai/hydra-ai-react/commit/bc68124c551daae3b7943b8170fff4eed486bf1f))
- **deps-dev:** bump typescript from 5.7.3 to 5.8.2 ([#100](https://github.com/use-hydra-ai/hydra-ai-react/issues/100)) ([8ee4fd3](https://github.com/use-hydra-ai/hydra-ai-react/commit/8ee4fd334b439f6e1ec529f82052974bdfdaad50))
- **deps-dev:** bump typescript-eslint from 8.24.1 to 8.25.0 ([#79](https://github.com/use-hydra-ai/hydra-ai-react/issues/79)) ([257687e](https://github.com/use-hydra-ai/hydra-ai-react/commit/257687efc967858add37034847887986daaebd64))
- **deps-dev:** bump typescript-eslint from 8.25.0 to 8.26.0 ([#105](https://github.com/use-hydra-ai/hydra-ai-react/issues/105)) ([4b84c29](https://github.com/use-hydra-ai/hydra-ai-react/commit/4b84c292bdb7de6e3625cadddfb36323c4bef55d))
- **deps:** bump @hydra-ai/client from 0.17.0 to 0.19.0 ([#83](https://github.com/use-hydra-ai/hydra-ai-react/issues/83)) ([16cd0f6](https://github.com/use-hydra-ai/hydra-ai-react/commit/16cd0f636785ff476c2d1680bf593a9231a09c3b))
- **deps:** bump client to 0.28.0 ([#121](https://github.com/use-hydra-ai/hydra-ai-react/issues/121)) ([e725fce](https://github.com/use-hydra-ai/hydra-ai-react/commit/e725fce328322d351a299417d90504fd4da9c004))
- expose TamboThread type ([#109](https://github.com/use-hydra-ai/hydra-ai-react/issues/109)) ([428c50f](https://github.com/use-hydra-ai/hydra-ai-react/commit/428c50f8fd9664996320b7c26c1eff64aadb7c9b))
- fix some caching/rerendering/useEffect triggers ([#133](https://github.com/use-hydra-ai/hydra-ai-react/issues/133)) ([f6a30e4](https://github.com/use-hydra-ai/hydra-ai-react/commit/f6a30e48fb9a93e58ec397f41371b17cec0a54e0))
- fixed auto-submit ([#57](https://github.com/use-hydra-ai/hydra-ai-react/issues/57)) ([7ab5cda](https://github.com/use-hydra-ai/hydra-ai-react/commit/7ab5cdaeacbd027d9d5445bab98e4c67338e5a44))
- Make advance toolresponse messages have correct actionType ([#128](https://github.com/use-hydra-ai/hydra-ai-react/issues/128)) ([c6f0d38](https://github.com/use-hydra-ai/hydra-ai-react/commit/c6f0d38cf4c0ff3d27a0ae2daf9a1469437ad4c2))
- Make sendThreadMessage options optional ([#80](https://github.com/use-hydra-ai/hydra-ai-react/issues/80)) ([bdf32a7](https://github.com/use-hydra-ai/hydra-ai-react/commit/bdf32a7d3235f49b8f5a8fc130941ba94d9e431e))
- make sure to sync up thread loading with placeholder thread object ([#110](https://github.com/use-hydra-ai/hydra-ai-react/issues/110)) ([1a9c436](https://github.com/use-hydra-ai/hydra-ai-react/commit/1a9c4363bb35015d0b513afd25012e3865744563))
- make sure to use `return await` to capture errors ([#52](https://github.com/use-hydra-ai/hydra-ai-react/issues/52)) ([92fb641](https://github.com/use-hydra-ai/hydra-ai-react/commit/92fb641f500aa4ae5a7b0ce37bc07e01c009e8b7))
- package bump ([#25](https://github.com/use-hydra-ai/hydra-ai-react/issues/25)) ([32bfe23](https://github.com/use-hydra-ai/hydra-ai-react/commit/32bfe2337b07bbf94d50572e95adeb30d851cfb2))
- propagate contextKey through input + sendMessage ([#94](https://github.com/use-hydra-ai/hydra-ai-react/issues/94)) ([583986b](https://github.com/use-hydra-ai/hydra-ai-react/commit/583986bec507893c70c4c84d51a1a6dee1e2f8f9))
- proper return type to include component ([#36](https://github.com/use-hydra-ai/hydra-ai-react/issues/36)) ([2d3e447](https://github.com/use-hydra-ai/hydra-ai-react/commit/2d3e447b1c448679c1ba614206699fbca6fb9ec0))
- properly track "unresolved" thread using useEffect ([#20](https://github.com/use-hydra-ai/hydra-ai-react/issues/20)) ([3e6312c](https://github.com/use-hydra-ai/hydra-ai-react/commit/3e6312c0d8dcadf0f7b02d34b23832ba900a1fb9))
- release-please-config name ([#135](https://github.com/use-hydra-ai/hydra-ai-react/issues/135)) ([6f22ddd](https://github.com/use-hydra-ai/hydra-ai-react/commit/6f22ddd4728025721b9f5e53f579a7e0f4866276))
- remove console.log ([f4a58ad](https://github.com/use-hydra-ai/hydra-ai-react/commit/f4a58ad28f326df2024e36c56cdd7ffcc4e301bb))
- remove console.log ([12e575f](https://github.com/use-hydra-ai/hydra-ai-react/commit/12e575f6e84e26a5cef847c6a85e4e1ce7986f05))
- remove luxon dependency ([#50](https://github.com/use-hydra-ai/hydra-ai-react/issues/50)) ([7e0fbf3](https://github.com/use-hydra-ai/hydra-ai-react/commit/7e0fbf3b5bee5d8bf2d9963b41b46c6bac0fea86))
- rename files to have tambo name ([#90](https://github.com/use-hydra-ai/hydra-ai-react/issues/90)) ([833431c](https://github.com/use-hydra-ai/hydra-ai-react/commit/833431cddd4f2afad1968ae972c89fd794ff6d87))
- reset state if no component was generated ([#44](https://github.com/use-hydra-ai/hydra-ai-react/issues/44)) ([10c371d](https://github.com/use-hydra-ai/hydra-ai-react/commit/10c371d4972254791e6c7a497426484cd1b1a6d0))
- Simplify error messages and handling ([#93](https://github.com/use-hydra-ai/hydra-ai-react/issues/93)) ([6801aac](https://github.com/use-hydra-ai/hydra-ai-react/commit/6801aacb33141339c3f21ddd4d0cf64264b6ff2b))
- simplify suggestions code so we can use abortController ([#112](https://github.com/use-hydra-ai/hydra-ai-react/issues/112)) ([ac2a99b](https://github.com/use-hydra-ai/hydra-ai-react/commit/ac2a99b87e5142c7fdd74f71a1be41c71fdf97ad))
- Simplify tool parameter mapping by marking all fields as 'object' ([#35](https://github.com/use-hydra-ai/hydra-ai-react/issues/35)) ([73b206e](https://github.com/use-hydra-ai/hydra-ai-react/commit/73b206ec3044a86c3ea8a96c908301893842287e))
- **smoketest,api:** Update to expose HydraThread/HydraThreadMessage as consistent type ([#38](https://github.com/use-hydra-ai/hydra-ai-react/issues/38)) ([4e3a794](https://github.com/use-hydra-ai/hydra-ai-react/commit/4e3a794db6b6a401acee7e05a2b92842d212bdc6))
- stop repeating useSuggestion stuff, add react-query envelope for useTamboThreads ([#122](https://github.com/use-hydra-ai/hydra-ai-react/issues/122)) ([001c667](https://github.com/use-hydra-ai/hydra-ai-react/commit/001c667b4e86753f56fe04484504e5aeb2fa6a4d))
- switch dependabot config to use "fix" tag ([#77](https://github.com/use-hydra-ai/hydra-ai-react/issues/77)) ([5cf0914](https://github.com/use-hydra-ai/hydra-ai-react/commit/5cf0914904f08043b3b655e4c85db67133b3a823))
- try adding explicit registry ([f30c958](https://github.com/use-hydra-ai/hydra-ai-react/commit/f30c95806d04f714a3d2b8b03c37d85269138a75))
- try moving permissions ([6d709fe](https://github.com/use-hydra-ai/hydra-ai-react/commit/6d709fec8477a1467fdc92ebf63d54295f2a78e3))
- try using NODE_AUTH_TOKEN ([136ce24](https://github.com/use-hydra-ai/hydra-ai-react/commit/136ce24a0ad0432633b7c7faa740730d9876e422))
- update readme with package name ([#24](https://github.com/use-hydra-ai/hydra-ai-react/issues/24)) ([85d638f](https://github.com/use-hydra-ai/hydra-ai-react/commit/85d638f72d7cce782376d603c9d3030f0a4d2dcf))
- Update returned thread to include rendered component ([#43](https://github.com/use-hydra-ai/hydra-ai-react/issues/43)) ([b9de9a5](https://github.com/use-hydra-ai/hydra-ai-react/commit/b9de9a510abf72176a13c55268e331e42b2a944f))
- Use internal queryClient for react-query-related calls ([#119](https://github.com/use-hydra-ai/hydra-ai-react/issues/119)) ([7073f40](https://github.com/use-hydra-ai/hydra-ai-react/commit/7073f400c791d53f5c7cd7f0112cac898546b31f))
- Use new Thread and ThreadMessage types ([#27](https://github.com/use-hydra-ai/hydra-ai-react/issues/27)) ([de0efd4](https://github.com/use-hydra-ai/hydra-ai-react/commit/de0efd4dd2143e30fb5a482e37c4d6f99bbd0105))

### Dependencies

- add dependabot ([#60](https://github.com/use-hydra-ai/hydra-ai-react/issues/60)) ([39cdc31](https://github.com/use-hydra-ai/hydra-ai-react/commit/39cdc319a8d7e046a148b03b7af97a6749b08fda))
- **deps-dev:** bump @eslint/js from 9.19.0 to 9.20.0 ([#62](https://github.com/use-hydra-ai/hydra-ai-react/issues/62)) ([3aa57ee](https://github.com/use-hydra-ai/hydra-ai-react/commit/3aa57eea74dd04278f91a3486a5e2ee05698b3fe))
- **deps-dev:** bump @eslint/js from 9.20.0 to 9.21.0 ([#73](https://github.com/use-hydra-ai/hydra-ai-react/issues/73)) ([a6f21cf](https://github.com/use-hydra-ai/hydra-ai-react/commit/a6f21cf644ea54e06e0ba32044e42a301bd3ecbb))
- **deps-dev:** bump @types/react from 19.0.8 to 19.0.10 ([#66](https://github.com/use-hydra-ai/hydra-ai-react/issues/66)) ([adf6874](https://github.com/use-hydra-ai/hydra-ai-react/commit/adf68746842cd29ef2ff966cb702f56fd76ea4d9))
- **deps-dev:** bump eslint from 9.19.0 to 9.20.1 ([#65](https://github.com/use-hydra-ai/hydra-ai-react/issues/65)) ([7046fd3](https://github.com/use-hydra-ai/hydra-ai-react/commit/7046fd32603b33ff66ad54194ff4599987d8c949))
- **deps-dev:** bump eslint from 9.20.1 to 9.21.0 ([#75](https://github.com/use-hydra-ai/hydra-ai-react/issues/75)) ([08e7a78](https://github.com/use-hydra-ai/hydra-ai-react/commit/08e7a78c5025d6d7a452d1dfbc9da23bd6e1e536))
- **deps-dev:** bump prettier from 3.4.2 to 3.5.1 ([#68](https://github.com/use-hydra-ai/hydra-ai-react/issues/68)) ([c3d70c7](https://github.com/use-hydra-ai/hydra-ai-react/commit/c3d70c7ae39aff32120f819fafd2d0fbb51db564))
- **deps-dev:** bump prettier from 3.5.1 to 3.5.2 ([#76](https://github.com/use-hydra-ai/hydra-ai-react/issues/76)) ([ebffc72](https://github.com/use-hydra-ai/hydra-ai-react/commit/ebffc7211252835d26348dec753e38b42cad4668))
- **deps-dev:** bump typescript-eslint from 8.23.0 to 8.24.1 ([#63](https://github.com/use-hydra-ai/hydra-ai-react/issues/63)) ([984bc36](https://github.com/use-hydra-ai/hydra-ai-react/commit/984bc36407ef3a98e67addf5c488f9f8a4670f15))
- **deps:** bump @hydra-ai/client from 0.15.0 to 0.16.0 ([#67](https://github.com/use-hydra-ai/hydra-ai-react/issues/67)) ([b939429](https://github.com/use-hydra-ai/hydra-ai-react/commit/b939429af77593c7538ad68e748e4bf88553bde2))
- **deps:** bump zod from 3.24.1 to 3.24.2 ([#64](https://github.com/use-hydra-ai/hydra-ai-react/issues/64)) ([8ee391b](https://github.com/use-hydra-ai/hydra-ai-react/commit/8ee391b7043fb401fb2e49325e006805bb86f4e4))
- **deps:** bump zod-to-json-schema from 3.24.1 to 3.24.2 ([#61](https://github.com/use-hydra-ai/hydra-ai-react/issues/61)) ([e74e427](https://github.com/use-hydra-ai/hydra-ai-react/commit/e74e42728ddee2a7e2620a6bfbc829fe8a9f965b))
- **deps:** bump zod-to-json-schema from 3.24.2 to 3.24.3 ([#74](https://github.com/use-hydra-ai/hydra-ai-react/issues/74)) ([3dfa491](https://github.com/use-hydra-ai/hydra-ai-react/commit/3dfa491b1ea0e60368d4aed101862f76aa59fe79))

### Miscellaneous Chores

- add esm build output ([#114](https://github.com/use-hydra-ai/hydra-ai-react/issues/114)) ([2b59d60](https://github.com/use-hydra-ai/hydra-ai-react/commit/2b59d60dbf5f69ecb204684051df18280a4bdaff))
- add explicit config ([#131](https://github.com/use-hydra-ai/hydra-ai-react/issues/131)) ([adee942](https://github.com/use-hydra-ai/hydra-ai-react/commit/adee94290cccdb3747129c6fc894740a89260d68))
- add explicit release-please sections so none are hidden ([#72](https://github.com/use-hydra-ai/hydra-ai-react/issues/72)) ([0942b01](https://github.com/use-hydra-ai/hydra-ai-react/commit/0942b015045f0895b73cbdc7daa9aaba2aa5c3a6))
- add pre-commit hook to react package ([#126](https://github.com/use-hydra-ai/hydra-ai-react/issues/126)) ([ade7526](https://github.com/use-hydra-ai/hydra-ai-react/commit/ade752606e88675635a867fa9f488030f1b90900))
- add pre-commit lint-staged ([#59](https://github.com/use-hydra-ai/hydra-ai-react/issues/59)) ([bbd4809](https://github.com/use-hydra-ai/hydra-ai-react/commit/bbd4809d2c5bdd9bc36d79ca7ae73fe29ba1d11c))
- bump @hydra-ai/client to 0.13.0 ([#48](https://github.com/use-hydra-ai/hydra-ai-react/issues/48)) ([c2a137e](https://github.com/use-hydra-ai/hydra-ai-react/commit/c2a137e9ee369e599731f52b2663ada8b5dc7f01))
- fix action secret ([740e801](https://github.com/use-hydra-ai/hydra-ai-react/commit/740e8017830d503b09b29332259e2242306a5331))
- fix lint by removing unnecessary dependency ([#130](https://github.com/use-hydra-ai/hydra-ai-react/issues/130)) ([5141217](https://github.com/use-hydra-ai/hydra-ai-react/commit/51412175c3f2d882253d7a4e0dee6c0602324678))
- **main:** release 0.0.2 ([#16](https://github.com/use-hydra-ai/hydra-ai-react/issues/16)) ([121a6d4](https://github.com/use-hydra-ai/hydra-ai-react/commit/121a6d473c56728c4da674b4e5a7763c1bbf2936))
- **main:** release 0.0.3 ([#17](https://github.com/use-hydra-ai/hydra-ai-react/issues/17)) ([add3a85](https://github.com/use-hydra-ai/hydra-ai-react/commit/add3a85569b4903a23998b9c094035639cc95169))
- **main:** release 0.0.4 ([#18](https://github.com/use-hydra-ai/hydra-ai-react/issues/18)) ([66b7da4](https://github.com/use-hydra-ai/hydra-ai-react/commit/66b7da45e5182990d7468997f7f6b83737f14c2d))
- **main:** release 0.0.5 ([#19](https://github.com/use-hydra-ai/hydra-ai-react/issues/19)) ([09e095a](https://github.com/use-hydra-ai/hydra-ai-react/commit/09e095a56eb69cd2c8eb4a2523f377a4ce3085ed))
- **main:** release 0.0.6 ([#21](https://github.com/use-hydra-ai/hydra-ai-react/issues/21)) ([f00e910](https://github.com/use-hydra-ai/hydra-ai-react/commit/f00e91061d04f6a0f7be814d3c38c3d2a5ae3d69))
- **main:** release 0.0.7 ([#26](https://github.com/use-hydra-ai/hydra-ai-react/issues/26)) ([00d5bff](https://github.com/use-hydra-ai/hydra-ai-react/commit/00d5bff5fd622d579dfbc1e60ee3de0899b5a9e4))
- **main:** release 0.0.8 ([#28](https://github.com/use-hydra-ai/hydra-ai-react/issues/28)) ([7e95730](https://github.com/use-hydra-ai/hydra-ai-react/commit/7e957305519aa8dc8d8f782103d9fb7ec6b70adc))
- **main:** release 0.1.0 ([#31](https://github.com/use-hydra-ai/hydra-ai-react/issues/31)) ([efe6a8b](https://github.com/use-hydra-ai/hydra-ai-react/commit/efe6a8b03b63c3dbd96ef45f052b1a5f3ab34686))
- **main:** release 0.1.1 ([#37](https://github.com/use-hydra-ai/hydra-ai-react/issues/37)) ([5613e95](https://github.com/use-hydra-ai/hydra-ai-react/commit/5613e95a20a77179fec6b36a494bffbe392054d2))
- **main:** release 0.1.2 ([#39](https://github.com/use-hydra-ai/hydra-ai-react/issues/39)) ([f705b28](https://github.com/use-hydra-ai/hydra-ai-react/commit/f705b2849e79ecdb7626e62d00772ef0799cfe0c))
- **main:** release 0.1.3 ([#41](https://github.com/use-hydra-ai/hydra-ai-react/issues/41)) ([55ad98a](https://github.com/use-hydra-ai/hydra-ai-react/commit/55ad98a0707ef5c3550a822382b14a467a690850))
- **main:** release 0.1.4 ([#45](https://github.com/use-hydra-ai/hydra-ai-react/issues/45)) ([e911c16](https://github.com/use-hydra-ai/hydra-ai-react/commit/e911c165f324a8a9da21b4c617eedfbd0e50908f))
- **main:** release 0.1.5 ([#49](https://github.com/use-hydra-ai/hydra-ai-react/issues/49)) ([2bbcc32](https://github.com/use-hydra-ai/hydra-ai-react/commit/2bbcc32f9a093fe04cb5dc769724a561bf7b9315))
- **main:** release 0.1.6 ([#51](https://github.com/use-hydra-ai/hydra-ai-react/issues/51)) ([a3f52e6](https://github.com/use-hydra-ai/hydra-ai-react/commit/a3f52e6980193272b6c07b05420c232f2cd8559e))
- **main:** release 0.1.7 ([#54](https://github.com/use-hydra-ai/hydra-ai-react/issues/54)) ([d110ea4](https://github.com/use-hydra-ai/hydra-ai-react/commit/d110ea4ae644178cbb67b6d7e9e08e38d0fe50c9))
- **main:** release 0.10.0 ([#127](https://github.com/use-hydra-ai/hydra-ai-react/issues/127)) ([71f3b3d](https://github.com/use-hydra-ai/hydra-ai-react/commit/71f3b3d0640c97e26ba07445cf705e3d1ba66465))
- **main:** release 0.2.0 ([#56](https://github.com/use-hydra-ai/hydra-ai-react/issues/56)) ([700f0a2](https://github.com/use-hydra-ai/hydra-ai-react/commit/700f0a2098786e18b9991bbf10c37040453abb45))
- **main:** release 0.2.1 ([#58](https://github.com/use-hydra-ai/hydra-ai-react/issues/58)) ([3f3d73e](https://github.com/use-hydra-ai/hydra-ai-react/commit/3f3d73e4754524af2ab18661499db430251ccb61))
- **main:** release 0.3.0 ([#70](https://github.com/use-hydra-ai/hydra-ai-react/issues/70)) ([3ac33d7](https://github.com/use-hydra-ai/hydra-ai-react/commit/3ac33d742824cf81e5d3ec6b2e80e71251212ae3))
- **main:** release 0.3.1 ([#78](https://github.com/use-hydra-ai/hydra-ai-react/issues/78)) ([dde938c](https://github.com/use-hydra-ai/hydra-ai-react/commit/dde938cf8447f09970cc0bf6d563f8e769f97ae4))
- **main:** release 0.4.0 ([#87](https://github.com/use-hydra-ai/hydra-ai-react/issues/87)) ([31f11c2](https://github.com/use-hydra-ai/hydra-ai-react/commit/31f11c25f277b08943e0e19ef5e3332bf7af8d6e))
- **main:** release 0.5.0 ([#89](https://github.com/use-hydra-ai/hydra-ai-react/issues/89)) ([f3ba3b7](https://github.com/use-hydra-ai/hydra-ai-react/commit/f3ba3b763961465a8334a34a3393dc8559295d3e))
- **main:** release 0.6.0 ([#92](https://github.com/use-hydra-ai/hydra-ai-react/issues/92)) ([ccb74a4](https://github.com/use-hydra-ai/hydra-ai-react/commit/ccb74a47cd77f150279bae7874874591b64d20ab))
- **main:** release 0.6.1 ([#95](https://github.com/use-hydra-ai/hydra-ai-react/issues/95)) ([fda2572](https://github.com/use-hydra-ai/hydra-ai-react/commit/fda25724b9f79bbca6cf8d9e239915af5043085f))
- **main:** release 0.7.0 ([#98](https://github.com/use-hydra-ai/hydra-ai-react/issues/98)) ([1269273](https://github.com/use-hydra-ai/hydra-ai-react/commit/12692736b997b5c3b5b39d3191b7bf6f57cf2c36))
- **main:** release 0.8.0 ([#104](https://github.com/use-hydra-ai/hydra-ai-react/issues/104)) ([6086b60](https://github.com/use-hydra-ai/hydra-ai-react/commit/6086b608823acf653a521d4bf5981fb111ca4283))
- **main:** release 0.8.1 ([#113](https://github.com/use-hydra-ai/hydra-ai-react/issues/113)) ([3cf4a54](https://github.com/use-hydra-ai/hydra-ai-react/commit/3cf4a547366eeddaf2b99ee9d74506873c663493))
- **main:** release 0.9.0 ([#116](https://github.com/use-hydra-ai/hydra-ai-react/issues/116)) ([598fdc7](https://github.com/use-hydra-ai/hydra-ai-react/commit/598fdc7481d758759dd173963a23f1444471e3a0))
- **main:** release 0.9.1 ([#118](https://github.com/use-hydra-ai/hydra-ai-react/issues/118)) ([ed8fc23](https://github.com/use-hydra-ai/hydra-ai-react/commit/ed8fc23f13e9c9d1119820661bbb57725635efeb))
- **main:** release 0.9.2 ([#123](https://github.com/use-hydra-ai/hydra-ai-react/issues/123)) ([03d6a7c](https://github.com/use-hydra-ai/hydra-ai-react/commit/03d6a7cb63564ffb7ba6bcd4a003f912d3c58517))
- npm install @types/react ([#42](https://github.com/use-hydra-ai/hydra-ai-react/issues/42)) ([fba7c8a](https://github.com/use-hydra-ai/hydra-ai-react/commit/fba7c8acabccdb9861437e530a6793757dbd1962))
- release 0.0.2 ([8c5f706](https://github.com/use-hydra-ai/hydra-ai-react/commit/8c5f7064813d57fe91e82f7b6fe66322cad1fbd4))
- release 0.1.5 ([021b559](https://github.com/use-hydra-ai/hydra-ai-react/commit/021b559f1ec37fe41048224b308cebe63170d13a))
- release 0.11.0 ([0817487](https://github.com/use-hydra-ai/hydra-ai-react/commit/08174879c93c6ce73a00b3de6ab7be1817efe7d6))
- try without release-type ([#132](https://github.com/use-hydra-ai/hydra-ai-react/issues/132)) ([24ae9d8](https://github.com/use-hydra-ai/hydra-ai-react/commit/24ae9d8766109367bc591476c88bd23fbe9e42a5))

### Code Refactoring

- Improve suggestions hook with registry and query integration ([#125](https://github.com/use-hydra-ai/hydra-ai-react/issues/125)) ([ae8a59a](https://github.com/use-hydra-ai/hydra-ai-react/commit/ae8a59a8d3a73b5f3dd14d8acbc87c04e1a4b292))

### Tests

- Add initial jest setup, add some tests, run in ci ([#120](https://github.com/use-hydra-ai/hydra-ai-react/issues/120)) ([3457608](https://github.com/use-hydra-ai/hydra-ai-react/commit/34576081c28c9b2c7785fe5a5b0529cf8d7a5703))

### Continuous Integration

- turn on release-please-manifest.json ([#108](https://github.com/use-hydra-ai/hydra-ai-react/issues/108)) ([26ecc15](https://github.com/use-hydra-ai/hydra-ai-react/commit/26ecc15dff76383f873635a513c513a43ff6beed))

## [0.10.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.9.2...v0.10.0) (2025-03-06)

### Features

- add 'advance' function to threads provider ([#124](https://github.com/use-hydra-ai/hydra-ai-react/issues/124)) ([9cbec03](https://github.com/use-hydra-ai/hydra-ai-react/commit/9cbec030d4121d0ec96b1e7459eb7a8701f12250))

### Bug Fixes

- bump client to get disabled retries ([#129](https://github.com/use-hydra-ai/hydra-ai-react/issues/129)) ([d8ac7d2](https://github.com/use-hydra-ai/hydra-ai-react/commit/d8ac7d2b727a8d5f1a3fbdb08da1d893e83ba08a))
- Make advance toolresponse messages have correct actionType ([#128](https://github.com/use-hydra-ai/hydra-ai-react/issues/128)) ([c6f0d38](https://github.com/use-hydra-ai/hydra-ai-react/commit/c6f0d38cf4c0ff3d27a0ae2daf9a1469437ad4c2))

## [0.9.2](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.9.1...v0.9.2) (2025-03-05)

### Bug Fixes

- stop repeating useSuggestion stuff, add react-query envelope for useTamboThreads ([#122](https://github.com/use-hydra-ai/hydra-ai-react/issues/122)) ([001c667](https://github.com/use-hydra-ai/hydra-ai-react/commit/001c667b4e86753f56fe04484504e5aeb2fa6a4d))

## [0.9.1](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.9.0...v0.9.1) (2025-03-05)

### Bug Fixes

- Add QueryClientProvider to TamboProvider ([#117](https://github.com/use-hydra-ai/hydra-ai-react/issues/117)) ([321de97](https://github.com/use-hydra-ai/hydra-ai-react/commit/321de97b76bf60d0c77ea3f91649fcb9a742348b))
- **deps:** bump client to 0.28.0 ([#121](https://github.com/use-hydra-ai/hydra-ai-react/issues/121)) ([e725fce](https://github.com/use-hydra-ai/hydra-ai-react/commit/e725fce328322d351a299417d90504fd4da9c004))
- Use internal queryClient for react-query-related calls ([#119](https://github.com/use-hydra-ai/hydra-ai-react/issues/119)) ([7073f40](https://github.com/use-hydra-ai/hydra-ai-react/commit/7073f400c791d53f5c7cd7f0112cac898546b31f))

## [0.9.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.8.1...v0.9.0) (2025-03-05)

### Features

- Integrate react-query into suggestions and input ([#115](https://github.com/use-hydra-ai/hydra-ai-react/issues/115)) ([6e736c4](https://github.com/use-hydra-ai/hydra-ai-react/commit/6e736c4a2237157ccc06d8d701382fe6c491867a))

## [0.8.1](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.8.0...v0.8.1) (2025-03-04)

### Bug Fixes

- simplify suggestions code so we can use abortController ([#112](https://github.com/use-hydra-ai/hydra-ai-react/issues/112)) ([ac2a99b](https://github.com/use-hydra-ai/hydra-ai-react/commit/ac2a99b87e5142c7fdd74f71a1be41c71fdf97ad))

## [0.8.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.7.0...v0.8.0) (2025-03-04)

### Features

- bump client to 0.25 to get thread messaages ([#107](https://github.com/use-hydra-ai/hydra-ai-react/issues/107)) ([6530f40](https://github.com/use-hydra-ai/hydra-ai-react/commit/6530f40875c815787b9c4aeeb28e85d7dd79d05e))
- make thread rehydration work ([#111](https://github.com/use-hydra-ai/hydra-ai-react/issues/111)) ([de0dcf8](https://github.com/use-hydra-ai/hydra-ai-react/commit/de0dcf88e5090073368d44f1811f9e1fd9e6bc00))

### Bug Fixes

- **deps-dev:** bump eslint-plugin-react-hooks from 5.1.0 to 5.2.0 ([#103](https://github.com/use-hydra-ai/hydra-ai-react/issues/103)) ([ca0c769](https://github.com/use-hydra-ai/hydra-ai-react/commit/ca0c76935bfd481c42ecb44c667415a99dc38b04))
- **deps-dev:** bump prettier from 3.5.2 to 3.5.3 ([#101](https://github.com/use-hydra-ai/hydra-ai-react/issues/101)) ([bc68124](https://github.com/use-hydra-ai/hydra-ai-react/commit/bc68124c551daae3b7943b8170fff4eed486bf1f))
- **deps-dev:** bump typescript from 5.7.3 to 5.8.2 ([#100](https://github.com/use-hydra-ai/hydra-ai-react/issues/100)) ([8ee4fd3](https://github.com/use-hydra-ai/hydra-ai-react/commit/8ee4fd334b439f6e1ec529f82052974bdfdaad50))
- **deps-dev:** bump typescript-eslint from 8.25.0 to 8.26.0 ([#105](https://github.com/use-hydra-ai/hydra-ai-react/issues/105)) ([4b84c29](https://github.com/use-hydra-ai/hydra-ai-react/commit/4b84c292bdb7de6e3625cadddfb36323c4bef55d))
- expose TamboThread type ([#109](https://github.com/use-hydra-ai/hydra-ai-react/issues/109)) ([428c50f](https://github.com/use-hydra-ai/hydra-ai-react/commit/428c50f8fd9664996320b7c26c1eff64aadb7c9b))
- make sure to sync up thread loading with placeholder thread object ([#110](https://github.com/use-hydra-ai/hydra-ai-react/issues/110)) ([1a9c436](https://github.com/use-hydra-ai/hydra-ai-react/commit/1a9c4363bb35015d0b513afd25012e3865744563))

## [0.7.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.6.1...v0.7.0) (2025-03-01)

### Features

- add useTamboThreads hook ([#97](https://github.com/use-hydra-ai/hydra-ai-react/issues/97)) ([1322f61](https://github.com/use-hydra-ai/hydra-ai-react/commit/1322f61126ac454cdb9bb12d4d11c22cae94593f))

## [0.6.1](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.6.0...v0.6.1) (2025-02-28)

### Bug Fixes

- bump to version with new threads API ([#96](https://github.com/use-hydra-ai/hydra-ai-react/issues/96)) ([726d390](https://github.com/use-hydra-ai/hydra-ai-react/commit/726d390f6b0830cd0e54c2ec71f5bdd6a40334dc))
- propagate contextKey through input + sendMessage ([#94](https://github.com/use-hydra-ai/hydra-ai-react/issues/94)) ([583986b](https://github.com/use-hydra-ai/hydra-ai-react/commit/583986bec507893c70c4c84d51a1a6dee1e2f8f9))
- Simplify error messages and handling ([#93](https://github.com/use-hydra-ai/hydra-ai-react/issues/93)) ([6801aac](https://github.com/use-hydra-ai/hydra-ai-react/commit/6801aacb33141339c3f21ddd4d0cf64264b6ff2b))

## [0.6.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.5.0...v0.6.0) (2025-02-26)

### Features

- update to @hydra-ai/client with Tambo naming ([#91](https://github.com/use-hydra-ai/hydra-ai-react/issues/91)) ([1d79bf4](https://github.com/use-hydra-ai/hydra-ai-react/commit/1d79bf473f0bf514a8c4ec7eb7074ec3b71c094f))

## [0.5.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.4.0...v0.5.0) (2025-02-26)

### Features

- Rename variables, types, etc from Hydra -&gt; Tambo ([#88](https://github.com/use-hydra-ai/hydra-ai-react/issues/88)) ([f77a1a8](https://github.com/use-hydra-ai/hydra-ai-react/commit/f77a1a834616b4a79df2a57d05eca2bcbafc5bab))

### Bug Fixes

- rename files to have tambo name ([#90](https://github.com/use-hydra-ai/hydra-ai-react/issues/90)) ([833431c](https://github.com/use-hydra-ai/hydra-ai-react/commit/833431cddd4f2afad1968ae972c89fd794ff6d87))

## [0.4.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.3.1...v0.4.0) (2025-02-26)

### Features

- Add useComponentState hook ([#86](https://github.com/use-hydra-ai/hydra-ai-react/issues/86)) ([f6f6f73](https://github.com/use-hydra-ai/hydra-ai-react/commit/f6f6f73902629cc787a682e2ffda4056640e08ed))

## [0.3.1](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.3.0...v0.3.1) (2025-02-24)

### Bug Fixes

- Add streaming generation stage ([#81](https://github.com/use-hydra-ai/hydra-ai-react/issues/81)) ([c7e5151](https://github.com/use-hydra-ai/hydra-ai-react/commit/c7e5151ca2b4827c2ba3ee000070147dfcd1d906))
- **deps-dev:** bump typescript-eslint from 8.24.1 to 8.25.0 ([#79](https://github.com/use-hydra-ai/hydra-ai-react/issues/79)) ([257687e](https://github.com/use-hydra-ai/hydra-ai-react/commit/257687efc967858add37034847887986daaebd64))
- **deps:** bump @hydra-ai/client from 0.17.0 to 0.19.0 ([#83](https://github.com/use-hydra-ai/hydra-ai-react/issues/83)) ([16cd0f6](https://github.com/use-hydra-ai/hydra-ai-react/commit/16cd0f636785ff476c2d1680bf593a9231a09c3b))
- Make sendThreadMessage options optional ([#80](https://github.com/use-hydra-ai/hydra-ai-react/issues/80)) ([bdf32a7](https://github.com/use-hydra-ai/hydra-ai-react/commit/bdf32a7d3235f49b8f5a8fc130941ba94d9e431e))
- switch dependabot config to use "fix" tag ([#77](https://github.com/use-hydra-ai/hydra-ai-react/issues/77)) ([5cf0914](https://github.com/use-hydra-ai/hydra-ai-react/commit/5cf0914904f08043b3b655e4c85db67133b3a823))

## [0.3.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.2.1...v0.3.0) (2025-02-21)

### Features

- Add initial streaming ([#71](https://github.com/use-hydra-ai/hydra-ai-react/issues/71)) ([7372948](https://github.com/use-hydra-ai/hydra-ai-react/commit/7372948be65cc9f9c637292b9430b5b7b46b824f))

### Bug Fixes

- add repo for dependabot ([#69](https://github.com/use-hydra-ai/hydra-ai-react/issues/69)) ([37656cf](https://github.com/use-hydra-ai/hydra-ai-react/commit/37656cfa843ce91ae5f5d4873c6c6bb28c6e935d))

## [0.2.1](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.2.0...v0.2.1) (2025-02-20)

### Bug Fixes

- fixed auto-submit ([#57](https://github.com/use-hydra-ai/hydra-ai-react/issues/57)) ([7ab5cda](https://github.com/use-hydra-ai/hydra-ai-react/commit/7ab5cdaeacbd027d9d5445bab98e4c67338e5a44))

## [0.2.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.1.7...v0.2.0) (2025-02-19)

### Features

- adds suggestions and input hooks ([#55](https://github.com/use-hydra-ai/hydra-ai-react/issues/55)) ([6589249](https://github.com/use-hydra-ai/hydra-ai-react/commit/658924955c69478714dee5f0cece3613bdcbee79))

## [0.1.7](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.1.6...v0.1.7) (2025-02-19)

### Bug Fixes

- bump to 0.15.0 to get environent var fix ([#53](https://github.com/use-hydra-ai/hydra-ai-react/issues/53)) ([1c375b3](https://github.com/use-hydra-ai/hydra-ai-react/commit/1c375b395393a05a576958d5cb4b7c1be1c52ee3))

## [0.1.6](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.1.5...v0.1.6) (2025-02-18)

### Bug Fixes

- make sure to use `return await` to capture errors ([#52](https://github.com/use-hydra-ai/hydra-ai-react/issues/52)) ([92fb641](https://github.com/use-hydra-ai/hydra-ai-react/commit/92fb641f500aa4ae5a7b0ce37bc07e01c009e8b7))
- remove luxon dependency ([#50](https://github.com/use-hydra-ai/hydra-ai-react/issues/50)) ([7e0fbf3](https://github.com/use-hydra-ai/hydra-ai-react/commit/7e0fbf3b5bee5d8bf2d9963b41b46c6bac0fea86))

## [0.1.5](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.1.4...v0.1.5) (2025-02-18)

### Miscellaneous Chores

- release 0.1.5 ([021b559](https://github.com/use-hydra-ai/hydra-ai-react/commit/021b559f1ec37fe41048224b308cebe63170d13a))

## [0.1.4](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.1.3...v0.1.4) (2025-02-14)

### Bug Fixes

- reset state if no component was generated ([#44](https://github.com/use-hydra-ai/hydra-ai-react/issues/44)) ([10c371d](https://github.com/use-hydra-ai/hydra-ai-react/commit/10c371d4972254791e6c7a497426484cd1b1a6d0))

## [0.1.3](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.1.2...v0.1.3) (2025-02-13)

### Bug Fixes

- bump client, messages are required now ([#40](https://github.com/use-hydra-ai/hydra-ai-react/issues/40)) ([a623667](https://github.com/use-hydra-ai/hydra-ai-react/commit/a62366798ea91b95dae3449f186619484f1a3b2d))
- Update returned thread to include rendered component ([#43](https://github.com/use-hydra-ai/hydra-ai-react/issues/43)) ([b9de9a5](https://github.com/use-hydra-ai/hydra-ai-react/commit/b9de9a510abf72176a13c55268e331e42b2a944f))

## [0.1.2](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.1.1...v0.1.2) (2025-02-13)

### Bug Fixes

- **smoketest,api:** Update to expose HydraThread/HydraThreadMessage as consistent type ([#38](https://github.com/use-hydra-ai/hydra-ai-react/issues/38)) ([4e3a794](https://github.com/use-hydra-ai/hydra-ai-react/commit/4e3a794db6b6a401acee7e05a2b92842d212bdc6))

## [0.1.1](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.1.0...v0.1.1) (2025-02-12)

### Bug Fixes

- proper return type to include component ([#36](https://github.com/use-hydra-ai/hydra-ai-react/issues/36)) ([2d3e447](https://github.com/use-hydra-ai/hydra-ai-react/commit/2d3e447b1c448679c1ba614206699fbca6fb9ec0))

## [0.1.0](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.0.8...v0.1.0) (2025-02-12)

### Features

- Bump to new generate2/hydrate2 apis ([#33](https://github.com/use-hydra-ai/hydra-ai-react/issues/33)) ([6aa6add](https://github.com/use-hydra-ai/hydra-ai-react/commit/6aa6addc8c422531ebeead32c4610cf69e0f0fed))

### Bug Fixes

- add github conventional commits action ([#30](https://github.com/use-hydra-ai/hydra-ai-react/issues/30)) ([a6a147e](https://github.com/use-hydra-ai/hydra-ai-react/commit/a6a147e0d36ad3dc9a20b11a6f251d1be95103fc))
- Add separate tool registry and hooks ([#32](https://github.com/use-hydra-ai/hydra-ai-react/issues/32)) ([573ca6d](https://github.com/use-hydra-ai/hydra-ai-react/commit/573ca6d199b629b8d6637b3deed6ffda93ba4565))
- Simplify tool parameter mapping by marking all fields as 'object' ([#35](https://github.com/use-hydra-ai/hydra-ai-react/issues/35)) ([73b206e](https://github.com/use-hydra-ai/hydra-ai-react/commit/73b206ec3044a86c3ea8a96c908301893842287e))

## [0.0.8](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.0.7...v0.0.8) (2025-02-07)

### Bug Fixes

- Use new Thread and ThreadMessage types ([#27](https://github.com/use-hydra-ai/hydra-ai-react/issues/27)) ([de0efd4](https://github.com/use-hydra-ai/hydra-ai-react/commit/de0efd4dd2143e30fb5a482e37c4d6f99bbd0105))

## [0.0.7](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.0.6...v0.0.7) (2025-02-07)

### Bug Fixes

- package bump ([#25](https://github.com/use-hydra-ai/hydra-ai-react/issues/25)) ([32bfe23](https://github.com/use-hydra-ai/hydra-ai-react/commit/32bfe2337b07bbf94d50572e95adeb30d851cfb2))

## [0.0.6](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.0.5...v0.0.6) (2025-02-05)

### Bug Fixes

- properly track "unresolved" thread using useEffect ([#20](https://github.com/use-hydra-ai/hydra-ai-react/issues/20)) ([3e6312c](https://github.com/use-hydra-ai/hydra-ai-react/commit/3e6312c0d8dcadf0f7b02d34b23832ba900a1fb9))
- update readme with package name ([#24](https://github.com/use-hydra-ai/hydra-ai-react/issues/24)) ([85d638f](https://github.com/use-hydra-ai/hydra-ai-react/commit/85d638f72d7cce782376d603c9d3030f0a4d2dcf))

## [0.0.5](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.0.4...v0.0.5) (2025-02-05)

### Bug Fixes

- try using NODE_AUTH_TOKEN ([136ce24](https://github.com/use-hydra-ai/hydra-ai-react/commit/136ce24a0ad0432633b7c7faa740730d9876e422))

## [0.0.4](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.0.3...v0.0.4) (2025-02-05)

### Bug Fixes

- try adding explicit registry ([f30c958](https://github.com/use-hydra-ai/hydra-ai-react/commit/f30c95806d04f714a3d2b8b03c37d85269138a75))

## [0.0.3](https://github.com/use-hydra-ai/hydra-ai-react/compare/v0.0.2...v0.0.3) (2025-02-05)

### Bug Fixes

- remove console.log ([f4a58ad](https://github.com/use-hydra-ai/hydra-ai-react/commit/f4a58ad28f326df2024e36c56cdd7ffcc4e301bb))

## 0.0.2 (2025-02-05)

### Bug Fixes

- remove console.log ([12e575f](https://github.com/use-hydra-ai/hydra-ai-react/commit/12e575f6e84e26a5cef847c6a85e4e1ce7986f05))
- try moving permissions ([6d709fe](https://github.com/use-hydra-ai/hydra-ai-react/commit/6d709fec8477a1467fdc92ebf63d54295f2a78e3))

### Miscellaneous Chores

- release 0.0.2 ([8c5f706](https://github.com/use-hydra-ai/hydra-ai-react/commit/8c5f7064813d57fe91e82f7b6fe66322cad1fbd4))
