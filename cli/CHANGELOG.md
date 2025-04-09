# Changelog

## [0.5.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.4.0...tambo-v0.5.0) (2025-04-09)


### Features

* remove borders from thread-full and suggestions ([#308](https://github.com/tambo-ai/tambo/issues/308)) ([917f1ee](https://github.com/tambo-ai/tambo/commit/917f1ee5adbfdb36cb2ba6eb0c5e6614bf92f211))

## [0.4.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.3.3...tambo-v0.4.0) (2025-04-09)


### Features

* **cli:** update message-input component style ([#306](https://github.com/tambo-ai/tambo/issues/306)) ([0454392](https://github.com/tambo-ai/tambo/commit/0454392c7ed07e7404605ae399b9a864f52438a2))


### Miscellaneous

* **deps-dev:** bump typescript from 5.8.2 to 5.8.3 ([#282](https://github.com/tambo-ai/tambo/issues/282)) ([0c1fc63](https://github.com/tambo-ai/tambo/commit/0c1fc631be3212e7c3b82c696306d7fac36d5f56))
* **deps:** bump inquirer from 9.3.7 to 10.2.2 ([#284](https://github.com/tambo-ai/tambo/issues/284)) ([7a3f5f5](https://github.com/tambo-ai/tambo/commit/7a3f5f51e43e885406058f63c9ca40061fdf348a))

## [0.3.3](https://github.com/tambo-ai/tambo/compare/tambo-v0.3.2...tambo-v0.3.3) (2025-04-04)


### Bug Fixes

* **cli:** add --init-git flag to create-app command and fix message-input auto-focus ([#273](https://github.com/tambo-ai/tambo/issues/273)) ([46ff832](https://github.com/tambo-ai/tambo/commit/46ff8328d4a3547bac3469389fdf018198ac077a))


### Code Refactoring

* **cli:** remove tambo.ts from init command (only full-send) ([#269](https://github.com/tambo-ai/tambo/issues/269)) ([96d65d2](https://github.com/tambo-ai/tambo/commit/96d65d27253de637a0b83e0050359ab71416a054))

## [0.3.2](https://github.com/tambo-ai/tambo/compare/tambo-v0.3.1...tambo-v0.3.2) (2025-04-03)


### Miscellaneous

* **cli:** change the appname in package.json while installing template ([#263](https://github.com/tambo-ai/tambo/issues/263)) ([a769bbf](https://github.com/tambo-ai/tambo/commit/a769bbf8baac23c0c38daafb64539162445c1355))

## [0.3.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.3.0...tambo-v0.3.1) (2025-04-03)


### Bug Fixes

* **cli:** add displayName to MessageSuggestions and ThreadHistory components ([#260](https://github.com/tambo-ai/tambo/issues/260)) ([0f07571](https://github.com/tambo-ai/tambo/commit/0f07571ae6df627d34dda621772b6bc704d408cf))

## [0.3.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.2.2...tambo-v0.3.0) (2025-04-02)


### Features

* add tambo.ts for registering components & simplify code ([#257](https://github.com/tambo-ai/tambo/issues/257)) ([139d727](https://github.com/tambo-ai/tambo/commit/139d727daf53c652a9ee39ce68492a35e381dc12))
* **cli:** add 'create-tambo-app' command to CLI for app creation from template ([#256](https://github.com/tambo-ai/tambo/issues/256)) ([4e116ce](https://github.com/tambo-ai/tambo/commit/4e116ce7e4f02a6dbf4e95e645035068b3a96594))


### Bug Fixes

* only run npm install twice ([#254](https://github.com/tambo-ai/tambo/issues/254)) ([ca2c8f4](https://github.com/tambo-ai/tambo/commit/ca2c8f4b73c53a710599d5fa9772a65e39c174c0))


### Documentation

* add a bunch of jsdocs for components ([#253](https://github.com/tambo-ai/tambo/issues/253)) ([f5fa2ec](https://github.com/tambo-ai/tambo/commit/f5fa2ec57378b2383c3b14fd6f9c79dbfdfc0b1e))

## [0.2.2](https://github.com/tambo-ai/tambo/compare/tambo-v0.2.1...tambo-v0.2.2) (2025-04-02)


### Bug Fixes

* improved CLI commands with user feedback and component location handling ([#247](https://github.com/tambo-ai/tambo/issues/247)) ([d90c1ba](https://github.com/tambo-ai/tambo/commit/d90c1bacf5b890e3b6941f6fa5345b8a737350ac))
* minor component cleanups: stop using useEffect/etc ([#242](https://github.com/tambo-ai/tambo/issues/242)) ([7c6d334](https://github.com/tambo-ai/tambo/commit/7c6d334d500d909038469132123c9d163f2f7c5b))
* more mac kbd cleanup: quiet down hydration warnings ([#248](https://github.com/tambo-ai/tambo/issues/248)) ([bcf13e7](https://github.com/tambo-ai/tambo/commit/bcf13e72890c0bf0cfdd4352a742a4adcb6f05dc))


### Documentation

* update README files for React SDK and CLI, fix links and enhance installation instructions ([#251](https://github.com/tambo-ai/tambo/issues/251)) ([fa85f17](https://github.com/tambo-ai/tambo/commit/fa85f1701fe27fdd59b4d7f0f6741c392c08808d))

## [0.2.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.2.0...tambo-v0.2.1) (2025-04-01)


### Bug Fixes

* show list of component if component is missing ([#241](https://github.com/tambo-ai/tambo/issues/241)) ([e971b10](https://github.com/tambo-ai/tambo/commit/e971b1021dbfd622dda304af2b33186e8608e235))
* warn about latest version, better src/ messaging ([#240](https://github.com/tambo-ai/tambo/issues/240)) ([60bb430](https://github.com/tambo-ai/tambo/commit/60bb43086accefcc5af67510b3a60cf602041492))
* warn users if they are using old tambo cli ([#238](https://github.com/tambo-ai/tambo/issues/238)) ([6070464](https://github.com/tambo-ai/tambo/commit/6070464ff2aeb4a84aef4643784bcefb041044fc))


### Miscellaneous

* fix thread-history and updated showcase site ([#204](https://github.com/tambo-ai/tambo/issues/204)) ([26c70cd](https://github.com/tambo-ai/tambo/commit/26c70cd841ef5bdeba7f755225ba57fe100c4429))

## [0.2.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.5...tambo-v0.2.0) (2025-03-28)


### Features

* useTamboThreads -&gt; useTamboThreadList ([#200](https://github.com/tambo-ai/tambo/issues/200)) ([4a32eda](https://github.com/tambo-ai/tambo/commit/4a32eda20b6564465b69bccda8ed94f65ea56b01))


### Bug Fixes

* **cli:** add API key check; update component installation logic, update component UI ([#198](https://github.com/tambo-ai/tambo/issues/198)) ([bdfbe7e](https://github.com/tambo-ai/tambo/commit/bdfbe7ecefd0231fa9801b5b5b77059206d6aabd))

## [0.1.5](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.4...tambo-v0.1.5) (2025-03-25)


### Miscellaneous

* **deps-dev:** bump @types/chalk from 0.4.31 to 2.2.4 ([#181](https://github.com/tambo-ai/tambo/issues/181)) ([855e618](https://github.com/tambo-ai/tambo/commit/855e6180966a6cef88b9142924350938479c501f))
* **deps-dev:** bump @types/ora from 3.1.0 to 3.2.0 ([#192](https://github.com/tambo-ai/tambo/issues/192)) ([911e4ed](https://github.com/tambo-ai/tambo/commit/911e4ed4cd30f960e5de9351ed6aa4605b7ec2a8))
* **deps-dev:** bump the eslint group with 4 updates ([#178](https://github.com/tambo-ai/tambo/issues/178)) ([52bcaca](https://github.com/tambo-ai/tambo/commit/52bcaca7c06141955d2185a84f1647cf40847a38))
* **deps:** bump sanitize-html from 2.14.0 to 2.15.0 ([#191](https://github.com/tambo-ai/tambo/issues/191)) ([88e2019](https://github.com/tambo-ai/tambo/commit/88e201920be820f08d9cdcc850f8ed9ae8ea8596))

## [0.1.4](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.3...tambo-v0.1.4) (2025-03-24)


### Bug Fixes

* **cli:** component path fix for message-suggestions ([#176](https://github.com/tambo-ai/tambo/issues/176)) ([d11d856](https://github.com/tambo-ai/tambo/commit/d11d85618338e348967fa54334c6e35f9349c8fb))

## [0.1.3](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.2...tambo-v0.1.3) (2025-03-22)


### Miscellaneous

* **cli:** update components UI and add update command ([#167](https://github.com/tambo-ai/tambo/issues/167)) ([a675c7d](https://github.com/tambo-ai/tambo/commit/a675c7d12bce6fde19752eebdeb148dbc65630eb))

## [0.1.2](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.1...tambo-v0.1.2) (2025-03-19)


### Bug Fixes

* **cli:** improve overall component ui ([#163](https://github.com/tambo-ai/tambo/issues/163)) ([bad4d07](https://github.com/tambo-ai/tambo/commit/bad4d07bb25458dd0e81382f6476afb307e57928))


### Miscellaneous

* pin stuff down to node &gt;=20 ([#159](https://github.com/tambo-ai/tambo/issues/159)) ([169797b](https://github.com/tambo-ai/tambo/commit/169797bc2800b1e42903d358f8023f391898b33f))
* show renderedComponent in Message component ([#160](https://github.com/tambo-ai/tambo/issues/160)) ([7a6a44a](https://github.com/tambo-ai/tambo/commit/7a6a44a7368d898e9fc1f4540f0ae11e7110b672))

## [0.1.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.1.0...tambo-v0.1.1) (2025-03-18)


### Bug Fixes

* **cli:** remove full-send flag and add it as a command instead ([#155](https://github.com/tambo-ai/tambo/issues/155)) ([2b0797a](https://github.com/tambo-ai/tambo/commit/2b0797a2fad8e8c2d47d943f5ad35e6b09ad885f))

## [0.1.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.0.3...tambo-v0.1.0) (2025-03-18)


### Features

* migration of tambo cli ([#119](https://github.com/tambo-ai/tambo/issues/119)) ([bbe2cbf](https://github.com/tambo-ai/tambo/commit/bbe2cbf2fbf6c25d0c2ae3a1aec69d5885a80569))


### Bug Fixes

* unpin cli from old version of @tambo-ai/react ([#150](https://github.com/tambo-ai/tambo/issues/150)) ([25ad800](https://github.com/tambo-ai/tambo/commit/25ad800d4402dd6db314321715bd48fcaa0df6f8))


### Miscellaneous

* **cli:** update release configuration and CLI version to 0.0.3 ([#153](https://github.com/tambo-ai/tambo/issues/153)) ([11831f2](https://github.com/tambo-ai/tambo/commit/11831f232169af428209d2d5eac69bcc82e45353))
* remove some unused dependencies ([#152](https://github.com/tambo-ai/tambo/issues/152)) ([02f3e0d](https://github.com/tambo-ai/tambo/commit/02f3e0d0d7708ddcf72216a90167938ed1aab78a))
