# Changelog

## [0.131.0](https://github.com/tambo-ai/tambo/compare/api-v0.130.0...api-v0.131.0) (2026-01-21)


### Features

* **api:** add Swagger documentation for SSE event streams ([#1865](https://github.com/tambo-ai/tambo/issues/1865)) ([34645f7](https://github.com/tambo-ai/tambo/commit/34645f70a661f4a6e7c404e6dc95073cdf07eb4f))


### Miscellaneous Chores

* **api:** add NestJS testing helpers ([#1777](https://github.com/tambo-ai/tambo/issues/1777)) ([0331a9f](https://github.com/tambo-ai/tambo/commit/0331a9f0346f718d7cbaad6b3819b43289557eb9))

## [0.130.0](https://github.com/tambo-ai/tambo/compare/api-v0.129.1...api-v0.130.0) (2026-01-21)


### Features

* **api:** PostHog backend analytics service (Phase 2) ([#1845](https://github.com/tambo-ai/tambo/issues/1845)) ([488a7f6](https://github.com/tambo-ai/tambo/commit/488a7f6cb0af5e407fd269ae96efc3741259dee2))


### Bug Fixes

* **api:** add S3 env vars to turbo.json and remove debug logging ([#1846](https://github.com/tambo-ai/tambo/issues/1846)) ([e744e0a](https://github.com/tambo-ai/tambo/commit/e744e0a83cc32b0edf910bb7b71bfeea4be24baa))
* **api:** expose discriminated unions in OpenAPI schema for v1 DTOs ([#1859](https://github.com/tambo-ai/tambo/issues/1859)) ([d90bd36](https://github.com/tambo-ai/tambo/commit/d90bd36fac461c7d76126e59506a1f311075f902))


### Tests

* **api:** add unit tests for CorrelationLoggerService ([#1853](https://github.com/tambo-ai/tambo/issues/1853)) ([a6d7100](https://github.com/tambo-ai/tambo/commit/a6d710040532312e97eebe4ba46bb4cf76737116))

## [0.129.1](https://github.com/tambo-ai/tambo/compare/api-v0.129.0...api-v0.129.1) (2026-01-20)


### Bug Fixes

* add back AdvanceThreadDto so it is codegened ([#1848](https://github.com/tambo-ai/tambo/issues/1848)) ([5e2caf7](https://github.com/tambo-ai/tambo/commit/5e2caf7915e5376d3f8312185cf23607ce7d75d8))

## [0.129.0](https://github.com/tambo-ai/tambo/compare/api-v0.128.0...api-v0.129.0) (2026-01-20)


### Features

* **api:** implement v1 API phase 1 - foundation & schema ([#1767](https://github.com/tambo-ai/tambo/issues/1767)) ([e4dad06](https://github.com/tambo-ai/tambo/commit/e4dad061f22d2b6378846949beac1449f8c8b5c4))
* **api:** implement v1 API phase 2 - thread & message CRUD ([#1779](https://github.com/tambo-ai/tambo/issues/1779)) ([94e6b60](https://github.com/tambo-ai/tambo/commit/94e6b600304b312b0fa419b5a217f42a3e052375))
* **api:** V1 API Phase 3 - Client tools, tool results, component streaming ([#1813](https://github.com/tambo-ai/tambo/issues/1813)) ([2aa8f16](https://github.com/tambo-ai/tambo/commit/2aa8f1680b338c7c7e48031737ffd38b2cb14de6))
* **api:** V1 API Phase 3 PR [#1](https://github.com/tambo-ai/tambo/issues/1) - Run endpoints & streaming foundation ([#1792](https://github.com/tambo-ai/tambo/issues/1792)) ([18e0272](https://github.com/tambo-ai/tambo/commit/18e0272c8dbfda35d0cafddfc53236ca19356067))


### Bug Fixes

* **api:** suppress console output in tests ([#1752](https://github.com/tambo-ai/tambo/issues/1752)) ([bee04b4](https://github.com/tambo-ai/tambo/commit/bee04b4f5d6f1e0836238841d326c27aabbbdd44))


### Miscellaneous Chores

* **api:** add debug logging for S3 config ([#1804](https://github.com/tambo-ai/tambo/issues/1804)) ([cd75bf0](https://github.com/tambo-ai/tambo/commit/cd75bf0a0b8c6f8f26bb647ddba65aee2637c749))
* **api:** add more debug logging for env vars ([#1805](https://github.com/tambo-ai/tambo/issues/1805)) ([e884e6b](https://github.com/tambo-ai/tambo/commit/e884e6bc5684fe1782c4baed716785ab2f5cc556))
* **deps:** bump openai from 6.15.0 to 6.16.0 ([#1835](https://github.com/tambo-ai/tambo/issues/1835)) ([c648fcb](https://github.com/tambo-ai/tambo/commit/c648fcbeb2b17a791c29b2ba6ad88e262a32200e))
* **deps:** bump resend from 6.6.0 to 6.7.0 ([#1836](https://github.com/tambo-ai/tambo/issues/1836)) ([0410860](https://github.com/tambo-ai/tambo/commit/0410860a01fe73e51cb403f0b261f9cf760c987b))
* **deps:** bump the ag-ui group across 1 directory with 2 updates ([#1771](https://github.com/tambo-ai/tambo/issues/1771)) ([5f0c14a](https://github.com/tambo-ai/tambo/commit/5f0c14aa5eaeb8dbf13bf68afe07c93faf2f6299))
* **deps:** bump the nestjs group with 6 updates ([#1828](https://github.com/tambo-ai/tambo/issues/1828)) ([5f3f4b4](https://github.com/tambo-ai/tambo/commit/5f3f4b4b1be2b754b303d947516835e3238eea36))
* **deps:** bump the sentry group with 3 updates ([#1832](https://github.com/tambo-ai/tambo/issues/1832)) ([bdbee36](https://github.com/tambo-ai/tambo/commit/bdbee3643f2cc90a5094365545e939633422a962))
* **deps:** bump the small-safe-packages group with 8 updates ([#1831](https://github.com/tambo-ai/tambo/issues/1831)) ([a5965b4](https://github.com/tambo-ai/tambo/commit/a5965b4f9d1cf502eaf185cc8b1e26a93f847de0))
* **test:** bump coverage thresholds (2026-01-19) ([#1822](https://github.com/tambo-ai/tambo/issues/1822)) ([acf34a5](https://github.com/tambo-ai/tambo/commit/acf34a58b3cda7d8ed0b1313998ecf53e8463ad3))


### Code Refactoring

* **logger:** replaced any with unknown and hardened message formatting ([#1670](https://github.com/tambo-ai/tambo/issues/1670)) ([6787db0](https://github.com/tambo-ai/tambo/commit/6787db01a96835f3168fd12a8a2dfd6e15fe42d9))

## [0.128.0](https://github.com/tambo-ai/tambo/compare/api-v0.127.1...api-v0.128.0) (2026-01-07)


### Features

* **api:** remove non-streaming advance thread endpoints ([#1648](https://github.com/tambo-ai/tambo/issues/1648)) ([3802c8d](https://github.com/tambo-ai/tambo/commit/3802c8deb24e8b72140656418b5e5f0549bbf228))


### Bug Fixes

* **docs:** missing `[@returns](https://github.com/returns)` ([#1667](https://github.com/tambo-ai/tambo/issues/1667)) ([d775e23](https://github.com/tambo-ai/tambo/commit/d775e23a271c5db5b549319523fe47fe56a21952))


### Miscellaneous Chores

* add cspell settings and correct a few spleling mistaeks ([#1586](https://github.com/tambo-ai/tambo/issues/1586)) ([f5cef2b](https://github.com/tambo-ai/tambo/commit/f5cef2b36d33076f2188f4a663bcebddd9679a9f))
* **deps:** bump dependencies ([#1624](https://github.com/tambo-ai/tambo/issues/1624)) ([88e8acd](https://github.com/tambo-ai/tambo/commit/88e8acd5050ab746230c2ec86a69fc28222b2753))
* **deps:** bump openai from 6.9.1 to 6.15.0 ([#1645](https://github.com/tambo-ai/tambo/issues/1645)) ([5384753](https://github.com/tambo-ai/tambo/commit/5384753d5ee12daf79691553123923a5a32fdb39))
* **deps:** bump the nestjs group with 4 updates ([#1626](https://github.com/tambo-ai/tambo/issues/1626)) ([32c0d8c](https://github.com/tambo-ai/tambo/commit/32c0d8cad96eb6fd06cf6b720af63b4866f7f49e))
* **deps:** bump the nestjs group with 4 updates ([#1637](https://github.com/tambo-ai/tambo/issues/1637)) ([6283b08](https://github.com/tambo-ai/tambo/commit/6283b08b92af8768a745cb31bb36bf025fdb864d))
* **deps:** bump the sentry group with 3 updates ([#1630](https://github.com/tambo-ai/tambo/issues/1630)) ([b6f4402](https://github.com/tambo-ai/tambo/commit/b6f44021cb714d903a05dbe2a4ec8ed598e943d0))
* **deps:** Support multiple tools for managing project tool versions ([#1603](https://github.com/tambo-ai/tambo/issues/1603)) ([31a09c3](https://github.com/tambo-ai/tambo/commit/31a09c32a25c440b16a705804a9b2341b0883514))
* **repo:** update testing and linting config ([#1619](https://github.com/tambo-ai/tambo/issues/1619)) ([ccc5c05](https://github.com/tambo-ai/tambo/commit/ccc5c05a0f62e4672068f4fbdd7316a7db306e7c))

## [0.127.1](https://github.com/tambo-ai/tambo/compare/api-v0.127.0...api-v0.127.1) (2025-12-23)


### Bug Fixes

* **react-sdk:** fetch client-side MCP resource content before sending ([#1574](https://github.com/tambo-ai/tambo/issues/1574)) ([bb2e987](https://github.com/tambo-ai/tambo/commit/bb2e9877c2688878b51b913d5ba79ddf79c26814))


### Miscellaneous Chores

* add LICENSE files across workspaces ([#1532](https://github.com/tambo-ai/tambo/issues/1532)) ([6e41be5](https://github.com/tambo-ai/tambo/commit/6e41be55b85be629f9b23d5688d058ccd2bd57f8))
* **deps:** bump resend from 6.5.2 to 6.6.0 ([#1560](https://github.com/tambo-ai/tambo/issues/1560)) ([b21227c](https://github.com/tambo-ai/tambo/commit/b21227c9548dcae8c41b1f4195e3d4f2fee7085e))
* **deps:** bump superjson from 2.2.5 to 2.2.6 ([#1567](https://github.com/tambo-ai/tambo/issues/1567)) ([ef27dc8](https://github.com/tambo-ai/tambo/commit/ef27dc8b63739d1b96b86230a719506d8183c592))
* **deps:** bump the sentry group with 3 updates ([#1615](https://github.com/tambo-ai/tambo/issues/1615)) ([8ebc981](https://github.com/tambo-ai/tambo/commit/8ebc981dd424fe7fa94a1897890d2f0bc59a3dab))
* **deps:** bump the small-safe-packages group with 5 updates ([#1614](https://github.com/tambo-ai/tambo/issues/1614)) ([0f9843b](https://github.com/tambo-ai/tambo/commit/0f9843beae591605144054a7b17f1c9ad9830857))
* **repo:** add settings for vscode-jest extension ([#1591](https://github.com/tambo-ai/tambo/issues/1591)) ([a714303](https://github.com/tambo-ai/tambo/commit/a7143037ccf05ada73a5a7a6fc9a0227ba653a48))


### Documentation

* consolidate and update development/deployment documentation ([#1569](https://github.com/tambo-ai/tambo/issues/1569)) ([1e7474b](https://github.com/tambo-ai/tambo/commit/1e7474ba4d919d2452f2792f2cb5c12046eff373))

## [0.127.0](https://github.com/tambo-ai/tambo/compare/api-v0.126.0...api-v0.127.0) (2025-12-13)


### Features

* allow multiple components returned in one response loop ([#1525](https://github.com/tambo-ai/tambo/issues/1525)) ([3886f59](https://github.com/tambo-ai/tambo/commit/3886f59765846c6466766c0c3dd6ae0c32f2eb2d))
* **api:** support per-tool maxCalls override for tool-call limits ([#1360](https://github.com/tambo-ai/tambo/issues/1360)) ([f96c882](https://github.com/tambo-ai/tambo/commit/f96c882fa9ac4db425baa133174c48feba649435))


### Bug Fixes

* **core:** enforce unsaved thread message path ([#1462](https://github.com/tambo-ai/tambo/issues/1462)) ([a226fcc](https://github.com/tambo-ai/tambo/commit/a226fcc1150c56b4963b135f6a462b8c86c10f5b))


### Miscellaneous Chores

* **ci:** update turbo caching ([#1505](https://github.com/tambo-ai/tambo/issues/1505)) ([a091dc6](https://github.com/tambo-ai/tambo/commit/a091dc68af625fdf5caa33e2d1efe65f480f9d47))
* **deps-dev:** bump ts-jest from 29.4.5 to 29.4.6 in the testing group ([#1484](https://github.com/tambo-ai/tambo/issues/1484)) ([07a1253](https://github.com/tambo-ai/tambo/commit/07a125380a847816424b4dae304075b3726e1816))
* **deps:** bump the drizzle group with 2 updates ([#1482](https://github.com/tambo-ai/tambo/issues/1482)) ([7f2670c](https://github.com/tambo-ai/tambo/commit/7f2670cdc6cada1c71bd27131b3c97f756908ad2))
* **deps:** bump the sentry group with 3 updates ([#1488](https://github.com/tambo-ai/tambo/issues/1488)) ([86e6b0b](https://github.com/tambo-ai/tambo/commit/86e6b0b4d756d01d8689b79587b8f46746131d81))
* **deps:** bump the small-safe-packages group with 3 updates ([#1487](https://github.com/tambo-ai/tambo/issues/1487)) ([2178c32](https://github.com/tambo-ai/tambo/commit/2178c32ed7c962a915aa80694cc8e3c4a7f434ba))
* remove "Extractor" and associated services/etc (not used) ([#1515](https://github.com/tambo-ai/tambo/issues/1515)) ([18a7f69](https://github.com/tambo-ai/tambo/commit/18a7f694cbeb3f9b144822c9e3aa7975096b8bac))

## [0.126.0](https://github.com/tambo-ai/tambo/compare/api-v0.125.0...api-v0.126.0) (2025-12-08)


### Features

* **backend:** use ThreadMessage directly in AI SDK client (PR 2/3) ([#1424](https://github.com/tambo-ai/tambo/issues/1424)) ([5199869](https://github.com/tambo-ai/tambo/commit/5199869c667c5e3e24b6c47bb8b91d4ed2ba5b80))


### Bug Fixes

* **deps:** upgrade to zod v3 subpath imports and MCP SDK 1.24 ([#1465](https://github.com/tambo-ai/tambo/issues/1465)) ([c8b7f07](https://github.com/tambo-ai/tambo/commit/c8b7f079560d423082c005018a103b9eb3cf6993))


### Miscellaneous Chores

* **deps-dev:** bump @nestjs/cli from 11.0.12 to 11.0.14 in the nestjs group ([#1428](https://github.com/tambo-ai/tambo/issues/1428)) ([57a1c95](https://github.com/tambo-ai/tambo/commit/57a1c956eac152699be2dec953ef5d95b863f3af))
* **deps:** bump mime-types from 2.1.35 to 3.0.2 ([#1440](https://github.com/tambo-ai/tambo/issues/1440)) ([900c1de](https://github.com/tambo-ai/tambo/commit/900c1de73e991fde9ba43de5350499dd3efcfaeb))
* **deps:** bump the small-safe-packages group with 5 updates ([#1436](https://github.com/tambo-ai/tambo/issues/1436)) ([5974a87](https://github.com/tambo-ai/tambo/commit/5974a87c06577da92cd6ef9a500ebc9226f46fec))


### Documentation

* Update / add some AGENTS.md and README.md as per some code audits I ran... ([#1451](https://github.com/tambo-ai/tambo/issues/1451)) ([600e862](https://github.com/tambo-ai/tambo/commit/600e8628be591748d19df31adbe8dac14c572207))


### Code Refactoring

* **core:** implement discriminated union types for ThreadMessage ([#1452](https://github.com/tambo-ai/tambo/issues/1452)) ([c772203](https://github.com/tambo-ai/tambo/commit/c772203528d4cabd4d330644198428fc8cbe2532))


### Tests

* simplify coverage thresholds and fix CI coverage ([#1458](https://github.com/tambo-ai/tambo/issues/1458)) ([719b9e6](https://github.com/tambo-ai/tambo/commit/719b9e660700b5eb420b288cab52cbc11c83028d))

## [0.125.0](https://github.com/tambo-ai/tambo/compare/api-v0.124.0...api-v0.125.0) (2025-12-01)


### Features

* return partial (building) toolcall requests to client ([#1410](https://github.com/tambo-ai/tambo/issues/1410)) ([22f4451](https://github.com/tambo-ai/tambo/commit/22f4451b99fab9d62659d2aa18d40df005f8deda))


### Miscellaneous Chores

* **repo:** standardize test layout ([#1409](https://github.com/tambo-ai/tambo/issues/1409)) ([126d6ee](https://github.com/tambo-ai/tambo/commit/126d6eec32c8a828fb0c3071dd3ba793d624d1db))


### Code Refactoring

* **ci:** update docker test pipeline to use parallel jobs ([#1389](https://github.com/tambo-ai/tambo/issues/1389)) ([3738c0a](https://github.com/tambo-ai/tambo/commit/3738c0a21f18cff082933260a5c4630f059dbcaf))
* consolidate config packages and improve async error handling ([#1401](https://github.com/tambo-ai/tambo/issues/1401)) ([c9e0dd3](https://github.com/tambo-ai/tambo/commit/c9e0dd37d5bdeee79ac8ff8ddb3f6f4aae5aa5fb))

## [0.124.0](https://github.com/tambo-ai/tambo/compare/api-v0.123.3...api-v0.124.0) (2025-11-25)


### Features

* **mcp-resources:** Fetch resources from MCP servers before sending to the AI SDK ([#1339](https://github.com/tambo-ai/tambo/issues/1339)) ([6297f38](https://github.com/tambo-ai/tambo/commit/6297f38f3b91bdaf0d4f8d2f731b10d44e361014))


### Bug Fixes

* fix hot-reloading of api ([#1388](https://github.com/tambo-ai/tambo/issues/1388)) ([3931a9f](https://github.com/tambo-ai/tambo/commit/3931a9fb2cb90cd517598ee808475fdc47fbb709))


### Miscellaneous Chores

* **deps:** bump the sentry group with 3 updates ([#1367](https://github.com/tambo-ai/tambo/issues/1367)) ([a4112c7](https://github.com/tambo-ai/tambo/commit/a4112c7e4c8d62368bf29366fbb5a12d34a3ed9c))
* **repo:** update docker build images and related scripts to work in monorepo ([#1357](https://github.com/tambo-ai/tambo/issues/1357)) ([ad4997e](https://github.com/tambo-ai/tambo/commit/ad4997edb13ce431ec744c95d4ae1a7cfd85d239))


### Code Refactoring

* **api:** simplify MCP authentication endpoints and token detection ([#1340](https://github.com/tambo-ai/tambo/issues/1340)) ([9d8c7ba](https://github.com/tambo-ai/tambo/commit/9d8c7ba3db18c32b157e01e650f631b8af40508d))

## [0.123.3](https://github.com/tambo-ai/tambo/compare/api-v0.123.2...api-v0.123.3) (2025-11-21)


### Miscellaneous Chores

* **release:** Split "tambo-cloud" release into 2 packages ([#1350](https://github.com/tambo-ai/tambo/issues/1350)) ([5891a6b](https://github.com/tambo-ai/tambo/commit/5891a6b8af86382f87f1de1afd8fe75262de4b0b))
* **repo:** move stuff out of tambo-cloud/ ([#1347](https://github.com/tambo-ai/tambo/issues/1347)) ([82185c8](https://github.com/tambo-ai/tambo/commit/82185c81e741891853852f50605cf49295afe074))
