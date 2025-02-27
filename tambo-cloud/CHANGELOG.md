# Changelog

## [0.9.1](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.9.0...v0.9.1) (2025-02-27)


### Bug Fixes

* add LIBRETTO_API_KEY so it works under the hood ([#388](https://github.com/use-hydra-ai/hydra-ai-site/issues/388)) ([d743032](https://github.com/use-hydra-ai/hydra-ai-site/commit/d743032fee60cf8cc0e6f29e637979009db99593))
* expose both forms of OPENAI_API_KEY ([#391](https://github.com/use-hydra-ai/hydra-ai-site/issues/391)) ([f744dee](https://github.com/use-hydra-ai/hydra-ai-site/commit/f744deeb58937eed8a9381b93ba26d4d6683b7bb))
* typo in configmodule ([#392](https://github.com/use-hydra-ai/hydra-ai-site/issues/392)) ([62eccc5](https://github.com/use-hydra-ai/hydra-ai-site/commit/62eccc5e463a180c7119e6ab6baa6d37b56cae7d))

## [0.9.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.8.0...v0.9.0) (2025-02-26)


### Features

* make updateComponentState work correctly, use it in the smoketest ([#374](https://github.com/use-hydra-ai/hydra-ai-site/issues/374)) ([25940be](https://github.com/use-hydra-ai/hydra-ai-site/commit/25940be9dce49daa2a79e61f77557e7d5e8c39bd))


### Bug Fixes

* add `additionalProperties` to metadata props ([#372](https://github.com/use-hydra-ai/hydra-ai-site/issues/372)) ([fa1faa6](https://github.com/use-hydra-ai/hydra-ai-site/commit/fa1faa62f4b35dfc1a63a757effec139ebc93672))
* Update @hydra-ai/react to get new Tambo names ([#375](https://github.com/use-hydra-ai/hydra-ai-site/issues/375)) ([24a2725](https://github.com/use-hydra-ai/hydra-ai-site/commit/24a2725769657fb4ade96366d27f43ffedad92c5))
* update streaming vnext docs ([#370](https://github.com/use-hydra-ai/hydra-ai-site/issues/370)) ([26471ef](https://github.com/use-hydra-ai/hydra-ai-site/commit/26471ef3f82bcd0f611b3c3a1c524e6ff0af1aec))

## [0.8.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.7.1...v0.8.0) (2025-02-25)


### Features

* add componentState column to message ([#367](https://github.com/use-hydra-ai/hydra-ai-site/issues/367)) ([ac1d239](https://github.com/use-hydra-ai/hydra-ai-site/commit/ac1d2398c85668dc4d5d8331676f73a62bdd01b8))
* expose state updates via messages ([#368](https://github.com/use-hydra-ai/hydra-ai-site/issues/368)) ([95d8d60](https://github.com/use-hydra-ai/hydra-ai-site/commit/95d8d6098f0b52aadad0d7050a1257a49c54d2f9))


### Bug Fixes

* Update message in db on interval during streaming ([#366](https://github.com/use-hydra-ai/hydra-ai-site/issues/366)) ([f3bade1](https://github.com/use-hydra-ai/hydra-ai-site/commit/f3bade168b0398c844c20baa45c6c786e9abb292))
* Update to new hydra packages ([#364](https://github.com/use-hydra-ai/hydra-ai-site/issues/364)) ([cba56b7](https://github.com/use-hydra-ai/hydra-ai-site/commit/cba56b7ec0aae4845f29d74584ff47b6d41cd751))

## [0.7.1](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.7.0...v0.7.1) (2025-02-24)


### Bug Fixes

* flush out more Dtos, including component registry ([#362](https://github.com/use-hydra-ai/hydra-ai-site/issues/362)) ([001b7ef](https://github.com/use-hydra-ai/hydra-ai-site/commit/001b7efbfc64d56f8f4f6fada690692c8a534e2b))
* Update thread with final message on stream routes ([#360](https://github.com/use-hydra-ai/hydra-ai-site/issues/360)) ([c9bee20](https://github.com/use-hydra-ai/hydra-ai-site/commit/c9bee20acfb2ce5e390b5b40d18d1f3b3d1f9857))

## [0.7.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.6.0...v0.7.0) (2025-02-22)


### Features

* adds AI functionality ([#345](https://github.com/use-hydra-ai/hydra-ai-site/issues/345)) ([637d702](https://github.com/use-hydra-ai/hydra-ai-site/commit/637d70259c84f7a02047835e62ef265fd1f544eb))
* adds passing available componets to suggestions endpoint. ([#331](https://github.com/use-hydra-ai/hydra-ai-site/issues/331)) ([4a1afdf](https://github.com/use-hydra-ai/hydra-ai-site/commit/4a1afdfed5c03947113a884902eaf23182bd99e0))
* remove all user-related APIs ([#332](https://github.com/use-hydra-ai/hydra-ai-site/issues/332)) ([7998cd4](https://github.com/use-hydra-ai/hydra-ai-site/commit/7998cd4f03ec4a71ae39655013c880583f13c402))


### Bug Fixes

* add Dto suffix, but rename with ApiSchema, do casting where appropriate, etc ([#347](https://github.com/use-hydra-ai/hydra-ai-site/issues/347)) ([54e02ca](https://github.com/use-hydra-ai/hydra-ai-site/commit/54e02caa21abb8ffe9475833f928401272fabfc3))
* Avoid hydration stream flicker ([#344](https://github.com/use-hydra-ai/hydra-ai-site/issues/344)) ([9ae6378](https://github.com/use-hydra-ai/hydra-ai-site/commit/9ae637845c2a4405715a2e7adb08c1a14ef35d4d))
* avoid resetting ID every chunk of streamed ThreadMessage ([#343](https://github.com/use-hydra-ai/hydra-ai-site/issues/343)) ([53b764a](https://github.com/use-hydra-ai/hydra-ai-site/commit/53b764ac2ce62b7e1012f1f274feca7b742fd153))
* make sure DbRepository is available to components ([#342](https://github.com/use-hydra-ai/hydra-ai-site/issues/342)) ([45f7d37](https://github.com/use-hydra-ai/hydra-ai-site/commit/45f7d3778bdfbf95deb4956815ed53d64825116c))
* Return component name with streamed toolcallrequest ([#329](https://github.com/use-hydra-ai/hydra-ai-site/issues/329)) ([f11ee78](https://github.com/use-hydra-ai/hydra-ai-site/commit/f11ee78af22bc566680d98158d29cef1079e2f8d))

## [0.6.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.5.0...v0.6.0) (2025-02-20)


### Features

* formally remove bearer auth ([#315](https://github.com/use-hydra-ai/hydra-ai-site/issues/315)) ([27c4008](https://github.com/use-hydra-ai/hydra-ai-site/commit/27c4008498c051cf71772ce402978a9858ecfbfc))
* updated smoketest with suggestions and thread input ([#312](https://github.com/use-hydra-ai/hydra-ai-site/issues/312)) ([e049565](https://github.com/use-hydra-ai/hydra-ai-site/commit/e0495655dc91d90eca8166f8f91f302977275249))


### Bug Fixes

* add param to let nestjs/swagger infer the right type ([#314](https://github.com/use-hydra-ai/hydra-ai-site/issues/314)) ([fdbab3d](https://github.com/use-hydra-ai/hydra-ai-site/commit/fdbab3d3dcc7db08ea1636a4fae6a472a32a1567))
* add return-await eslint rule, and clean up existing config ([#313](https://github.com/use-hydra-ai/hydra-ai-site/issues/313)) ([f9e0d18](https://github.com/use-hydra-ai/hydra-ai-site/commit/f9e0d182491d3f99ba9ac54a5f88e8c29b866c7b))
* update to new hydra-ai for security/etc fixes ([#310](https://github.com/use-hydra-ai/hydra-ai-site/issues/310)) ([72327f4](https://github.com/use-hydra-ai/hydra-ai-site/commit/72327f4119b5f584fac89c9416271a36d51e017a))
* use ApiQuery to indicate a query param, not a path param ([#316](https://github.com/use-hydra-ai/hydra-ai-site/issues/316)) ([f802e6b](https://github.com/use-hydra-ai/hydra-ai-site/commit/f802e6bba1574f006b80660c5f6c27e8e46065ff))

## [0.5.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.4.0...v0.5.0) (2025-02-19)


### Features

* Add streaming API endpoints ([#307](https://github.com/use-hydra-ai/hydra-ai-site/issues/307)) ([83983a4](https://github.com/use-hydra-ai/hydra-ai-site/commit/83983a4f2f81f34525ef689e32f702e2f766ab99))

## [0.4.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.3.0...v0.4.0) (2025-02-19)


### Features

* Init server package streaming ([#287](https://github.com/use-hydra-ai/hydra-ai-site/issues/287)) ([e8a2519](https://github.com/use-hydra-ai/hydra-ai-site/commit/e8a25196be8acce701b354137650744f61a40008))


### Bug Fixes

* add missings param from openapi spec ([#305](https://github.com/use-hydra-ai/hydra-ai-site/issues/305)) ([6ba0506](https://github.com/use-hydra-ai/hydra-ai-site/commit/6ba05064ba4ab5bfdb89b9f6b46f4eaf281f1bfa))
* handle server errors gracefully ([#302](https://github.com/use-hydra-ai/hydra-ai-site/issues/302)) ([9af1cc3](https://github.com/use-hydra-ai/hydra-ai-site/commit/9af1cc3ae03f60a01a6a5d301ab20212e93af719))
* hide internal messages from apis by default, add checkbox to dashboard ([#303](https://github.com/use-hydra-ai/hydra-ai-site/issues/303)) ([649931c](https://github.com/use-hydra-ai/hydra-ai-site/commit/649931c4c2e316400c0b58848a547ba2a247b43f))

## [0.3.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.2.1...v0.3.0) (2025-02-18)


### Features

* Add API monitor to smoketest page ([#283](https://github.com/use-hydra-ai/hydra-ai-site/issues/283)) ([69a758b](https://github.com/use-hydra-ai/hydra-ai-site/commit/69a758b735296527a82ea2bcd75af13771d8776e))
* add suggestions to smoketest ([#285](https://github.com/use-hydra-ai/hydra-ai-site/issues/285)) ([e25cad4](https://github.com/use-hydra-ai/hydra-ai-site/commit/e25cad4b92d341fa131eb8b1cd9ad3159b04f91d))
* add token count to api monitor ([#286](https://github.com/use-hydra-ai/hydra-ai-site/issues/286)) ([1ca481d](https://github.com/use-hydra-ai/hydra-ai-site/commit/1ca481dfd4fd683f0d32f0db88fa922c8ff0e90b))
* fix auth, rm SuggestedActions and add suggestions API ([#288](https://github.com/use-hydra-ai/hydra-ai-site/issues/288)) ([de7352b](https://github.com/use-hydra-ai/hydra-ai-site/commit/de7352b4c52f43266e63bb749999b3be4a401839))


### Bug Fixes

* fix pause/error toggles ([#300](https://github.com/use-hydra-ai/hydra-ai-site/issues/300)) ([386f3ac](https://github.com/use-hydra-ai/hydra-ai-site/commit/386f3ac4fc265fe7c10fcd9060ce7e01ff01981a))

## [0.2.1](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.2.0...v0.2.1) (2025-02-14)


### Bug Fixes

* try to use yaml again in slack notification ([#282](https://github.com/use-hydra-ai/hydra-ai-site/issues/282)) ([5fd82dd](https://github.com/use-hydra-ai/hydra-ai-site/commit/5fd82dd3be2b7836ba5d26fde0f5b2c67bb5de3a))
* update package-lock.json ([#280](https://github.com/use-hydra-ai/hydra-ai-site/issues/280)) ([f7c6082](https://github.com/use-hydra-ai/hydra-ai-site/commit/f7c6082445578ef595cc9e56fc624c7ba81ee7b0))

## [0.2.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.1.4...v0.2.0) (2025-02-14)


### Features

* Wire up libretto, rough cut ([#278](https://github.com/use-hydra-ai/hydra-ai-site/issues/278)) ([853508b](https://github.com/use-hydra-ai/hydra-ai-site/commit/853508b9e156c84a9694b93dd0192e1b0f3713da))


### Bug Fixes

* accidentally remove supabase url, putting back ([#277](https://github.com/use-hydra-ai/hydra-ai-site/issues/277)) ([f552f13](https://github.com/use-hydra-ai/hydra-ai-site/commit/f552f135ba0410afe081be3e73a7bd95b0ef34dc))
* new @hydra-ai/react for missing components state fix ([#279](https://github.com/use-hydra-ai/hydra-ai-site/issues/279)) ([5a49b5e](https://github.com/use-hydra-ai/hydra-ai-site/commit/5a49b5e696d92770f8a25b934ac6daf247c8fbf3))
* properly format slack notification on release ([#275](https://github.com/use-hydra-ai/hydra-ai-site/issues/275)) ([b696b82](https://github.com/use-hydra-ai/hydra-ai-site/commit/b696b8206e70ead788de493ba1a85fd5914b6599))

## [0.1.4](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.1.3...v0.1.4) (2025-02-14)


### Bug Fixes

* Use "system", "assistant" and "user" roles where appropriate ([#273](https://github.com/use-hydra-ai/hydra-ai-site/issues/273)) ([0b75327](https://github.com/use-hydra-ai/hydra-ai-site/commit/0b75327c0951bfc9f1f1f8d8bde385b83f969339))

## [0.1.3](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.1.2...v0.1.3) (2025-02-13)


### Bug Fixes

* update smoketest to use working persistent threads from @hydra-ai/react ([#270](https://github.com/use-hydra-ai/hydra-ai-site/issues/270)) ([8da20f8](https://github.com/use-hydra-ai/hydra-ai-site/commit/8da20f8afb5b9fea5f15b528982e434acf303e0d))

## [0.1.2](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.1.1...v0.1.2) (2025-02-13)


### Bug Fixes

* add some missing fields, use them from the updated react client ([#268](https://github.com/use-hydra-ai/hydra-ai-site/issues/268)) ([275290f](https://github.com/use-hydra-ai/hydra-ai-site/commit/275290fad9c2e5367dd18fa1cdb40df1d7cee6fb))
* message is required ([#266](https://github.com/use-hydra-ai/hydra-ai-site/issues/266)) ([f2103f4](https://github.com/use-hydra-ai/hydra-ai-site/commit/f2103f43bb660b67d63b74d4ba12c891bfea762a))

## [0.1.1](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.1.0...v0.1.1) (2025-02-12)


### Bug Fixes

* include the threadId in the ThreadMessage ([#264](https://github.com/use-hydra-ai/hydra-ai-site/issues/264)) ([86d8a98](https://github.com/use-hydra-ai/hydra-ai-site/commit/86d8a98a080882db9e23148b4ba59fbb3da499e5))

## [0.1.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.0.2...v0.1.0) (2025-02-12)


### Features

* update generate2/hydrate2 APIs to return MessageThread instead of ComponentDecision ([#258](https://github.com/use-hydra-ai/hydra-ai-site/issues/258)) ([cf40d96](https://github.com/use-hydra-ai/hydra-ai-site/commit/cf40d9695b925f8afb5efde66291c8f4dfbdf476))


### Bug Fixes

* **build:** use TS Paths instead of module exports ([#262](https://github.com/use-hydra-ai/hydra-ai-site/issues/262)) ([ecf4315](https://github.com/use-hydra-ai/hydra-ai-site/commit/ecf4315a3b2f163d2eb4e3b5063a5eb410483ca3))
* mistyped the wrong API ([#263](https://github.com/use-hydra-ai/hydra-ai-site/issues/263)) ([c8f39dc](https://github.com/use-hydra-ai/hydra-ai-site/commit/c8f39dcf5464a2ee880cdb92828191fdbedbed39))

## [0.0.2](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.0.1...v0.0.2) (2025-02-12)


### Bug Fixes

* **smoketest:** add padding to status line ([#256](https://github.com/use-hydra-ai/hydra-ai-site/issues/256)) ([32b11a7](https://github.com/use-hydra-ai/hydra-ai-site/commit/32b11a7fd606a5add7c1910b813bd63c47b9e898))

## 0.0.1 (2025-02-12)


### Features

* New Generate2 + Hydrate2 APIs ([#230](https://github.com/use-hydra-ai/hydra-ai-site/issues/230)) ([1428c68](https://github.com/use-hydra-ai/hydra-ai-site/commit/1428c689059246747566e54e88226889df9c7c5d))


### Bug Fixes

* do not show json thread ([#254](https://github.com/use-hydra-ai/hydra-ai-site/issues/254)) ([8cd6c62](https://github.com/use-hydra-ai/hydra-ai-site/commit/8cd6c62de58d7ffe4d3361d9ef2ecab731367033))
* update smoketest to new API, add legacy smoketest for old api ([#171](https://github.com/use-hydra-ai/hydra-ai-site/issues/171)) ([09a855c](https://github.com/use-hydra-ai/hydra-ai-site/commit/09a855c1693665b336e78830f5a6a6805c1000d4))


### Miscellaneous Chores

* release 0.0.1 ([1fa02d1](https://github.com/use-hydra-ai/hydra-ai-site/commit/1fa02d1203b6472277a477530cf320af6afc716c))
