# Changelog

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
