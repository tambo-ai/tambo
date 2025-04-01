# Changelog

## [0.19.5](https://github.com/tambo-ai/tambo/compare/react-v0.19.4...react-v0.19.5) (2025-04-01)


### Bug Fixes

* minor component cleanups: stop using useEffect/etc ([#242](https://github.com/tambo-ai/tambo/issues/242)) ([7c6d334](https://github.com/tambo-ai/tambo/commit/7c6d334d500d909038469132123c9d163f2f7c5b))
* workaround turbopack bugs w/Stainless shims ([#243](https://github.com/tambo-ai/tambo/issues/243)) ([c3ef647](https://github.com/tambo-ai/tambo/commit/c3ef6478a47d0acb7f690fdb54d8298f3f7d63ca))


### Miscellaneous

* **deps-dev:** bump @types/node from 20.17.27 to 20.17.28 ([#231](https://github.com/tambo-ai/tambo/issues/231)) ([edee5d1](https://github.com/tambo-ai/tambo/commit/edee5d17860df15f4eb32eaa74afc309f97cbdcb))
* **deps-dev:** bump ts-jest from 29.2.6 to 29.3.1 ([#235](https://github.com/tambo-ai/tambo/issues/235)) ([bf683cf](https://github.com/tambo-ai/tambo/commit/bf683cf9c79429752b74db3d6adb1239989dcfdd))
* **deps-dev:** bump typescript-eslint from 8.28.0 to 8.29.0 in the eslint group ([#227](https://github.com/tambo-ai/tambo/issues/227)) ([58134f1](https://github.com/tambo-ai/tambo/commit/58134f16f5bbee49df3390cf7bd3b09ab0e00313))
* **deps:** bump @tanstack/react-query from 5.69.0 to 5.71.1 ([#232](https://github.com/tambo-ai/tambo/issues/232)) ([4a30da3](https://github.com/tambo-ai/tambo/commit/4a30da3afc057066fcb84da9b60805055572fc77))

## [0.19.4](https://github.com/tambo-ai/tambo/compare/react-v0.19.3...react-v0.19.4) (2025-03-28)


### Bug Fixes

* do not debounce local updates ([#224](https://github.com/tambo-ai/tambo/issues/224)) ([1ce2227](https://github.com/tambo-ai/tambo/commit/1ce22271b365f6ed07791a80e3337ea46d9e0982))

## [0.19.3](https://github.com/tambo-ai/tambo/compare/react-v0.19.2...react-v0.19.3) (2025-03-28)


### Bug Fixes

* now the debounce just stores the current user value and doesn't sync back also made it 500ms default ([#221](https://github.com/tambo-ai/tambo/issues/221)) ([1eabf10](https://github.com/tambo-ai/tambo/commit/1eabf1038348eeb4026906ebafbb8c0b1b72af12))


### Miscellaneous

* bump typescript-sdk version to get componentState changes ([#223](https://github.com/tambo-ai/tambo/issues/223)) ([2cff5e9](https://github.com/tambo-ai/tambo/commit/2cff5e99d440ee6c80ae716830de989b448abdfe))

## [0.19.2](https://github.com/tambo-ai/tambo/compare/react-v0.19.1...react-v0.19.2) (2025-03-27)


### Bug Fixes

* remove setState & currentState from dependency array in useTamboStreamingProps hook ([#218](https://github.com/tambo-ai/tambo/issues/218)) ([b1d5be2](https://github.com/tambo-ai/tambo/commit/b1d5be28302fe3706685ff9fe5a493a622b4da51))
* update dependency array in useTamboStreamingProps to only include streamingProps ([#220](https://github.com/tambo-ai/tambo/issues/220)) ([da153ac](https://github.com/tambo-ai/tambo/commit/da153ace1063ba0f622b02d83dd36b5e8b706eba))

## [0.19.1](https://github.com/tambo-ai/tambo/compare/react-v0.19.0...react-v0.19.1) (2025-03-26)


### Miscellaneous

* **deps:** bump @tambo-ai/typescript-sdk to 0.41 ([#217](https://github.com/tambo-ai/tambo/issues/217)) ([e55e76c](https://github.com/tambo-ai/tambo/commit/e55e76c58b4e5b16591bb4988e42691b1926128b))


### Documentation

* add even more jsdocs for public methods/hooks/etc ([#216](https://github.com/tambo-ai/tambo/issues/216)) ([4dcbdd1](https://github.com/tambo-ai/tambo/commit/4dcbdd1f29d407d7f3deeb1b4b220f4361b20787))
* add JSDocs to exported functions ([#215](https://github.com/tambo-ai/tambo/issues/215)) ([cc8714d](https://github.com/tambo-ai/tambo/commit/cc8714d63f30c5311b2e9cd306490c41abc25a1f))


### Code Refactoring

* use faster/pre-built isEqual, will be useful elsewhere ([#202](https://github.com/tambo-ai/tambo/issues/202)) ([a8bd035](https://github.com/tambo-ai/tambo/commit/a8bd03512a0988b087c38df012212e9b03b8d052))

## [0.19.0](https://github.com/tambo-ai/tambo/compare/react-v0.18.2...react-v0.19.0) (2025-03-26)


### Features

* add 'startNewThread' method ([#205](https://github.com/tambo-ai/tambo/issues/205)) ([d62e867](https://github.com/tambo-ai/tambo/commit/d62e8676c0d140faf648597341449be9328e589f))
* useTamboThreads -&gt; useTamboThreadList ([#200](https://github.com/tambo-ai/tambo/issues/200)) ([4a32eda](https://github.com/tambo-ai/tambo/commit/4a32eda20b6564465b69bccda8ed94f65ea56b01))


### Bug Fixes

* add period to update release please ([#207](https://github.com/tambo-ai/tambo/issues/207)) ([d4585fd](https://github.com/tambo-ai/tambo/commit/d4585fd775bbb8469051bb666a1ef6a02b41f415))


### Miscellaneous

* allow switch to placeholder as 'new thread' ([#201](https://github.com/tambo-ai/tambo/issues/201)) ([9061863](https://github.com/tambo-ai/tambo/commit/9061863dc2dd563b2e204b7ad10ad33237388d21))
* **deps:** bump @tambo-ai/typescript-sdk from 0.39.0 to 0.40.0 ([#209](https://github.com/tambo-ai/tambo/issues/209)) ([07406d8](https://github.com/tambo-ai/tambo/commit/07406d897a70064d2d34a25d691472531c1d9fb6))

## [0.18.2](https://github.com/tambo-ai/tambo/compare/react-v0.18.1...react-v0.18.2) (2025-03-26)


### Miscellaneous

* bump tambo/ts version ([#196](https://github.com/tambo-ai/tambo/issues/196)) ([d24918b](https://github.com/tambo-ai/tambo/commit/d24918b61acc78ae5f1d09a4f70f65c09ebd989d))

## [0.18.1](https://github.com/tambo-ai/tambo/compare/react-v0.18.0...react-v0.18.1) (2025-03-25)


### Bug Fixes

* suggestions to filter for assistant ([#188](https://github.com/tambo-ai/tambo/issues/188)) ([03b597d](https://github.com/tambo-ai/tambo/commit/03b597d3f1ec19e0c33be1b850c9284db3546d75))


### Miscellaneous

* **deps-dev:** bump @types/node from 20.17.25 to 20.17.27 ([#180](https://github.com/tambo-ai/tambo/issues/180)) ([9caede8](https://github.com/tambo-ai/tambo/commit/9caede80a7999afaf0d8e05521c290c204fb099d))
* **deps-dev:** bump the eslint group with 4 updates ([#178](https://github.com/tambo-ai/tambo/issues/178)) ([52bcaca](https://github.com/tambo-ai/tambo/commit/52bcaca7c06141955d2185a84f1647cf40847a38))
* **deps:** bump @tambo-ai/typescript-sdk from 0.37.0 to 0.38.0 ([#182](https://github.com/tambo-ai/tambo/issues/182)) ([e4222b1](https://github.com/tambo-ai/tambo/commit/e4222b132bc647d8216fec3e18df705c9afe8659))
* **deps:** bump @tanstack/react-query from 5.68.0 to 5.69.0 ([#183](https://github.com/tambo-ai/tambo/issues/183)) ([ba18fba](https://github.com/tambo-ai/tambo/commit/ba18fbab3680c89c62f4f05b5fa342d3798bbcc9))
* **deps:** bump zod-to-json-schema from 3.24.4 to 3.24.5 ([#187](https://github.com/tambo-ai/tambo/issues/187)) ([45e150f](https://github.com/tambo-ai/tambo/commit/45e150f5ec0224301e8eea160834920754eec6f8))

## [0.18.0](https://github.com/tambo-ai/tambo/compare/react-v0.17.0...react-v0.18.0) (2025-03-22)


### Features

* add support for propsSchema ([#174](https://github.com/tambo-ai/tambo/issues/174)) ([da0e049](https://github.com/tambo-ai/tambo/commit/da0e049295a1bba5c7aa13d137df2602f2ffd09f))

## [0.17.0](https://github.com/tambo-ai/tambo/compare/react-v0.16.2...react-v0.17.0) (2025-03-21)


### Features

* add debounce, optimistic updates, and helper functions for prop updates ([#169](https://github.com/tambo-ai/tambo/issues/169)) ([b1f5870](https://github.com/tambo-ai/tambo/commit/b1f587033596857ea0df00499a53caf85af89dc6))

## [0.16.2](https://github.com/tambo-ai/tambo/compare/react-v0.16.1...react-v0.16.2) (2025-03-21)


### Bug Fixes

* expose fetch param from switchthread ([#170](https://github.com/tambo-ai/tambo/issues/170)) ([83f41fe](https://github.com/tambo-ai/tambo/commit/83f41fe41672f4950346dedc7798c64d3849727e))

## [0.16.1](https://github.com/tambo-ai/tambo/compare/react-v0.16.0...react-v0.16.1) (2025-03-19)


### Bug Fixes

* only initialize component state value once ([#165](https://github.com/tambo-ai/tambo/issues/165)) ([316afcf](https://github.com/tambo-ai/tambo/commit/316afcf881435e694017ea06e00afd8f6dad5733))

## [0.16.0](https://github.com/tambo-ai/tambo/compare/react-v0.15.1...react-v0.16.0) (2025-03-19)


### Features

* add components= prop to pass static component list ([#164](https://github.com/tambo-ai/tambo/issues/164)) ([a78f6da](https://github.com/tambo-ai/tambo/commit/a78f6dae3ac6ca51ca5768c6ea0abe511ba999c0))


### Miscellaneous

* pin stuff down to node &gt;=20 ([#159](https://github.com/tambo-ai/tambo/issues/159)) ([169797b](https://github.com/tambo-ai/tambo/commit/169797bc2800b1e42903d358f8023f391898b33f))

## [0.15.1](https://github.com/tambo-ai/tambo/compare/react-v0.15.0...react-v0.15.1) (2025-03-18)


### Bug Fixes

* add explicit key= to work around subtle react caching behavior ([#157](https://github.com/tambo-ai/tambo/issues/157)) ([aaa1ce0](https://github.com/tambo-ai/tambo/commit/aaa1ce0f826afc00f45a2ed27d7b82524c8262a0))

## [0.15.0](https://github.com/tambo-ai/tambo/compare/react-v0.14.1...react-v0.15.0) (2025-03-18)


### Features

* send tool response in message content ([#149](https://github.com/tambo-ai/tambo/issues/149)) ([1e90186](https://github.com/tambo-ai/tambo/commit/1e90186ac12c35765441a0c136ca8f6ceb2b165e))


### Miscellaneous

* bump to new typescript-sdk ([#147](https://github.com/tambo-ai/tambo/issues/147)) ([2c4f0bc](https://github.com/tambo-ai/tambo/commit/2c4f0bc38ca62dcac6fb4b3de1f13eff199fe2ac))
* remove some unused dependencies ([#152](https://github.com/tambo-ai/tambo/issues/152)) ([02f3e0d](https://github.com/tambo-ai/tambo/commit/02f3e0d0d7708ddcf72216a90167938ed1aab78a))

## [0.14.1](https://github.com/tambo-ai/tambo/compare/react-v0.14.0...react-v0.14.1) (2025-03-17)


### Bug Fixes

* include tool_call_id in response, for full round-trip ([#143](https://github.com/tambo-ai/tambo/issues/143)) ([deb96ab](https://github.com/tambo-ai/tambo/commit/deb96abdbf606e51c573b3350005884993c2fee3))

## [0.14.0](https://github.com/tambo-ai/tambo/compare/react-v0.13.4...react-v0.14.0) (2025-03-17)


### Features

* add suggestionResult to useTamboSuggestions interface ([#125](https://github.com/tambo-ai/tambo/issues/125)) ([172c7d2](https://github.com/tambo-ai/tambo/commit/172c7d268527faf57668daf2dcd8c681cda14f57))
* bump typescript-sdk and fix react hooks lint ([#140](https://github.com/tambo-ai/tambo/issues/140)) ([0039327](https://github.com/tambo-ai/tambo/commit/0039327f1f7ade38c3da90fbdad17b686d600b03))

## [0.13.4](https://github.com/tambo-ai/tambo/compare/react-v0.13.3...react-v0.13.4) (2025-03-17)


### Bug Fixes

* correct repo url for dependabot references/etc ([#139](https://github.com/tambo-ai/tambo/issues/139)) ([514ca3a](https://github.com/tambo-ai/tambo/commit/514ca3ae8c19cd2e777e0683d6adc6e346492a57))


### Miscellaneous

* **deps-dev:** bump lint-staged from 15.4.3 to 15.5.0 ([#137](https://github.com/tambo-ai/tambo/issues/137)) ([46f5837](https://github.com/tambo-ai/tambo/commit/46f5837fe6cb446ac87df58e072cd4ade0527265))
* **deps:** bump @tanstack/react-query from 5.67.3 to 5.68.0 ([#132](https://github.com/tambo-ai/tambo/issues/132)) ([3e15aa2](https://github.com/tambo-ai/tambo/commit/3e15aa255fd36bcd629a74b4f98ec18e573d269d))
* **deps:** bump zod-to-json-schema from 3.24.3 to 3.24.4 ([#133](https://github.com/tambo-ai/tambo/issues/133)) ([755762d](https://github.com/tambo-ai/tambo/commit/755762dfd8cf75b977103a189e0f1301c865f03d))

## [0.13.3](https://github.com/tambo-ai/tambo/compare/react-v0.13.2...react-v0.13.3) (2025-03-13)


### Bug Fixes

* Send initial component state on render ([#124](https://github.com/tambo-ai/tambo/issues/124)) ([2cfa4b2](https://github.com/tambo-ai/tambo/commit/2cfa4b21274e71edb25a39ca5919ad4bf7c56954))


### Miscellaneous

* bump typescript-sdk to pick up required type ([#127](https://github.com/tambo-ai/tambo/issues/127)) ([0f4d4f4](https://github.com/tambo-ai/tambo/commit/0f4d4f485de97479371efb9880b52dad5a8bcec4))

## [0.13.2](https://github.com/tambo-ai/tambo/compare/react-v0.13.1...react-v0.13.2) (2025-03-12)


### Bug Fixes

* bump typescript-sdk to eliminate old apis ([#121](https://github.com/tambo-ai/tambo/issues/121)) ([9173a7d](https://github.com/tambo-ai/tambo/commit/9173a7d85863c2009205020c47ce1141b32d554e))
* during streaming fetch at complete ([#120](https://github.com/tambo-ai/tambo/issues/120)) ([246971a](https://github.com/tambo-ai/tambo/commit/246971afe74b6f06d1deb473d7e466f4c8ed3e03))
* rename `react` directory to `react-sdk` for name collision avoidance ([#113](https://github.com/tambo-ai/tambo/issues/113)) ([f6ac4c9](https://github.com/tambo-ai/tambo/commit/f6ac4c99892172650b58aad68585eb7aa35da9b2))
* renaming react suffix on package (as a test) ([#114](https://github.com/tambo-ai/tambo/issues/114)) ([dfe581d](https://github.com/tambo-ai/tambo/commit/dfe581dbb94e82284ac05b15e9e88d440fe87d87))


### Miscellaneous

* removes old files and update readmes ([#117](https://github.com/tambo-ai/tambo/issues/117)) ([94e6dde](https://github.com/tambo-ai/tambo/commit/94e6dded0d8abd15b7f2b19c0837cf9baf2f279d))

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
