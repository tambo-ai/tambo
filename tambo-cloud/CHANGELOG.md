# Changelog

## [0.46.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.46.1...repo-v0.46.2) (2025-05-08)


### Bug Fixes

* more zod validation stuff ([#930](https://github.com/tambo-ai/tambo-cloud/issues/930)) ([2799185](https://github.com/tambo-ai/tambo-cloud/commit/2799185a531be5e6243e851581a4381b53231c6e))
* refine jsonschema stripping, add back contentEncoding/contentMediaType, add tests ([#932](https://github.com/tambo-ai/tambo-cloud/issues/932)) ([2656eac](https://github.com/tambo-ai/tambo-cloud/commit/2656eac52da9b9ed5cbba6bc40b0daa7147a29e4))

## [0.46.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.46.0...repo-v0.46.1) (2025-05-08)


### Bug Fixes

* still call tools even without parameters ([#928](https://github.com/tambo-ai/tambo-cloud/issues/928)) ([facadb1](https://github.com/tambo-ai/tambo-cloud/commit/facadb12c1b8c776aa140a5e47efb66a2d1e5f08))

## [0.46.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.45.0...repo-v0.46.0) (2025-05-06)


### Features

* Add MCP server setup during project setup ([#924](https://github.com/tambo-ai/tambo-cloud/issues/924)) ([aaff9b7](https://github.com/tambo-ai/tambo-cloud/commit/aaff9b78d4c891c584309d4b9a884f8a6f63c7da))
* validate MCP server in mcp editor ([#925](https://github.com/tambo-ai/tambo-cloud/issues/925)) ([ced7acb](https://github.com/tambo-ai/tambo-cloud/commit/ced7acb9806350e9a9fe38283b7950e85a7fb88f))


### Bug Fixes

* propagate system prompt from db to prompt ([#926](https://github.com/tambo-ai/tambo-cloud/issues/926)) ([99e3226](https://github.com/tambo-ai/tambo-cloud/commit/99e3226c90e8e9c3f3a329e4195b89b92a3e2215))
* sanitize other json schema formats like anyOf/etc ([#927](https://github.com/tambo-ai/tambo-cloud/issues/927)) ([11c8bf3](https://github.com/tambo-ai/tambo-cloud/commit/11c8bf3b1feba1445079f08f5acfa68eb3b01004))


### Code Refactoring

* move client side components out of pages so they have distinct titles ([#922](https://github.com/tambo-ai/tambo-cloud/issues/922)) ([0e2cf8f](https://github.com/tambo-ai/tambo-cloud/commit/0e2cf8fc2965bc67f78090b245277b1681f1d641))

## [0.45.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.44.1...repo-v0.45.0) (2025-05-05)


### Features

* add custom instructions editor ([#920](https://github.com/tambo-ai/tambo-cloud/issues/920)) ([fe90bca](https://github.com/tambo-ai/tambo-cloud/commit/fe90bcad076194d3478a99ed14cd21155e7a53c5))

## [0.44.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.44.0...repo-v0.44.1) (2025-05-05)


### Miscellaneous Chores

* **deps-dev:** bump drizzle-kit from 0.31.0 to 0.31.1 in the drizzle group ([#901](https://github.com/tambo-ai/tambo-cloud/issues/901)) ([436e032](https://github.com/tambo-ai/tambo-cloud/commit/436e032897c81b4214af1e5eab1c04aed1d784c3))
* **deps-dev:** bump the eslint group with 2 updates ([#902](https://github.com/tambo-ai/tambo-cloud/issues/902)) ([60e9afe](https://github.com/tambo-ai/tambo-cloud/commit/60e9afe776d64a4142fe05eb437c67c2eb783926))
* **deps-dev:** bump typescript-eslint from 8.31.1 to 8.32.0 in the eslint group ([#911](https://github.com/tambo-ai/tambo-cloud/issues/911)) ([ccbce97](https://github.com/tambo-ai/tambo-cloud/commit/ccbce97232d67b1f515e6876e7141ec55a3832f0))
* **deps:** bump @libretto/token.js from 0.7.0 to 0.7.1 ([#913](https://github.com/tambo-ai/tambo-cloud/issues/913)) ([eac07ba](https://github.com/tambo-ai/tambo-cloud/commit/eac07ba0c8c627682560fe9bcb10e370076375b8))
* **deps:** bump @nestjs/swagger from 11.1.5 to 11.1.6 in the nestjs group ([#900](https://github.com/tambo-ai/tambo-cloud/issues/900)) ([70f6d9a](https://github.com/tambo-ai/tambo-cloud/commit/70f6d9aef79e158bf24a62f32eae635a0322ece4))
* **deps:** bump @nestjs/swagger from 11.1.6 to 11.2.0 in the nestjs group ([#910](https://github.com/tambo-ai/tambo-cloud/issues/910)) ([86b1e9f](https://github.com/tambo-ai/tambo-cloud/commit/86b1e9f72a95e2c2d189583a2a9aea84b2fd300f))
* **deps:** bump @t3-oss/env-nextjs from 0.13.0 to 0.13.4 ([#904](https://github.com/tambo-ai/tambo-cloud/issues/904)) ([a3890de](https://github.com/tambo-ai/tambo-cloud/commit/a3890de8b91fd8510ec8a0fb64447dbc2daaadd7))
* **deps:** bump @tanstack/react-query from 5.74.7 to 5.75.2 ([#906](https://github.com/tambo-ai/tambo-cloud/issues/906)) ([1fc19df](https://github.com/tambo-ai/tambo-cloud/commit/1fc19df99793eda13126fd63857691e1eb94dc9e))
* **deps:** bump class-validator from 0.14.1 to 0.14.2 ([#917](https://github.com/tambo-ai/tambo-cloud/issues/917)) ([7f321c3](https://github.com/tambo-ai/tambo-cloud/commit/7f321c36363921b6efa44a83e518335267d4bd32))
* **deps:** bump composio-core from 0.5.33 to 0.5.36 ([#915](https://github.com/tambo-ai/tambo-cloud/issues/915)) ([faacde9](https://github.com/tambo-ai/tambo-cloud/commit/faacde9bc3ff9a53415421d2d90ae7c0f9216963))
* **deps:** bump framer-motion from 12.9.2 to 12.9.7 ([#916](https://github.com/tambo-ai/tambo-cloud/issues/916)) ([0b5d8a6](https://github.com/tambo-ai/tambo-cloud/commit/0b5d8a6ba2a254d37c930484e73e944557800ff0))
* **deps:** bump posthog-js from 1.236.7 to 1.239.1 ([#905](https://github.com/tambo-ai/tambo-cloud/issues/905)) ([64fe670](https://github.com/tambo-ai/tambo-cloud/commit/64fe67013c81ef28ff597d2b5691f50937c4c41f))
* **deps:** bump react-hook-form from 7.56.1 to 7.56.2 ([#907](https://github.com/tambo-ai/tambo-cloud/issues/907)) ([915c168](https://github.com/tambo-ai/tambo-cloud/commit/915c168cf38f6f1d76c3c1e2676a32ef4215383b))
* **deps:** bump react-speech-recognition from 4.0.0 to 4.0.1 ([#908](https://github.com/tambo-ai/tambo-cloud/issues/908)) ([5619e77](https://github.com/tambo-ai/tambo-cloud/commit/5619e77a732ba5878507bf25abc4d876a9802a4e))
* **deps:** bump resend from 4.4.1 to 4.5.1 ([#914](https://github.com/tambo-ai/tambo-cloud/issues/914)) ([d6251b9](https://github.com/tambo-ai/tambo-cloud/commit/d6251b947e3ce3dd57b2b1b469070d7a892b5320))
* **deps:** bump the trpc group with 3 updates ([#899](https://github.com/tambo-ai/tambo-cloud/issues/899)) ([daa8ef6](https://github.com/tambo-ai/tambo-cloud/commit/daa8ef655990c678d963582d195b2ec24235bdc3))
* **deps:** bump tldts from 7.0.4 to 7.0.6 ([#918](https://github.com/tambo-ai/tambo-cloud/issues/918)) ([2c74e8c](https://github.com/tambo-ai/tambo-cloud/commit/2c74e8c0fa9cd73c1900131b18526e416cea6451))
* **deps:** bump zod from 3.24.3 to 3.24.4 ([#919](https://github.com/tambo-ai/tambo-cloud/issues/919)) ([747d92e](https://github.com/tambo-ai/tambo-cloud/commit/747d92e8c81fb6a2c6602e9b2b66c5e1f8928634))

## [0.44.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.43.0...repo-v0.44.0) (2025-05-03)


### Features

* support streamable http for mcp servers ([#896](https://github.com/tambo-ai/tambo-cloud/issues/896)) ([063f5b5](https://github.com/tambo-ai/tambo-cloud/commit/063f5b517910738fff77978f7ee34c10e359a2b1))


### Bug Fixes

* drop more props for schema sanitization ([#898](https://github.com/tambo-ai/tambo-cloud/issues/898)) ([17a280e](https://github.com/tambo-ai/tambo-cloud/commit/17a280eb6b76eac44f63385942df65879c1622eb))

## [0.43.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.42.0...repo-v0.43.0) (2025-05-02)


### Features

* enable MCP for all projects ([#895](https://github.com/tambo-ai/tambo-cloud/issues/895)) ([9f30cf9](https://github.com/tambo-ai/tambo-cloud/commit/9f30cf92d5c12d7c93225cb23f8d5943998fab72))
* make all tool calls strict, by transforming JSONSchema as appropriate ([#892](https://github.com/tambo-ai/tambo-cloud/issues/892)) ([d2f30a6](https://github.com/tambo-ai/tambo-cloud/commit/d2f30a6fc82698d0c062d834a1b0acbb69efdf1b))


### Bug Fixes

* prefix internal tool parameter names with "_tambo_" ([#894](https://github.com/tambo-ai/tambo-cloud/issues/894)) ([c94fe94](https://github.com/tambo-ai/tambo-cloud/commit/c94fe943680e2b51db0f55ffa36f1a0db3e5a2b1))

## [0.42.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.41.0...repo-v0.42.0) (2025-04-30)


### Features

* add StartPage redirect to CodeSandbox template ([#889](https://github.com/tambo-ai/tambo-cloud/issues/889)) ([65f27ca](https://github.com/tambo-ai/tambo-cloud/commit/65f27ca815ea7be44a89b1771dd549ee074166db))


### Bug Fixes

* show tool status indicator in smoketest ([#890](https://github.com/tambo-ai/tambo-cloud/issues/890)) ([6654e10](https://github.com/tambo-ai/tambo-cloud/commit/6654e1086a131e41c46a503b09c5c93e55263bc1))

## [0.41.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.40.0...repo-v0.41.0) (2025-04-29)


### Features

* add stream indicator to smoketest, exposing tool calls as non-internal ([#886](https://github.com/tambo-ai/tambo-cloud/issues/886)) ([475e70a](https://github.com/tambo-ai/tambo-cloud/commit/475e70a3df7b1285849e6d1d4f32610519c08c45))


### Bug Fixes

* expose status messages in component dto ([#888](https://github.com/tambo-ai/tambo-cloud/issues/888)) ([f8da459](https://github.com/tambo-ai/tambo-cloud/commit/f8da459ca9e8abfe727808426948275683b0ed0a))

## [0.40.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.39.5...repo-v0.40.0) (2025-04-29)


### Features

* Standardize error shape using ProblemDetails ([#885](https://github.com/tambo-ai/tambo-cloud/issues/885)) ([ee32845](https://github.com/tambo-ai/tambo-cloud/commit/ee328458196d099ae761c06690ba69965a9bac9c))


### Code Refactoring

* remove a bunch of dead code from component service removal ([#884](https://github.com/tambo-ai/tambo-cloud/issues/884)) ([3d214bf](https://github.com/tambo-ai/tambo-cloud/commit/3d214bf646e40d419815804dda58575791ba8b17))
* remove old components entrypoints/controllers/services/etc ([#829](https://github.com/tambo-ai/tambo-cloud/issues/829)) ([6dc71cb](https://github.com/tambo-ai/tambo-cloud/commit/6dc71cb7abfb594dc6f3af448e0256db06a76517))

## [0.39.5](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.39.4...repo-v0.39.5) (2025-04-29)


### Bug Fixes

* bump react sdk to get streaming behavior ([#881](https://github.com/tambo-ai/tambo-cloud/issues/881)) ([70b4d56](https://github.com/tambo-ai/tambo-cloud/commit/70b4d562f806d697bddf3c2581c9b14338803312))


### Miscellaneous Chores

* **deps-dev:** bump ts-jest from 29.3.1 to 29.3.2 in the testing group ([#876](https://github.com/tambo-ai/tambo-cloud/issues/876)) ([887ac87](https://github.com/tambo-ai/tambo-cloud/commit/887ac87f56b3cd661078806e2a892fa045172c62))
* **deps:** bump react-hook-form from 7.56.0 to 7.56.1 ([#880](https://github.com/tambo-ai/tambo-cloud/issues/880)) ([54f1682](https://github.com/tambo-ai/tambo-cloud/commit/54f1682bb47ab004d6c1102c33032617949f0d9f))
* **deps:** bump resend from 4.2.0 to 4.4.1 ([#875](https://github.com/tambo-ai/tambo-cloud/issues/875)) ([36738a3](https://github.com/tambo-ai/tambo-cloud/commit/36738a356c200e4eff0e62fc10c0d2ee3603044e))

## [0.39.4](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.39.3...repo-v0.39.4) (2025-04-28)


### Bug Fixes

* make demo email props required ([#878](https://github.com/tambo-ai/tambo-cloud/issues/878)) ([c4f1063](https://github.com/tambo-ai/tambo-cloud/commit/c4f1063a9ca7d0f6c33878bd031617daec9e25d8))
* make email component props required ([#874](https://github.com/tambo-ai/tambo-cloud/issues/874)) ([2eaebe8](https://github.com/tambo-ai/tambo-cloud/commit/2eaebe82abf3b56ed3275e1a07ce1531ded5df41))

## [0.39.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.39.2...repo-v0.39.3) (2025-04-28)


### Bug Fixes

* account for partial LLMResponse... then use lint to find related issues ([#871](https://github.com/tambo-ai/tambo-cloud/issues/871)) ([53df4ad](https://github.com/tambo-ai/tambo-cloud/commit/53df4ad241a9e707df0053861f66ca8f933aabf9))
* use span for badges, they are usually used as inline ([#872](https://github.com/tambo-ai/tambo-cloud/issues/872)) ([20ceb8d](https://github.com/tambo-ai/tambo-cloud/commit/20ceb8d504572221fa929422b4d42e6fe8e53f31))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 20.17.30 to 20.17.32 ([#869](https://github.com/tambo-ai/tambo-cloud/issues/869)) ([a1cbc5c](https://github.com/tambo-ai/tambo-cloud/commit/a1cbc5c0b53772e513b952da84819f79c57a4956))
* **deps-dev:** bump eslint-config-prettier from 10.1.1 to 10.1.2 ([#868](https://github.com/tambo-ai/tambo-cloud/issues/868)) ([73908b2](https://github.com/tambo-ai/tambo-cloud/commit/73908b2f15763eb4a2d163482fc82b6320329f54))
* **deps-dev:** bump turbo from 2.5.0 to 2.5.2 ([#870](https://github.com/tambo-ai/tambo-cloud/issues/870)) ([9fe6df1](https://github.com/tambo-ai/tambo-cloud/commit/9fe6df1640eb7d0b887ddc39753ad2d7171a3fd1))
* **deps-dev:** bump typescript-eslint from 8.31.0 to 8.31.1 in the eslint group ([#856](https://github.com/tambo-ai/tambo-cloud/issues/856)) ([4d0bc46](https://github.com/tambo-ai/tambo-cloud/commit/4d0bc46ced2a4f2ef23b2dea94cd9d522957470a))
* **deps:** bump @splinetool/runtime from 1.9.82 to 1.9.89 ([#860](https://github.com/tambo-ai/tambo-cloud/issues/860)) ([5a03800](https://github.com/tambo-ai/tambo-cloud/commit/5a03800de525fe0c0c0199a7c3a6d9435ae3da78))
* **deps:** bump @tambo-ai/react from 0.20.4 to 0.21.1 ([#859](https://github.com/tambo-ai/tambo-cloud/issues/859)) ([4fdeea4](https://github.com/tambo-ai/tambo-cloud/commit/4fdeea49f18dc4c998910e3655d92bcca709f3cd))
* **deps:** bump lucide-react from 0.487.0 to 0.503.0 ([#864](https://github.com/tambo-ai/tambo-cloud/issues/864)) ([a4cc0ec](https://github.com/tambo-ai/tambo-cloud/commit/a4cc0ecf7ce1408c650ad65d3cd7d60ec3d14989))
* **deps:** bump openai from 4.95.1 to 4.96.0 ([#865](https://github.com/tambo-ai/tambo-cloud/issues/865)) ([5eb6645](https://github.com/tambo-ai/tambo-cloud/commit/5eb6645266b7ae5e96d00c3d7b0db57d6dd06573))
* **deps:** bump pg and @types/pg ([#861](https://github.com/tambo-ai/tambo-cloud/issues/861)) ([617afcc](https://github.com/tambo-ai/tambo-cloud/commit/617afcc31770eed7b73004fce9e95344a675ac58))
* **deps:** bump posthog-js from 1.234.9 to 1.236.7 ([#863](https://github.com/tambo-ai/tambo-cloud/issues/863)) ([28b1b27](https://github.com/tambo-ai/tambo-cloud/commit/28b1b27841a2ba319cb17872144aa3ff78d06747))
* **deps:** bump tldts from 6.1.85 to 7.0.4 ([#862](https://github.com/tambo-ai/tambo-cloud/issues/862)) ([955001d](https://github.com/tambo-ai/tambo-cloud/commit/955001d58dced362d6bfd9a0db39a7e6f9b5f277))
* **deps:** bump token.js from 0.5.4 to 0.7.1 ([#858](https://github.com/tambo-ai/tambo-cloud/issues/858)) ([4e545ce](https://github.com/tambo-ai/tambo-cloud/commit/4e545ce233ead8e46706d912f563f17e4d078a4f))
* more dependabot groups for fewer prs ([#873](https://github.com/tambo-ai/tambo-cloud/issues/873)) ([37925e8](https://github.com/tambo-ai/tambo-cloud/commit/37925e8f6cf967af2fd532e768ac626140361fae))

## [0.39.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.39.1...repo-v0.39.2) (2025-04-28)


### Continuous Integration

* make api-specific build command for faster railway builds ([#854](https://github.com/tambo-ai/tambo-cloud/issues/854)) ([d2631ef](https://github.com/tambo-ai/tambo-cloud/commit/d2631ef1ecca808048a4d7e7805a62cd4bfddca3))

## [0.39.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.39.0...repo-v0.39.1) (2025-04-28)


### Bug Fixes

* OpenAPI errors ([#852](https://github.com/tambo-ai/tambo-cloud/issues/852)) ([695502b](https://github.com/tambo-ai/tambo-cloud/commit/695502ba9a2b58f542dc241f15ab135c6de08180))

## [0.39.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.38.0...repo-v0.39.0) (2025-04-28)


### Features

* **cli-auth:** implement new CLI auth page and simplify cli-auth ([#758](https://github.com/tambo-ai/tambo-cloud/issues/758)) ([67ae8ae](https://github.com/tambo-ai/tambo-cloud/commit/67ae8ae3425dc2f4a2a275da1ddc003dfef66d3e))
* **docs:** update index and quickstart documentation, add components guide ([#833](https://github.com/tambo-ai/tambo-cloud/issues/833)) ([43e57b7](https://github.com/tambo-ai/tambo-cloud/commit/43e57b77d43f1242c913687406e00e0b3b45e30c))
* improvements to the thread display in the "observability" tab ([#834](https://github.com/tambo-ai/tambo-cloud/issues/834)) ([4b4e1ac](https://github.com/tambo-ai/tambo-cloud/commit/4b4e1ac2f425f6dee27de02870d45b4a8a0232b4))


### Bug Fixes

* add back tool call ids for streaming, system tool calls ([#841](https://github.com/tambo-ai/tambo-cloud/issues/841)) ([8d91269](https://github.com/tambo-ai/tambo-cloud/commit/8d91269b62dcf4cab79fd1d6dbbeb6322280ec96))
* add back var ([#831](https://github.com/tambo-ai/tambo-cloud/issues/831)) ([ceac78e](https://github.com/tambo-ai/tambo-cloud/commit/ceac78ef1d4c46fa7e6475684bf56fccd2424ef8))
* clean up message display in smoketest ([#837](https://github.com/tambo-ai/tambo-cloud/issues/837)) ([5d8b29d](https://github.com/tambo-ai/tambo-cloud/commit/5d8b29d44417662a7ef779b526471fa8d507cce7))
* cleanup tool call ids ([#830](https://github.com/tambo-ai/tambo-cloud/issues/830)) ([344ec7f](https://github.com/tambo-ai/tambo-cloud/commit/344ec7fbc7e1786c011883124c0be5c29614dfe1))
* **console:** remove noise from duplicate removal ([#840](https://github.com/tambo-ai/tambo-cloud/issues/840)) ([929a7b6](https://github.com/tambo-ai/tambo-cloud/commit/929a7b6cdecc35b251e0edf9e45220e7a122fdd8))
* make sure to record tool_call_id when streaming ([#838](https://github.com/tambo-ai/tambo-cloud/issues/838)) ([b34e67e](https://github.com/tambo-ai/tambo-cloud/commit/b34e67e08f22aab2171a84f2e0b867d206415759))
* missing tool_call_ids on internal calls ([#835](https://github.com/tambo-ai/tambo-cloud/issues/835)) ([bb0640c](https://github.com/tambo-ai/tambo-cloud/commit/bb0640c823a376c9ff648d56d7b5ca2efe20e12c))
* **performance:** filter out duplicate chunks ([#839](https://github.com/tambo-ai/tambo-cloud/issues/839)) ([d99b1e5](https://github.com/tambo-ai/tambo-cloud/commit/d99b1e532e82faed660795a89548f1cd5b61210c))


### Miscellaneous Chores

* **deps-dev:** bump eslint-plugin-turbo from 2.5.0 to 2.5.2 in the eslint group ([#845](https://github.com/tambo-ai/tambo-cloud/issues/845)) ([53cc60c](https://github.com/tambo-ai/tambo-cloud/commit/53cc60cc92f60260783474fa0037632549300728))
* **deps-dev:** bump lint-staged from 15.5.0 to 15.5.1 ([#849](https://github.com/tambo-ai/tambo-cloud/issues/849)) ([3b3540b](https://github.com/tambo-ai/tambo-cloud/commit/3b3540b1ec202637970f0e8aa5470679eb0eaeec))
* **deps:** bump @t3-oss/env-nextjs from 0.12.0 to 0.13.0 ([#847](https://github.com/tambo-ai/tambo-cloud/issues/847)) ([830cb90](https://github.com/tambo-ai/tambo-cloud/commit/830cb90709f7a1ac6e95012af66348ca425673ea))
* **deps:** bump drizzle-orm from 0.42.0 to 0.43.1 in the drizzle group ([#844](https://github.com/tambo-ai/tambo-cloud/issues/844)) ([e176b03](https://github.com/tambo-ai/tambo-cloud/commit/e176b035ef835ba7477c3f76ac524a645266fdfc))
* **deps:** bump framer-motion from 12.6.5 to 12.9.2 ([#851](https://github.com/tambo-ai/tambo-cloud/issues/851)) ([7fbc11a](https://github.com/tambo-ai/tambo-cloud/commit/7fbc11afcc04beed600f102271d4687d45e8d6c4))
* **deps:** bump js-tiktoken from 1.0.19 to 1.0.20 ([#848](https://github.com/tambo-ai/tambo-cloud/issues/848)) ([09c6642](https://github.com/tambo-ai/tambo-cloud/commit/09c6642f122a7d210b800b8163a0bb7b3671c931))
* **deps:** bump next from 15.2.4 to 15.3.1 ([#850](https://github.com/tambo-ai/tambo-cloud/issues/850)) ([bc24f87](https://github.com/tambo-ai/tambo-cloud/commit/bc24f8767423fdf5f26e3e75c366100615fcb2f1))
* **deps:** bump radix-ui from 1.1.3 to 1.3.3 ([#815](https://github.com/tambo-ai/tambo-cloud/issues/815)) ([fd043bc](https://github.com/tambo-ai/tambo-cloud/commit/fd043bcb8c8bccb129d434f650f1b419c266fd3a))
* **deps:** bump the nestjs group with 6 updates ([#843](https://github.com/tambo-ai/tambo-cloud/issues/843)) ([646d7d5](https://github.com/tambo-ai/tambo-cloud/commit/646d7d566b8dbc73ad3b394f90865a93ef3a3a3b))
* **deps:** bump the trpc group with 3 updates ([#842](https://github.com/tambo-ai/tambo-cloud/issues/842)) ([a66ef2a](https://github.com/tambo-ai/tambo-cloud/commit/a66ef2a8bc87a13a0d8c319bb362fc0848092c4d))
* fix a bunch of lint issues ([#832](https://github.com/tambo-ai/tambo-cloud/issues/832)) ([e72f62d](https://github.com/tambo-ai/tambo-cloud/commit/e72f62d9f8760084a29c2b350b559e8718745115))
* remove old smoketest-legacy and hydra-ai lib ([#836](https://github.com/tambo-ai/tambo-cloud/issues/836)) ([d674803](https://github.com/tambo-ai/tambo-cloud/commit/d6748033f108886f819f86a17a682dfab4d01a2e))
* safely remove unused variables across web application ([#766](https://github.com/tambo-ai/tambo-cloud/issues/766)) ([53da77a](https://github.com/tambo-ai/tambo-cloud/commit/53da77ad3312822780428a8b1dd04907fd2016c7))
* update tools doc to remove component association ([#827](https://github.com/tambo-ai/tambo-cloud/issues/827)) ([de196c3](https://github.com/tambo-ai/tambo-cloud/commit/de196c3b620d7bcd2432bbcc044dea77d323f774))


### Code Refactoring

* **images:** replace HTML img tags with Next.js Image component ([#767](https://github.com/tambo-ai/tambo-cloud/issues/767)) ([2c96cd5](https://github.com/tambo-ai/tambo-cloud/commit/2c96cd59aa40cbdea710544251e40ef54ecbcce6))

## [0.38.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.37.0...repo-v0.38.0) (2025-04-24)


### Features

* add standard tool param for completionStatusMessage ([#821](https://github.com/tambo-ai/tambo-cloud/issues/821)) ([22c17d5](https://github.com/tambo-ai/tambo-cloud/commit/22c17d5580cd5931e7eb43dfc94316dd075279ef))
* allow standalone "client tools" to be sent into advance routes ([#825](https://github.com/tambo-ai/tambo-cloud/issues/825)) ([59aa60f](https://github.com/tambo-ai/tambo-cloud/commit/59aa60f3c9c5c4f50164bee404a43c66348459d3))
* initial decision loop ([#801](https://github.com/tambo-ai/tambo-cloud/issues/801)) ([ece563a](https://github.com/tambo-ai/tambo-cloud/commit/ece563a47a85e058d493f924b74fe571d0d29521))
* Management side of composio auth flow, plus some decision loop tool updates ([#822](https://github.com/tambo-ai/tambo-cloud/issues/822)) ([cfff091](https://github.com/tambo-ai/tambo-cloud/commit/cfff09170b15945e18f9265c1f882acc59b10446))
* propagate custom headers through MCPClient to SSEClientTransport ([#803](https://github.com/tambo-ai/tambo-cloud/issues/803)) ([5f97d87](https://github.com/tambo-ai/tambo-cloud/commit/5f97d87c60e8f42e2ec1913d3ada0404e8881e05))
* store full composio oauth config in the db, including dynamic fields ([#808](https://github.com/tambo-ai/tambo-cloud/issues/808)) ([20dcd4d](https://github.com/tambo-ai/tambo-cloud/commit/20dcd4d93f8b7721400b599c81795711ae0b070f))
* Update project creation dashboard flow ([#823](https://github.com/tambo-ai/tambo-cloud/issues/823)) ([680cc90](https://github.com/tambo-ai/tambo-cloud/commit/680cc90e81abe41395b5ea1172b7a516e0ccf6b0))
* wire up composio calls to decision loop ([#824](https://github.com/tambo-ai/tambo-cloud/issues/824)) ([2800783](https://github.com/tambo-ai/tambo-cloud/commit/28007836fe9ff3a0c11eab67e64daa0b21105980))


### Bug Fixes

* clarify markdown usage in displayMessageTool ([#819](https://github.com/tambo-ai/tambo-cloud/issues/819)) ([7160a3d](https://github.com/tambo-ai/tambo-cloud/commit/7160a3de0e15bccc4da4a6e988eb3bc6f0c4aada))
* make sure required field on generated ui tools includes required fields ([#820](https://github.com/tambo-ai/tambo-cloud/issues/820)) ([a654f26](https://github.com/tambo-ai/tambo-cloud/commit/a654f260d6e5222c2f4d7a87d68094331a4616b0))


### Miscellaneous Chores

* bump @tambo-ai/react version ([#826](https://github.com/tambo-ai/tambo-cloud/issues/826)) ([36799ff](https://github.com/tambo-ai/tambo-cloud/commit/36799ff3c9a07a5879dd42e23b4e871b547b9dce))
* **charlie:** make prettier part of 'fix' ([#806](https://github.com/tambo-ai/tambo-cloud/issues/806)) ([6b1bba0](https://github.com/tambo-ai/tambo-cloud/commit/6b1bba0c0ed133a8342ebd71bb4402515ab4bf6c))
* **deps-dev:** bump @next/eslint-plugin-next from 15.2.4 to 15.3.1 ([#817](https://github.com/tambo-ai/tambo-cloud/issues/817)) ([d17a6db](https://github.com/tambo-ai/tambo-cloud/commit/d17a6db43f9fdc77f1883cb0e458727243ca8bf0))
* **deps-dev:** bump the eslint group with 3 updates ([#812](https://github.com/tambo-ai/tambo-cloud/issues/812)) ([ace18c8](https://github.com/tambo-ai/tambo-cloud/commit/ace18c8b0cc364901bc3b3139a224b22c5f1a5f4))
* **deps:** bump @modelcontextprotocol/sdk from 1.9.0 to 1.10.1 ([#813](https://github.com/tambo-ai/tambo-cloud/issues/813)) ([4241271](https://github.com/tambo-ai/tambo-cloud/commit/4241271ed5b47f818d523261632ce717eba4e83b))
* **deps:** bump openai from 4.94.0 to 4.95.1 ([#818](https://github.com/tambo-ai/tambo-cloud/issues/818)) ([5a2cd7f](https://github.com/tambo-ai/tambo-cloud/commit/5a2cd7f227ea964692285b5ddb6db80528200f39))
* **deps:** bump react-hook-form from 7.55.0 to 7.56.0 ([#816](https://github.com/tambo-ai/tambo-cloud/issues/816)) ([a899872](https://github.com/tambo-ai/tambo-cloud/commit/a899872def23854e79cc25246ae1969d0a1d19c8))
* **deps:** bump the drizzle group with 2 updates ([#811](https://github.com/tambo-ai/tambo-cloud/issues/811)) ([504d38f](https://github.com/tambo-ai/tambo-cloud/commit/504d38f40842fa54b849fbf45f0f6fb828093e70))
* **deps:** bump the nestjs group with 5 updates ([#809](https://github.com/tambo-ai/tambo-cloud/issues/809)) ([2a86401](https://github.com/tambo-ai/tambo-cloud/commit/2a864011bc4e37156cd081d5e01d63b1b0a2aa5a))

## [0.37.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.36.3...repo-v0.37.0) (2025-04-18)


### Features

* landing-demo-with-code ([#805](https://github.com/tambo-ai/tambo-cloud/issues/805)) ([bca7dcd](https://github.com/tambo-ai/tambo-cloud/commit/bca7dcd153d05f8bef8066c96b574d958fe58982))
* update MCP and tools editing to start to account for auth ([#800](https://github.com/tambo-ai/tambo-cloud/issues/800)) ([7cd2f44](https://github.com/tambo-ai/tambo-cloud/commit/7cd2f441c89247e1e08da7e922a4b0298e8408a8))


### Miscellaneous Chores

* bump openai and tokenjs ([#804](https://github.com/tambo-ai/tambo-cloud/issues/804)) ([6b29d72](https://github.com/tambo-ai/tambo-cloud/commit/6b29d7245b4eab70eca2d84216efddd4bb25615e))
* remove old ts-node dep, replace with tsx ([#796](https://github.com/tambo-ai/tambo-cloud/issues/796)) ([e59be39](https://github.com/tambo-ai/tambo-cloud/commit/e59be3947f0106100983523a95b4718b0cdf39b6))


### Code Refactoring

* more cleanup to make testing easier ([#798](https://github.com/tambo-ai/tambo-cloud/issues/798)) ([1a79777](https://github.com/tambo-ai/tambo-cloud/commit/1a79777b395dcaf1e74f2b22ab3d2738242d905e))


### Tests

* more tests for thread stuff ([#799](https://github.com/tambo-ai/tambo-cloud/issues/799)) ([f36fd71](https://github.com/tambo-ai/tambo-cloud/commit/f36fd71f00ca5f18c81e294f9145197004542186))

## [0.36.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.36.2...repo-v0.36.3) (2025-04-16)


### Bug Fixes

* include final tool call in finalResponse after streaming ([#794](https://github.com/tambo-ai/tambo-cloud/issues/794)) ([e339970](https://github.com/tambo-ai/tambo-cloud/commit/e339970f81de1eed51e8e12563732ff4ce489e53))

## [0.36.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.36.1...repo-v0.36.2) (2025-04-16)


### Bug Fixes

* add fallback key to turbo ([#793](https://github.com/tambo-ai/tambo-cloud/issues/793)) ([20e34c8](https://github.com/tambo-ai/tambo-cloud/commit/20e34c8ab8eca90825960fc064e212fa799a0951))
* change fallback to backup ([#792](https://github.com/tambo-ai/tambo-cloud/issues/792)) ([552ab9d](https://github.com/tambo-ai/tambo-cloud/commit/552ab9dc7b420ff25985b70aa40b720617556b9e))
* log resend ([#791](https://github.com/tambo-ai/tambo-cloud/issues/791)) ([94e3479](https://github.com/tambo-ai/tambo-cloud/commit/94e3479eb565cf82d41d8ac999d33a5a2637e251))
* make streaming of mcp responses work ([#786](https://github.com/tambo-ai/tambo-cloud/issues/786)) ([9917b8e](https://github.com/tambo-ai/tambo-cloud/commit/9917b8eeb81f06a0ffd869c9c5fa015c355ead39))
* mcp tool calling should not store nested JSON ([#788](https://github.com/tambo-ai/tambo-cloud/issues/788)) ([f44f732](https://github.com/tambo-ai/tambo-cloud/commit/f44f732537773ce7f551ba95f7d9e83e0b2aba85))
* test env ([#790](https://github.com/tambo-ai/tambo-cloud/issues/790)) ([1c8db50](https://github.com/tambo-ai/tambo-cloud/commit/1c8db50e0fa3b9c51548a191cef51cb94856dcc3))
* use process.env for fallback instead of config ([#789](https://github.com/tambo-ai/tambo-cloud/issues/789)) ([d653294](https://github.com/tambo-ai/tambo-cloud/commit/d653294347cd4e4c5181518c073113db13e4824b))

## [0.36.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.36.0...repo-v0.36.1) (2025-04-15)


### Bug Fixes

* **api:** required isn't valid in this context ([#784](https://github.com/tambo-ai/tambo-cloud/issues/784)) ([95ab2b2](https://github.com/tambo-ai/tambo-cloud/commit/95ab2b2e0a192357f11bdbd6977dd375863be3cd))

## [0.36.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.35.0...repo-v0.36.0) (2025-04-15)


### Features

* hydrate tools server-side ([#757](https://github.com/tambo-ai/tambo-cloud/issues/757)) ([24156ea](https://github.com/tambo-ai/tambo-cloud/commit/24156ea5fc6206fed39f855a493ca8dc476cd751))


### Miscellaneous Chores

* **api:** Fix upload of stainless openjson api ([#782](https://github.com/tambo-ai/tambo-cloud/issues/782)) ([0dcc6b5](https://github.com/tambo-ai/tambo-cloud/commit/0dcc6b5d85d15eb0ab29321da3b505ebea7a825d))

## [0.35.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.34.0...repo-v0.35.0) (2025-04-14)


### Features

* add 50 free msgs per user when the OPENAI API KEY is not set ([#740](https://github.com/tambo-ai/tambo-cloud/issues/740)) ([b7ea13f](https://github.com/tambo-ai/tambo-cloud/commit/b7ea13fca3c17fcf07636b1cdf7aa65f059a69bd))
* add mcp/composio UI to new project page ([#756](https://github.com/tambo-ai/tambo-cloud/issues/756)) ([5b21859](https://github.com/tambo-ai/tambo-cloud/commit/5b218593ff853917ba01704016f057e05436b432))
* add UI for MCP servers, start on composio integration ([#749](https://github.com/tambo-ai/tambo-cloud/issues/749)) ([98dec10](https://github.com/tambo-ai/tambo-cloud/commit/98dec109b92a614039443425a1ab5cc888fe345d))
* **auth:** implement dedicated /login page and protect dashboard routes with auth layout ([#744](https://github.com/tambo-ai/tambo-cloud/issues/744)) ([e7b22a7](https://github.com/tambo-ai/tambo-cloud/commit/e7b22a74673a5d6067bd8ea97505182aea760683))
* **github:** add script to fetch GitHub stargazers and save to JSON/CSV ([#687](https://github.com/tambo-ai/tambo-cloud/issues/687)) ([80bc059](https://github.com/tambo-ai/tambo-cloud/commit/80bc059cc4b6e4fa75c585df96f7607d182bc1c9))
* improve-ui-for-projects ([#751](https://github.com/tambo-ai/tambo-cloud/issues/751)) ([2002b8e](https://github.com/tambo-ai/tambo-cloud/commit/2002b8e78cc75dd28e94479593894eca701a702e))


### Miscellaneous Chores

* **deps-dev:** bump typescript-eslint from 8.29.0 to 8.29.1 in the eslint group ([#772](https://github.com/tambo-ai/tambo-cloud/issues/772)) ([8f0596d](https://github.com/tambo-ai/tambo-cloud/commit/8f0596df14ae34f548fed2b076f0b2f555a3374e))
* **deps:** bump @libretto/openai from 1.3.1 to 1.3.6 ([#778](https://github.com/tambo-ai/tambo-cloud/issues/778)) ([d584ddd](https://github.com/tambo-ai/tambo-cloud/commit/d584ddd0d927941de082d5b31a03ecd1bdecdc7d))
* **deps:** bump @libretto/token.js from 0.3.0 to 0.6.0 ([#776](https://github.com/tambo-ai/tambo-cloud/issues/776)) ([26bb2b8](https://github.com/tambo-ai/tambo-cloud/commit/26bb2b84024a6d52ebf9e7892dc575787482756f))
* **deps:** bump @tanstack/react-query from 5.71.10 to 5.74.0 ([#774](https://github.com/tambo-ai/tambo-cloud/issues/774)) ([090ac62](https://github.com/tambo-ai/tambo-cloud/commit/090ac624612998b73402f9c1e04c0e2ef176cdd6))
* **deps:** bump framer-motion from 12.6.3 to 12.6.5 ([#775](https://github.com/tambo-ai/tambo-cloud/issues/775)) ([e66e9a0](https://github.com/tambo-ai/tambo-cloud/commit/e66e9a0c623d138d55081697f5fa04985aa8e86e))
* **deps:** bump openai from 4.91.1 to 4.93.0 ([#777](https://github.com/tambo-ai/tambo-cloud/issues/777)) ([d21569b](https://github.com/tambo-ai/tambo-cloud/commit/d21569bea9681bd7b03440ccfec2c9d6cf88aab1))
* **deps:** bump the nestjs group with 6 updates ([#770](https://github.com/tambo-ai/tambo-cloud/issues/770)) ([b4a786b](https://github.com/tambo-ai/tambo-cloud/commit/b4a786b383e863fcd94169623b5b7394d52796d0))
* **deps:** bump the radix-ui group with 14 updates ([#771](https://github.com/tambo-ai/tambo-cloud/issues/771)) ([1d30a47](https://github.com/tambo-ai/tambo-cloud/commit/1d30a473d10b7a07c919e75fe49f8669be867199))
* **deps:** bump the trpc group with 3 updates ([#769](https://github.com/tambo-ai/tambo-cloud/issues/769)) ([8f9b966](https://github.com/tambo-ai/tambo-cloud/commit/8f9b96622b8b78cfee2958e07cb28bc66abf46b6))
* thread service refactor ([#781](https://github.com/tambo-ai/tambo-cloud/issues/781)) ([96c6d28](https://github.com/tambo-ai/tambo-cloud/commit/96c6d2805020554a9b62b30dc3e5249b39534020))


### Continuous Integration

* make migrations run after "Build" step is done ([#780](https://github.com/tambo-ai/tambo-cloud/issues/780)) ([d5581d2](https://github.com/tambo-ai/tambo-cloud/commit/d5581d23e9c057a84ed9a463a36cbc5042c0f1d9))

## [0.34.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.33.2...repo-v0.34.0) (2025-04-10)


### Features

* add db schema for tool providers ([#737](https://github.com/tambo-ai/tambo-cloud/issues/737)) ([dfce287](https://github.com/tambo-ai/tambo-cloud/commit/dfce287eba42d9472375cadf009028db05027b9d))
* add OpenAI API Key Link in Project Creation Flow ([#685](https://github.com/tambo-ai/tambo-cloud/issues/685)) ([e561143](https://github.com/tambo-ai/tambo-cloud/commit/e561143c793fef6ba45bd84532af14fda21914bb))
* **dashboard:** improved ui ([#741](https://github.com/tambo-ai/tambo-cloud/issues/741)) ([72e5b20](https://github.com/tambo-ai/tambo-cloud/commit/72e5b2000eb2b66106320782912644f86d2c78aa))


### Bug Fixes

* add mcp/composio flags for projects ([#746](https://github.com/tambo-ai/tambo-cloud/issues/746)) ([1612fac](https://github.com/tambo-ai/tambo-cloud/commit/1612facd38c3694df59fc10be792234c9487341f))
* charlie calling the wrong check-types ([#745](https://github.com/tambo-ai/tambo-cloud/issues/745)) ([35a7ed0](https://github.com/tambo-ai/tambo-cloud/commit/35a7ed0d01789338efb014e694a826d0dbd74b42))


### Documentation

* update README with project renaming and comprehensive improvements ([#658](https://github.com/tambo-ai/tambo-cloud/issues/658)) ([fe80774](https://github.com/tambo-ai/tambo-cloud/commit/fe80774fda54a634aed6563a1b63a371b62c37ef))


### Miscellaneous Chores

* replace 'hydra' References with 'tambo' in apps/web Directory ([#686](https://github.com/tambo-ai/tambo-cloud/issues/686)) ([9a34f6e](https://github.com/tambo-ai/tambo-cloud/commit/9a34f6ec744e9b3301b2218370858299ae6bc2ca))
* update API Documentation with Signup Link and Init Command ([#684](https://github.com/tambo-ai/tambo-cloud/issues/684)) ([6f90b78](https://github.com/tambo-ai/tambo-cloud/commit/6f90b789b90ea4d3f560ec5e32a76fd9575df957))


### Code Refactoring

* **auth:** fixed auth flash and imrpved styles ([#742](https://github.com/tambo-ai/tambo-cloud/issues/742)) ([874c56b](https://github.com/tambo-ai/tambo-cloud/commit/874c56be1fdf113848457af2333282617219a918))
* **ci:** split GitHub Actions into Parallel Workflows for Build, Test, and Lint ([#748](https://github.com/tambo-ai/tambo-cloud/issues/748)) ([8d636ba](https://github.com/tambo-ai/tambo-cloud/commit/8d636baef042e88da93c6bf47798a1fd793cc6f0))

## [0.33.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.33.1...repo-v0.33.2) (2025-04-08)


### Bug Fixes

* add env config for google + github auth ([#734](https://github.com/tambo-ai/tambo-cloud/issues/734)) ([2f713ee](https://github.com/tambo-ai/tambo-cloud/commit/2f713ee3fb21ff978990c0cabdd2b342e5a3b255))
* remove tx middleware completely ([#736](https://github.com/tambo-ai/tambo-cloud/issues/736)) ([b4917ef](https://github.com/tambo-ai/tambo-cloud/commit/b4917ef435ce639866294e3e8fee6e74a5e1be1c))

## [0.33.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.33.0...repo-v0.33.1) (2025-04-08)


### Bug Fixes

* catch errors in threads list for project route ([#731](https://github.com/tambo-ai/tambo-cloud/issues/731)) ([75fe286](https://github.com/tambo-ai/tambo-cloud/commit/75fe286f16d54f62486d83bea38da0645f43cf59))


### Miscellaneous Chores

* small change to rerun release-please checks ([#733](https://github.com/tambo-ai/tambo-cloud/issues/733)) ([375a057](https://github.com/tambo-ai/tambo-cloud/commit/375a0575104c8a4bce1c3c59b132b77ed83bae03))

## [0.33.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.10...repo-v0.33.0) (2025-04-07)


### Features

* add basic health check ([#728](https://github.com/tambo-ai/tambo-cloud/issues/728)) ([5639550](https://github.com/tambo-ai/tambo-cloud/commit/5639550eb37f3165e53cd26d2430c8be01d7cf24))

## [0.32.10](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.9...repo-v0.32.10) (2025-04-07)


### Bug Fixes

* a couple docs typos ([#727](https://github.com/tambo-ai/tambo-cloud/issues/727)) ([9ded16b](https://github.com/tambo-ai/tambo-cloud/commit/9ded16b5c7e9ea56aaffa6af3c5f43b18a3029b7))
* bump @tambo-ai/react to 0.20.1 ([#725](https://github.com/tambo-ai/tambo-cloud/issues/725)) ([eaefa40](https://github.com/tambo-ai/tambo-cloud/commit/eaefa403b520fd6c780a31460d3e04cf49e6fa7a))
* Don't show full decision JSON in noComponentCase response ([#726](https://github.com/tambo-ai/tambo-cloud/issues/726)) ([9c35ff8](https://github.com/tambo-ai/tambo-cloud/commit/9c35ff838c68065dc9f2ea1963615c27a4ba4e29))


### Documentation

* show jsonschema example in registration docs ([#693](https://github.com/tambo-ai/tambo-cloud/issues/693)) ([61a92cd](https://github.com/tambo-ai/tambo-cloud/commit/61a92cdaac7baea16bd068794428347607c15c4c))


### Miscellaneous Chores

* **charlie:** wrong command checking types ([#706](https://github.com/tambo-ai/tambo-cloud/issues/706)) ([694e85b](https://github.com/tambo-ai/tambo-cloud/commit/694e85b7c083438d0a0daa1272083867d604da61))
* **deps-dev:** bump @types/node from 20.17.25 to 20.17.30 ([#721](https://github.com/tambo-ai/tambo-cloud/issues/721)) ([f74a3b5](https://github.com/tambo-ai/tambo-cloud/commit/f74a3b55924a5048897be02709b768c85cef722c))
* **deps-dev:** bump @types/supertest from 6.0.2 to 6.0.3 ([#699](https://github.com/tambo-ai/tambo-cloud/issues/699)) ([b0fede0](https://github.com/tambo-ai/tambo-cloud/commit/b0fede03d99482d33dca14530e76b0fdf858678a))
* **deps-dev:** bump the eslint group with 5 updates ([#696](https://github.com/tambo-ai/tambo-cloud/issues/696)) ([5f1e3dd](https://github.com/tambo-ai/tambo-cloud/commit/5f1e3dd1441232cb0b212d780f5ca69841f22028))
* **deps-dev:** bump turbo from 2.4.4 to 2.5.0 ([#710](https://github.com/tambo-ai/tambo-cloud/issues/710)) ([5ef78d2](https://github.com/tambo-ai/tambo-cloud/commit/5ef78d2a56dc7e4572a5026b1d598dc9d6274809))
* **deps-dev:** bump typescript from 5.8.2 to 5.8.3 ([#711](https://github.com/tambo-ai/tambo-cloud/issues/711)) ([95532bf](https://github.com/tambo-ai/tambo-cloud/commit/95532bfad22357927db1add8a76720cc4dfb6dea))
* **deps:** bump @hookform/resolvers from 4.1.2 to 5.0.1 ([#708](https://github.com/tambo-ai/tambo-cloud/issues/708)) ([2d423ef](https://github.com/tambo-ai/tambo-cloud/commit/2d423ef91aa00265f3a8e57674509fcd44e1e661))
* **deps:** bump @splinetool/runtime from 1.9.80 to 1.9.82 ([#712](https://github.com/tambo-ai/tambo-cloud/issues/712)) ([55776a8](https://github.com/tambo-ai/tambo-cloud/commit/55776a8ac55a578174f8db93a96bef208085931d))
* **deps:** bump @tanstack/react-query from 5.69.0 to 5.71.10 ([#703](https://github.com/tambo-ai/tambo-cloud/issues/703)) ([2633d45](https://github.com/tambo-ai/tambo-cloud/commit/2633d4570ddb30342613df3e126cdd06c036c808))
* **deps:** bump @vercel/og from 0.6.5 to 0.6.8 ([#704](https://github.com/tambo-ai/tambo-cloud/issues/704)) ([58de293](https://github.com/tambo-ai/tambo-cloud/commit/58de293803fe75594056085c57300f4fc2da80c1))
* **deps:** bump embla-carousel-react from 8.5.2 to 8.6.0 ([#720](https://github.com/tambo-ai/tambo-cloud/issues/720)) ([ed3b1ce](https://github.com/tambo-ai/tambo-cloud/commit/ed3b1ce06dc428ccf173914ebedce2576cd06655))
* **deps:** bump framer-motion from 12.4.7 to 12.6.3 ([#717](https://github.com/tambo-ai/tambo-cloud/issues/717)) ([0bd0873](https://github.com/tambo-ai/tambo-cloud/commit/0bd0873261c4b625d94982f3501aa71797f94d58))
* **deps:** bump lucide-react from 0.483.0 to 0.487.0 ([#713](https://github.com/tambo-ai/tambo-cloud/issues/713)) ([a5b7943](https://github.com/tambo-ai/tambo-cloud/commit/a5b794343ca34d887bde978bc87db3eae1e03b73))
* **deps:** bump luxon and @types/luxon ([#718](https://github.com/tambo-ai/tambo-cloud/issues/718)) ([2e5394c](https://github.com/tambo-ai/tambo-cloud/commit/2e5394c4c8aba19766ec55631034a41dfe034857))
* **deps:** bump next from 15.2.3 to 15.2.4 ([#719](https://github.com/tambo-ai/tambo-cloud/issues/719)) ([99d9abb](https://github.com/tambo-ai/tambo-cloud/commit/99d9abb8a1764d015654d8ac2870e76b2c3bb2c8))
* **deps:** bump openai from 4.89.0 to 4.91.1 ([#702](https://github.com/tambo-ai/tambo-cloud/issues/702)) ([cc925c7](https://github.com/tambo-ai/tambo-cloud/commit/cc925c7ae0dcdcc0eafe7f3cae624e1abaf1a9d3))
* **deps:** bump posthog-js from 1.232.7 to 1.234.9 ([#700](https://github.com/tambo-ai/tambo-cloud/issues/700)) ([ed17ffe](https://github.com/tambo-ai/tambo-cloud/commit/ed17ffed0f9754cef77507d4e2085e2d50cd22b5))
* **deps:** bump remark-rehype from 11.1.1 to 11.1.2 ([#709](https://github.com/tambo-ai/tambo-cloud/issues/709)) ([ed2a13c](https://github.com/tambo-ai/tambo-cloud/commit/ed2a13ccce588b33c9f95cb1f4f0d44615049b2d))
* **deps:** bump resend from 4.1.2 to 4.2.0 ([#716](https://github.com/tambo-ai/tambo-cloud/issues/716)) ([fdd14d1](https://github.com/tambo-ai/tambo-cloud/commit/fdd14d1f4397687d04f6752c4d9ea5dc23e30623))
* **deps:** bump the nestjs group with 7 updates ([#695](https://github.com/tambo-ai/tambo-cloud/issues/695)) ([b6b8498](https://github.com/tambo-ai/tambo-cloud/commit/b6b84982fd3b4cce7587eac5725dca8431cc4c5b))
* **deps:** bump the trpc group with 3 updates ([#694](https://github.com/tambo-ai/tambo-cloud/issues/694)) ([6315199](https://github.com/tambo-ai/tambo-cloud/commit/63151998ba10608f5180a367a2be5fca822db419))


### Continuous Integration

* make sure we actually build as a part of our CI checks ([#691](https://github.com/tambo-ai/tambo-cloud/issues/691)) ([f582005](https://github.com/tambo-ai/tambo-cloud/commit/f5820053884709560e684c9029dfdab2b7624010))

## [0.32.9](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.8...repo-v0.32.9) (2025-04-04)


### Bug Fixes

* explicitly bring in ajv for json ([#689](https://github.com/tambo-ai/tambo-cloud/issues/689)) ([a142b87](https://github.com/tambo-ai/tambo-cloud/commit/a142b8763aafaf28cca89637bba4661e32760b0a))

## [0.32.8](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.7...repo-v0.32.8) (2025-04-04)


### Bug Fixes

* remove componentstate PUT route from tx ([#688](https://github.com/tambo-ai/tambo-cloud/issues/688)) ([565b1ec](https://github.com/tambo-ai/tambo-cloud/commit/565b1ec36c0b070076a90e46857d515e0df441af))


### Code Refactoring

* clean up backend library ([#678](https://github.com/tambo-ai/tambo-cloud/issues/678)) ([6f0ac48](https://github.com/tambo-ai/tambo-cloud/commit/6f0ac48a2ae6f5c5d35cb3fe708323b832961d06))
* remove intermediate aiservice, it was just a pass-through ([#682](https://github.com/tambo-ai/tambo-cloud/issues/682)) ([7110fbb](https://github.com/tambo-ai/tambo-cloud/commit/7110fbb609d162924fd4f6f61f27ba80e20ba00a))
* rename hydra-ai-server -&gt; backend ([#677](https://github.com/tambo-ai/tambo-cloud/issues/677)) ([754dddd](https://github.com/tambo-ai/tambo-cloud/commit/754dddd90a0e8ebbda122e0cb793e80405c0915f))


### Tests

* **backend:** add backend tests for thread conversion ([#679](https://github.com/tambo-ai/tambo-cloud/issues/679)) ([a4d4390](https://github.com/tambo-ai/tambo-cloud/commit/a4d439083f64301c599bab5e0e657e6c05796411))
* Fix tests, make them run in CI ([#675](https://github.com/tambo-ai/tambo-cloud/issues/675)) ([b90505e](https://github.com/tambo-ai/tambo-cloud/commit/b90505ee844321fda1026e98cb7788aeaf147fe3))

## [0.32.7](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.6...repo-v0.32.7) (2025-04-04)


### Bug Fixes

* **prompts:** Better formatting for components, props, etc ([#672](https://github.com/tambo-ai/tambo-cloud/issues/672)) ([464df14](https://github.com/tambo-ai/tambo-cloud/commit/464df14f9bb097ab003cb0322238ae18a714bf9f))


### Documentation

* a few more instructions ([#668](https://github.com/tambo-ai/tambo-cloud/issues/668)) ([210600e](https://github.com/tambo-ai/tambo-cloud/commit/210600ea252d03fb83d87e064fd538ca17114768))
* add charlie instructions ([#666](https://github.com/tambo-ai/tambo-cloud/issues/666)) ([be869e4](https://github.com/tambo-ai/tambo-cloud/commit/be869e43b32084b7e4581321cebc9b4ceceedb14))


### Miscellaneous Chores

* Update Command References on Landing Page and Quickstart Guide ([#674](https://github.com/tambo-ai/tambo-cloud/issues/674)) ([33477d5](https://github.com/tambo-ai/tambo-cloud/commit/33477d5107f86d82166e05bae22ee1e2a12f687c))
* update installation commands in quickstart guide and on landing page ([#669](https://github.com/tambo-ai/tambo-cloud/issues/669)) ([a2d3d0c](https://github.com/tambo-ai/tambo-cloud/commit/a2d3d0c294d0a84b42baae6f8aa97a573d167a56))


### Code Refactoring

* **prompts:** clean up and organize prompt generation code ([#670](https://github.com/tambo-ai/tambo-cloud/issues/670)) ([78a566c](https://github.com/tambo-ai/tambo-cloud/commit/78a566c5a1cc4d2a2a0b07d661487d9068519627))
* remove intermediate OpenAIResponse type and use more native types ([#671](https://github.com/tambo-ai/tambo-cloud/issues/671)) ([41ed657](https://github.com/tambo-ai/tambo-cloud/commit/41ed657e807520caf6d40a06b400c1cf697b3605))

## [0.32.6](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.5...repo-v0.32.6) (2025-04-02)


### Bug Fixes

* **cli:** enhance API key management and validation in project dialogs ([#664](https://github.com/tambo-ai/tambo-cloud/issues/664)) ([b403c2a](https://github.com/tambo-ai/tambo-cloud/commit/b403c2a2f52cdc1d83e60bc19f5770c95769c0b2))

## [0.32.5](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.4...repo-v0.32.5) (2025-04-02)


### Documentation

* update docs to include info about "use client" ([#661](https://github.com/tambo-ai/tambo-cloud/issues/661)) ([9150bbe](https://github.com/tambo-ai/tambo-cloud/commit/9150bbed3c1fc79e9559c9a09bcecca3552c1189))


### Miscellaneous Chores

* update site configuration and image components for enhanced branding and messaging ([#663](https://github.com/tambo-ai/tambo-cloud/issues/663)) ([5e10ac4](https://github.com/tambo-ai/tambo-cloud/commit/5e10ac49ca7f33d44db8af298c099131b69adf31))

## [0.32.4](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.3...repo-v0.32.4) (2025-04-01)


### Bug Fixes

* broken link in docs ([#651](https://github.com/tambo-ai/tambo-cloud/issues/651)) ([4a60ac9](https://github.com/tambo-ai/tambo-cloud/commit/4a60ac99a0e66e0a901254fea932045fee9e6b1c))


### Miscellaneous Chores

* add better CTA on landing page and setup instructions to docs ([#655](https://github.com/tambo-ai/tambo-cloud/issues/655)) ([7f1a663](https://github.com/tambo-ai/tambo-cloud/commit/7f1a663e17e4dbecad8aabbf753d0271181f20fd))
* **deps-dev:** bump @next/eslint-plugin-next from 15.2.3 to 15.2.4 ([#645](https://github.com/tambo-ai/tambo-cloud/issues/645)) ([3b29f0d](https://github.com/tambo-ai/tambo-cloud/commit/3b29f0d7eb70d2987044e94c09e72d63cca64948))
* **deps-dev:** bump drizzle-kit from 0.30.5 to 0.30.6 in the drizzle group ([#642](https://github.com/tambo-ai/tambo-cloud/issues/642)) ([607b7f9](https://github.com/tambo-ai/tambo-cloud/commit/607b7f9ce897c18de036bb23e4ba1f6cebda0bd6))
* **deps-dev:** bump ts-jest from 29.2.6 to 29.3.0 ([#647](https://github.com/tambo-ai/tambo-cloud/issues/647)) ([90c783f](https://github.com/tambo-ai/tambo-cloud/commit/90c783f129875a1c1b359204d2aad47e741b49ec))
* **deps-dev:** bump typescript-eslint from 8.27.0 to 8.28.0 in the eslint group ([#643](https://github.com/tambo-ai/tambo-cloud/issues/643)) ([d196f1d](https://github.com/tambo-ai/tambo-cloud/commit/d196f1d36b51840af0cfce0b37fcdcd1842f6f43))
* **deps:** bump react-hook-form from 7.54.2 to 7.55.0 ([#646](https://github.com/tambo-ai/tambo-cloud/issues/646)) ([9de388d](https://github.com/tambo-ai/tambo-cloud/commit/9de388d99a9eaf6f7473e2f0301842848824a5bd))
* **deps:** bump the nestjs group with 2 updates ([#641](https://github.com/tambo-ai/tambo-cloud/issues/641)) ([37daa9c](https://github.com/tambo-ai/tambo-cloud/commit/37daa9c73b2ac5974c99a80d1674709385a523b9))
* **deps:** bump the trpc group with 3 updates ([#640](https://github.com/tambo-ai/tambo-cloud/issues/640)) ([f043118](https://github.com/tambo-ai/tambo-cloud/commit/f043118cdcb5c2fc2104732329effefd1dc4903b))
* implement same login options for both cli and web ([#653](https://github.com/tambo-ai/tambo-cloud/issues/653)) ([d16a7ad](https://github.com/tambo-ai/tambo-cloud/commit/d16a7adb9fffe3753aceeb98dd9a7528f7ca11c4))
* remove email login from cli ([#654](https://github.com/tambo-ai/tambo-cloud/issues/654)) ([51cf208](https://github.com/tambo-ai/tambo-cloud/commit/51cf208d40cf76f6322c73e267ab5842d45181fe))

## [0.32.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.2...repo-v0.32.3) (2025-03-31)


### Bug Fixes

* improve error handling and validation response in send-founder-email API ([#650](https://github.com/tambo-ai/tambo-cloud/issues/650)) ([2d2213b](https://github.com/tambo-ai/tambo-cloud/commit/2d2213b7fb6f4e0a3879f2b12f09f3a1c6174cfc))


### Miscellaneous Chores

* implement same login options for both cli and web ([#648](https://github.com/tambo-ai/tambo-cloud/issues/648)) ([be05961](https://github.com/tambo-ai/tambo-cloud/commit/be05961dc3c27e30c659f9e675dbe32980c82367))

## [0.32.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.1...repo-v0.32.2) (2025-03-28)


### Miscellaneous Chores

* **deps:** bump @tambo-ai/react to get better debouncing ([#637](https://github.com/tambo-ai/tambo-cloud/issues/637)) ([f26eb82](https://github.com/tambo-ai/tambo-cloud/commit/f26eb821b0f8b724fdadcead0f6a2e3d16c3880c))

## [0.32.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.32.0...repo-v0.32.1) (2025-03-28)


### Code Refactoring

* remove email validation logic from POST request in contacts API ([#635](https://github.com/tambo-ai/tambo-cloud/issues/635)) ([1e7c804](https://github.com/tambo-ai/tambo-cloud/commit/1e7c804cdc8ae1a12de13478114eced85bae6c48))

## [0.32.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.31.0...repo-v0.32.0) (2025-03-28)


### Features

* add welcome dialog and initial message handling ([#633](https://github.com/tambo-ai/tambo-cloud/issues/633)) ([7127296](https://github.com/tambo-ai/tambo-cloud/commit/712729642765f38a4edd963f181bec95d8053ac4))

## [0.31.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.30.1...repo-v0.31.0) (2025-03-27)


### Features

* check if emails are valid :) ([#626](https://github.com/tambo-ai/tambo-cloud/issues/626)) ([beaeb4c](https://github.com/tambo-ai/tambo-cloud/commit/beaeb4c709771ac62bf9c8665a53cc22118ab4b6))
* rename state -&gt; componentState in the API for consistency across the stack ([#632](https://github.com/tambo-ai/tambo-cloud/issues/632)) ([45cebe1](https://github.com/tambo-ai/tambo-cloud/commit/45cebe11b30b93d3c96048d485abdfe5c45e0516))


### Bug Fixes

* change state name + location in response hoping not to confuse the json response from the llm ([#631](https://github.com/tambo-ai/tambo-cloud/issues/631)) ([0eb2e47](https://github.com/tambo-ai/tambo-cloud/commit/0eb2e477d145207329ef9524c00ff8da0670ce69))
* Properly "merge" serialized state in component state updates ([#628](https://github.com/tambo-ai/tambo-cloud/issues/628)) ([9be10d8](https://github.com/tambo-ai/tambo-cloud/commit/9be10d8f57b50f27194270e8a96a2f3619d438c9))
* smoketest cleanup to persist "imperial" state ([#625](https://github.com/tambo-ai/tambo-cloud/issues/625)) ([98081ec](https://github.com/tambo-ai/tambo-cloud/commit/98081ec2a94ee2031f1b42679b399cbf0bfd5ae6))
* **smoketest:** split forecast and current weather to save tokens ([#630](https://github.com/tambo-ai/tambo-cloud/issues/630)) ([e28b55c](https://github.com/tambo-ai/tambo-cloud/commit/e28b55c0c655bff53677bd26ee6213aabde6fbef))


### Code Refactoring

* replace with message arch so it's simpler ([#629](https://github.com/tambo-ai/tambo-cloud/issues/629)) ([9525380](https://github.com/tambo-ai/tambo-cloud/commit/9525380e1d2cbdcaaea4c6534f1a047a3f65351e))

## [0.30.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.30.0...repo-v0.30.1) (2025-03-27)


### Miscellaneous Chores

* **deps:** update @tambo-ai/react to version 0.19.2 to fix useStreamingProps in demo ([#623](https://github.com/tambo-ai/tambo-cloud/issues/623)) ([11be11e](https://github.com/tambo-ai/tambo-cloud/commit/11be11e47ee783f3f438c60fb236bf134047d4b1))

## [0.30.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.29.0...repo-v0.30.0) (2025-03-26)


### Features

* add additionalContext to input types ([#621](https://github.com/tambo-ai/tambo-cloud/issues/621)) ([d706b4f](https://github.com/tambo-ai/tambo-cloud/commit/d706b4f6629a8463e68b682f0123ea4fc78c0fe5))

## [0.29.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.28.0...repo-v0.29.0) (2025-03-26)


### Features

* remove non-functional endpoints requiring request.userId ([#619](https://github.com/tambo-ai/tambo-cloud/issues/619)) ([69e7881](https://github.com/tambo-ai/tambo-cloud/commit/69e788105823f5db988b46c1e48375439887554b))

## [0.28.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.27.3...repo-v0.28.0) (2025-03-26)


### Features

* protect thread endpoints with thread-in-project guard (take 2) ([#616](https://github.com/tambo-ai/tambo-cloud/issues/616)) ([4d25335](https://github.com/tambo-ai/tambo-cloud/commit/4d25335f4d27ab35428435c0ead169ea2cfe90a5))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/react from 0.18.2 to 0.19.0 ([#618](https://github.com/tambo-ai/tambo-cloud/issues/618)) ([6fe5c19](https://github.com/tambo-ai/tambo-cloud/commit/6fe5c19266588024b58b9cafd871da624cd45dc1))

## [0.27.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.27.2...repo-v0.27.3) (2025-03-26)


### Bug Fixes

* stop injecting the transaction middleware altogether for now ([#613](https://github.com/tambo-ai/tambo-cloud/issues/613)) ([65c90ca](https://github.com/tambo-ai/tambo-cloud/commit/65c90caf799a2c2fe278e582c10e0a8f0b56b175))


### Miscellaneous Chores

* bump tambo/react ([#615](https://github.com/tambo-ai/tambo-cloud/issues/615)) ([987badc](https://github.com/tambo-ai/tambo-cloud/commit/987badcd4ebde9384004d51ad7fd6f4a3825eb30))

## [0.27.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.27.1...repo-v0.27.2) (2025-03-26)


### Bug Fixes

* add a generous 10s connection timeout to try to diagnose railway issues ([#611](https://github.com/tambo-ai/tambo-cloud/issues/611)) ([c67024d](https://github.com/tambo-ai/tambo-cloud/commit/c67024db17ef79e79dba849b7c1675f79595be1c))

## [0.27.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.27.0...repo-v0.27.1) (2025-03-26)


### Bug Fixes

* update ref handling in MessageInput component to improve focus behavior ([#608](https://github.com/tambo-ai/tambo-cloud/issues/608)) ([cf1b226](https://github.com/tambo-ai/tambo-cloud/commit/cf1b226359c08365d3f54c7b57f210135cbaeaa1))


### Reverts

* "feat: protect thread endpoints with thread-in-project guard" ([#610](https://github.com/tambo-ai/tambo-cloud/issues/610)) ([abc26dd](https://github.com/tambo-ai/tambo-cloud/commit/abc26dd9d5a36208fb29bbd13afaf83f0552efe4))

## [0.27.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.26.2...repo-v0.27.0) (2025-03-25)


### Features

* protect thread endpoints with thread-in-project guard ([#601](https://github.com/tambo-ai/tambo-cloud/issues/601)) ([b344d3e](https://github.com/tambo-ai/tambo-cloud/commit/b344d3eceeac373696d052e0375714ac91033b7e))
* start plumbing state through message history/etc ([#606](https://github.com/tambo-ai/tambo-cloud/issues/606)) ([0c7a5cb](https://github.com/tambo-ai/tambo-cloud/commit/0c7a5cbf6b5caa3ad585c2421a00457574480b70))

## [0.26.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.26.1...repo-v0.26.2) (2025-03-25)


### Bug Fixes

* store basic message in the db, but reconstitute the message history based on component history/etc ([#604](https://github.com/tambo-ai/tambo-cloud/issues/604)) ([494e2a2](https://github.com/tambo-ai/tambo-cloud/commit/494e2a232fb9ff2f66a93c5f20f2875cb21a3ef4))


### Miscellaneous Chores

* clean up landing page ([#603](https://github.com/tambo-ai/tambo-cloud/issues/603)) ([2f8db63](https://github.com/tambo-ai/tambo-cloud/commit/2f8db63d1789d9a42620dd7241a78de28f9a88bb))

## [0.26.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.26.0...repo-v0.26.1) (2025-03-25)


### Bug Fixes

* exclude suggestions from long transactions ([#599](https://github.com/tambo-ai/tambo-cloud/issues/599)) ([3383fca](https://github.com/tambo-ai/tambo-cloud/commit/3383fca52051484f65d2c2a7c8f58732f6c41fe3))

## [0.26.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.11...repo-v0.26.0) (2025-03-25)


### Features

* update the landing page to use components ([#597](https://github.com/tambo-ai/tambo-cloud/issues/597)) ([be8bbf6](https://github.com/tambo-ai/tambo-cloud/commit/be8bbf68242e96b8a0173443e33186aa0a33a211))


### Bug Fixes

* "hydra" -&gt; "assistant" in operations ([#591](https://github.com/tambo-ai/tambo-cloud/issues/591)) ([68fff0c](https://github.com/tambo-ai/tambo-cloud/commit/68fff0caf3822c001ce09b950aa043d34289f0f0))
* enforce specific components, treat hallucinated components as not choosing a component ([#595](https://github.com/tambo-ai/tambo-cloud/issues/595)) ([835e320](https://github.com/tambo-ai/tambo-cloud/commit/835e320b56a033aff09b864985a52a3381a05183))
* fake component decision as a tool call ([#594](https://github.com/tambo-ai/tambo-cloud/issues/594)) ([87e871d](https://github.com/tambo-ai/tambo-cloud/commit/87e871df78b4801ad32f27142c6ff43544ef8c24))
* include full component decision in chat history when sending to llm ([#596](https://github.com/tambo-ai/tambo-cloud/issues/596)) ([e16b31d](https://github.com/tambo-ai/tambo-cloud/commit/e16b31d12d5d768940debb2d19e530037e750bb8))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/react and a few other packages ([#598](https://github.com/tambo-ai/tambo-cloud/issues/598)) ([0d75363](https://github.com/tambo-ai/tambo-cloud/commit/0d7536363f712f58fe192c3556269a8c35a420f2))
* update demo & docs to 0.18.0 ([#571](https://github.com/tambo-ai/tambo-cloud/issues/571)) ([8515cb5](https://github.com/tambo-ai/tambo-cloud/commit/8515cb5774499f43864319c50d5ebe8d1eec367f))


### Code Refactoring

* rename Hydra API keys to Tambo API keys in configuration and code references ([#592](https://github.com/tambo-ai/tambo-cloud/issues/592)) ([72d03b1](https://github.com/tambo-ai/tambo-cloud/commit/72d03b12000d25076193913765ce38c3fc5e6452))

## [0.25.11](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.10...repo-v0.25.11) (2025-03-24)


### Documentation

* add imports ([#569](https://github.com/tambo-ai/tambo-cloud/issues/569)) ([10c0f51](https://github.com/tambo-ai/tambo-cloud/commit/10c0f51ee488ae41edf521881b20c92a1d27822c))


### Miscellaneous Chores

* **deps-dev:** bump @next/eslint-plugin-next from 15.1.7 to 15.2.3 ([#581](https://github.com/tambo-ai/tambo-cloud/issues/581)) ([9e43720](https://github.com/tambo-ai/tambo-cloud/commit/9e437203307080c8040eb9ca9f2c296581dbe2a0))
* **deps-dev:** bump @types/node from 20.17.24 to 20.17.25 ([#578](https://github.com/tambo-ai/tambo-cloud/issues/578)) ([1fdb3d7](https://github.com/tambo-ai/tambo-cloud/commit/1fdb3d7f9fcc1d91da3cc128ef04e444559dd628))
* **deps-dev:** bump lint-staged from 15.4.3 to 15.5.0 ([#584](https://github.com/tambo-ai/tambo-cloud/issues/584)) ([1eeebd6](https://github.com/tambo-ai/tambo-cloud/commit/1eeebd6da7406b764a5e912bbe02d8d7de4785ba))
* **deps-dev:** bump supertest from 7.0.0 to 7.1.0 ([#585](https://github.com/tambo-ai/tambo-cloud/issues/585)) ([61524ae](https://github.com/tambo-ai/tambo-cloud/commit/61524aeb9fdbeb63132bda638dda280da60d300d))
* **deps-dev:** bump the eslint group with 3 updates ([#575](https://github.com/tambo-ai/tambo-cloud/issues/575)) ([efb138a](https://github.com/tambo-ai/tambo-cloud/commit/efb138a8b1941acf149ae80caaa0cc45d4253d2f))
* **deps:** bump @splinetool/runtime from 1.9.72 to 1.9.80 ([#583](https://github.com/tambo-ai/tambo-cloud/issues/583)) ([1fd9bd1](https://github.com/tambo-ai/tambo-cloud/commit/1fd9bd19ffc037006f096d57f9aa2842881909a4))
* **deps:** bump @supabase/supabase-js from 2.49.1 to 2.49.2 ([#587](https://github.com/tambo-ai/tambo-cloud/issues/587)) ([4a03e1d](https://github.com/tambo-ai/tambo-cloud/commit/4a03e1d994ff2e887be8907161434d9afb4d4714))
* **deps:** bump @tanstack/react-query from 5.68.0 to 5.69.0 ([#589](https://github.com/tambo-ai/tambo-cloud/issues/589)) ([5689fe7](https://github.com/tambo-ai/tambo-cloud/commit/5689fe799e55008f7d430d55449c6d64e5318ce3))
* **deps:** bump @theguild/remark-mermaid from 0.2.0 to 0.3.0 ([#588](https://github.com/tambo-ai/tambo-cloud/issues/588)) ([b62da05](https://github.com/tambo-ai/tambo-cloud/commit/b62da053ddb9fa26e1be11786865155684a48e0d))
* **deps:** bump drizzle-orm from 0.40.0 to 0.41.0 in the drizzle group ([#574](https://github.com/tambo-ai/tambo-cloud/issues/574)) ([d2603d4](https://github.com/tambo-ai/tambo-cloud/commit/d2603d4c6ef25726b7553821becbaa026d78e5ff))
* **deps:** bump lucide-react from 0.477.0 to 0.483.0 ([#579](https://github.com/tambo-ai/tambo-cloud/issues/579)) ([7c48700](https://github.com/tambo-ai/tambo-cloud/commit/7c48700cfe5b8daae1280dbf6e9408d2752cc1f9))
* **deps:** bump next from 15.2.1 to 15.2.3 ([#582](https://github.com/tambo-ai/tambo-cloud/issues/582)) ([e99a03d](https://github.com/tambo-ai/tambo-cloud/commit/e99a03d122c02d6463023fcfc5d8e2100627961c))
* **deps:** bump openai from 4.86.2 to 4.89.0 ([#577](https://github.com/tambo-ai/tambo-cloud/issues/577)) ([39bd3f9](https://github.com/tambo-ai/tambo-cloud/commit/39bd3f9e3c4699f27360c1062420a299369e62f3))
* **deps:** bump pg from 8.14.0 to 8.14.1 ([#586](https://github.com/tambo-ai/tambo-cloud/issues/586)) ([bd1eb84](https://github.com/tambo-ai/tambo-cloud/commit/bd1eb8437c8b1b5d74e6198afcac43be73ad8039))
* **deps:** bump the nestjs group with 5 updates ([#573](https://github.com/tambo-ai/tambo-cloud/issues/573)) ([970531a](https://github.com/tambo-ai/tambo-cloud/commit/970531aa7b292277ad054a3f9ae54553b6473fcb))
* **deps:** bump the trpc group with 3 updates ([#572](https://github.com/tambo-ai/tambo-cloud/issues/572)) ([3099500](https://github.com/tambo-ai/tambo-cloud/commit/309950021d23fa33014d8d29a4954bc72daaa50f))
* remove per-project prettier config ([#590](https://github.com/tambo-ai/tambo-cloud/issues/590)) ([b8ea968](https://github.com/tambo-ai/tambo-cloud/commit/b8ea96859664caf1449aec8f66f00fa5645f2304))

## [0.25.10](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.9...repo-v0.25.10) (2025-03-22)


### Bug Fixes

* remove tx from streaming message update interval ([#567](https://github.com/tambo-ai/tambo-cloud/issues/567)) ([f562b33](https://github.com/tambo-ai/tambo-cloud/commit/f562b3314be16d823b9f3361570a1702880c8cc5))

## [0.25.9](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.8...repo-v0.25.9) (2025-03-22)


### Bug Fixes

* relax tx on stream update further ([#565](https://github.com/tambo-ai/tambo-cloud/issues/565)) ([ac1746c](https://github.com/tambo-ai/tambo-cloud/commit/ac1746c487e0d134e1b2fdef290c6a920677c28a))

## [0.25.8](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.7...repo-v0.25.8) (2025-03-22)


### Documentation

* add streaming-props doc, and add descriptions. ([#563](https://github.com/tambo-ai/tambo-cloud/issues/563)) ([b335fe1](https://github.com/tambo-ai/tambo-cloud/commit/b335fe1cb756797c2fdb0b72129d0b816603b123))


### Miscellaneous Chores

* update @tambo-ai/react to version 0.17.0 and refactor Subscribe & Demo ([#562](https://github.com/tambo-ai/tambo-cloud/issues/562)) ([ac67f55](https://github.com/tambo-ai/tambo-cloud/commit/ac67f5540ea3ffcb1fc25170f70843e5e25ae8a8))

## [0.25.7](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.6...repo-v0.25.7) (2025-03-21)


### Bug Fixes

* format error stream message ([#560](https://github.com/tambo-ai/tambo-cloud/issues/560)) ([1be1d08](https://github.com/tambo-ai/tambo-cloud/commit/1be1d085022d2f285eac0baddc518c8f21a36c85))
* pass along contextKey when creating thread ([#557](https://github.com/tambo-ai/tambo-cloud/issues/557)) ([a627449](https://github.com/tambo-ai/tambo-cloud/commit/a627449fe9c5fbfa2a22dbe8e539b2aa67ac47ff))
* relax isolation level ([#561](https://github.com/tambo-ai/tambo-cloud/issues/561)) ([996c123](https://github.com/tambo-ai/tambo-cloud/commit/996c123bd9258992563b60b056383f38eaf975ae))


### Documentation

* explain static component registration ([#559](https://github.com/tambo-ai/tambo-cloud/issues/559)) ([b2b8817](https://github.com/tambo-ai/tambo-cloud/commit/b2b8817b445e96337c4d92c9ee113ea5243b141b))

## [0.25.6](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.5...repo-v0.25.6) (2025-03-21)


### Bug Fixes

* optimistic concurrency in advanceThread to allow letting go of db connection ([#556](https://github.com/tambo-ai/tambo-cloud/issues/556)) ([499412c](https://github.com/tambo-ai/tambo-cloud/commit/499412ca8261fff685fd8a0b5e641c8fb99c8052))


### Miscellaneous Chores

* enhance layout configuration and documentation styling ([#553](https://github.com/tambo-ai/tambo-cloud/issues/553)) ([7cdbb4e](https://github.com/tambo-ai/tambo-cloud/commit/7cdbb4e5394e621a2574a84e277650439448f32f))
* update docs api ref ([#551](https://github.com/tambo-ai/tambo-cloud/issues/551)) ([ddf476a](https://github.com/tambo-ai/tambo-cloud/commit/ddf476a735a8b4bcb6a96a16a9f46e00fd015ab3))
* update some docs ([#555](https://github.com/tambo-ai/tambo-cloud/issues/555)) ([ac1664a](https://github.com/tambo-ai/tambo-cloud/commit/ac1664a3fde5e7e6e5fef4b4e425bb410479879b))


### Code Refactoring

* remove deprecated Callout component from docs page ([#554](https://github.com/tambo-ai/tambo-cloud/issues/554)) ([40a1baf](https://github.com/tambo-ai/tambo-cloud/commit/40a1baf6e4aec1b3abc0cbdae2e986d4ad1063e9))

## [0.25.5](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.4...repo-v0.25.5) (2025-03-20)


### Bug Fixes

* bump connection limit to 50 ([#549](https://github.com/tambo-ai/tambo-cloud/issues/549)) ([43ad9d4](https://github.com/tambo-ai/tambo-cloud/commit/43ad9d4da7d8856cd06f8aaada505832d97a9329))

## [0.25.4](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.3...repo-v0.25.4) (2025-03-19)


### Miscellaneous Chores

* bump to 0.16.1 to get better component-state behavior ([#547](https://github.com/tambo-ai/tambo-cloud/issues/547)) ([9e0b088](https://github.com/tambo-ai/tambo-cloud/commit/9e0b088e6a7954999d02ebef89333c2aac3ebc60))

## [0.25.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.2...repo-v0.25.3) (2025-03-19)


### Bug Fixes

* make sure db is retrieved per request ([#546](https://github.com/tambo-ai/tambo-cloud/issues/546)) ([344500e](https://github.com/tambo-ai/tambo-cloud/commit/344500ead10d321252e486117c4ec518f2fdd35b))
* switch to postgres driver for individual connections, store current request serial # for logging ([#543](https://github.com/tambo-ai/tambo-cloud/issues/543)) ([abccc2c](https://github.com/tambo-ai/tambo-cloud/commit/abccc2ce437678455006b5a5823718171024bc57))

## [0.25.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.1...repo-v0.25.2) (2025-03-19)


### Bug Fixes

* bump pooling to 30, verbose logging during transactions ([#540](https://github.com/tambo-ai/tambo-cloud/issues/540)) ([0ac2824](https://github.com/tambo-ai/tambo-cloud/commit/0ac282437c89cee58acc65b96a5d173e8ea93538))
* use global pool, local drizzle instance ([#542](https://github.com/tambo-ai/tambo-cloud/issues/542)) ([079de91](https://github.com/tambo-ai/tambo-cloud/commit/079de915a1e38d3e52207a2b090f412a2cc7ae8f))

## [0.25.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.25.0...repo-v0.25.1) (2025-03-19)


### Bug Fixes

* show a 'no components' prompt if none are available ([#538](https://github.com/tambo-ai/tambo-cloud/issues/538)) ([284a9ea](https://github.com/tambo-ai/tambo-cloud/commit/284a9ea351cb24319b22e876eac5eb8163b26862))
* use node-postgres connection pool ([#539](https://github.com/tambo-ai/tambo-cloud/issues/539)) ([bb5243d](https://github.com/tambo-ai/tambo-cloud/commit/bb5243df7f41f59b891b4fb2ea469e2a48749122))


### Miscellaneous Chores

* Update docs with info from VNext ([#536](https://github.com/tambo-ai/tambo-cloud/issues/536)) ([8e35aee](https://github.com/tambo-ai/tambo-cloud/commit/8e35aeedb2aca4a7f50e9c33134514283c97c9ca))

## [0.25.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.24.1...repo-v0.25.0) (2025-03-18)


### Features

* implement subscription feature with speech recognition and contact management ([#531](https://github.com/tambo-ai/tambo-cloud/issues/531)) ([8809b54](https://github.com/tambo-ai/tambo-cloud/commit/8809b54c21359710324abad78fcdb214e444a45b))
* update wemb location ([#534](https://github.com/tambo-ai/tambo-cloud/issues/534)) ([142326d](https://github.com/tambo-ai/tambo-cloud/commit/142326d0699e8c1436fb216890c90ca1591dc92a))
* use tools to force component decisions ([#535](https://github.com/tambo-ai/tambo-cloud/issues/535)) ([4499177](https://github.com/tambo-ai/tambo-cloud/commit/4499177e7666967924829a3209b2fa946d58467b))


### Miscellaneous Chores

* pin down to node 20+ ([#533](https://github.com/tambo-ai/tambo-cloud/issues/533)) ([33f07bf](https://github.com/tambo-ai/tambo-cloud/commit/33f07bf6bd471d2e7ea9ea62cccae570384a4cca))

## [0.24.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.24.0...repo-v0.24.1) (2025-03-18)


### Bug Fixes

* bump react lib to get tool ids ([#529](https://github.com/tambo-ai/tambo-cloud/issues/529)) ([8188941](https://github.com/tambo-ai/tambo-cloud/commit/8188941f87af77208a1a076f4867c4607aa9d3bb))

## [0.24.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.23.0...repo-v0.24.0) (2025-03-18)


### Features

* start accepting tool responses in the content, deprecated toolResponse ([#527](https://github.com/tambo-ai/tambo-cloud/issues/527)) ([9fbeacb](https://github.com/tambo-ai/tambo-cloud/commit/9fbeacbd0eab304dc8f505006e9bfd98618d5d8b))

## [0.23.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.22.0...repo-v0.23.0) (2025-03-17)


### Features

* optimize hero animation for cross-browser compatibility ([#522](https://github.com/tambo-ai/tambo-cloud/issues/522)) ([fb7d871](https://github.com/tambo-ai/tambo-cloud/commit/fb7d87115897cf5f1a0ac5966d64a0a52bedb31a))


### Bug Fixes

* generation of robots/sitemap ([#526](https://github.com/tambo-ai/tambo-cloud/issues/526)) ([98a8da8](https://github.com/tambo-ai/tambo-cloud/commit/98a8da84ba5842b5c3d5e6c18beea3498e32c719))


### Miscellaneous Chores

* bump to 0.14.1 to get tool_call_id ([#525](https://github.com/tambo-ai/tambo-cloud/issues/525)) ([48efa7d](https://github.com/tambo-ai/tambo-cloud/commit/48efa7df86275e1eb8a74d7bea515308ea7ebdc5))


### Code Refactoring

* replace static navigation links with HeaderActions and MobileNavigation components ([#523](https://github.com/tambo-ai/tambo-cloud/issues/523)) ([8a25769](https://github.com/tambo-ai/tambo-cloud/commit/8a257698be9514d74c6e2bcc2ab035eacc8375c5))

## [0.22.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.21.0...repo-v0.22.0) (2025-03-17)


### Features

* start propagating tool_call_id through messages ([#519](https://github.com/tambo-ai/tambo-cloud/issues/519)) ([84d26e1](https://github.com/tambo-ai/tambo-cloud/commit/84d26e1717ae948e05b3dc2105abd857ed3b6082))


### Miscellaneous Chores

* bump react-sdk to 0.14 for local smoketest ([#521](https://github.com/tambo-ai/tambo-cloud/issues/521)) ([d1dd058](https://github.com/tambo-ai/tambo-cloud/commit/d1dd0588f1c75d607f810d3c10067010104f8188))

## [0.21.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.20.0...repo-v0.21.0) (2025-03-17)


### Features

* **cli:** add browser auth flow for cli ([#501](https://github.com/tambo-ai/tambo-cloud/issues/501)) ([e7a95ab](https://github.com/tambo-ai/tambo-cloud/commit/e7a95ab1d087dab374f5d6cd67012fbeec733cd1))


### Bug Fixes

* add new tool_call_id column for later ([#507](https://github.com/tambo-ai/tambo-cloud/issues/507)) ([f5d0d1b](https://github.com/tambo-ai/tambo-cloud/commit/f5d0d1b881a3768130c8d426c2383996c2b9d86e))


### Miscellaneous Chores

* add watch path to make npm link easier ([#505](https://github.com/tambo-ai/tambo-cloud/issues/505)) ([cba8311](https://github.com/tambo-ai/tambo-cloud/commit/cba8311e3a85026ed26e7016d600e9095c000d50))
* bump to @types/react@18.3.18 to be in sync with tambo repo ([#506](https://github.com/tambo-ai/tambo-cloud/issues/506)) ([0f11fd8](https://github.com/tambo-ai/tambo-cloud/commit/0f11fd8d0a9b37357677e0e5bd9b80b00d57cf55))
* **deps:** bump @supabase/ssr from 0.5.2 to 0.6.1 ([#516](https://github.com/tambo-ai/tambo-cloud/issues/516)) ([a794fe9](https://github.com/tambo-ai/tambo-cloud/commit/a794fe95e8bd1b42518f0cc138d877eae6f913d8))
* **deps:** bump @tambo-ai/react from 0.13.0 to 0.13.1 ([#514](https://github.com/tambo-ai/tambo-cloud/issues/514)) ([d25a4f5](https://github.com/tambo-ai/tambo-cloud/commit/d25a4f566916df1135eb6e4f43525dd86a1c202c))
* **deps:** bump pg from 8.13.3 to 8.14.0 ([#511](https://github.com/tambo-ai/tambo-cloud/issues/511)) ([ccf56b7](https://github.com/tambo-ai/tambo-cloud/commit/ccf56b7fa582f09a10ccb3890902dede269f1606))
* **deps:** bump posthog-js from 1.230.1 to 1.231.0 ([#513](https://github.com/tambo-ai/tambo-cloud/issues/513)) ([d60fdbd](https://github.com/tambo-ai/tambo-cloud/commit/d60fdbdffb642d865bffac0c918775646b2350bd))
* **deps:** bump rehype-pretty-code from 0.14.0 to 0.14.1 ([#512](https://github.com/tambo-ai/tambo-cloud/issues/512)) ([2a53841](https://github.com/tambo-ai/tambo-cloud/commit/2a53841302b7756ce5dbf24dc47e7840ab908f33))
* **deps:** bump shiki from 2.4.1 to 2.5.0 ([#517](https://github.com/tambo-ai/tambo-cloud/issues/517)) ([13d51cb](https://github.com/tambo-ai/tambo-cloud/commit/13d51cbe7337b0572b15ee9e8322e4ba66adbcde))
* **deps:** bump the trpc group with 3 updates ([#509](https://github.com/tambo-ai/tambo-cloud/issues/509)) ([aaa346e](https://github.com/tambo-ai/tambo-cloud/commit/aaa346efdf5a661b982011c9162d711d50caed1d))
* Update Landing with Assets and Interactive Demo ([#508](https://github.com/tambo-ai/tambo-cloud/issues/508)) ([33f8ce5](https://github.com/tambo-ai/tambo-cloud/commit/33f8ce501eebfb4bfa333528c102b45084908e7b))


### Code Refactoring

* make useSession generally available, behaves like useQuery ([#503](https://github.com/tambo-ai/tambo-cloud/issues/503)) ([44ed019](https://github.com/tambo-ai/tambo-cloud/commit/44ed01914f44588bcea81b3df085eaa034bb0d3f))

## [0.20.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.19.0...repo-v0.20.0) (2025-03-14)


### Features

* normalize thread history, Dtos, Interfaces, etc ([#502](https://github.com/tambo-ai/tambo-cloud/issues/502)) ([0bb078c](https://github.com/tambo-ai/tambo-cloud/commit/0bb078c7c09db59886648a959a82563fc9c59eb6))


### Miscellaneous Chores

* stream message first ([#499](https://github.com/tambo-ai/tambo-cloud/issues/499)) ([e137209](https://github.com/tambo-ai/tambo-cloud/commit/e13720943c2949656e8bbac9dcbc6baaea72bbd6))

## [0.19.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.18.1...repo-v0.19.0) (2025-03-13)


### Features

* clean up and formalize prompt templates, including support for zod schema on responses ([#494](https://github.com/tambo-ai/tambo-cloud/issues/494)) ([3d361ad](https://github.com/tambo-ai/tambo-cloud/commit/3d361ad64e8e954df4d7c622a4dcf7d50d6cc85c))
* make messageToAppend required, reflect across the APIs ([#498](https://github.com/tambo-ai/tambo-cloud/issues/498)) ([e88421c](https://github.com/tambo-ai/tambo-cloud/commit/e88421c83340358b8d531919bcd2df5be05705dd))


### Bug Fixes

* add component info and state to llm message history only when needed ([#496](https://github.com/tambo-ai/tambo-cloud/issues/496)) ([55bd70c](https://github.com/tambo-ai/tambo-cloud/commit/55bd70ca96ea05a97da95d030bedc44d8410541a))
* Add component state to context ([#495](https://github.com/tambo-ai/tambo-cloud/issues/495)) ([03b5c44](https://github.com/tambo-ai/tambo-cloud/commit/03b5c4485fe2cad312d7df371891af1a7e0538e7))
* thread stage during streaming ([#492](https://github.com/tambo-ai/tambo-cloud/issues/492)) ([c70d5be](https://github.com/tambo-ai/tambo-cloud/commit/c70d5be3dacd5ec6d056d9467d569d84f9e89220))


### Code Refactoring

* some internal type alignment ([#497](https://github.com/tambo-ai/tambo-cloud/issues/497)) ([551d07d](https://github.com/tambo-ai/tambo-cloud/commit/551d07d7b52945239ff9e2054bcf254dd8be822c))

## [0.18.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.18.0...repo-v0.18.1) (2025-03-12)


### Bug Fixes

* bump next-themes to avoid console error + flashing ([#489](https://github.com/tambo-ai/tambo-cloud/issues/489)) ([7c51bea](https://github.com/tambo-ai/tambo-cloud/commit/7c51beab2174b2595d4882ca136f55aa15b03992))
* remove unused entrypoints ([#491](https://github.com/tambo-ai/tambo-cloud/issues/491)) ([7636660](https://github.com/tambo-ai/tambo-cloud/commit/76366606fe29992f702793c3c506f8cc1d9e9c75))

## [0.18.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.17.1...repo-v0.18.0) (2025-03-11)


### Features

* add streaming to smoketest ([#486](https://github.com/tambo-ai/tambo-cloud/issues/486)) ([402691c](https://github.com/tambo-ai/tambo-cloud/commit/402691c6539617ebf0bdd1965f2dc04dd624895a))
* tambo rename v0 ([#485](https://github.com/tambo-ai/tambo-cloud/issues/485)) ([689aee8](https://github.com/tambo-ai/tambo-cloud/commit/689aee81b04dfe9de984a9a4ce062ae6d59ef353))


### Bug Fixes

* repair package-lock by reinstalling ([#487](https://github.com/tambo-ai/tambo-cloud/issues/487)) ([becaab8](https://github.com/tambo-ai/tambo-cloud/commit/becaab8ccc9aff7d9ac1f548141ef8f2f41dbe2c))
* update example env supabase url ([#484](https://github.com/tambo-ai/tambo-cloud/issues/484)) ([885cc90](https://github.com/tambo-ai/tambo-cloud/commit/885cc9080d006b502b152c480e6efaf578bf903b))


### Miscellaneous Chores

* rename [@use-hydra-ai](https://github.com/use-hydra-ai) to [@tambo-ai-cloud](https://github.com/tambo-ai-cloud) ([#482](https://github.com/tambo-ai/tambo-cloud/issues/482)) ([7fa6092](https://github.com/tambo-ai/tambo-cloud/commit/7fa60920f14b657fe79ce9151be290b482fd0c2c))

## [0.17.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.17.0...repo-v0.17.1) (2025-03-10)


### Bug Fixes

* bump body size limit ([#480](https://github.com/tambo-ai/tambo-cloud/issues/480)) ([ee7b697](https://github.com/tambo-ai/tambo-cloud/commit/ee7b6976fcf2b58ba4b9b0ec6741321b5f209778))
* make config match manifest ([#476](https://github.com/tambo-ai/tambo-cloud/issues/476)) ([4cc4365](https://github.com/tambo-ai/tambo-cloud/commit/4cc43654841cf0ac691a94a3fe50410a7b0a5e5a))
* nest in "packages" ([#477](https://github.com/tambo-ai/tambo-cloud/issues/477)) ([bbc1285](https://github.com/tambo-ai/tambo-cloud/commit/bbc1285e612a910bf23aead665bf00e019c6d875))
* use new @tambo-ai/* libraries in smoketest/etc ([#481](https://github.com/tambo-ai/tambo-cloud/issues/481)) ([eead918](https://github.com/tambo-ai/tambo-cloud/commit/eead918da30e25114dce51ca559befaaeaf8c327))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 20.17.19 to 20.17.24 ([#470](https://github.com/tambo-ai/tambo-cloud/issues/470)) ([5f2af05](https://github.com/tambo-ai/tambo-cloud/commit/5f2af0529c66dda7dbec1072ee9153982375f109))
* **deps-dev:** bump eslint-config-prettier from 10.0.1 to 10.1.1 ([#471](https://github.com/tambo-ai/tambo-cloud/issues/471)) ([6b02523](https://github.com/tambo-ai/tambo-cloud/commit/6b02523fe5131f324f6c254cf3bda6aaf2dc7088))
* **deps-dev:** bump the eslint group across 1 directory with 3 updates ([#479](https://github.com/tambo-ai/tambo-cloud/issues/479)) ([efb9532](https://github.com/tambo-ai/tambo-cloud/commit/efb95321733b55abd63b3cac91077591cb4550f0))
* **deps:** bump next-themes from 0.4.4 to 0.4.5 ([#469](https://github.com/tambo-ai/tambo-cloud/issues/469)) ([5e64c94](https://github.com/tambo-ai/tambo-cloud/commit/5e64c942bda3426251f86483f3345bdce67654c0))
* **deps:** bump posthog-js from 1.225.0 to 1.230.1 ([#475](https://github.com/tambo-ai/tambo-cloud/issues/475)) ([ae32896](https://github.com/tambo-ai/tambo-cloud/commit/ae3289671c0000c2bbe9d0f9cc1689a0ec130b42))
* **deps:** bump the trpc group with 3 updates ([#465](https://github.com/tambo-ai/tambo-cloud/issues/465)) ([3d33c56](https://github.com/tambo-ai/tambo-cloud/commit/3d33c560b19225a65af2dac763f718a355a6673f))

## [0.17.0](https://github.com/tambo-ai/tambo-cloud/compare/v0.16.1...v0.17.0) (2025-03-10)


### Features

* bump to @hydra-ai/react to get cached rendered components ([#464](https://github.com/tambo-ai/tambo-cloud/issues/464)) ([964be52](https://github.com/tambo-ai/tambo-cloud/commit/964be52139b1f65a3e923ba2745eacd0f9e8285d))


### Bug Fixes

* add some local state to the AQI component to demonstrate proper rerendering ([#462](https://github.com/tambo-ai/tambo-cloud/issues/462)) ([8449de9](https://github.com/tambo-ai/tambo-cloud/commit/8449de9f5a9ef0f9f2fc75d61a50fa4bfb607b82))

## [0.16.1](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.16.0...v0.16.1) (2025-03-07)


### Bug Fixes

* add missing timezone, switch to clock_timestamp() ([#460](https://github.com/use-hydra-ai/hydra-ai-site/issues/460)) ([8921448](https://github.com/use-hydra-ai/hydra-ai-site/commit/892144880ff17057faa69b2de703b82b53636319))
* bump @hydra-ai/react to get 0 retry API calls ([#456](https://github.com/use-hydra-ai/hydra-ai-site/issues/456)) ([861cb9a](https://github.com/use-hydra-ai/hydra-ai-site/commit/861cb9ad69bec855e5b3774bb533af140efa9a47))
* make the prompt more explicit, and handle errors better ([#458](https://github.com/use-hydra-ai/hydra-ai-site/issues/458)) ([b15e826](https://github.com/use-hydra-ai/hydra-ai-site/commit/b15e826683cec9b495400dc6e499d2f9a108061d))
* oops, this was local debugging ([#461](https://github.com/use-hydra-ai/hydra-ai-site/issues/461)) ([33c6fd2](https://github.com/use-hydra-ai/hydra-ai-site/commit/33c6fd21d01b2d9be6e8bcfa2c027c67b9dfbc04))
* simplify transaction middleware ([#459](https://github.com/use-hydra-ai/hydra-ai-site/issues/459)) ([b9e6a55](https://github.com/use-hydra-ai/hydra-ai-site/commit/b9e6a55e733bc09de78bb8ff2fdcc048519876b0))

## [0.16.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.15.0...v0.16.0) (2025-03-07)


### Features

* cleanup/normalize db and transaction access in nest ([#452](https://github.com/use-hydra-ai/hydra-ai-site/issues/452)) ([d0c4c7d](https://github.com/use-hydra-ai/hydra-ai-site/commit/d0c4c7d15d766aab52a4682f1d2952b2449995f8))


### Bug Fixes

* bump to new @hydra-ai/react with better thread state ([#448](https://github.com/use-hydra-ai/hydra-ai-site/issues/448)) ([3930956](https://github.com/use-hydra-ai/hydra-ai-site/commit/39309562136a494028b8a51e7fffa689cd248b00))
* Improve thread backend creation with dynamic provider key retrieval ([#444](https://github.com/use-hydra-ai/hydra-ai-site/issues/444)) ([0ad7687](https://github.com/use-hydra-ai/hydra-ai-site/commit/0ad7687f324f408ef0f2a484fb6dfb596576782a))
* remove some console.log'ing ([#450](https://github.com/use-hydra-ai/hydra-ai-site/issues/450)) ([9925564](https://github.com/use-hydra-ai/hydra-ai-site/commit/9925564923793c515d86da7a03c1196fe9b656ff))
* switch driver from postgresjs to pg-native, as per drizzle instructions ([#451](https://github.com/use-hydra-ai/hydra-ai-site/issues/451)) ([9c75f82](https://github.com/use-hydra-ai/hydra-ai-site/commit/9c75f822eb178c34a818c6f9a9861bce18ee08ce))
* use creator to allow project creation w/out members ([#454](https://github.com/use-hydra-ai/hydra-ai-site/issues/454)) ([b4777d1](https://github.com/use-hydra-ai/hydra-ai-site/commit/b4777d1dfeea35f4d2345a5e4f2b497868c9665c))
* use custom SQL function to allow project creation while bypassing RLS ([#453](https://github.com/use-hydra-ai/hydra-ai-site/issues/453)) ([77defb0](https://github.com/use-hydra-ai/hydra-ai-site/commit/77defb0702e2f20ae3534f07ea5b8b3b0d01ad80))
* use updated react package with new react-query like api ([#447](https://github.com/use-hydra-ai/hydra-ai-site/issues/447)) ([52ee00b](https://github.com/use-hydra-ai/hydra-ai-site/commit/52ee00b7d3faf7ae1de4f9c64cdb3b9ce0ee2501))

## [0.15.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.14.1...v0.15.0) (2025-03-04)


### Features

* Add row-level security to projects, project_members ([#395](https://github.com/use-hydra-ai/hydra-ai-site/issues/395)) ([d5c6e87](https://github.com/use-hydra-ai/hydra-ai-site/commit/d5c6e87b44d4525b49b3858a63b6cdee231c1f53))


### Bug Fixes

* add apischema decorator to advance return type ([#442](https://github.com/use-hydra-ai/hydra-ai-site/issues/442)) ([94b0aed](https://github.com/use-hydra-ai/hydra-ai-site/commit/94b0aede93609e3281c15e1d9ea37c84ae2db476))
* add back lost migrations to set up role permissions ([#445](https://github.com/use-hydra-ai/hydra-ai-site/issues/445)) ([25e91a5](https://github.com/use-hydra-ai/hydra-ai-site/commit/25e91a50cadb7d022d983ceb66933fb6321862ca))

## [0.14.1](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.14.0...v0.14.1) (2025-03-04)


### Bug Fixes

* Add return types for advance routes ([#439](https://github.com/use-hydra-ai/hydra-ai-site/issues/439)) ([a277ce9](https://github.com/use-hydra-ai/hydra-ai-site/commit/a277ce9f72d6ca32d55aa24752ba57d3d671b901))

## [0.14.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.13.0...v0.14.0) (2025-03-04)


### Features

* Add 'advance' thread routes ([#428](https://github.com/use-hydra-ai/hydra-ai-site/issues/428)) ([aac8464](https://github.com/use-hydra-ai/hydra-ai-site/commit/aac8464a81641544151d2a6a1581be24a331dfcd))

## [0.13.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.12.0...v0.13.0) (2025-03-04)


### Features

* add thread rehydrating to smoketest ([#427](https://github.com/use-hydra-ai/hydra-ai-site/issues/427)) ([dfd7a2f](https://github.com/use-hydra-ai/hydra-ai-site/commit/dfd7a2f71a25ed4093f419167fa6727e208a7191))


### Bug Fixes

* proper path for release-please-manifest ([#425](https://github.com/use-hydra-ai/hydra-ai-site/issues/425)) ([d0c178f](https://github.com/use-hydra-ai/hydra-ai-site/commit/d0c178f55f1cde35a048b96d139b7f546a5274d2))

## [0.12.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.11.1...v0.12.0) (2025-03-03)


### Features

* Allow threads.retrieve to include messages ([#422](https://github.com/use-hydra-ai/hydra-ai-site/issues/422)) ([2c01639](https://github.com/use-hydra-ai/hydra-ai-site/commit/2c016394b5287101e5a818b1ce86de112de08084))

## [0.11.1](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.11.0...v0.11.1) (2025-03-01)


### Bug Fixes

* try using `runner.temp` in stainless push ([#410](https://github.com/use-hydra-ai/hydra-ai-site/issues/410)) ([ec60311](https://github.com/use-hydra-ai/hydra-ai-site/commit/ec6031134ab77533092255a89e670ea66bcfc128))

## [0.11.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.10.2...v0.11.0) (2025-03-01)


### Features

* Add API entrypoint for current project ([#408](https://github.com/use-hydra-ai/hydra-ai-site/issues/408)) ([5907858](https://github.com/use-hydra-ai/hydra-ai-site/commit/590785862f4be4da5cf1a719a6a1f9d036061e4e))
* update thread generation stage during generation/hydration ([#404](https://github.com/use-hydra-ai/hydra-ai-site/issues/404)) ([5a27179](https://github.com/use-hydra-ai/hydra-ai-site/commit/5a2717959bacc62e34d280d9e51a753806788b09))


### Bug Fixes

* require async, and thus await, on all Promise-based functions ([#409](https://github.com/use-hydra-ai/hydra-ai-site/issues/409)) ([abf6dbe](https://github.com/use-hydra-ai/hydra-ai-site/commit/abf6dbe6c5d7945823dc01e824f884afa5e3461c))
* update openapi.json generation so stainless can actually be called ([#406](https://github.com/use-hydra-ai/hydra-ai-site/issues/406)) ([979658f](https://github.com/use-hydra-ai/hydra-ai-site/commit/979658fddecc1b0feac79455b8ebabcf743b4357))
* update status doc ([#407](https://github.com/use-hydra-ai/hydra-ai-site/issues/407)) ([fe7f71d](https://github.com/use-hydra-ai/hydra-ai-site/commit/fe7f71d1b8f9b414024b75dc89ddc142fc3248b7))

## [0.10.2](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.10.1...v0.10.2) (2025-02-28)


### Bug Fixes

* log legacy key use ([#401](https://github.com/use-hydra-ai/hydra-ai-site/issues/401)) ([cd86d9c](https://github.com/use-hydra-ai/hydra-ai-site/commit/cd86d9ce96279f26ddf23fa6aec48c5b73bfc1dd))

## [0.10.1](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.10.0...v0.10.1) (2025-02-28)


### Bug Fixes

* use generic "items", not "threads" so pagination is generic ([#399](https://github.com/use-hydra-ai/hydra-ai-site/issues/399)) ([c674600](https://github.com/use-hydra-ai/hydra-ai-site/commit/c674600c250f0b2661d6e1cf3ca7277dfdc79e0d))

## [0.10.0](https://github.com/use-hydra-ai/hydra-ai-site/compare/v0.9.1...v0.10.0) (2025-02-28)


### Features

* add generationStage and statusMessage to Thread ([#396](https://github.com/use-hydra-ai/hydra-ai-site/issues/396)) ([4b1b6aa](https://github.com/use-hydra-ai/hydra-ai-site/commit/4b1b6aa2263c59fb63705fc55122493c84431a1a))
* add pagination to threads ([#398](https://github.com/use-hydra-ai/hydra-ai-site/issues/398)) ([0f6edb3](https://github.com/use-hydra-ai/hydra-ai-site/commit/0f6edb3eeddbea7434c7babccb478ea31f1e5336))

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
