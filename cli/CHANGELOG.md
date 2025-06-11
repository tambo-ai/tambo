# Changelog

## [0.14.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.13.2...tambo-v0.14.0) (2025-06-10)


### Features

* allow multiple components to add / update command ([#518](https://github.com/tambo-ai/tambo/issues/518)) ([a39d2af](https://github.com/tambo-ai/tambo/commit/a39d2af83d1576e93dcf0eb827e6c3948ed02da7))

## [0.13.2](https://github.com/tambo-ai/tambo/compare/tambo-v0.13.1...tambo-v0.13.2) (2025-06-02)


### Bug Fixes

* use proper whitespace wrapping and format tool params correctly ([#505](https://github.com/tambo-ai/tambo/issues/505)) ([2346610](https://github.com/tambo-ai/tambo/commit/23466105ae4a9c89c0a4fc3f37e7f2705393e8a4))

## [0.13.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.13.0...tambo-v0.13.1) (2025-05-31)


### Miscellaneous

* add json-stringify-pretty-compact and ExternalLink component; enhance message styling ([#485](https://github.com/tambo-ai/tambo/issues/485)) ([644ab74](https://github.com/tambo-ai/tambo/commit/644ab74e5502f2d8f393e7b25de774f4c0900d95))

## [0.13.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.12.0...tambo-v0.13.0) (2025-05-31)


### Features

* show threadname in history ([#488](https://github.com/tambo-ai/tambo/issues/488)) ([9fa1a5d](https://github.com/tambo-ai/tambo/commit/9fa1a5d776de4480b60838afb1b8d7fa351ffee5))


### Bug Fixes

* default to "fetching data" instead of "Choosing component" ([#475](https://github.com/tambo-ai/tambo/issues/475)) ([7a062e5](https://github.com/tambo-ai/tambo/commit/7a062e5f85702e5590326c2ce314c0414d2e4316))

## [0.12.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.11.1...tambo-v0.12.0) (2025-05-30)


### Features

* show toolcall name and params under status ([#476](https://github.com/tambo-ai/tambo/issues/476)) ([7fefe78](https://github.com/tambo-ai/tambo/commit/7fefe783262731f61e5100891110fc57b2fbe468))

## [0.11.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.11.0...tambo-v0.11.1) (2025-05-29)


### Miscellaneous

* update upgrade command to let users choose which components to update ([#473](https://github.com/tambo-ai/tambo/issues/473)) ([50f20d1](https://github.com/tambo-ai/tambo/commit/50f20d1295af80b7bacce41d82fc9af2a4ec2973))

## [0.11.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.10.1...tambo-v0.11.0) (2025-05-28)


### Features

* improve ThreadContent component alignment and width TAM-141 ([#447](https://github.com/tambo-ai/tambo/issues/447)) ([a25ea61](https://github.com/tambo-ai/tambo/commit/a25ea61e9d23050f0a0da736be9db0caa9af3e8f))
* update ThreadHistory to default to collapsed sidebar ([#427](https://github.com/tambo-ai/tambo/issues/427)) ([efa0894](https://github.com/tambo-ai/tambo/commit/efa0894b254c672cd5d2cb154c1e2a3eed8a274e))


### Bug Fixes

* **scrollable-message-container:** increase auto-scroll timeout to 250ms ([#449](https://github.com/tambo-ai/tambo/issues/449)) ([b09dbf1](https://github.com/tambo-ai/tambo/commit/b09dbf1b9da170795c18d841346e69639976a149))


### Miscellaneous

* **deps:** bump ts-morph from 25.0.1 to 26.0.0 ([#458](https://github.com/tambo-ai/tambo/issues/458)) ([b7656cd](https://github.com/tambo-ai/tambo/commit/b7656cd226fbd2dae0035530168cfa38d63f65a6))
* improve upgrade command, update dependencies and improve UI responsiveness ([#471](https://github.com/tambo-ai/tambo/issues/471)) ([e09d740](https://github.com/tambo-ai/tambo/commit/e09d740d9ac1bfb30dfd2ebb5776f0de98921718))
* update components, remove unused dependencies and improve TamboProvider integration in showcase components ([#472](https://github.com/tambo-ai/tambo/issues/472)) ([5e0a2af](https://github.com/tambo-ai/tambo/commit/5e0a2af28979e2319319655ae0a4b38527fdfc0d))

## [0.10.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.10.0...tambo-v0.10.1) (2025-05-19)


### Bug Fixes

* **cli:** a few more dev tweaks to allow listing components, not crashing on add, etc ([#442](https://github.com/tambo-ai/tambo/issues/442)) ([3a79f60](https://github.com/tambo-ai/tambo/commit/3a79f606cf116a8924129a426f87362121757b6c))
* small devex tweaks ([#429](https://github.com/tambo-ai/tambo/issues/429)) ([b42caaa](https://github.com/tambo-ai/tambo/commit/b42caaab3f0e9d98adaea625891e0a2a1f146f83))


### Miscellaneous

* **deps:** bump sanitize-html from 2.16.0 to 2.17.0 ([#436](https://github.com/tambo-ai/tambo/issues/436)) ([2e3153d](https://github.com/tambo-ai/tambo/commit/2e3153d8d34145d35014799b96ed943a48cf0d68))

## [0.10.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.9.0...tambo-v0.10.0) (2025-05-15)


### Features

* **cli:** add upgrade command with accept-all option for whole template upgrades ([#419](https://github.com/tambo-ai/tambo/issues/419)) ([5081dcd](https://github.com/tambo-ai/tambo/commit/5081dcd7a08b8e3ce632e0978a478f7410edec5f))
* handle toolcall failures ([#420](https://github.com/tambo-ai/tambo/issues/420)) ([8a8bd27](https://github.com/tambo-ai/tambo/commit/8a8bd276dfcea261d9f7c6f1171829ef3682ffef))

## [0.9.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.8.0...tambo-v0.9.0) (2025-05-13)


### Features

* add template selection for create-app command ([#411](https://github.com/tambo-ai/tambo/issues/411)) ([1e75289](https://github.com/tambo-ai/tambo/commit/1e75289649dcc27da8e19813b825ccb55818724c))


### Miscellaneous

* **deps:** bump semver from 7.7.1 to 7.7.2 ([#407](https://github.com/tambo-ai/tambo/issues/407)) ([60bcd53](https://github.com/tambo-ai/tambo/commit/60bcd530ea4c85cc8779fe75b42ef7cb405e9dda))

## [0.8.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.7.0...tambo-v0.8.0) (2025-05-13)


### Features

* enhance Graph component with Zod type included and better loading ([#409](https://github.com/tambo-ai/tambo/issues/409)) ([9f7078c](https://github.com/tambo-ai/tambo/commit/9f7078c66fa20b419780464ac771e4c755dbe0fb))


### Bug Fixes

* remove unused animation and use isIdle ([#397](https://github.com/tambo-ai/tambo/issues/397)) ([0897067](https://github.com/tambo-ai/tambo/commit/0897067925f8880b147139a9d9c88160df0dbf89))
* showcase component sidebar issues and update of form component ([#412](https://github.com/tambo-ai/tambo/issues/412)) ([bb3da9c](https://github.com/tambo-ai/tambo/commit/bb3da9c1085b61f655adeca958995b46f3f72b83))

## [0.7.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.6.0...tambo-v0.7.0) (2025-05-07)


### Features

* allow env to override tambo URL, for local dev ([#379](https://github.com/tambo-ai/tambo/issues/379)) ([2a79b55](https://github.com/tambo-ai/tambo/commit/2a79b55864134dd89a86f089537e90ddfb834752))
* update showcase with new components ([#367](https://github.com/tambo-ai/tambo/issues/367)) ([581359a](https://github.com/tambo-ai/tambo/commit/581359adc7f85433c08f7a3c5da7af65cb8529fc))


### Miscellaneous

* **deps:** bump open from 10.1.1 to 10.1.2 ([#370](https://github.com/tambo-ai/tambo/issues/370)) ([72df9ad](https://github.com/tambo-ai/tambo/commit/72df9ad2c5ddce8c07be3e095c8ed2220eb6d4ba))

## [0.6.0](https://github.com/tambo-ai/tambo/compare/tambo-v0.5.1...tambo-v0.6.0) (2025-05-01)


### Features

* **UI:** add loading indicator and tool status messages to message component ([#361](https://github.com/tambo-ai/tambo/issues/361)) ([54bf5fb](https://github.com/tambo-ai/tambo/commit/54bf5fb11a61ab33d2f2aec29c31bfdc3b0a2ffe))

## [0.5.1](https://github.com/tambo-ai/tambo/compare/tambo-v0.5.0...tambo-v0.5.1) (2025-04-30)


### Miscellaneous

* **deps:** bump dotenv from 16.4.7 to 16.5.0 ([#313](https://github.com/tambo-ai/tambo/issues/313)) ([cffc541](https://github.com/tambo-ai/tambo/commit/cffc5416718bd11e8346aa26e426f892a467bbb9))
* **deps:** bump inquirer from 9.3.7 to 10.2.2 ([#327](https://github.com/tambo-ai/tambo/issues/327)) ([7e7f7e7](https://github.com/tambo-ai/tambo/commit/7e7f7e72beca07af4c6afed982782a32caeb1332))
* **deps:** bump open from 10.1.0 to 10.1.1 ([#326](https://github.com/tambo-ai/tambo/issues/326)) ([fb7b9cd](https://github.com/tambo-ai/tambo/commit/fb7b9cd4012b2dc895663ef941777a851fe24f20))
* **deps:** bump sanitize-html from 2.15.0 to 2.16.0 ([#334](https://github.com/tambo-ai/tambo/issues/334)) ([f5b38d6](https://github.com/tambo-ai/tambo/commit/f5b38d61af1bee74354cf04fc3b66351d20aba93))


### Code Refactoring

* **UI:** update UI components and styles for improved usability and integration ([#343](https://github.com/tambo-ai/tambo/issues/343)) ([b07b7e3](https://github.com/tambo-ai/tambo/commit/b07b7e3c8433e1dcfcae7ea466d7130bdfcf4639))

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
