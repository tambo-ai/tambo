# Changelog

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
