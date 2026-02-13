# Changelog

## [0.143.1](https://github.com/tambo-ai/tambo/compare/api-v0.143.0...api-v0.143.1) (2026-02-13)


### Bug Fixes

* **api:** persist tool call counts across V1 runs ([#2360](https://github.com/tambo-ai/tambo/issues/2360)) ([9047cba](https://github.com/tambo-ai/tambo/commit/9047cbae0c628601054c2826801816c7fb656084))


### Code Refactoring

* **api:** remove dead transaction middleware and rename database provider ([#2393](https://github.com/tambo-ai/tambo/issues/2393)) ([ebf088e](https://github.com/tambo-ai/tambo/commit/ebf088e0430949244d3ad80b3f10bfb7737b9015))

## [0.143.0](https://github.com/tambo-ai/tambo/compare/api-v0.142.0...api-v0.143.0) (2026-02-10)


### Features

* **api:** convert emails to React Email, rewrite welcome copy ([#2350](https://github.com/tambo-ai/tambo/issues/2350)) ([c014c10](https://github.com/tambo-ai/tambo/commit/c014c10c8d0ad35777323e39b8226c9cb41d240e))

## [0.142.0](https://github.com/tambo-ai/tambo/compare/api-v0.141.1...api-v0.142.0) (2026-02-10)


### Features

* **api:** expose parentMessageId on V1 messages and SDK ([#2349](https://github.com/tambo-ai/tambo/issues/2349)) ([fcd9ffc](https://github.com/tambo-ai/tambo/commit/fcd9ffcd0da0b23cece51f3b87a9b5deca73dd63))

## [0.141.1](https://github.com/tambo-ai/tambo/compare/api-v0.141.0...api-v0.141.1) (2026-02-10)


### Bug Fixes

* **api:** skip previousRunId check for threads with only initialMessages ([#2347](https://github.com/tambo-ai/tambo/issues/2347)) ([9780eca](https://github.com/tambo-ai/tambo/commit/9780eca754e51842231e7d6a2d3046554fc0fa10))
* remove displayMessage tambo param ([#2346](https://github.com/tambo-ai/tambo/issues/2346)) ([a9b3d4d](https://github.com/tambo-ai/tambo/commit/a9b3d4d6d3e8ac415e828d902a5e4810d9220169))

## [0.141.0](https://github.com/tambo-ai/tambo/compare/api-v0.140.1...api-v0.141.0) (2026-02-09)


### Features

* **react-sdk:** expose updateThreadName for manual thread renaming ([#2328](https://github.com/tambo-ai/tambo/issues/2328)) ([3a60a65](https://github.com/tambo-ai/tambo/commit/3a60a65ba19aeb9d3ca7e39fa9aeea33557f5959))


### Miscellaneous Chores

* **test:** bump coverage thresholds (2026-02-09) ([#2323](https://github.com/tambo-ai/tambo/issues/2323)) ([0aac70b](https://github.com/tambo-ai/tambo/commit/0aac70b23da7ae51d9d449b3692b765570af44f9))

## [0.140.1](https://github.com/tambo-ai/tambo/compare/api-v0.140.0...api-v0.140.1) (2026-02-08)


### Bug Fixes

* bump self-enforced max client connections ([#2300](https://github.com/tambo-ai/tambo/issues/2300)) ([7bca6e1](https://github.com/tambo-ai/tambo/commit/7bca6e1b324e3358010832cf2fe7678b906e44a5))

## [0.140.0](https://github.com/tambo-ai/tambo/compare/api-v0.139.0...api-v0.140.0) (2026-02-08)


### Features

* **api:** require userKey or bearer token in all V1 thread routes ([#2293](https://github.com/tambo-ai/tambo/issues/2293)) ([efe5eeb](https://github.com/tambo-ai/tambo/commit/efe5eeb9208403919bcf6663c98f3a14a5f80546))


### Bug Fixes

* **api,react-sdk:** route V1 initialMessages through ThreadsService and support system/assistant roles ([#2295](https://github.com/tambo-ai/tambo/issues/2295)) ([3df637d](https://github.com/tambo-ai/tambo/commit/3df637dd3719617baa9637e9e7538e7959e33e02))
* **api:** reset generationStage on V1 run cancel and error ([#2289](https://github.com/tambo-ai/tambo/issues/2289)) ([a99e17d](https://github.com/tambo-ai/tambo/commit/a99e17d38e3fc9de6ed5d6f7454e3d4b6cf9c19a))
* **api:** return thread name in V1 thread DTO        ([#2286](https://github.com/tambo-ai/tambo/issues/2286)) ([eeb1665](https://github.com/tambo-ai/tambo/commit/eeb16658a003f64cc7f95aeece2e55884b9f7c5b))

## [0.139.0](https://github.com/tambo-ai/tambo/compare/api-v0.138.0...api-v0.139.0) (2026-02-07)


### Features

* **api,react-sdk:** wire up toolChoice support end-to-end ([#2260](https://github.com/tambo-ai/tambo/issues/2260)) ([3106ab6](https://github.com/tambo-ai/tambo/commit/3106ab64a21a6086e5bea699936438a7a97b8580))
* **react-sdk,api:** support initialMessages in V1 stack and add maxCalls to tool DTO ([#2264](https://github.com/tambo-ai/tambo/issues/2264)) ([872af14](https://github.com/tambo-ai/tambo/commit/872af14ee4054357b5e06fee5bab9236b9d50fc5))
* **web:** move dashboard from /dashboard to root path ([#2232](https://github.com/tambo-ai/tambo/issues/2232)) ([9aec81d](https://github.com/tambo-ai/tambo/commit/9aec81d5e3017d4de5eb83d020bad4a9d401d70f))
* **web:** track api_key_generated event in PostHog ([#2266](https://github.com/tambo-ai/tambo/issues/2266)) ([f64a037](https://github.com/tambo-ai/tambo/commit/f64a037be70bba4d08e674f6e2612c30b02f50ea))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 22.19.7 to 22.19.8 ([#2249](https://github.com/tambo-ai/tambo/issues/2249)) ([aed1ae6](https://github.com/tambo-ai/tambo/commit/aed1ae6a83a35f74e3c4d919f5ee266206711880))
* **deps:** bump posthog-node from 5.24.1 to 5.24.9 ([#2248](https://github.com/tambo-ai/tambo/issues/2248)) ([87bfe9d](https://github.com/tambo-ai/tambo/commit/87bfe9ddc6f3eb4aca7e39ad4f786ce0ddd9e9d7))
* **deps:** bump the nestjs group with 7 updates ([#2242](https://github.com/tambo-ai/tambo/issues/2242)) ([e4cb91d](https://github.com/tambo-ai/tambo/commit/e4cb91d465b30affc09db86a48e65be2636032b6))

## [0.138.0](https://github.com/tambo-ai/tambo/compare/api-v0.137.0...api-v0.138.0) (2026-02-06)


### Features

* **api:** add SDK version tracking to messages and threads ([#2255](https://github.com/tambo-ai/tambo/issues/2255)) ([36a47bd](https://github.com/tambo-ai/tambo/commit/36a47bdf3cd7b7de8411a6d26ed100ffb5d48f90))


### Bug Fixes

* **api,react-sdk:** prevent MCP "Method not found" error when no servers configured ([#2223](https://github.com/tambo-ai/tambo/issues/2223)) ([1363bde](https://github.com/tambo-ai/tambo/commit/1363bde8668012734c5fb83cacbe6792352c2c89))

## [0.137.0](https://github.com/tambo-ai/tambo/compare/api-v0.136.1...api-v0.137.0) (2026-02-06)


### Features

* **v1:** add run cancellation support ([#2213](https://github.com/tambo-ai/tambo/issues/2213)) ([27e6ac2](https://github.com/tambo-ai/tambo/commit/27e6ac2ecfd0b47d8cf683288bcdfe13d96ba014))


### Bug Fixes

* **api:** abort LLM HTTP stream when run is cancelled ([#2236](https://github.com/tambo-ai/tambo/issues/2236)) ([a96d856](https://github.com/tambo-ai/tambo/commit/a96d856e643b0aabd2c1ef2d9af20e549d3f01a1))
* **api:** add PostHog env vars to turbo globalEnv for production analytics ([#2239](https://github.com/tambo-ai/tambo/issues/2239)) ([47cac2d](https://github.com/tambo-ai/tambo/commit/47cac2d62f16e63ab4e94465740900b296060ded))
* **v1:** set isError flag on tool result errors ([#2229](https://github.com/tambo-ai/tambo/issues/2229)) ([1aa04ad](https://github.com/tambo-ai/tambo/commit/1aa04adf6817d51e9457de61904da8b096b2783b))

## [0.136.1](https://github.com/tambo-ai/tambo/compare/api-v0.136.0...api-v0.136.1) (2026-02-05)


### Bug Fixes

* **api:** use computed component ID in content block for V1 API ([#2191](https://github.com/tambo-ai/tambo/issues/2191)) ([6d0a007](https://github.com/tambo-ai/tambo/commit/6d0a0074c74af79ad6d3f2cd18142f7cebe62715))
* **api:** use real user ID for PostHog message_sent analytics ([#2212](https://github.com/tambo-ai/tambo/issues/2212)) ([2bea1e1](https://github.com/tambo-ai/tambo/commit/2bea1e1b4ea0f5e08ed0f06d92bf0902f7d565ae))
* **api:** warn instead of throw for invalid componentDecision ([#2209](https://github.com/tambo-ai/tambo/issues/2209)) ([d7b5406](https://github.com/tambo-ai/tambo/commit/d7b5406703fefa7d62da70b5d4d826d1360ca750))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 22.19.5 to 22.19.7 ([#2181](https://github.com/tambo-ai/tambo/issues/2181)) ([2dbb652](https://github.com/tambo-ai/tambo/commit/2dbb652293255c5f1baf370a87c0760567eb441e))
* **deps:** bump resend from 6.8.0 to 6.9.1 ([#2186](https://github.com/tambo-ai/tambo/issues/2186)) ([9c2268f](https://github.com/tambo-ai/tambo/commit/9c2268f7b6cf6c6aa2c9d5b340154f87f50c55d1))

## [0.136.0](https://github.com/tambo-ai/tambo/compare/api-v0.135.0...api-v0.136.0) (2026-02-04)


### Features

* **api,react-sdk:** V1 API message loading improvements ([#2190](https://github.com/tambo-ai/tambo/issues/2190)) ([53eb5ad](https://github.com/tambo-ai/tambo/commit/53eb5ad852c7c4b02845af8c326c1e4007eca521))
* **api:** add additionalContext to V1 API and fix limit type ([#2193](https://github.com/tambo-ai/tambo/issues/2193)) ([f6707d7](https://github.com/tambo-ai/tambo/commit/f6707d7d96f970add58dface84d721cdf20b959a))


### Bug Fixes

* **api:** use DEFAULT_OPENAI_MODEL constant in threads service tests ([#2173](https://github.com/tambo-ai/tambo/issues/2173)) ([e401583](https://github.com/tambo-ai/tambo/commit/e401583e93fbbbec8134757abd71e451db0f2c08))
* update sentry config for db spans ([#2166](https://github.com/tambo-ai/tambo/issues/2166)) ([c6c212a](https://github.com/tambo-ai/tambo/commit/c6c212acde1c76e16a1dc9ed62d9a726e9fc1025))

## [0.135.0](https://github.com/tambo-ai/tambo/compare/api-v0.134.0...api-v0.135.0) (2026-02-03)


### Features

* **backend:** V1 streaming API improvements for component rendering ([#2133](https://github.com/tambo-ai/tambo/issues/2133)) ([b84de33](https://github.com/tambo-ai/tambo/commit/b84de33d40d06e41c75b7479b70627d3eba0ed08))


### Miscellaneous Chores

* **deps:** bump the sentry group with 3 updates ([#2162](https://github.com/tambo-ai/tambo/issues/2162)) ([78c36d2](https://github.com/tambo-ai/tambo/commit/78c36d26ccbb1c9e92b53293345be2fcb2bd4acd))
* **test:** bump coverage thresholds (2026-02-02) ([#2139](https://github.com/tambo-ai/tambo/issues/2139)) ([0f16ec3](https://github.com/tambo-ai/tambo/commit/0f16ec33bb8cfcbd598dbb847589b0c44a423232))

## [0.134.0](https://github.com/tambo-ai/tambo/compare/api-v0.133.4...api-v0.134.0) (2026-01-30)


### Features

* **api:** add V1 suggestions API endpoints ([#2092](https://github.com/tambo-ai/tambo/issues/2092)) ([e80b99d](https://github.com/tambo-ai/tambo/commit/e80b99d3db9fda166e49dcb83274c898efa8cdae))
* **ci:** split CI into parallel jobs with Codecov ([#1908](https://github.com/tambo-ai/tambo/issues/1908)) ([9ba2ea8](https://github.com/tambo-ai/tambo/commit/9ba2ea876e014e95fe7e00543cd63595c3cd73ca))

## [0.133.4](https://github.com/tambo-ai/tambo/compare/api-v0.133.3...api-v0.133.4) (2026-01-30)


### Bug Fixes

* **api:** remove langfuse span processing ([#2052](https://github.com/tambo-ai/tambo/issues/2052)) ([4a715ad](https://github.com/tambo-ai/tambo/commit/4a715ad16d707d0110e861258de08bd6367f809c))

## [0.133.3](https://github.com/tambo-ai/tambo/compare/api-v0.133.2...api-v0.133.3) (2026-01-29)


### Miscellaneous Chores

* small change to trigger api release ([#2045](https://github.com/tambo-ai/tambo/issues/2045)) ([d52f777](https://github.com/tambo-ai/tambo/commit/d52f777da55dcb5e48d43fac1a1842618f187307))

## [0.133.2](https://github.com/tambo-ai/tambo/compare/api-v0.133.1...api-v0.133.2) (2026-01-29)


### Bug Fixes

* **api:** use ANY_CONTEXT_KEY for thread lookups when contextKey is not provided ([#2015](https://github.com/tambo-ai/tambo/issues/2015)) ([24a6dbf](https://github.com/tambo-ai/tambo/commit/24a6dbfb65566ab2dabb32431d300b3f81d6fa1b))
* fetch thread without contextkey ([#2034](https://github.com/tambo-ai/tambo/issues/2034)) ([3ceaa55](https://github.com/tambo-ai/tambo/commit/3ceaa558ec8547c464426b5c56c2c0c787ea1098))


### Documentation

* **api:** clarify userKey description in V1 API DTOs ([#2007](https://github.com/tambo-ai/tambo/issues/2007)) ([a348372](https://github.com/tambo-ai/tambo/commit/a34837236456b7946f933ade9bef701139340a9b))

## [0.133.1](https://github.com/tambo-ai/tambo/compare/api-v0.133.0...api-v0.133.1) (2026-01-29)


### Miscellaneous Chores

* **api:** update description ([#2008](https://github.com/tambo-ai/tambo/issues/2008)) ([4a5445d](https://github.com/tambo-ai/tambo/commit/4a5445d00f56e7b9d215f315ae3d5017941001dc))

## [0.133.0](https://github.com/tambo-ai/tambo/compare/api-v0.132.1...api-v0.133.0) (2026-01-28)


### Features

* **api:** add userKey support to V1 API endpoints ([#1994](https://github.com/tambo-ai/tambo/issues/1994)) ([02e7169](https://github.com/tambo-ai/tambo/commit/02e7169e63422961a68bd0c40cec2cf7acf11f8d))


### Bug Fixes

* **api:** remove inline oneOf schema from component state endpoint ([#1961](https://github.com/tambo-ai/tambo/issues/1961)) ([c79be8e](https://github.com/tambo-ai/tambo/commit/c79be8ec7de12df6ccb0049a95990e05cf4b871f))

## [0.132.1](https://github.com/tambo-ai/tambo/compare/api-v0.132.0...api-v0.132.1) (2026-01-27)


### Bug Fixes

* **api:** add ApiExtraModels to DTOs for OpenAPI schema generation ([#1953](https://github.com/tambo-ai/tambo/issues/1953)) ([c345c72](https://github.com/tambo-ai/tambo/commit/c345c725c321ea3517805daf7f2a044ce6ade2f6))


### Miscellaneous Chores

* **deps:** bump posthog-node from 5.21.2 to 5.24.1 ([#1938](https://github.com/tambo-ai/tambo/issues/1938)) ([b9790dd](https://github.com/tambo-ai/tambo/commit/b9790dd427ab59321f227efe281d335df2fba53c))
* **deps:** bump the sentry group with 3 updates ([#1933](https://github.com/tambo-ai/tambo/issues/1933)) ([5bec612](https://github.com/tambo-ai/tambo/commit/5bec6126512078ee8f8bff2845d1660f73357d88))
* **deps:** bump the small-safe-packages group with 10 updates ([#1932](https://github.com/tambo-ai/tambo/issues/1932)) ([66f8ee8](https://github.com/tambo-ai/tambo/commit/66f8ee83adbcdb8c64d5c85159bc6574d4166f7b))
* **docs:** Organize reference section ([#1916](https://github.com/tambo-ai/tambo/issues/1916)) ([46154a5](https://github.com/tambo-ai/tambo/commit/46154a5fd22525f9d6dc601119d09c8f8909d841))

## [0.132.0](https://github.com/tambo-ai/tambo/compare/api-v0.131.0...api-v0.132.0) (2026-01-27)


### Features

* **api:** implement component state update endpoint (Phase 4) ([#1844](https://github.com/tambo-ai/tambo/issues/1844)) ([32c2425](https://github.com/tambo-ai/tambo/commit/32c242517f36b8e33a15ce78e87131cdca94a8c2))


### Bug Fixes

* **api:** add ApiDiscriminatedUnion decorator to eliminate boilerplate ([#1860](https://github.com/tambo-ai/tambo/issues/1860)) ([9834ce6](https://github.com/tambo-ai/tambo/commit/9834ce68d8fbe354dbf4bdf8a9629ac64f3dabaf))
* **api:** remove projectId from V1 public API thread DTO ([#1897](https://github.com/tambo-ai/tambo/issues/1897)) ([76ba68c](https://github.com/tambo-ai/tambo/commit/76ba68ce097b00b807ec47a7d9033e88d00d4778))
* **api:** restore e2e tests and add them to CI ([#1910](https://github.com/tambo-ai/tambo/issues/1910)) ([b085089](https://github.com/tambo-ai/tambo/commit/b085089b693c3b6f19a75296f6dccf30a4b4dd2a))
* **cli:** optimization to ScrollableMessageContainer [#1706](https://github.com/tambo-ai/tambo/issues/1706) ([#1887](https://github.com/tambo-ai/tambo/issues/1887)) ([3e05258](https://github.com/tambo-ai/tambo/commit/3e052587b3e016439206d229b433fc0c2c666ba2))
* update openapi name to tambo ([#1873](https://github.com/tambo-ai/tambo/issues/1873)) ([7433605](https://github.com/tambo-ai/tambo/commit/74336052746987f6e725504c197c6f931e80416c))


### Miscellaneous Chores

* **deps:** bump the ag-ui group with 2 updates ([#1833](https://github.com/tambo-ai/tambo/issues/1833)) ([dacef94](https://github.com/tambo-ai/tambo/commit/dacef94c7e5d4ca917f6232542fd93cd84cfd4fb))
* **test:** bump coverage thresholds (2026-01-26) ([#1918](https://github.com/tambo-ai/tambo/issues/1918)) ([3173795](https://github.com/tambo-ai/tambo/commit/3173795837258192e183144b3c5c48c901990d26))


### Code Refactoring

* **api:** type-narrow StorageConfigService.hasStorageConfig [#1770](https://github.com/tambo-ai/tambo/issues/1770) ([#1854](https://github.com/tambo-ai/tambo/issues/1854)) ([4d64067](https://github.com/tambo-ai/tambo/commit/4d6406701f5cb347f6fcad87dadcec591733ad8f))

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
