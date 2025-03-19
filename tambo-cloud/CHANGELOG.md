# Changelog

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
