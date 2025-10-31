# Changelog

## [1.16.1](https://github.com/tambo-ai/tambo/compare/docs-v1.16.0...docs-v1.16.1) (2025-10-31)


### Bug Fixes

* **docs:** Migrate to Tailwind CSS v4 ([#1222](https://github.com/tambo-ai/tambo/issues/1222)) ([253af21](https://github.com/tambo-ai/tambo/commit/253af21b900ccd837d959abc1d7a09729716b11a))

## [1.16.0](https://github.com/tambo-ai/tambo/compare/docs-v1.15.0...docs-v1.16.0) (2025-10-31)


### Features

* add context badge for images ([#1192](https://github.com/tambo-ai/tambo/issues/1192)) ([020cd5e](https://github.com/tambo-ai/tambo/commit/020cd5e19285921bf0ef3086d3d84777bf694685))


### Bug Fixes

* run transformToContent for streaming requests too ([#1184](https://github.com/tambo-ai/tambo/issues/1184)) ([42d8a82](https://github.com/tambo-ai/tambo/commit/42d8a82eff25836d021480ff3b9ca0fb3b9793cb))


### Miscellaneous Chores

* **config:** Align tsconfigs and eslint configs between docs, showcase, and base ([#1216](https://github.com/tambo-ai/tambo/issues/1216)) ([ab61266](https://github.com/tambo-ai/tambo/commit/ab61266f89f14084d9f9f8abc2098bc3a3cb3adf))
* **deps-dev:** bump @tailwindcss/postcss from 4.1.14 to 4.1.16 in the tailwind group ([#1204](https://github.com/tambo-ai/tambo/issues/1204)) ([352b252](https://github.com/tambo-ai/tambo/commit/352b252d5152d500dd87168002524f6219df0984))
* **deps:** bump @tambo-ai/typescript-sdk from 0.75.0 to 0.75.1 ([#1208](https://github.com/tambo-ai/tambo/issues/1208)) ([76640d7](https://github.com/tambo-ai/tambo/commit/76640d7eab0202555ba699039152be7b656d40ef))
* **deps:** bump posthog-js from 1.276.0 to 1.280.1 ([#1200](https://github.com/tambo-ai/tambo/issues/1200)) ([c7886ad](https://github.com/tambo-ai/tambo/commit/c7886adaf96e654c175534082682676b29bfbb8f))
* **docs:** add callouts for interactable components registration ([#1213](https://github.com/tambo-ai/tambo/issues/1213)) ([1bdd145](https://github.com/tambo-ai/tambo/commit/1bdd145788d6738c5f0e24896400ff45188be637))
* update CLAUDE.md files to reference AGENTS.md properly ([#1214](https://github.com/tambo-ai/tambo/issues/1214)) ([22d6ea2](https://github.com/tambo-ai/tambo/commit/22d6ea28fd18c073b3f739d901121bb1e1e59e31))

## [1.15.0](https://github.com/tambo-ai/tambo/compare/docs-v1.14.0...docs-v1.15.0) (2025-10-21)


### Features

* **sdk:** Add client-side transformToContent callback in tool registration ([#1169](https://github.com/tambo-ai/tambo/issues/1169)) ([651dc01](https://github.com/tambo-ai/tambo/commit/651dc01649e17fce4bcfb778a041e7b7ef830dbf))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/typescript-sdk from 0.73.0 to 0.75.0 ([#1179](https://github.com/tambo-ai/tambo/issues/1179)) ([e781957](https://github.com/tambo-ai/tambo/commit/e781957a758cdd3f5e820b24f8fe9266b3c86baf))
* **deps:** bump dompurify from 3.2.7 to 3.3.0 ([#1175](https://github.com/tambo-ai/tambo/issues/1175)) ([ffd2ec1](https://github.com/tambo-ai/tambo/commit/ffd2ec1b2eb56eaf92f2d7eb68a9529cc3da4f92))
* **deps:** bump framer-motion from 12.23.22 to 12.23.24 ([#1160](https://github.com/tambo-ai/tambo/issues/1160)) ([6dab68f](https://github.com/tambo-ai/tambo/commit/6dab68f916d255174b37c09c041ede244f9f8c4a))
* **deps:** bump lucide-react from 0.545.0 to 0.546.0 ([#1174](https://github.com/tambo-ai/tambo/issues/1174)) ([49dc23f](https://github.com/tambo-ai/tambo/commit/49dc23f7ae1b0d4a88a2cea38aaccab189afa023))
* **deps:** bump posthog-js from 1.273.1 to 1.274.1 ([#1157](https://github.com/tambo-ai/tambo/issues/1157)) ([49445c2](https://github.com/tambo-ai/tambo/commit/49445c267806909c7546d6d452ff94aea8a8e8bc))
* **deps:** bump posthog-js from 1.274.1 to 1.276.0 ([#1173](https://github.com/tambo-ai/tambo/issues/1173)) ([6baf8ce](https://github.com/tambo-ai/tambo/commit/6baf8ce4da39ed9de0223ca74dcb8aaf3358d730))
* **deps:** bump streamdown from 1.3.0 to 1.4.0 ([#1181](https://github.com/tambo-ai/tambo/issues/1181)) ([441d3e0](https://github.com/tambo-ai/tambo/commit/441d3e0587d71fdfb63f2365c52d0aa88bfdbb21))
* **deps:** bump the next group with 2 updates ([#1172](https://github.com/tambo-ai/tambo/issues/1172)) ([61f92b6](https://github.com/tambo-ai/tambo/commit/61f92b6ee158f8f8b62f316d7c138937d851d132))


### Code Refactoring

* **message:** simplify tool call request retrieval and enhance status message handling ([#1152](https://github.com/tambo-ai/tambo/issues/1152)) ([c866b67](https://github.com/tambo-ai/tambo/commit/c866b674e8fcc8524cf0de9e347902ac31efe81f))

## [1.14.0](https://github.com/tambo-ai/tambo/compare/docs-v1.13.1...docs-v1.14.0) (2025-10-09)


### Features

* initial messages ([#1000](https://github.com/tambo-ai/tambo/issues/1000)) ([7d7a52a](https://github.com/tambo-ai/tambo/commit/7d7a52ab45f8d230b428cb83cace36cc1037152f))


### Bug Fixes

* **ui:** text pasting in the message input and update message component to use role instead of actionType ([#1139](https://github.com/tambo-ai/tambo/issues/1139)) ([48b9e5a](https://github.com/tambo-ai/tambo/commit/48b9e5ae11040f86a4a558c3c89e0b22bb8a6af4))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/typescript-sdk from 0.72.1 to 0.73.0 ([#1146](https://github.com/tambo-ai/tambo/issues/1146)) ([47432e7](https://github.com/tambo-ai/tambo/commit/47432e735d7ed3f6d6c99ac1cb727e86936d9c88))
* **deps:** bump lucide-react from 0.544.0 to 0.545.0 ([#1145](https://github.com/tambo-ai/tambo/issues/1145)) ([dae817d](https://github.com/tambo-ai/tambo/commit/dae817d5e0eb279cbb5d0f0a1ed10e98d38bf93b))
* **deps:** bump posthog-js from 1.271.0 to 1.273.1 ([#1143](https://github.com/tambo-ai/tambo/issues/1143)) ([9bbdb3e](https://github.com/tambo-ai/tambo/commit/9bbdb3edd87c19d3a874ae07d463e09a3af3806e))
* **deps:** bump the fumadocs group with 2 updates ([#1142](https://github.com/tambo-ai/tambo/issues/1142)) ([69778e6](https://github.com/tambo-ai/tambo/commit/69778e63328a4e239d226e67e79fcbb02777f0be))

## [1.13.1](https://github.com/tambo-ai/tambo/compare/docs-v1.13.0...docs-v1.13.1) (2025-10-07)


### Miscellaneous Chores

* add reasoning documentation ([#1134](https://github.com/tambo-ai/tambo/issues/1134)) ([8dadfd9](https://github.com/tambo-ai/tambo/commit/8dadfd9ded5ee16fd267f40f5dcebff9d17cab56))
* **deps-dev:** bump the tailwind group with 2 updates ([#1126](https://github.com/tambo-ai/tambo/issues/1126)) ([0cb24a0](https://github.com/tambo-ai/tambo/commit/0cb24a0199da76e8283aafa7cf835c710c19db91))
* **deps-dev:** bump typescript from 5.9.2 to 5.9.3 ([#1132](https://github.com/tambo-ai/tambo/issues/1132)) ([94b23a4](https://github.com/tambo-ai/tambo/commit/94b23a47d2d347033a15a2232b7c04216c982ad3))
* **deps:** bump @tambo-ai/typescript-sdk from 0.72.0 to 0.72.1 ([#1129](https://github.com/tambo-ai/tambo/issues/1129)) ([8d8cf9f](https://github.com/tambo-ai/tambo/commit/8d8cf9f2fe5c0661a576f8f77192d8b9c20ca62f))
* **deps:** bump posthog-js from 1.261.8 to 1.271.0 ([#1130](https://github.com/tambo-ai/tambo/issues/1130)) ([c494411](https://github.com/tambo-ai/tambo/commit/c49441118f8ae5d573f3176b75443836583dda43))
* **deps:** bump the fumadocs group with 3 updates ([#1124](https://github.com/tambo-ai/tambo/issues/1124)) ([82a0757](https://github.com/tambo-ai/tambo/commit/82a0757dfa7f0211c466ba7156b43e44edecf49c))

## [1.13.0](https://github.com/tambo-ai/tambo/compare/docs-v1.12.1...docs-v1.13.0) (2025-10-02)


### Features

* add reasoning UI, smart autoscroll with UI improvements and update component paths to use /tambo ([#1101](https://github.com/tambo-ai/tambo/issues/1101)) ([9ec66c3](https://github.com/tambo-ai/tambo/commit/9ec66c37493eb636d5778e51ca8553ffb9982fc4))


### Miscellaneous Chores

* add agents.md & claude.md to monorepo. ([#1116](https://github.com/tambo-ai/tambo/issues/1116)) ([fe911d4](https://github.com/tambo-ai/tambo/commit/fe911d4613b301cf9a68a6a95ebc2b7a6a294dd5))
* **deps:** bump dompurify from 3.2.6 to 3.2.7 ([#1111](https://github.com/tambo-ai/tambo/issues/1111)) ([024a6ca](https://github.com/tambo-ai/tambo/commit/024a6ca703652cdb1b014ef293e6a07a4eea2269))
* **deps:** bump framer-motion from 12.23.12 to 12.23.22 ([#1107](https://github.com/tambo-ai/tambo/issues/1107)) ([3c0ab4b](https://github.com/tambo-ai/tambo/commit/3c0ab4b9875e2d12166fceb98915a8ef34505118))
* **deps:** bump lucide-react from 0.542.0 to 0.544.0 ([#1105](https://github.com/tambo-ai/tambo/issues/1105)) ([8b5a36b](https://github.com/tambo-ai/tambo/commit/8b5a36b772300f164351443dafe2692432981cff))
* **deps:** bump mermaid from 11.11.0 to 11.12.0 ([#1088](https://github.com/tambo-ai/tambo/issues/1088)) ([03ea0c3](https://github.com/tambo-ai/tambo/commit/03ea0c31b5547a9286314ee2ee3b9962b6b1f4b9))
* **deps:** bump next from 15.5.3 to 15.5.4 in the next group ([#1110](https://github.com/tambo-ai/tambo/issues/1110)) ([dd1a35d](https://github.com/tambo-ai/tambo/commit/dd1a35d669023d0440a885237e73d2109e247144))
* **deps:** bump streamdown from 1.2.0 to 1.3.0 ([#1093](https://github.com/tambo-ai/tambo/issues/1093)) ([761f213](https://github.com/tambo-ai/tambo/commit/761f213340ea0b611d8c712d1b5ca8fb744a8ace))
* **deps:** bump the fumadocs group with 2 updates ([#1109](https://github.com/tambo-ai/tambo/issues/1109)) ([74e09de](https://github.com/tambo-ai/tambo/commit/74e09de369a412b409d12e4d94888125ac1a1bf9))
* **deps:** bump the fumadocs group with 3 updates ([#1085](https://github.com/tambo-ai/tambo/issues/1085)) ([14f5e72](https://github.com/tambo-ai/tambo/commit/14f5e728988b9c03bbe0df1e6c04b15feb9ab6a2))

## [1.12.1](https://github.com/tambo-ai/tambo/compare/docs-v1.12.0...docs-v1.12.1) (2025-09-22)


### Miscellaneous Chores

* Add next-sitemap to docs sitemap to see ([#1083](https://github.com/tambo-ai/tambo/issues/1083)) ([9d500c5](https://github.com/tambo-ai/tambo/commit/9d500c5259cdf440630d3c113b432ed98c1838d6))

## [1.12.0](https://github.com/tambo-ai/tambo/compare/docs-v1.11.0...docs-v1.12.0) (2025-09-20)


### Features

* **docs:** add documentation for custom llm parameters ([#1071](https://github.com/tambo-ai/tambo/issues/1071)) ([fe64ca3](https://github.com/tambo-ai/tambo/commit/fe64ca3a71c9c1616a9269fe7b7a9ec878b1ce4d))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/typescript-sdk to 0.72 for reasoning shape ([#1072](https://github.com/tambo-ai/tambo/issues/1072)) ([a103b5f](https://github.com/tambo-ai/tambo/commit/a103b5fa250b334edaa4d81ba8fe82d36995ae7c))

## [1.11.0](https://github.com/tambo-ai/tambo/compare/docs-v1.10.0...docs-v1.11.0) (2025-09-19)


### Features

* **sdk:** Update to the new "typescript sdk" from stainless ([#1061](https://github.com/tambo-ai/tambo/issues/1061)) ([22dd7e3](https://github.com/tambo-ai/tambo/commit/22dd7e392cbf005a2d8bb7f43a813d53eee51611))


### Miscellaneous Chores

* remove producthunt banners, bubbles and widget ([#1065](https://github.com/tambo-ai/tambo/issues/1065)) ([7ceff06](https://github.com/tambo-ai/tambo/commit/7ceff06f312e404a0e1d3c81efec569139e6f847))

## [1.10.0](https://github.com/tambo-ai/tambo/compare/docs-v1.9.0...docs-v1.10.0) (2025-09-17)


### Features

* **sdk:** partial updates for interactables + auto tools + new docs ([#1036](https://github.com/tambo-ai/tambo/issues/1036)) ([7352f12](https://github.com/tambo-ai/tambo/commit/7352f1274c399215bfc99b4bbd69b3db4b7364cc))


### Miscellaneous Chores

* **deps:** bump mermaid from 11.10.1 to 11.11.0 ([#1051](https://github.com/tambo-ai/tambo/issues/1051)) ([e3b3ce7](https://github.com/tambo-ai/tambo/commit/e3b3ce7fb3751165a86842ca770526eccce9a2ef))
* **deps:** bump next from 15.5.2 to 15.5.3 in the next group across 1 directory ([#1055](https://github.com/tambo-ai/tambo/issues/1055)) ([d21ecdb](https://github.com/tambo-ai/tambo/commit/d21ecdbc498ca018f2763b9f4f1df87fd2edafcc))
* **deps:** bump streamdown from 1.1.5 to 1.2.0 ([#1050](https://github.com/tambo-ai/tambo/issues/1050)) ([f78ae45](https://github.com/tambo-ai/tambo/commit/f78ae4545c1714df7a954ff513da47ef8bd8958e))
* **deps:** bump the fumadocs group with 3 updates ([#1045](https://github.com/tambo-ai/tambo/issues/1045)) ([70bd2dc](https://github.com/tambo-ai/tambo/commit/70bd2dceeb77fc0df89057400a40957e00b9e7ac))
* update sitemap to .co domain ([#1042](https://github.com/tambo-ai/tambo/issues/1042)) ([64b2da1](https://github.com/tambo-ai/tambo/commit/64b2da187dbbc1fda98953bedb3cfe84c6e83d66))


### Documentation

* use https://docs.tambo.co as default baseUrl in layout ([#1043](https://github.com/tambo-ai/tambo/issues/1043)) ([55aa89c](https://github.com/tambo-ai/tambo/commit/55aa89cdea368b8476820504b549ca562c504038))

## [1.9.0](https://github.com/tambo-ai/tambo/compare/docs-v1.8.0...docs-v1.9.0) (2025-09-12)


### Features

* **image:** add image attachment support ([#1001](https://github.com/tambo-ai/tambo/issues/1001)) ([5a8e9a2](https://github.com/tambo-ai/tambo/commit/5a8e9a2267801feb1d24dd43e3bacd4fcc368b53))
* Replace TamboHackBanner with ProductHuntBanner ([#1035](https://github.com/tambo-ai/tambo/issues/1035)) ([7af2f53](https://github.com/tambo-ai/tambo/commit/7af2f5394c5d3d85ee7e0ec03b4b767df946d249))

## [1.8.0](https://github.com/tambo-ai/tambo/compare/docs-v1.7.0...docs-v1.8.0) (2025-09-11)


### Features

* **sdk:** Add onCallUnregisteredTool callback for handling unexpected tool callbacks ([#1030](https://github.com/tambo-ai/tambo/issues/1030)) ([993405b](https://github.com/tambo-ai/tambo/commit/993405b6593b622f6ec755cf93d65c5272a49127))


### Bug Fixes

* **ui:** When tool calls are big, allow scrolling ([#1034](https://github.com/tambo-ai/tambo/issues/1034)) ([8149f6b](https://github.com/tambo-ai/tambo/commit/8149f6bd3f2513861bd699649a0500376388e0c4))


### Miscellaneous Chores

* **docs:** update sitemap domain to docs.tambo.co ([#1027](https://github.com/tambo-ai/tambo/issues/1027)) ([cfd5a7e](https://github.com/tambo-ai/tambo/commit/cfd5a7ea41dd0a7983bce825ccaec997e966a431))

## [1.7.0](https://github.com/tambo-ai/tambo/compare/docs-v1.6.0...docs-v1.7.0) (2025-09-09)


### Features

* add ask to tambo in the ai actions dropdown ([#993](https://github.com/tambo-ai/tambo/issues/993)) ([1b2882c](https://github.com/tambo-ai/tambo/commit/1b2882c8b64c58340551d065cba6500135a2f474))
* **cli:** add analytics template and update related commands and docs ([#978](https://github.com/tambo-ai/tambo/issues/978)) ([5431386](https://github.com/tambo-ai/tambo/commit/5431386a79d3933725c4d395bcf4548869a7c23f))
* **interactables:** Add automatic context injection for interactable components that sends their current state to the AI by default. ([#977](https://github.com/tambo-ai/tambo/issues/977)) ([bdec8f9](https://github.com/tambo-ai/tambo/commit/bdec8f9a3097d7bae52086b6ff0699e0e6759e12))


### Bug Fixes

* resolve ENOENT error during Vercel deployment ([#1019](https://github.com/tambo-ai/tambo/issues/1019)) ([f077236](https://github.com/tambo-ai/tambo/commit/f077236ca44a4b005e5309d4a647ade0597b5344))


### Miscellaneous Chores

* **deps-dev:** bump @tailwindcss/postcss from 4.1.12 to 4.1.13 in the tailwind group ([#1008](https://github.com/tambo-ai/tambo/issues/1008)) ([2aa0126](https://github.com/tambo-ai/tambo/commit/2aa01268b7bc7ec3702249e437cc8df8a6827587))
* **deps:** bump posthog-js from 1.261.0 to 1.261.8 ([#1011](https://github.com/tambo-ai/tambo/issues/1011)) ([fa139f3](https://github.com/tambo-ai/tambo/commit/fa139f335d731e98ac923268aebf2ee2e78539d3))
* **deps:** bump the fumadocs group with 3 updates ([#1006](https://github.com/tambo-ai/tambo/issues/1006)) ([2fcc4e5](https://github.com/tambo-ai/tambo/commit/2fcc4e5cfa8162e444ca16653c138be0fab0c834))

## [1.6.0](https://github.com/tambo-ai/tambo/compare/docs-v1.5.1...docs-v1.6.0) (2025-09-05)


### Features

* **docs:** setup ai page actions ([#943](https://github.com/tambo-ai/tambo/issues/943)) ([836d7a3](https://github.com/tambo-ai/tambo/commit/836d7a3c88edea65fc6441519cc574f53372e01b))

## [1.5.1](https://github.com/tambo-ai/tambo/compare/docs-v1.5.0...docs-v1.5.1) (2025-09-04)


### Miscellaneous Chores

* update tambo mcp url ([#970](https://github.com/tambo-ai/tambo/issues/970)) ([613f3f6](https://github.com/tambo-ai/tambo/commit/613f3f60b832a3306edb66532bab66d73e56a193))

## [1.5.0](https://github.com/tambo-ai/tambo/compare/docs-v1.4.0...docs-v1.5.0) (2025-09-02)


### Features

* **docs:** add sitemap and robots.txt ([#940](https://github.com/tambo-ai/tambo/issues/940)) ([99114d7](https://github.com/tambo-ai/tambo/commit/99114d7f54c2ef71cf4cdea1baa94fe2008ef781))
* **docs:** added support for llms.txt/llm-full.txt along with .mdx support for individual routes ([#935](https://github.com/tambo-ai/tambo/issues/935)) ([9c3bb5c](https://github.com/tambo-ai/tambo/commit/9c3bb5c8d5ddf8b22a547ea8f705ca7308e1500c))


### Bug Fixes

* **docs:** fixed document alignment issue ([#962](https://github.com/tambo-ai/tambo/issues/962)) ([26bc5ad](https://github.com/tambo-ai/tambo/commit/26bc5adc0495ef25e2ef4bd56db602be52a2f72a))
* sidebar overlaps with header [#942](https://github.com/tambo-ai/tambo/issues/942) ([#944](https://github.com/tambo-ai/tambo/issues/944)) ([9467132](https://github.com/tambo-ai/tambo/commit/94671328260e01e5c4aabae77865da1120d6f6fa))


### Miscellaneous Chores

* **deps:** bump next from 15.5.1 to 15.5.2 in the next group across 1 directory ([#955](https://github.com/tambo-ai/tambo/issues/955)) ([c1b99f4](https://github.com/tambo-ai/tambo/commit/c1b99f4eb19edcd18456d1d2cf43df724129d6e9))
* update upgrade command to filter known safe packages ([#959](https://github.com/tambo-ai/tambo/issues/959)) ([3e57bd5](https://github.com/tambo-ai/tambo/commit/3e57bd593e78991664cf66eed2367a47168c65b3))

## [1.4.0](https://github.com/tambo-ai/tambo/compare/docs-v1.3.2...docs-v1.4.0) (2025-08-28)


### Features

* migrate from react-markdown to streamdown ([#927](https://github.com/tambo-ai/tambo/issues/927)) ([fe5648e](https://github.com/tambo-ai/tambo/commit/fe5648e1e15d0181bc3bfc48bebdc556bb4be6b9))


### Miscellaneous Chores

* **deps:** bump mermaid from 11.10.0 to 11.10.1 ([#930](https://github.com/tambo-ai/tambo/issues/930)) ([1de614a](https://github.com/tambo-ai/tambo/commit/1de614af1c04c77bbf2431d347efb6f519a60de2))
* **deps:** bump posthog-js from 1.260.3 to 1.261.0 ([#953](https://github.com/tambo-ai/tambo/issues/953)) ([26e9507](https://github.com/tambo-ai/tambo/commit/26e9507d5976423cdc572757c1c9be40fcfc8789))
* **deps:** bump streamdown from 1.1.3 to 1.1.5 ([#950](https://github.com/tambo-ai/tambo/issues/950)) ([5aff96d](https://github.com/tambo-ai/tambo/commit/5aff96daf6685b7b9198819aba3cb1576d9622a0))
* **deps:** bump the fumadocs group with 3 updates ([#952](https://github.com/tambo-ai/tambo/issues/952)) ([d7e2a72](https://github.com/tambo-ai/tambo/commit/d7e2a7244f2383a2195da67c1a79422b6506b0a7))
* Fix react/mcp subpackage path ([#946](https://github.com/tambo-ai/tambo/issues/946)) ([180ed1b](https://github.com/tambo-ai/tambo/commit/180ed1be9c04dc58c256d1183cdfc812fb3b961b))
* fix tsconfig paths for react-sdk ([#945](https://github.com/tambo-ai/tambo/issues/945)) ([14dab2f](https://github.com/tambo-ai/tambo/commit/14dab2f4ae96e1a3c7b24cc84b0d15d74106f9a5))

## [1.3.2](https://github.com/tambo-ai/tambo/compare/docs-v1.3.1...docs-v1.3.2) (2025-08-27)


### Miscellaneous Chores

* **build:** fix docs build ([#923](https://github.com/tambo-ai/tambo/issues/923)) ([b65f0d3](https://github.com/tambo-ai/tambo/commit/b65f0d371e05285460cf88cb9d51c2141d9747d0))
* **deps:** bump @tambo-ai/typescript-sdk to get deprecated ActionType ([#928](https://github.com/tambo-ai/tambo/issues/928)) ([0b316e6](https://github.com/tambo-ai/tambo/commit/0b316e6d842241069e8b17d5823b8b8df60cbaf8))
* **deps:** bump fumadocs-mdx from 11.7.5 to 11.8.0 ([#918](https://github.com/tambo-ai/tambo/issues/918)) ([2604122](https://github.com/tambo-ai/tambo/commit/26041226db95e8cfeff7882a2a546c44418d7e83))
* **deps:** bump lucide-react from 0.540.0 to 0.541.0 ([#916](https://github.com/tambo-ai/tambo/issues/916)) ([50da283](https://github.com/tambo-ai/tambo/commit/50da2833e2e451211377cde13abd28d5835e2b7c))
* **deps:** bump next from 15.4.7 to 15.5.0 ([#914](https://github.com/tambo-ai/tambo/issues/914)) ([4c4ff85](https://github.com/tambo-ai/tambo/commit/4c4ff85c219e8018f743d5fbe32d8a2b111819dc))
* **deps:** bump posthog-js from 1.260.1 to 1.260.2 ([#921](https://github.com/tambo-ai/tambo/issues/921)) ([f14e759](https://github.com/tambo-ai/tambo/commit/f14e7590129c2d4d32ee551c840b8a7773692a22))
* remove conversational-form template from CLI and documentation ([#908](https://github.com/tambo-ai/tambo/issues/908)) ([3f24f2b](https://github.com/tambo-ai/tambo/commit/3f24f2be17819e338df031ea26d3c27f4caf9637))


### Documentation

* update component-state docs ([#936](https://github.com/tambo-ai/tambo/issues/936)) ([102227b](https://github.com/tambo-ai/tambo/commit/102227bde99ebf94e1bbb708e45683f43027184a))

## [1.3.1](https://github.com/tambo-ai/tambo/compare/docs-v1.3.0...docs-v1.3.1) (2025-08-23)


### Miscellaneous Chores

* update dependencies and update message input handling ([#905](https://github.com/tambo-ai/tambo/issues/905)) ([8015195](https://github.com/tambo-ai/tambo/commit/80151952ea321f8cf65a5e9b447b84ea6986125e))

## [1.3.0](https://github.com/tambo-ai/tambo/compare/docs-v1.2.4...docs-v1.3.0) (2025-08-21)


### Features

* add tambo hack banner and update mobile layout ([#895](https://github.com/tambo-ai/tambo/issues/895)) ([bb04b1c](https://github.com/tambo-ai/tambo/commit/bb04b1cff0eccbf087a4c5d4b01b24eb64dc9014))
* **docs:** integrate PostHog for analytics and add Web Vitals reporting ([#894](https://github.com/tambo-ai/tambo/issues/894)) ([90c5c3f](https://github.com/tambo-ai/tambo/commit/90c5c3f05702fd18c29a6caf342b013ee2788f5e))
* useTamboThreadInput context return reactquery values ([#897](https://github.com/tambo-ai/tambo/issues/897)) ([13aeff6](https://github.com/tambo-ai/tambo/commit/13aeff669bd5760e4f8f93e9ff77dae301f4ba83))

## [1.2.4](https://github.com/tambo-ai/tambo/compare/docs-v1.2.3...docs-v1.2.4) (2025-08-20)


### Miscellaneous

* **deps:** bump mermaid from 11.9.0 to 11.10.0 in the npm_and_yarn group ([#871](https://github.com/tambo-ai/tambo/issues/871)) ([e4f5feb](https://github.com/tambo-ai/tambo/commit/e4f5febb7b211f9d783cf347d8909be4c0a37106))

## [1.2.3](https://github.com/tambo-ai/tambo/compare/docs-v1.2.2...docs-v1.2.3) (2025-08-20)


### Miscellaneous

* **deps-dev:** bump @tailwindcss/postcss from 4.1.11 to 4.1.12 ([#855](https://github.com/tambo-ai/tambo/issues/855)) ([a7b5caf](https://github.com/tambo-ai/tambo/commit/a7b5caf2ef12781fe5e16033a5d8449cecea6512))
* **deps:** bump fumadocs-core from 15.6.10 to 15.6.12 ([#850](https://github.com/tambo-ai/tambo/issues/850)) ([24644a1](https://github.com/tambo-ai/tambo/commit/24644a1358824475ed50442ee1493b66bce34c9f))
* **deps:** bump fumadocs-mdx from 11.7.4 to 11.7.5 ([#860](https://github.com/tambo-ai/tambo/issues/860)) ([512a202](https://github.com/tambo-ai/tambo/commit/512a202b266eea819daae1d4861b7b6ff9e68aea))
* **deps:** bump fumadocs-ui from 15.6.9 to 15.6.12 ([#854](https://github.com/tambo-ai/tambo/issues/854)) ([4f26122](https://github.com/tambo-ai/tambo/commit/4f261225de8ca869f136e714c3fd3538893e24db))
* **deps:** bump lucide-react from 0.539.0 to 0.540.0 ([#849](https://github.com/tambo-ai/tambo/issues/849)) ([52f4804](https://github.com/tambo-ai/tambo/commit/52f48045cc051882c990b353c3ef9152717abe2a))
* **deps:** bump next from 15.4.6 to 15.4.7 ([#862](https://github.com/tambo-ai/tambo/issues/862)) ([7abc4f9](https://github.com/tambo-ai/tambo/commit/7abc4f97337d08adc5bd132dd4e6f44dfaea6b35))
* **deps:** Fix some duplicated/misaligned [@types](https://github.com/types) versions ([#867](https://github.com/tambo-ai/tambo/issues/867)) ([0c3fcfe](https://github.com/tambo-ai/tambo/commit/0c3fcfe4a7356966e74104b5c60397aab7eb7848))


### Documentation

* add docs header and chatwithtambo ([#838](https://github.com/tambo-ai/tambo/issues/838)) ([8509f26](https://github.com/tambo-ai/tambo/commit/8509f26180ca1f3d53333b61321c3fa6c54f263a))

## [1.2.2](https://github.com/tambo-ai/tambo/compare/docs-v1.2.1...docs-v1.2.2) (2025-08-14)


### Miscellaneous

* **deps:** bump fumadocs-core from 15.6.6 to 15.6.9 ([#821](https://github.com/tambo-ai/tambo/issues/821)) ([2423953](https://github.com/tambo-ai/tambo/commit/24239533114148903d0195ddce8e8b1c57602c64))
* **deps:** bump fumadocs-mdx from 11.7.3 to 11.7.4 ([#824](https://github.com/tambo-ai/tambo/issues/824)) ([8eef4cf](https://github.com/tambo-ai/tambo/commit/8eef4cf44339772709cd690657f46fcd83d063e8))
* **deps:** bump lucide-react from 0.536.0 to 0.539.0 ([#830](https://github.com/tambo-ai/tambo/issues/830)) ([1dfe483](https://github.com/tambo-ai/tambo/commit/1dfe483dc92ec6a3e043f9d15f958d183f87e557))
* **deps:** bump next from 15.4.4 to 15.4.6 ([#828](https://github.com/tambo-ai/tambo/issues/828)) ([a073604](https://github.com/tambo-ai/tambo/commit/a0736041c951d21c84c23979b617dc47d62648bd))


### Documentation

* add tambo mcp doc page ([#835](https://github.com/tambo-ai/tambo/issues/835)) ([69d9777](https://github.com/tambo-ai/tambo/commit/69d977735ac734d83f6f1ebd321011c3559d66df))

## [1.2.1](https://github.com/tambo-ai/tambo/compare/docs-v1.2.0...docs-v1.2.1) (2025-08-08)


### Documentation

* add new section for Models ([#809](https://github.com/tambo-ai/tambo/issues/809)) ([7b4652a](https://github.com/tambo-ai/tambo/commit/7b4652a8c961f0b14b9022e5be54e6d86e1f5287))

## [1.2.0](https://github.com/tambo-ai/tambo/compare/docs-v1.1.2...docs-v1.2.0) (2025-08-07)


### Features

* add custom context helpers for additional context ([#801](https://github.com/tambo-ai/tambo/issues/801)) ([2e33769](https://github.com/tambo-ai/tambo/commit/2e3376962c096e965266a9db96b0dcdc5c930b43))

## [1.1.2](https://github.com/tambo-ai/tambo/compare/docs-v1.1.1...docs-v1.1.2) (2025-08-05)


### Miscellaneous

* **deps-dev:** bump typescript from 5.8.3 to 5.9.2 ([#790](https://github.com/tambo-ai/tambo/issues/790)) ([49b86a0](https://github.com/tambo-ai/tambo/commit/49b86a0ba3198419054b7b75af9970321224b997))
* **deps:** bump fumadocs-mdx from 11.7.1 to 11.7.3 ([#785](https://github.com/tambo-ai/tambo/issues/785)) ([f73a4ce](https://github.com/tambo-ai/tambo/commit/f73a4ce189618be6c13a226aa370dca31e61a7cb))
* **deps:** bump fumadocs-ui from 15.6.6 to 15.6.9 ([#783](https://github.com/tambo-ai/tambo/issues/783)) ([c73936c](https://github.com/tambo-ai/tambo/commit/c73936c84e22308069843439fe0107558d5534ba))
* **deps:** bump lucide-react from 0.532.0 to 0.536.0 ([#781](https://github.com/tambo-ai/tambo/issues/781)) ([9f80a50](https://github.com/tambo-ai/tambo/commit/9f80a50c9359c3df741f329584608c35f7fbee58))


### Documentation

* update function name in interactables doc to 'withInteractable' ([#799](https://github.com/tambo-ai/tambo/issues/799)) ([cbb2ada](https://github.com/tambo-ai/tambo/commit/cbb2adab2e3c5c213203b8a7eb09f56ac4c52225))

## [1.1.1](https://github.com/tambo-ai/tambo/compare/docs-v1.1.0...docs-v1.1.1) (2025-08-05)


### Miscellaneous

* update additional context docs ([#780](https://github.com/tambo-ai/tambo/issues/780)) ([dcaaa1c](https://github.com/tambo-ai/tambo/commit/dcaaa1c91a966c6882aa61075b1391a4682ab313))


### Documentation

* add init docs llms.txt ([#778](https://github.com/tambo-ai/tambo/issues/778)) ([4624b34](https://github.com/tambo-ai/tambo/commit/4624b3447f115b23879acf58a416de63203d5c3a))

## [1.1.0](https://github.com/tambo-ai/tambo/compare/docs-v1.0.12...docs-v1.1.0) (2025-08-05)


### Features

* add pre-built context helpers ([#769](https://github.com/tambo-ai/tambo/issues/769)) ([757448b](https://github.com/tambo-ai/tambo/commit/757448b949f33a89ad0bc25b56918d95748da5ab))


### Bug Fixes

* remove last edit from docs to allow build ([#777](https://github.com/tambo-ai/tambo/issues/777)) ([7cf864a](https://github.com/tambo-ai/tambo/commit/7cf864a38ef5be9bbd1f36bb404538806041f2c9))

## [1.0.12](https://github.com/tambo-ai/tambo/compare/docs-v1.0.11...docs-v1.0.12) (2025-08-03)


### Documentation

* add 'edit on github' link to docs pages ([#767](https://github.com/tambo-ai/tambo/issues/767)) ([63aae74](https://github.com/tambo-ai/tambo/commit/63aae74b57395baa076a8da80a68ee8da784515b))

## [1.0.11](https://github.com/tambo-ai/tambo/compare/docs-v1.0.10...docs-v1.0.11) (2025-08-03)


### Bug Fixes

* add back in doc gif ([#765](https://github.com/tambo-ai/tambo/issues/765)) ([6be69e5](https://github.com/tambo-ai/tambo/commit/6be69e553b9138546d4d66c9059ea50a27faad29))

## [1.0.10](https://github.com/tambo-ai/tambo/compare/docs-v1.0.9...docs-v1.0.10) (2025-08-01)


### Documentation

* fix mermaid diagram ([#763](https://github.com/tambo-ai/tambo/issues/763)) ([b33d5cf](https://github.com/tambo-ai/tambo/commit/b33d5cf04c71345f768097e85de13e8dc5a81748))

## [1.0.9](https://github.com/tambo-ai/tambo/compare/docs-v1.0.8...docs-v1.0.9) (2025-08-01)


### Documentation

* trigger docs release ([#755](https://github.com/tambo-ai/tambo/issues/755)) ([5ff8544](https://github.com/tambo-ai/tambo/commit/5ff8544ac21dac547cc27f7673ba586fe00a0c55))

## [1.0.8](https://github.com/tambo-ai/tambo/compare/docs-v1.0.7...docs-v1.0.8) (2025-08-01)


### Documentation

* small change to trigger release ([#752](https://github.com/tambo-ai/tambo/issues/752)) ([7c1975c](https://github.com/tambo-ai/tambo/commit/7c1975cb59c1267d095d1334c0feed882feb8317))

## [1.0.7](https://github.com/tambo-ai/tambo/compare/docs-v1.0.6...docs-v1.0.7) (2025-08-01)


### Miscellaneous

* **docs:** add documentation for additional context ([#745](https://github.com/tambo-ai/tambo/issues/745)) ([84ccd70](https://github.com/tambo-ai/tambo/commit/84ccd705fccf3e4acb798134d998bacf199e6fb7))

## [1.0.6](https://github.com/tambo-ai/tambo/compare/docs-v1.0.5...docs-v1.0.6) (2025-07-31)


### Documentation

* Add Interactables doc page ([#744](https://github.com/tambo-ai/tambo/issues/744)) ([cfacd3d](https://github.com/tambo-ai/tambo/commit/cfacd3dc23a80ef4c2d135a5c02d6a1c5374f119))

## [1.0.5](https://github.com/tambo-ai/tambo/compare/docs-v1.0.4...docs-v1.0.5) (2025-07-29)


### Miscellaneous

* **deps:** bump fumadocs-core from 15.6.5 to 15.6.6 ([#732](https://github.com/tambo-ai/tambo/issues/732)) ([14aa154](https://github.com/tambo-ai/tambo/commit/14aa1540c7944d5538ac2e0ab525bfbeb35f3039))
* **deps:** bump fumadocs-mdx from 11.7.0 to 11.7.1 ([#725](https://github.com/tambo-ai/tambo/issues/725)) ([6f786ae](https://github.com/tambo-ai/tambo/commit/6f786ae482c698f13237fef70a874dbe75f33773))
* **deps:** bump fumadocs-ui from 15.6.5 to 15.6.6 ([#735](https://github.com/tambo-ai/tambo/issues/735)) ([44a55bd](https://github.com/tambo-ai/tambo/commit/44a55bd92c3a9f8eba1aaac3ac8f8bb9dd32b98f))
* **deps:** bump next from 15.3.5 to 15.4.4 ([#724](https://github.com/tambo-ai/tambo/issues/724)) ([bcbc50a](https://github.com/tambo-ai/tambo/commit/bcbc50a4e7cea5fcf720ca6d0ffbe57c5897cf54))

## [1.0.4](https://github.com/tambo-ai/tambo/compare/docs-v1.0.3...docs-v1.0.4) (2025-07-29)


### Miscellaneous

* **main:** release docs 1.0.3 ([#719](https://github.com/tambo-ai/tambo/issues/719)) ([4050059](https://github.com/tambo-ai/tambo/commit/40500595b916bab7922cb663f5958bf9cdd2ce3a))

## [1.0.3](https://github.com/tambo-ai/tambo/compare/docs-v1.0.2...docs-v1.0.3) (2025-07-28)


### Bug Fixes

* cleanup TamboPropStreamProvider ([#713](https://github.com/tambo-ai/tambo/issues/713)) ([d486d0a](https://github.com/tambo-ai/tambo/commit/d486d0aeef52930fb531d15fbe3e662af09ad254))


### Miscellaneous

* **main:** release docs 1.0.3 ([#718](https://github.com/tambo-ai/tambo/issues/718)) ([49b85b1](https://github.com/tambo-ai/tambo/commit/49b85b1717417708e58a9901b7331536bd006b2e))

## [1.0.3](https://github.com/tambo-ai/tambo/compare/docs-v1.0.2...docs-v1.0.3) (2025-07-28)


### Bug Fixes

* cleanup TamboPropStreamProvider ([#713](https://github.com/tambo-ai/tambo/issues/713)) ([d486d0a](https://github.com/tambo-ai/tambo/commit/d486d0aeef52930fb531d15fbe3e662af09ad254))

## [1.0.2](https://github.com/tambo-ai/tambo/compare/docs-v1.0.1...docs-v1.0.2) (2025-07-25)


### Documentation

* small update to trigger release ([#708](https://github.com/tambo-ai/tambo/issues/708)) ([52bcfed](https://github.com/tambo-ai/tambo/commit/52bcfedac8e4aca0ede00959787c48b8ab672cc3))

## [1.0.1](https://github.com/tambo-ai/tambo/compare/docs-v1.0.0...docs-v1.0.1) (2025-07-25)


### Documentation

* small update to test release ([#705](https://github.com/tambo-ai/tambo/issues/705)) ([b3de946](https://github.com/tambo-ai/tambo/commit/b3de94634527e56d489eae50c7a65cfa1dd110f5))

## 1.0.0 (2025-07-23)


### Features

* setup release-please for docs site ([#699](https://github.com/tambo-ai/tambo/issues/699)) ([13cb83d](https://github.com/tambo-ai/tambo/commit/13cb83d09c98994d6ce56e11b2d5dfb143e0c32d))


### Miscellaneous

* update documentation links to new domain and update dev command filter ([#698](https://github.com/tambo-ai/tambo/issues/698)) ([23946de](https://github.com/tambo-ai/tambo/commit/23946de0d4a67919e119f7188731f83bcc2e86a0))


### Documentation

* add recently-added docs ([#701](https://github.com/tambo-ai/tambo/issues/701)) ([5044c5a](https://github.com/tambo-ai/tambo/commit/5044c5aefc03ddc586b8239e78d91ae716712714))
* move docs to opensource repo ([#697](https://github.com/tambo-ai/tambo/issues/697)) ([3576dac](https://github.com/tambo-ai/tambo/commit/3576dace7c6dc33308e228395211a1a2f38ad17a))
