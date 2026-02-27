# Changelog

## [0.1.0-alpha.8](https://github.com/tambo-ai/tambo/compare/@tambo-ai/react-ui-base-v0.1.0-alpha.7...@tambo-ai/react-ui-base-v0.1.0-alpha.8) (2026-02-27)


### Features

* **react-ui-base:** add McpPrompts and McpResources headless primitives ([#2512](https://github.com/tambo-ai/tambo/issues/2512)) ([459144d](https://github.com/tambo-ai/tambo/commit/459144d32acac499cd109f587fa6c5c2173f36e0))
* **react-ui-base:** add ThreadContent headless primitives ([#2509](https://github.com/tambo-ai/tambo/issues/2509)) ([51dd31b](https://github.com/tambo-ai/tambo/commit/51dd31bc5c1dbdd865342114f268ce559c29087b))
* **react-ui-base:** add ThreadHistory, ThreadDropdown base components ([#2504](https://github.com/tambo-ai/tambo/issues/2504)) ([52815e0](https://github.com/tambo-ai/tambo/commit/52815e07f60c64ea728d3d3363b5d4c168a69139))
* **ui:** finalize message input behavior and contextual showcase prompts ([#2447](https://github.com/tambo-ai/tambo/issues/2447)) ([00434a5](https://github.com/tambo-ai/tambo/commit/00434a5de077357cc7b4725cc16cf7e78c094a2e))


### Bug Fixes

* **dev:** update custom condition usage for hmr/dev/tsconfig ([#2480](https://github.com/tambo-ai/tambo/issues/2480)) ([71a141d](https://github.com/tambo-ai/tambo/commit/71a141de9ccbd7cf82c0e5170eb3274b177b6641))


### Miscellaneous Chores

* enable monorepo hot reload DX ([#2427](https://github.com/tambo-ai/tambo/issues/2427)) ([c72bb66](https://github.com/tambo-ai/tambo/commit/c72bb663b86f3a751064cf5a87db84d250a7462c))


### Code Refactoring

* **react-ui-base:** harden useRender state/props split across primitives ([#2499](https://github.com/tambo-ai/tambo/issues/2499)) ([75c0d15](https://github.com/tambo-ai/tambo/commit/75c0d159daf62a9f82afefecafd1cbb8f8984a92))
* **react-ui-base:** migrate primitives to base-ui useRender ([#2443](https://github.com/tambo-ai/tambo/issues/2443)) ([41e8419](https://github.com/tambo-ai/tambo/commit/41e841967338f57817d474c40c6bb2720dabb503))

## [0.1.0-alpha.7](https://github.com/tambo-ai/tambo/compare/@tambo-ai/react-ui-base-v0.1.0-alpha.6...@tambo-ai/react-ui-base-v0.1.0-alpha.7) (2026-02-18)


### Bug Fixes

* **react-ui-base:** render content blocks in natural order from model response ([#2435](https://github.com/tambo-ai/tambo/issues/2435)) ([6e279a2](https://github.com/tambo-ai/tambo/commit/6e279a2bf30e71b94e220588f4580a0a0c5f398c))

## [0.1.0-alpha.6](https://github.com/tambo-ai/tambo/compare/@tambo-ai/react-ui-base-v0.1.0-alpha.5...@tambo-ai/react-ui-base-v0.1.0-alpha.6) (2026-02-18)


### Miscellaneous Chores

* **react-ui-base:** update package provenance ([#2433](https://github.com/tambo-ai/tambo/issues/2433)) ([dd89e15](https://github.com/tambo-ai/tambo/commit/dd89e15e197e4d3357d0f933f1a7398a1a360c4b))

## [0.1.0-alpha.5](https://github.com/tambo-ai/tambo/compare/@tambo-ai/react-ui-base-v0.1.0-alpha.4...@tambo-ai/react-ui-base-v0.1.0-alpha.5) (2026-02-17)


### Miscellaneous Chores

* **deps:** bump @tambo-ai/typescript-sdk from 0.91.0 to 0.92.0 in the tambo-ai group ([#2337](https://github.com/tambo-ai/tambo/issues/2337)) ([97dcd7d](https://github.com/tambo-ai/tambo/commit/97dcd7dd70b8337da1bf957eaccff00b0b83a4ee))

## [0.1.0-alpha.4](https://github.com/tambo-ai/tambo/compare/@tambo-ai/react-ui-base-v0.1.0-alpha.3...@tambo-ai/react-ui-base-v0.1.0-alpha.4) (2026-02-11)


### Bug Fixes

* **react-ui-base:** preserve MAX_IMAGES and IS_PASTED_IMAGE in build output ([#2371](https://github.com/tambo-ai/tambo/issues/2371)) ([dc6d5e5](https://github.com/tambo-ai/tambo/commit/dc6d5e5a1714641890ef1fd6dbb7bcdbcc54a521))

## [0.1.0-alpha.3](https://github.com/tambo-ai/tambo/compare/@tambo-ai/react-ui-base-v0.1.0-alpha.2...@tambo-ai/react-ui-base-v0.1.0-alpha.3) (2026-02-10)


### Bug Fixes

* **react-sdk:** fix tool call UI during streaming  ([#2320](https://github.com/tambo-ai/tambo/issues/2320)) ([7a2cd83](https://github.com/tambo-ai/tambo/commit/7a2cd83b3926e9fa5ee12b01d1a674c09f17f8a1))
* **react-sdk:** wire up onClick handler on MessageInputFileButton ([#2354](https://github.com/tambo-ai/tambo/issues/2354)) ([0abdc8b](https://github.com/tambo-ai/tambo/commit/0abdc8bd24c9683f9685484c4bf8af99fbaec53f))
* **react-ui-base:** hide loading bubbles when tool_use or component blocks exist ([#2333](https://github.com/tambo-ai/tambo/issues/2333)) ([9fa0c8d](https://github.com/tambo-ai/tambo/commit/9fa0c8dc04acfed4229dfc0e01fbdb31087f762c))
* **ui:** message generation stage, input placeholder, canvas page in showcase ([#2358](https://github.com/tambo-ai/tambo/issues/2358)) ([3acedbb](https://github.com/tambo-ai/tambo/commit/3acedbbc32437c1b8f3d8cacdf3dc012ae1abeb6))


### Miscellaneous Chores

* bump to typescript-sdk 0.92 ([#2334](https://github.com/tambo-ai/tambo/issues/2334)) ([3767c6c](https://github.com/tambo-ai/tambo/commit/3767c6c0e12c9862afd992b6f18bc3338ea4201d))
* **react-ui-base:** add package description ([#2312](https://github.com/tambo-ai/tambo/issues/2312)) ([b891cc3](https://github.com/tambo-ai/tambo/commit/b891cc31a6b4a49976c2bdb111388fb3ca76dae5))


### Code Refactoring

* **react-sdk:** promote V1 SDK to main export (1.0.0-rc.1) ([#2297](https://github.com/tambo-ai/tambo/issues/2297)) ([1799bce](https://github.com/tambo-ai/tambo/commit/1799bceecf412d1a4f263108dae75ddcb3fe7491))

## [0.1.0-alpha.2](https://github.com/tambo-ai/tambo/compare/@tambo-ai/react-ui-base-v0.1.0-alpha.1...@tambo-ai/react-ui-base-v0.1.0-alpha.2) (2026-02-06)


### Miscellaneous Chores

* **react-ui-base:** adjust workflow for prerelease ([#2237](https://github.com/tambo-ai/tambo/issues/2237)) ([bd5fd1a](https://github.com/tambo-ai/tambo/commit/bd5fd1af991b16bb9cd7ffbd844a6e118ff249d3))

## [0.1.0-alpha.1](https://github.com/tambo-ai/tambo/compare/@tambo-ai/react-ui-base-v0.1.0-alpha.0...@tambo-ai/react-ui-base-v0.1.0-alpha.1) (2026-02-05)


### Miscellaneous Chores

* **react-ui-base:** minor update to trigger versioning ([#2233](https://github.com/tambo-ai/tambo/issues/2233)) ([996a6b3](https://github.com/tambo-ai/tambo/commit/996a6b3408e7f314b4a8e0d466a68d26dec5fb2f))

## 0.1.0-alpha.0 (2026-02-05)


### Features

* **react-ui-base:** create new package with base UI components ([#2176](https://github.com/tambo-ai/tambo/issues/2176)) ([7842a32](https://github.com/tambo-ai/tambo/commit/7842a32bd7e0af40395ec98ed0e1635ffe419b33))


### Miscellaneous Chores

* **react-ui-base:** versioning ([#2228](https://github.com/tambo-ai/tambo/issues/2228)) ([0bc768b](https://github.com/tambo-ai/tambo/commit/0bc768b6eaedb9d05aab278a66fd4ecfb5541377))
