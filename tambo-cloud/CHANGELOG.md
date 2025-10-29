# Changelog

## [0.120.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.120.0...repo-v0.120.1) (2025-10-29)


### Miscellaneous Chores

* **blog:** Add cheatsheet blog post. ([#2004](https://github.com/tambo-ai/tambo-cloud/issues/2004)) ([787527f](https://github.com/tambo-ai/tambo-cloud/commit/787527fd3744182fed2fe9a02fde2a9ff2ee8ccc))

## [0.120.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.119.0...repo-v0.120.0) (2025-10-28)


### Features

* add dockerfile for mcp-everything ([#1999](https://github.com/tambo-ai/tambo-cloud/issues/1999)) ([94180a5](https://github.com/tambo-ai/tambo-cloud/commit/94180a5c16aa56f476974f1cf353866f777bfdab))


### Bug Fixes

* better MCP Everything docker deploy ([#2001](https://github.com/tambo-ai/tambo-cloud/issues/2001)) ([c0a88a9](https://github.com/tambo-ai/tambo-cloud/commit/c0a88a9eb32f089a5da197e277269862ab064b5c))
* Ensure Tambo always responds with a complete _tambo_displayMessage ([#2003](https://github.com/tambo-ai/tambo-cloud/issues/2003)) ([a569086](https://github.com/tambo-ai/tambo-cloud/commit/a569086eb5d4bd533f9011589aaa194d6237c370))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group across 1 directory with 3 updates ([#1998](https://github.com/tambo-ai/tambo-cloud/issues/1998)) ([b14647c](https://github.com/tambo-ai/tambo-cloud/commit/b14647cce7c41a0cf9d82ee1fa3e09f085cc4a46))

## [0.119.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.118.1...repo-v0.119.0) (2025-10-27)


### Features

* add audio transcription route ([#1983](https://github.com/tambo-ai/tambo-cloud/issues/1983)) ([f57a502](https://github.com/tambo-ai/tambo-cloud/commit/f57a50238ec99fc878c091e4a102c4e9f5a66d43))
* add context badge for images ([#1982](https://github.com/tambo-ai/tambo-cloud/issues/1982)) ([807140a](https://github.com/tambo-ai/tambo-cloud/commit/807140a151307a9dcaace1f9155108c3fb6b3711))
* remove reactivation emails ([#1984](https://github.com/tambo-ai/tambo-cloud/issues/1984)) ([d3b461d](https://github.com/tambo-ai/tambo-cloud/commit/d3b461d4ab0b41ba152c44d3338df493c39d19fb))


### Bug Fixes

* let handleAdvanceStream end streams on error ([#1997](https://github.com/tambo-ai/tambo-cloud/issues/1997)) ([2e9bfc2](https://github.com/tambo-ai/tambo-cloud/commit/2e9bfc283b90f46750bf95960390538556cccc51))
* make mcp prompts proxy correcty ([#1986](https://github.com/tambo-ai/tambo-cloud/issues/1986)) ([477b49f](https://github.com/tambo-ai/tambo-cloud/commit/477b49f8444fde9a3a6bbb3acd1c423b9ce7a756))


### Miscellaneous Chores

* **deps:** bump @langfuse/otel from 4.2.0 to 4.2.1 ([#1992](https://github.com/tambo-ai/tambo-cloud/issues/1992)) ([832db40](https://github.com/tambo-ai/tambo-cloud/commit/832db40c8556425382753b047edd8757789f68d9))
* **deps:** bump drizzle-orm from 0.44.6 to 0.44.7 in the drizzle group ([#1989](https://github.com/tambo-ai/tambo-cloud/issues/1989)) ([35d092f](https://github.com/tambo-ai/tambo-cloud/commit/35d092f7de1c794085da23b5984428ca6bbda38a))
* **deps:** bump langfuse from 3.38.5 to 3.38.6 ([#1995](https://github.com/tambo-ai/tambo-cloud/issues/1995)) ([94d5539](https://github.com/tambo-ai/tambo-cloud/commit/94d5539003cda9a528eff119acf39832405d00b2))
* **deps:** bump recharts from 3.2.1 to 3.3.0 ([#1993](https://github.com/tambo-ai/tambo-cloud/issues/1993)) ([7505fe1](https://github.com/tambo-ai/tambo-cloud/commit/7505fe1384ee088da31d673b8eb0c3c3715fc62a))
* **deps:** bump the ai-sdk group with 3 updates ([#1990](https://github.com/tambo-ai/tambo-cloud/issues/1990)) ([464daa8](https://github.com/tambo-ai/tambo-cloud/commit/464daa8d9bea6fc46a1dd3d00af8e6faa965165e))
* **deps:** bump the nestjs group with 4 updates ([#1988](https://github.com/tambo-ai/tambo-cloud/issues/1988)) ([ac620bc](https://github.com/tambo-ai/tambo-cloud/commit/ac620bc86eeb949ad706f1e26b3f3c9621ab44bd))
* **deps:** bump the sentry group with 3 updates ([#1994](https://github.com/tambo-ai/tambo-cloud/issues/1994)) ([6e9db3e](https://github.com/tambo-ai/tambo-cloud/commit/6e9db3e7bc866b99e30fdb305284482a613b2cd4))
* **deps:** bump the small-safe-packages group with 8 updates ([#1991](https://github.com/tambo-ai/tambo-cloud/issues/1991)) ([3f1d344](https://github.com/tambo-ai/tambo-cloud/commit/3f1d3448fa611c347328cc0d17676b73ca24563d))

## [0.118.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.118.0...repo-v0.118.1) (2025-10-23)


### Bug Fixes

* fall back to latest non-child message in the db if parentMessageId was not passed through the sampling _meta request ([#1979](https://github.com/tambo-ai/tambo-cloud/issues/1979)) ([3182323](https://github.com/tambo-ai/tambo-cloud/commit/3182323bb2b1730eb2f913e8286f787d1d627fa7))


### Miscellaneous Chores

* add MCP Sampling blogpost ([#1976](https://github.com/tambo-ai/tambo-cloud/issues/1976)) ([a569ac3](https://github.com/tambo-ai/tambo-cloud/commit/a569ac3bd48e7858c9f3a59cd19172d04c1f3cc4))
* **deps:** bump tambo version to get mcpAccessToken behavior ([#1980](https://github.com/tambo-ai/tambo-cloud/issues/1980)) ([de0e49f](https://github.com/tambo-ai/tambo-cloud/commit/de0e49ff19091282953ae6317a069595a1cb1058))

## [0.118.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.117.0...repo-v0.118.0) (2025-10-22)


### Features

* refactor tool registration for tambo ([#1948](https://github.com/tambo-ai/tambo-cloud/issues/1948)) ([60d9bd4](https://github.com/tambo-ai/tambo-cloud/commit/60d9bd41217555272adbec1b78aac6332ff9a013))
* stub out "proxy" mcp server, just for prompts ([#1949](https://github.com/tambo-ai/tambo-cloud/issues/1949)) ([8de353e](https://github.com/tambo-ai/tambo-cloud/commit/8de353e6ee99b0f5bb8aaeadc8ccc06aa7675b4d))


### Bug Fixes

* add mastra to ag-ui group so packages move together ([#1965](https://github.com/tambo-ai/tambo-cloud/issues/1965)) ([d5523e3](https://github.com/tambo-ai/tambo-cloud/commit/d5523e35795e1cf205640f48371cce86ac16b014))
* handle images in tool call responses ([#1978](https://github.com/tambo-ai/tambo-cloud/issues/1978)) ([bb1c2ac](https://github.com/tambo-ai/tambo-cloud/commit/bb1c2ac1a49690d850fed2fa38744c513ce31786))


### Miscellaneous Chores

* bump to node 22.21 ([#1977](https://github.com/tambo-ai/tambo-cloud/issues/1977)) ([0d55d15](https://github.com/tambo-ai/tambo-cloud/commit/0d55d155e5166d9e78ffa685ac68a9776bbba6dc))
* **deps:** bump @modelcontextprotocol/sdk from 1.19.1 to 1.20.1 ([#1975](https://github.com/tambo-ai/tambo-cloud/issues/1975)) ([222418b](https://github.com/tambo-ai/tambo-cloud/commit/222418bdfe2c9cb1db6506deb1eedb218f688213))
* **deps:** bump @tambo-ai/typescript-sdk from 0.74.0 to 0.75.0 in the tambo-ai group ([#1968](https://github.com/tambo-ai/tambo-cloud/issues/1968)) ([ae94211](https://github.com/tambo-ai/tambo-cloud/commit/ae94211a2599e6855498c9b3895add046f8f609f))
* **deps:** bump @tanstack/react-query from 5.90.2 to 5.90.5 ([#1973](https://github.com/tambo-ai/tambo-cloud/issues/1973)) ([f8904a9](https://github.com/tambo-ai/tambo-cloud/commit/f8904a9b62f34e7ba5cb283cf890fed7ff01f77a))
* **deps:** bump gpt-tokenizer from 3.0.1 to 3.2.0 ([#1972](https://github.com/tambo-ai/tambo-cloud/issues/1972)) ([2f487d4](https://github.com/tambo-ai/tambo-cloud/commit/2f487d4267f54b0771a3e87044cc837c41e6a946))
* **deps:** bump openai from 6.1.0 to 6.4.0 ([#1974](https://github.com/tambo-ai/tambo-cloud/issues/1974)) ([707b06d](https://github.com/tambo-ai/tambo-cloud/commit/707b06d8ac6c2db6854684d0efaf525aca91e166))
* **deps:** bump react-hook-form from 7.64.0 to 7.65.0 ([#1971](https://github.com/tambo-ai/tambo-cloud/issues/1971)) ([839a1b6](https://github.com/tambo-ai/tambo-cloud/commit/839a1b6f6c31f8c0079aa3285a21f4e032f4cd66))
* **deps:** bump streamdown from 1.3.0 to 1.4.0 ([#1970](https://github.com/tambo-ai/tambo-cloud/issues/1970)) ([770c570](https://github.com/tambo-ai/tambo-cloud/commit/770c57057884660ed8b456eecab34c9ac921641c))
* **deps:** bump the ai-sdk group with 4 updates ([#1955](https://github.com/tambo-ai/tambo-cloud/issues/1955)) ([7d4e675](https://github.com/tambo-ai/tambo-cloud/commit/7d4e6757def43b0f2de1f812a8081d0ba7da211d))
* **deps:** bump the sentry group with 3 updates ([#1959](https://github.com/tambo-ai/tambo-cloud/issues/1959)) ([7774023](https://github.com/tambo-ai/tambo-cloud/commit/77740232d557b238b41439397fe767f16729e544))
* **deps:** bump the small-safe-packages group with 2 updates ([#1969](https://github.com/tambo-ai/tambo-cloud/issues/1969)) ([4fd171b](https://github.com/tambo-ai/tambo-cloud/commit/4fd171b5e87b70a5a019699c0768c200a3aafa88))

## [0.117.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.116.1...repo-v0.117.0) (2025-10-20)


### Features

* add support for claude 4.5 ([#1950](https://github.com/tambo-ai/tambo-cloud/issues/1950)) ([9136613](https://github.com/tambo-ai/tambo-cloud/commit/913661375df0f00681a6e25be60500fb6da7ca7f))
* **api:** make the mcpAccessToken optional, only returning it if we have any mcp servers ([#1963](https://github.com/tambo-ai/tambo-cloud/issues/1963)) ([729f9b1](https://github.com/tambo-ai/tambo-cloud/commit/729f9b18b892042431a8faa6922c38ecef0cdd26))


### Bug Fixes

* eslintconfig for docs-mcp ([#1964](https://github.com/tambo-ai/tambo-cloud/issues/1964)) ([69cb6ab](https://github.com/tambo-ai/tambo-cloud/commit/69cb6ab7703e5c824eebcdc8b1ecfd26cd18bee2))
* use types to make sure all exposed models are supported ([#1952](https://github.com/tambo-ai/tambo-cloud/issues/1952)) ([78cec10](https://github.com/tambo-ai/tambo-cloud/commit/78cec1077bf1b2fc651901838fd00ee5ce9633dc))


### Miscellaneous Chores

* **deps:** bump @nestjs/swagger from 11.2.0 to 11.2.1 in the nestjs group ([#1953](https://github.com/tambo-ai/tambo-cloud/issues/1953)) ([b37ed16](https://github.com/tambo-ai/tambo-cloud/commit/b37ed1698340ef0c17ade3f5b3c173f693c2b7a7))
* **deps:** bump @tambo-ai/typescript-sdk from 0.73.0 to 0.74.0 in the tambo-ai group ([#1957](https://github.com/tambo-ai/tambo-cloud/issues/1957)) ([d0a46a8](https://github.com/tambo-ai/tambo-cloud/commit/d0a46a89e4baf9f2563b0b562f7f5a6a35b3331d))
* **deps:** bump dompurify from 3.2.7 to 3.3.0 ([#1962](https://github.com/tambo-ai/tambo-cloud/issues/1962)) ([ae245d7](https://github.com/tambo-ai/tambo-cloud/commit/ae245d7be2aaba8a2f0c68fdcc238f0d381f34ff))
* **deps:** bump resend from 6.1.2 to 6.1.3 ([#1961](https://github.com/tambo-ai/tambo-cloud/issues/1961)) ([54617a0](https://github.com/tambo-ai/tambo-cloud/commit/54617a0507691281031ee92467ee9c4331ac776c))
* **deps:** bump the next group with 2 updates ([#1956](https://github.com/tambo-ai/tambo-cloud/issues/1956)) ([6b47756](https://github.com/tambo-ai/tambo-cloud/commit/6b47756cefbf03196b7f4b070f113db2322619d6))
* **deps:** bump the small-safe-packages group with 2 updates ([#1958](https://github.com/tambo-ai/tambo-cloud/issues/1958)) ([ebb288c](https://github.com/tambo-ai/tambo-cloud/commit/ebb288c3f2b291a067cb36591b4fc0a800fdd516))

## [0.116.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.116.0...repo-v0.116.1) (2025-10-16)


### Bug Fixes

* **api:** Make sure thread API returns tool calls ([#1944](https://github.com/tambo-ai/tambo-cloud/issues/1944)) ([99b1108](https://github.com/tambo-ai/tambo-cloud/commit/99b110888e304717941e0444d26d0fdb5d4a4552))
* calculate reasoningduration of all steps ([#1947](https://github.com/tambo-ai/tambo-cloud/issues/1947)) ([aead3e9](https://github.com/tambo-ai/tambo-cloud/commit/aead3e977ac59e51a84afda2601e6b4b225940bb))


### Code Refactoring

* **mcp:** Clean up and add tests to mcp oauth setup, mcp client setup, mcp oauth token verification, etc ([#1946](https://github.com/tambo-ai/tambo-cloud/issues/1946)) ([9ec7032](https://github.com/tambo-ai/tambo-cloud/commit/9ec7032ed24e7a6eaf5ca40f646951bd1d6f1afe))

## [0.116.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.115.0...repo-v0.116.0) (2025-10-15)


### Features

* **backend:** move suggestions generation to internal model ([#1941](https://github.com/tambo-ai/tambo-cloud/issues/1941)) ([f424f66](https://github.com/tambo-ai/tambo-cloud/commit/f424f66e4b1ed169e5ce4c99d8b8ff1883e18830))
* Stream sampling messages back to client ([#1940](https://github.com/tambo-ai/tambo-cloud/issues/1940)) ([b39abbf](https://github.com/tambo-ai/tambo-cloud/commit/b39abbf5e8b33bd90fb9704129c92504c1219739))
* Track reasoning duration, set minimal effort ([#1942](https://github.com/tambo-ai/tambo-cloud/issues/1942)) ([758626a](https://github.com/tambo-ai/tambo-cloud/commit/758626a5ae13eed58b38251c98434f2c4cc02788))


### Bug Fixes

* add reasoningSummary to openai provider default params ([#1938](https://github.com/tambo-ai/tambo-cloud/issues/1938)) ([c355401](https://github.com/tambo-ai/tambo-cloud/commit/c355401bc732b2f8f94df692f7e3fd8ac31c731c))


### Tests

* **threads:** Add more tests for threads service ([#1943](https://github.com/tambo-ai/tambo-cloud/issues/1943)) ([0da3d7a](https://github.com/tambo-ai/tambo-cloud/commit/0da3d7a533b8ab2c94f3c5232ea55861cfbea723))

## [0.115.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.114.0...repo-v0.115.0) (2025-10-13)


### Features

* **web:** shift to message thread panel and modal design ([#1925](https://github.com/tambo-ai/tambo-cloud/issues/1925)) ([0c8fc4d](https://github.com/tambo-ai/tambo-cloud/commit/0c8fc4db0f3c086d394b3e5c1d724f8f503df342))


### Bug Fixes

* **backend:** suggestions failing with tool call messages ([#1923](https://github.com/tambo-ai/tambo-cloud/issues/1923)) ([1c1f1de](https://github.com/tambo-ai/tambo-cloud/commit/1c1f1de317fb687ea7f2f3c1a1371ae57b1d2fbd))
* **debugging:** Revive langfuse support ([#1918](https://github.com/tambo-ai/tambo-cloud/issues/1918)) ([a125b82](https://github.com/tambo-ai/tambo-cloud/commit/a125b82a894a016c3b5d76c307304c7e46ebcc95))


### Reverts

* "fix(debugging): Revive langfuse support" ([#1920](https://github.com/tambo-ai/tambo-cloud/issues/1920)) ([c7a670c](https://github.com/tambo-ai/tambo-cloud/commit/c7a670c2ee32967cc96062eeb9343d3c786fe22e))


### Miscellaneous Chores

* bump tambo assistant components ([#1922](https://github.com/tambo-ai/tambo-cloud/issues/1922)) ([74f758a](https://github.com/tambo-ai/tambo-cloud/commit/74f758a032821b8ad2ac8e27d548bcc515f7a8cc))
* **deps-dev:** bump @nestjs/schematics from 11.0.8 to 11.0.9 in the nestjs group ([#1928](https://github.com/tambo-ai/tambo-cloud/issues/1928)) ([254069d](https://github.com/tambo-ai/tambo-cloud/commit/254069d6f1dd1650293d55819a52894af7095ed3))
* **deps-dev:** bump ts-jest from 29.4.4 to 29.4.5 in the testing group ([#1929](https://github.com/tambo-ai/tambo-cloud/issues/1929)) ([5e3c621](https://github.com/tambo-ai/tambo-cloud/commit/5e3c621e91eb9b27600af14139b6158862e1c6de))
* **deps:** bump @tambo-ai/react from 0.56.0 to 0.57.0 in the tambo-ai group ([#1931](https://github.com/tambo-ai/tambo-cloud/issues/1931)) ([ff698b4](https://github.com/tambo-ai/tambo-cloud/commit/ff698b42f88efbe95ab482e6d804a24b3e1c4c79))
* **deps:** bump framer-motion from 12.23.22 to 12.23.24 ([#1935](https://github.com/tambo-ai/tambo-cloud/issues/1935)) ([4bdf9d5](https://github.com/tambo-ai/tambo-cloud/commit/4bdf9d51680a4ad94a012e74377635c4ee711f66))
* **deps:** bump mcp-handler from 1.0.2 to 1.0.3 ([#1933](https://github.com/tambo-ai/tambo-cloud/issues/1933)) ([f140a65](https://github.com/tambo-ai/tambo-cloud/commit/f140a65764b3f7ddb7cc568b8e4a9f032ba1e015))
* **deps:** bump the ai-sdk group with 7 updates ([#1930](https://github.com/tambo-ai/tambo-cloud/issues/1930)) ([49b48c9](https://github.com/tambo-ai/tambo-cloud/commit/49b48c91d979f5e56191eace91564cc145b4ea3f))
* **deps:** bump the small-safe-packages group across 1 directory with 9 updates ([#1937](https://github.com/tambo-ai/tambo-cloud/issues/1937)) ([556257a](https://github.com/tambo-ai/tambo-cloud/commit/556257a66ef2a8cfb76cc1d8b7324a21cfd5ade8))
* **deps:** bump tldts from 7.0.16 to 7.0.17 ([#1936](https://github.com/tambo-ai/tambo-cloud/issues/1936)) ([a04cf55](https://github.com/tambo-ai/tambo-cloud/commit/a04cf55c9d12962782eeb738bd85f99cbd6a407d))


### Code Refactoring

* **agents:** break out AsyncQueue and push control to the decision loop ([#1921](https://github.com/tambo-ai/tambo-cloud/issues/1921)) ([abdd1c3](https://github.com/tambo-ai/tambo-cloud/commit/abdd1c35ee0f0ad9cddfd2ec245b4c8272532998))
* move AsyncQueue to core ([#1927](https://github.com/tambo-ai/tambo-cloud/issues/1927)) ([fd2dce9](https://github.com/tambo-ai/tambo-cloud/commit/fd2dce938ac631cc74286fdb62ee2cd0d107f8f5))

## [0.114.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.113.0...repo-v0.114.0) (2025-10-09)


### Features

* **sampling:** Show "child" messages in the observability view in a collapsable container ([#1916](https://github.com/tambo-ai/tambo-cloud/issues/1916)) ([dda5725](https://github.com/tambo-ai/tambo-cloud/commit/dda5725a75473de2b139824a1fc0770a69619f10))


### Bug Fixes

* add linux/arm64 platform support to Docker release builds ([#1917](https://github.com/tambo-ai/tambo-cloud/issues/1917)) ([edbc442](https://github.com/tambo-ai/tambo-cloud/commit/edbc442b868bf81fd15d2e2b16b6438185ebd9b2))


### Miscellaneous Chores

* add cooldown configuration to dependabot ([#1912](https://github.com/tambo-ai/tambo-cloud/issues/1912)) ([15d079e](https://github.com/tambo-ai/tambo-cloud/commit/15d079e21a2eb8378359d793f18d180a0acd2f62))
* **deps-dev:** bump typescript-eslint from 8.45.0 to 8.46.0 in the eslint group ([#1904](https://github.com/tambo-ai/tambo-cloud/issues/1904)) ([2fe2bfd](https://github.com/tambo-ai/tambo-cloud/commit/2fe2bfdc32955a9f210685bed32d3cd95666be79))
* **deps:** bump @ai-sdk/openai from 2.0.42 to 2.0.44 in the ai-sdk group ([#1905](https://github.com/tambo-ai/tambo-cloud/issues/1905)) ([19e481a](https://github.com/tambo-ai/tambo-cloud/commit/19e481a5face98c7a01e1231263f062d9cea724f))
* **deps:** bump @splinetool/runtime from 1.10.75 to 1.10.76 in the small-safe-packages group across 1 directory ([#1914](https://github.com/tambo-ai/tambo-cloud/issues/1914)) ([5c69917](https://github.com/tambo-ai/tambo-cloud/commit/5c69917d8cb77683f968c6b60640ad61cc2bfc2a))
* **deps:** bump mime-types from 2.1.35 to 3.0.1 ([#1911](https://github.com/tambo-ai/tambo-cloud/issues/1911)) ([2180c39](https://github.com/tambo-ai/tambo-cloud/commit/2180c3909694936ced16488219aecff8b656956d))
* **deps:** bump the sentry group with 3 updates ([#1908](https://github.com/tambo-ai/tambo-cloud/issues/1908)) ([ff1b230](https://github.com/tambo-ai/tambo-cloud/commit/ff1b230ebc0d9b771e999494b000b26657ec498d))
* **deps:** bump the tambo-ai group with 2 updates ([#1906](https://github.com/tambo-ai/tambo-cloud/issues/1906)) ([d93de68](https://github.com/tambo-ai/tambo-cloud/commit/d93de68cf072e8a5b2d98837492faa11c116bea4))


### Code Refactoring

* **clipboard:** Standardize clipboard copying behavior across all components ([#1903](https://github.com/tambo-ai/tambo-cloud/issues/1903)) ([5611615](https://github.com/tambo-ai/tambo-cloud/commit/5611615a39d79babf8c5e27bdfb75e4abaad7e7a))

## [0.113.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.112.1...repo-v0.113.0) (2025-10-08)


### Features

* **sampling:** Add child messages when sampling call comes through ([#1900](https://github.com/tambo-ai/tambo-cloud/issues/1900)) ([f984186](https://github.com/tambo-ai/tambo-cloud/commit/f984186865e7de475d075d8328aa84f3f4c83915))


### Miscellaneous Chores

* **api:** Document contextKey and a few other parameters ([#1898](https://github.com/tambo-ai/tambo-cloud/issues/1898)) ([0e8c243](https://github.com/tambo-ai/tambo-cloud/commit/0e8c24381a67ffa4cb55f7c8e16583a5c34ef92f))
* remove generative table; fetch and render data directly ([#1902](https://github.com/tambo-ai/tambo-cloud/issues/1902)) ([9ae8406](https://github.com/tambo-ai/tambo-cloud/commit/9ae840649330b52455fda47c2eac17c877a3c781))

## [0.112.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.112.0...repo-v0.112.1) (2025-10-07)


### Miscellaneous Chores

* add reasoning to gpt-5-nano ([#1896](https://github.com/tambo-ai/tambo-cloud/issues/1896)) ([c61df88](https://github.com/tambo-ai/tambo-cloud/commit/c61df880fc3b4cfdd8ba8e51ad67fe42fc753a72))

## [0.112.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.111.1...repo-v0.112.0) (2025-10-07)


### Features

* **alecf:** Implement initial POC for sampling ([#1894](https://github.com/tambo-ai/tambo-cloud/issues/1894)) ([39598f3](https://github.com/tambo-ai/tambo-cloud/commit/39598f36b91405da49c73cf8287bdee5c6328b36))
* Introduce "parentMessage" concept in messages ([#1893](https://github.com/tambo-ai/tambo-cloud/issues/1893)) ([e67aae7](https://github.com/tambo-ai/tambo-cloud/commit/e67aae7b8381ba618874853e53bbeae3b1fae9be))


### Bug Fixes

* **api:** update has_setup_project flag when projects are created ([#1872](https://github.com/tambo-ai/tambo-cloud/issues/1872)) ([8eae7d1](https://github.com/tambo-ai/tambo-cloud/commit/8eae7d17ee94a1250e266db497b38af65a406aa2))


### Miscellaneous Chores

* **deps-dev:** bump @nestjs/schematics from 11.0.7 to 11.0.8 in the nestjs group ([#1873](https://github.com/tambo-ai/tambo-cloud/issues/1873)) ([946fb82](https://github.com/tambo-ai/tambo-cloud/commit/946fb821eb9bedb6b36568d93c0ee5de736f4c63))
* **deps-dev:** bump @testing-library/jest-dom from 6.8.0 to 6.9.1 in the testing group ([#1876](https://github.com/tambo-ai/tambo-cloud/issues/1876)) ([c05135d](https://github.com/tambo-ai/tambo-cloud/commit/c05135d249a338622134424d5b57654b672d412e))
* **deps-dev:** bump tailwindcss from 3.4.17 to 3.4.18 ([#1887](https://github.com/tambo-ai/tambo-cloud/issues/1887)) ([52d6556](https://github.com/tambo-ai/tambo-cloud/commit/52d6556cf21821df5fe76f9689b2fc8dccf5a0c9))
* **deps-dev:** bump the eslint group with 4 updates ([#1875](https://github.com/tambo-ai/tambo-cloud/issues/1875)) ([e5a2673](https://github.com/tambo-ai/tambo-cloud/commit/e5a2673ef8a710845d7ae97822ddf383079c583c))
* **deps-dev:** bump typescript from 5.9.2 to 5.9.3 ([#1886](https://github.com/tambo-ai/tambo-cloud/issues/1886)) ([463d6b2](https://github.com/tambo-ai/tambo-cloud/commit/463d6b24ca54eaddf9ed6e4440c4f56516be7a6b))
* **deps:** bump @modelcontextprotocol/sdk from 1.18.2 to 1.19.1 ([#1890](https://github.com/tambo-ai/tambo-cloud/issues/1890)) ([565a8d3](https://github.com/tambo-ai/tambo-cloud/commit/565a8d3de74ef089c1c60f1887eb85e09098282e))
* **deps:** bump @tambo-ai/react from 0.54.1 to 0.55.0 in the tambo-ai group ([#1880](https://github.com/tambo-ai/tambo-cloud/issues/1880)) ([cd0782c](https://github.com/tambo-ai/tambo-cloud/commit/cd0782ccd4d7624d6e4c6ee314a0470d921e36b6))
* **deps:** bump drizzle-orm from 0.44.5 to 0.44.6 in the drizzle group ([#1874](https://github.com/tambo-ai/tambo-cloud/issues/1874)) ([af44cc8](https://github.com/tambo-ai/tambo-cloud/commit/af44cc8d5f34da403602b1a9ebe1c4bf192a5f94))
* **deps:** bump jiti from 2.6.0 to 2.6.1 ([#1888](https://github.com/tambo-ai/tambo-cloud/issues/1888)) ([493ffd5](https://github.com/tambo-ai/tambo-cloud/commit/493ffd561729bd475a8de798fed5e550c6cf31b8))
* **deps:** bump openai from 5.23.1 to 6.1.0 ([#1891](https://github.com/tambo-ai/tambo-cloud/issues/1891)) ([7b8df40](https://github.com/tambo-ai/tambo-cloud/commit/7b8df405791a27260ac4b802ec57269a4367d74f))
* **deps:** bump react-hook-form from 7.63.0 to 7.64.0 ([#1889](https://github.com/tambo-ai/tambo-cloud/issues/1889)) ([15ccd29](https://github.com/tambo-ai/tambo-cloud/commit/15ccd29ffee2d88abc7e403857c0f7f6596f7dc5))
* **deps:** bump resend from 6.1.1 to 6.1.2 ([#1892](https://github.com/tambo-ai/tambo-cloud/issues/1892)) ([9b1fd24](https://github.com/tambo-ai/tambo-cloud/commit/9b1fd24ff9c5a1b35d67949662eced859be7b5cc))
* **deps:** bump the ag-ui group with 3 updates ([#1883](https://github.com/tambo-ai/tambo-cloud/issues/1883)) ([e078ca4](https://github.com/tambo-ai/tambo-cloud/commit/e078ca45e9d44780b3937e71443685a755641b73))
* **deps:** bump the ai-sdk group with 3 updates ([#1877](https://github.com/tambo-ai/tambo-cloud/issues/1877)) ([8d47c9d](https://github.com/tambo-ai/tambo-cloud/commit/8d47c9df69869dad79a91180bda689c86704445c))
* **deps:** bump the nexstra group with 2 updates ([#1885](https://github.com/tambo-ai/tambo-cloud/issues/1885)) ([a3ab8e2](https://github.com/tambo-ai/tambo-cloud/commit/a3ab8e26127f83f3dea0e612afde72b092829893))
* **deps:** bump the sentry group with 3 updates ([#1882](https://github.com/tambo-ai/tambo-cloud/issues/1882)) ([a56e70d](https://github.com/tambo-ai/tambo-cloud/commit/a56e70d8f3c1e9eaea1ea7984b2ce147121945bd))
* **deps:** bump the small-safe-packages group with 5 updates ([#1881](https://github.com/tambo-ai/tambo-cloud/issues/1881)) ([b73dc4f](https://github.com/tambo-ai/tambo-cloud/commit/b73dc4f2eeec0e48714ee5246bc900ca3df86268))


### Tests

* **mcp:** Make a "testing" mcp server to test elicitation, notifications, sampling, etc ([#1853](https://github.com/tambo-ai/tambo-cloud/issues/1853)) ([70077d6](https://github.com/tambo-ai/tambo-cloud/commit/70077d67dc2779af66127913d0d797b169f65d5c))

## [0.111.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.111.0...repo-v0.111.1) (2025-10-03)


### Miscellaneous Chores

* **ci:** fix slack step in release please workflow ([#1870](https://github.com/tambo-ai/tambo-cloud/issues/1870)) ([d651fb8](https://github.com/tambo-ai/tambo-cloud/commit/d651fb8afcc49ff6372ea405f0be141f9359c6e0))

## [0.111.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.110.0...repo-v0.111.0) (2025-10-03)


### Features

* **mcp:** Add sampling/elicitation support to internal mcp client ([#1865](https://github.com/tambo-ai/tambo-cloud/issues/1865)) ([31f6a6e](https://github.com/tambo-ai/tambo-cloud/commit/31f6a6ef8409588934ec04bd89b4afebeff3ed3d))


### Bug Fixes

* **oauth:** Add support for PEM formatted keys ([#1868](https://github.com/tambo-ai/tambo-cloud/issues/1868)) ([0c899bf](https://github.com/tambo-ai/tambo-cloud/commit/0c899bffd2dc2ca5e623a24c5435c80c799e1089))


### Miscellaneous Chores

* **ci:** push images to GHCR with release tags during releases ([#1869](https://github.com/tambo-ai/tambo-cloud/issues/1869)) ([f2ab5da](https://github.com/tambo-ai/tambo-cloud/commit/f2ab5dac8b39000e557a5e4552c44897b4636898))
* delete some unused JWT verification code ([#1866](https://github.com/tambo-ai/tambo-cloud/issues/1866)) ([98cc2da](https://github.com/tambo-ai/tambo-cloud/commit/98cc2dae3a8274a4c2aca8fa7d17c04572098346))

## [0.110.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.109.0...repo-v0.110.0) (2025-10-02)


### Features

* **agents:** Add back mastra support ([#1855](https://github.com/tambo-ai/tambo-cloud/issues/1855)) ([23f077b](https://github.com/tambo-ai/tambo-cloud/commit/23f077ba20e13c9b1d6ef8bd3835f304a0cd6fa9))
* **agents:** support reasoning messages ([#1783](https://github.com/tambo-ai/tambo-cloud/issues/1783)) ([aa04272](https://github.com/tambo-ai/tambo-cloud/commit/aa04272b83e2fbe0ca9775aa6b9af301d2aa4a12))
* **mcp:** Add support for sessionIds ([#1858](https://github.com/tambo-ai/tambo-cloud/issues/1858)) ([4bb0a96](https://github.com/tambo-ai/tambo-cloud/commit/4bb0a96f1132036913fa832612db191738afd4a0))


### Bug Fixes

* **api:** make email service configuration optional and handle missing environment variables ([#1864](https://github.com/tambo-ai/tambo-cloud/issues/1864)) ([5eb326c](https://github.com/tambo-ai/tambo-cloud/commit/5eb326cd6c95918199f31af10ad690bf44331cc5))
* **ci:** prevent docker images from pushing to docker.io ([#1856](https://github.com/tambo-ai/tambo-cloud/issues/1856)) ([248aa04](https://github.com/tambo-ai/tambo-cloud/commit/248aa0416246ece85567e0bacf5e431be5409e27))
* **db:** Fix migration for extra constraint ([#1861](https://github.com/tambo-ai/tambo-cloud/issues/1861)) ([0fa1619](https://github.com/tambo-ai/tambo-cloud/commit/0fa16194262ec52d2c1ca6900c90106a99f1219a))
* **db:** rewind 3 snapshots, rerun as a single snapshot ([#1863](https://github.com/tambo-ai/tambo-cloud/issues/1863)) ([4e7de72](https://github.com/tambo-ai/tambo-cloud/commit/4e7de72725e2415e3702edf7e201350083faec4e))
* **db:** use sql`now()` instead of new Date() ([#1859](https://github.com/tambo-ai/tambo-cloud/issues/1859)) ([e74c97a](https://github.com/tambo-ai/tambo-cloud/commit/e74c97a2b25a19ef235e46723ab97bf605adad3a))
* **email:** Check unsubscribe before sending personal emails ([#1806](https://github.com/tambo-ai/tambo-cloud/issues/1806)) ([5ea3ff7](https://github.com/tambo-ai/tambo-cloud/commit/5ea3ff73b793cda45c934c8695fde9038557f379))
* **web:** close mobile navigation drawer on hash link clicks ([#1851](https://github.com/tambo-ai/tambo-cloud/issues/1851)) ([212763f](https://github.com/tambo-ai/tambo-cloud/commit/212763f0e3e9a174b257bacf59e1ce00a9ed607a))


### Miscellaneous Chores

* **agent-dev:** no backticks in claude.md - references are as-is ([#1857](https://github.com/tambo-ai/tambo-cloud/issues/1857)) ([73ddf49](https://github.com/tambo-ai/tambo-cloud/commit/73ddf494763bfad07af22b74cbe20408a7382f81))
* **ci:** add GitHub Container Registry login and image push steps to docker-test workflow ([#1848](https://github.com/tambo-ai/tambo-cloud/issues/1848)) ([56d2a28](https://github.com/tambo-ai/tambo-cloud/commit/56d2a28b76e0fd5b3c6251eb3bee4f81ba9df533))
* **ci:** enhance docker-test workflow to conditionally push images to GHCR ([#1852](https://github.com/tambo-ai/tambo-cloud/issues/1852)) ([42b83a1](https://github.com/tambo-ai/tambo-cloud/commit/42b83a1ed497dda1c6fb0adaa9aad33050a94003))
* **ci:** refactor docker-test workflow to use build-push-action for image builds and pushes ([#1849](https://github.com/tambo-ai/tambo-cloud/issues/1849)) ([b2b53bb](https://github.com/tambo-ai/tambo-cloud/commit/b2b53bbbb6ada2f8d838c942752b21ba91cd77aa))
* **ci:** update variable name for auth in docker workflow ([#1854](https://github.com/tambo-ai/tambo-cloud/issues/1854)) ([4759cdd](https://github.com/tambo-ai/tambo-cloud/commit/4759cdd4b5ba6c2be737d22cf61b13a2e4ff85f2))
* **deps-dev:** bump @tailwindcss/typography from 0.5.16 to 0.5.19 ([#1828](https://github.com/tambo-ai/tambo-cloud/issues/1828)) ([dfa9612](https://github.com/tambo-ai/tambo-cloud/commit/dfa9612424a13168db03571377244123238b119d))
* **deps-dev:** bump drizzle-kit from 0.31.4 to 0.31.5 in the drizzle group ([#1812](https://github.com/tambo-ai/tambo-cloud/issues/1812)) ([3370a1c](https://github.com/tambo-ai/tambo-cloud/commit/3370a1cf5246f74ce1e9af197845dd85abb060a1))
* **deps-dev:** bump lint-staged from 16.2.1 to 16.2.3 in the small-safe-packages group ([#1837](https://github.com/tambo-ai/tambo-cloud/issues/1837)) ([b1a5e2b](https://github.com/tambo-ai/tambo-cloud/commit/b1a5e2b472c2efa975aeeff70378a88d0f023d50))
* **deps-dev:** bump the eslint group with 2 updates ([#1813](https://github.com/tambo-ai/tambo-cloud/issues/1813)) ([843eaf4](https://github.com/tambo-ai/tambo-cloud/commit/843eaf49371c7a890ffaa93af60bdb7390b3e3c2))
* **deps-dev:** bump the testing group with 2 updates ([#1835](https://github.com/tambo-ai/tambo-cloud/issues/1835)) ([d3c26ec](https://github.com/tambo-ai/tambo-cloud/commit/d3c26ec031d6cb5e27b9c9cb91b6c07acae40873))
* **deps-dev:** bump tsx from 4.20.5 to 4.20.6 ([#1826](https://github.com/tambo-ai/tambo-cloud/issues/1826)) ([3cf0930](https://github.com/tambo-ai/tambo-cloud/commit/3cf0930a79840dd5f77c4dc2c7c1f0d37d54a819))
* **deps-dev:** bump turbo from 2.5.6 to 2.5.8 ([#1825](https://github.com/tambo-ai/tambo-cloud/issues/1825)) ([2a832ee](https://github.com/tambo-ai/tambo-cloud/commit/2a832ee953bb8b4b7d566dcb8b6d6b5b038db991))
* **deps:** bump @langfuse/otel from 4.0.1 to 4.2.0 ([#1832](https://github.com/tambo-ai/tambo-cloud/issues/1832)) ([bf2e30a](https://github.com/tambo-ai/tambo-cloud/commit/bf2e30a6b5a4f757ae01327ff6f59bab4fdd9eb6))
* **deps:** bump @modelcontextprotocol/sdk from 1.18.0 to 1.18.2 ([#1841](https://github.com/tambo-ai/tambo-cloud/issues/1841)) ([9d3b88e](https://github.com/tambo-ai/tambo-cloud/commit/9d3b88e158dbc28d8f0e51c20f31f3da3f7d841c))
* **deps:** bump @tanstack/react-query from 5.87.4 to 5.90.2 ([#1824](https://github.com/tambo-ai/tambo-cloud/issues/1824)) ([ca53266](https://github.com/tambo-ai/tambo-cloud/commit/ca5326619354d81a79389f481dbfad7c6c1aa25b))
* **deps:** bump dompurify from 3.2.6 to 3.2.7 ([#1820](https://github.com/tambo-ai/tambo-cloud/issues/1820)) ([bbb56aa](https://github.com/tambo-ai/tambo-cloud/commit/bbb56aa2e600b42e96278c652ce24bdc68890899))
* **deps:** bump framer-motion from 12.23.12 to 12.23.22 ([#1839](https://github.com/tambo-ai/tambo-cloud/issues/1839)) ([d79d71d](https://github.com/tambo-ai/tambo-cloud/commit/d79d71d8639d82b6d99d5633568b60d70d4e3629))
* **deps:** bump jiti from 2.5.1 to 2.6.0 ([#1829](https://github.com/tambo-ai/tambo-cloud/issues/1829)) ([7eb6a31](https://github.com/tambo-ai/tambo-cloud/commit/7eb6a310f5f840bfed10a402d3b867eeb96cd838))
* **deps:** bump nextra from 4.4.0 to 4.5.0 ([#1821](https://github.com/tambo-ai/tambo-cloud/issues/1821)) ([9e676b9](https://github.com/tambo-ai/tambo-cloud/commit/9e676b933b9515b3737a627feed90c64e0fa379a))
* **deps:** bump nextra-theme-blog from 4.4.0 to 4.5.0 ([#1827](https://github.com/tambo-ai/tambo-cloud/issues/1827)) ([95111dd](https://github.com/tambo-ai/tambo-cloud/commit/95111ddf9c11f369175b6165bc0b39b8de6e7d94))
* **deps:** bump nextra-theme-blog from 4.5.0 to 4.5.1 ([#1838](https://github.com/tambo-ai/tambo-cloud/issues/1838)) ([6392ee4](https://github.com/tambo-ai/tambo-cloud/commit/6392ee4bfb54f02e2511d5e3c603977c58fc04ed))
* **deps:** bump openai from 5.20.3 to 5.23.1 ([#1819](https://github.com/tambo-ai/tambo-cloud/issues/1819)) ([d9fa4be](https://github.com/tambo-ai/tambo-cloud/commit/d9fa4be2d6a555c19320da774b433ce7a3120f13))
* **deps:** bump posthog-js from 1.268.6 to 1.268.8 in the small-safe-packages group across 1 directory ([#1843](https://github.com/tambo-ai/tambo-cloud/issues/1843)) ([414eed7](https://github.com/tambo-ai/tambo-cloud/commit/414eed726d0e7bc75fc4d68a448baa7a60113b48))
* **deps:** bump react-hook-form from 7.62.0 to 7.63.0 ([#1831](https://github.com/tambo-ai/tambo-cloud/issues/1831)) ([9e1294e](https://github.com/tambo-ai/tambo-cloud/commit/9e1294eca80d578f5aa6f59ababe098069794646))
* **deps:** bump resend from 6.1.0 to 6.1.1 ([#1847](https://github.com/tambo-ai/tambo-cloud/issues/1847)) ([5ff7ac0](https://github.com/tambo-ai/tambo-cloud/commit/5ff7ac045abcf97e9db4d4d32f85d470b719f8dd))
* **deps:** bump the ag-ui group with 2 updates ([#1818](https://github.com/tambo-ai/tambo-cloud/issues/1818)) ([c05417e](https://github.com/tambo-ai/tambo-cloud/commit/c05417e5e189d445ba772e12ce47e6c3460e42a1))
* **deps:** bump the ai-sdk group with 2 updates ([#1844](https://github.com/tambo-ai/tambo-cloud/issues/1844)) ([cef26ab](https://github.com/tambo-ai/tambo-cloud/commit/cef26ab13f6d23ffd2fa3412bc5aabfbec0991e0))
* **deps:** bump the ai-sdk group with 7 updates ([#1814](https://github.com/tambo-ai/tambo-cloud/issues/1814)) ([c6e528b](https://github.com/tambo-ai/tambo-cloud/commit/c6e528b613314a144a019d498e22f9b8ef9db663))
* **deps:** bump the next group with 2 updates ([#1816](https://github.com/tambo-ai/tambo-cloud/issues/1816)) ([55a24b3](https://github.com/tambo-ai/tambo-cloud/commit/55a24b39e16c15961a30b9bee11e4286023fb369))
* **deps:** bump the sentry group with 3 updates ([#1846](https://github.com/tambo-ai/tambo-cloud/issues/1846)) ([9d60e75](https://github.com/tambo-ai/tambo-cloud/commit/9d60e75167203f0530dcedc46c20d9a6afad31de))
* **deps:** bump the small-safe-packages group with 3 updates ([#1817](https://github.com/tambo-ai/tambo-cloud/issues/1817)) ([077e96c](https://github.com/tambo-ai/tambo-cloud/commit/077e96c2db14ddf6120dcc6bb760f021e0f75cf4))
* **deps:** bump the trpc group with 3 updates ([#1811](https://github.com/tambo-ai/tambo-cloud/issues/1811)) ([5cf4a36](https://github.com/tambo-ai/tambo-cloud/commit/5cf4a36ad83dd8bd3c179e9c184498f8938c3e8f))
* **deps:** bump tldts from 7.0.14 to 7.0.16 ([#1830](https://github.com/tambo-ai/tambo-cloud/issues/1830)) ([53a5fa4](https://github.com/tambo-ai/tambo-cloud/commit/53a5fa40df11ea4bc428406c8c83933602fcd0be))
* **deps:** Create nexstra dependabot group ([#1842](https://github.com/tambo-ai/tambo-cloud/issues/1842)) ([ae07bc0](https://github.com/tambo-ai/tambo-cloud/commit/ae07bc01c820f6c0c04d0d172b53e20763ca114f))
* fix packagemanager and volta config ([#1860](https://github.com/tambo-ai/tambo-cloud/issues/1860)) ([94f0cff](https://github.com/tambo-ai/tambo-cloud/commit/94f0cff2265031dcfdbdf03474f68d744a4f3448))


### Code Refactoring

* **ci:** use docker-compose as source of truth for image builds ([#1850](https://github.com/tambo-ai/tambo-cloud/issues/1850)) ([fe2c20a](https://github.com/tambo-ai/tambo-cloud/commit/fe2c20ac65a859858e6d968e9371e98593166ecc))


### Tests

* **agent-client:** Fix tests to actually generate messages ([#1822](https://github.com/tambo-ai/tambo-cloud/issues/1822)) ([0b50073](https://github.com/tambo-ai/tambo-cloud/commit/0b50073f9ebe0eeec7f76715c7467478059d4f8d))

## [0.109.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.108.0...repo-v0.109.0) (2025-09-26)


### Features

* **llms:** Allow model-specific parameters, add reasoning for openai ([#1791](https://github.com/tambo-ai/tambo-cloud/issues/1791)) ([9d006ea](https://github.com/tambo-ai/tambo-cloud/commit/9d006ea84580f0115cd2ba048f9d21f0712015a1))
* **web:** update custom LLM parameters with example support and fix reasoning parameters to go under provider options ([#1803](https://github.com/tambo-ai/tambo-cloud/issues/1803)) ([0dc400c](https://github.com/tambo-ai/tambo-cloud/commit/0dc400cb8c8aae9433ccaf182072c7e6b28b92fc))


### Bug Fixes

* **pricing:** update pricing component typography and styling to match consistency along. ([#1699](https://github.com/tambo-ai/tambo-cloud/issues/1699)) ([ba1ac55](https://github.com/tambo-ai/tambo-cloud/commit/ba1ac551f30741838d2c37e76c2cd91e92db983b))
* **web:** Canonicalize email links for tracking ([#1805](https://github.com/tambo-ai/tambo-cloud/issues/1805)) ([6680a2f](https://github.com/tambo-ai/tambo-cloud/commit/6680a2f845ce693c77f331cbecae60c7fae8f08f))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 2 updates ([#1794](https://github.com/tambo-ai/tambo-cloud/issues/1794)) ([52a40a1](https://github.com/tambo-ai/tambo-cloud/commit/52a40a13ea543463025dcc360d9000057e9998a6))
* **deps-dev:** bump ts-jest from 29.4.2 to 29.4.4 in the testing group ([#1795](https://github.com/tambo-ai/tambo-cloud/issues/1795)) ([36c5a69](https://github.com/tambo-ai/tambo-cloud/commit/36c5a699752eae1247e9b54e1288ac5ee7ea17dc))
* **deps:** bump @nestjs/schedule from 6.0.0 to 6.0.1 in the nestjs group ([#1793](https://github.com/tambo-ai/tambo-cloud/issues/1793)) ([3996002](https://github.com/tambo-ai/tambo-cloud/commit/3996002ff7ff3d5304b0b3a020210ea7a3982b70))
* **deps:** bump recharts from 3.2.0 to 3.2.1 ([#1802](https://github.com/tambo-ai/tambo-cloud/issues/1802)) ([cca4651](https://github.com/tambo-ai/tambo-cloud/commit/cca465152a42861e89c584f6c99a1e4e17ded9cb))
* **deps:** bump the ag-ui group with 2 updates ([#1801](https://github.com/tambo-ai/tambo-cloud/issues/1801)) ([6029878](https://github.com/tambo-ai/tambo-cloud/commit/60298785b259513be7ba998af9263bd8c9b174f4))
* **deps:** bump the ai-sdk group across 1 directory with 6 updates ([#1807](https://github.com/tambo-ai/tambo-cloud/issues/1807)) ([89d12fe](https://github.com/tambo-ai/tambo-cloud/commit/89d12fea5f41508076599a4964cd86a6ef025318))
* **deps:** bump the sentry group with 3 updates ([#1800](https://github.com/tambo-ai/tambo-cloud/issues/1800)) ([fbcc748](https://github.com/tambo-ai/tambo-cloud/commit/fbcc748fa27995a3b094ff32374e0a6f6a5c8300))
* **deps:** bump the small-safe-packages group with 2 updates ([#1799](https://github.com/tambo-ai/tambo-cloud/issues/1799)) ([0fe6d9d](https://github.com/tambo-ai/tambo-cloud/commit/0fe6d9d4c62e59b7de5bc98e924f6853ca78f2a7))
* **deps:** bump the tambo-ai group with 2 updates ([#1798](https://github.com/tambo-ai/tambo-cloud/issues/1798)) ([6b22c4b](https://github.com/tambo-ai/tambo-cloud/commit/6b22c4bec4b8045a3447bd284a5363bbe0538715))
* fix settings component alignment and text overflow ([#1804](https://github.com/tambo-ai/tambo-cloud/issues/1804)) ([0aaa17d](https://github.com/tambo-ai/tambo-cloud/commit/0aaa17d942ac4c8316919d72fa1eef926aee2edc))


### Code Refactoring

* **ternaries:** Remove some nested ternaries ([#1809](https://github.com/tambo-ai/tambo-cloud/issues/1809)) ([2285ac9](https://github.com/tambo-ai/tambo-cloud/commit/2285ac905256664aa7f7160e97642fb584138c12))


### Tests

* **framer:** Disable framer animations so more tests can be enabled ([#1808](https://github.com/tambo-ai/tambo-cloud/issues/1808)) ([3642595](https://github.com/tambo-ai/tambo-cloud/commit/364259519e98e3632923593b94e2c78133edc139))

## [0.108.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.107.0...repo-v0.108.0) (2025-09-19)


### Features

* enable custom llm parameters  ([#1744](https://github.com/tambo-ai/tambo-cloud/issues/1744)) ([69c7972](https://github.com/tambo-ai/tambo-cloud/commit/69c797230228cbfe209a99addbd5d7e05519d8b8))
* initial messages ([#1715](https://github.com/tambo-ai/tambo-cloud/issues/1715)) ([b7d1cea](https://github.com/tambo-ai/tambo-cloud/commit/b7d1cea26d3aa15a27f5a7f8d257af79ce2b477b))
* **reasoning:** Reasoning support in the API ([#1781](https://github.com/tambo-ai/tambo-cloud/issues/1781)) ([95ab7d2](https://github.com/tambo-ai/tambo-cloud/commit/95ab7d20a662a3cc1930bcc9f6760f0ad0bb7d7a))
* update custom llm parameters ([#1784](https://github.com/tambo-ai/tambo-cloud/issues/1784)) ([71ca742](https://github.com/tambo-ai/tambo-cloud/commit/71ca7422bd34081a82cde2e81846de31f7dd5be2))


### Bug Fixes

* allow pr title workflow to run with fork PRs ([#1786](https://github.com/tambo-ai/tambo-cloud/issues/1786)) ([297fb12](https://github.com/tambo-ai/tambo-cloud/commit/297fb12888a35e17b048e32dc35ffdcba9a50057))
* **db:** add missing snapshot ([#1758](https://github.com/tambo-ai/tambo-cloud/issues/1758)) ([392a324](https://github.com/tambo-ai/tambo-cloud/commit/392a3243000f40c9c397a01a7c188614279c9385))
* disallow parallel tool calls for main providers ([#1770](https://github.com/tambo-ai/tambo-cloud/issues/1770)) ([29726f7](https://github.com/tambo-ai/tambo-cloud/commit/29726f72e2e3db35c9095b89f396d2033779f845))
* update workflow ([#1789](https://github.com/tambo-ai/tambo-cloud/issues/1789)) ([0b2bc57](https://github.com/tambo-ai/tambo-cloud/commit/0b2bc5701c4dd51c5fda3dc6f2ff7d000e99ce4f))


### Documentation

* **agents:** more best practices for AGENTS ([#1780](https://github.com/tambo-ai/tambo-cloud/issues/1780)) ([d3e1094](https://github.com/tambo-ai/tambo-cloud/commit/d3e1094fcf6bbccd1ac8c3e0deb4c0548110d119))


### Miscellaneous Chores

* clarify free LLM call terminology ([#1782](https://github.com/tambo-ai/tambo-cloud/issues/1782)) ([52b85d1](https://github.com/tambo-ai/tambo-cloud/commit/52b85d16b134a42886e9a9185e9089261d77ee77))
* **code:** remove a little more dead code ([#1768](https://github.com/tambo-ai/tambo-cloud/issues/1768)) ([e6c2446](https://github.com/tambo-ai/tambo-cloud/commit/e6c2446a179be7f5977c4652d4fc0909ef24472a))
* **code:** Remove some old code found while hooking up testing ([#1767](https://github.com/tambo-ai/tambo-cloud/issues/1767)) ([8806987](https://github.com/tambo-ai/tambo-cloud/commit/88069875ef5912f1045395b7ea6e13c9c4d425c7))
* **deps-dev:** bump ts-jest from 29.4.1 to 29.4.2 in the testing group ([#1771](https://github.com/tambo-ai/tambo-cloud/issues/1771)) ([939ea83](https://github.com/tambo-ai/tambo-cloud/commit/939ea83a31dd20569076b71829ee6e1e9ca8d83b))
* **deps-dev:** bump typescript-eslint from 8.43.0 to 8.44.0 in the eslint group ([#1760](https://github.com/tambo-ai/tambo-cloud/issues/1760)) ([16f6108](https://github.com/tambo-ai/tambo-cloud/commit/16f6108ac3dc3ee19028263eccf0a680f390f229))
* **deps:** bump @ai-sdk/openai-compatible from 1.0.17 to 1.0.18 in the ai-sdk group ([#1772](https://github.com/tambo-ai/tambo-cloud/issues/1772)) ([c0f91d9](https://github.com/tambo-ai/tambo-cloud/commit/c0f91d91f2d3f2cc3c35928861b5f610f5347806))
* **deps:** bump @hookform/resolvers from 5.2.1 to 5.2.2 ([#1762](https://github.com/tambo-ai/tambo-cloud/issues/1762)) ([dcecbc0](https://github.com/tambo-ai/tambo-cloud/commit/dcecbc0ae29a1862b96718013b8daa1aeaf78adb))
* **deps:** bump @modelcontextprotocol/sdk from 1.17.5 to 1.18.0 ([#1776](https://github.com/tambo-ai/tambo-cloud/issues/1776)) ([d8d782d](https://github.com/tambo-ai/tambo-cloud/commit/d8d782d24a9bbb30508fcb6ea808cf6223986baf))
* **deps:** bump @tambo-ai/react from 0.49.0 to 0.50.0 in the tambo-ai group ([#1752](https://github.com/tambo-ai/tambo-cloud/issues/1752)) ([03a6d6f](https://github.com/tambo-ai/tambo-cloud/commit/03a6d6f081cb6ac3a9c4f7acc8ba07f4f7b7a41e))
* **deps:** bump @tanstack/react-query from 5.87.1 to 5.87.4 ([#1756](https://github.com/tambo-ai/tambo-cloud/issues/1756)) ([2de9a0e](https://github.com/tambo-ai/tambo-cloud/commit/2de9a0e07d3de0762a0a9e159abde20b10ee9b94))
* **deps:** bump commander from 14.0.0 to 14.0.1 ([#1766](https://github.com/tambo-ai/tambo-cloud/issues/1766)) ([7d43177](https://github.com/tambo-ai/tambo-cloud/commit/7d43177e5f2911f9a5d67f0e4a8efb41fd5f8293))
* **deps:** bump luxon from 3.7.1 to 3.7.2 ([#1755](https://github.com/tambo-ai/tambo-cloud/issues/1755)) ([10a982f](https://github.com/tambo-ai/tambo-cloud/commit/10a982f89af51de07c4dd881807ad1cc545fea51))
* **deps:** bump openai from 5.19.1 to 5.20.2 ([#1763](https://github.com/tambo-ai/tambo-cloud/issues/1763)) ([9447b84](https://github.com/tambo-ai/tambo-cloud/commit/9447b8483bf01c589fba5e79841b850d0b332e18))
* **deps:** bump openai from 5.20.2 to 5.20.3 ([#1779](https://github.com/tambo-ai/tambo-cloud/issues/1779)) ([b078318](https://github.com/tambo-ai/tambo-cloud/commit/b078318b2bfa8ab3bf44bd79bc8d149416e2f10c))
* **deps:** bump recharts from 3.1.2 to 3.2.0 ([#1757](https://github.com/tambo-ai/tambo-cloud/issues/1757)) ([3df6b87](https://github.com/tambo-ai/tambo-cloud/commit/3df6b871543f105d1c035ff986bb29e204bc2b67))
* **deps:** bump resend from 6.0.3 to 6.1.0 ([#1778](https://github.com/tambo-ai/tambo-cloud/issues/1778)) ([1a13825](https://github.com/tambo-ai/tambo-cloud/commit/1a1382516792f15b394da6a7a0781c63321b2707))
* **deps:** bump the ai-sdk group with 6 updates ([#1749](https://github.com/tambo-ai/tambo-cloud/issues/1749)) ([e6df669](https://github.com/tambo-ai/tambo-cloud/commit/e6df669c350c5f625799615ce53d8c1d01d36e0b))
* **deps:** bump the next group with 2 updates ([#1774](https://github.com/tambo-ai/tambo-cloud/issues/1774)) ([b95cedd](https://github.com/tambo-ai/tambo-cloud/commit/b95cedd4f5e3df75b72705dc779ed4c27bb98411))
* **deps:** bump the sentry group with 3 updates ([#1754](https://github.com/tambo-ai/tambo-cloud/issues/1754)) ([1979686](https://github.com/tambo-ai/tambo-cloud/commit/1979686793dd6b3ee1ec926f3eb982715427951a))
* **deps:** bump the small-safe-packages group with 8 updates ([#1775](https://github.com/tambo-ai/tambo-cloud/issues/1775)) ([371b58a](https://github.com/tambo-ai/tambo-cloud/commit/371b58a91bb7ed29302368cde8c8aa280eac30d7))
* **deps:** bump tldts from 7.0.12 to 7.0.14 ([#1764](https://github.com/tambo-ai/tambo-cloud/issues/1764)) ([1f711d8](https://github.com/tambo-ai/tambo-cloud/commit/1f711d8bed56f8f8a35a9514b884dd2ff35bbc38))
* **deps:** bump to @tambo-ai/react@0.53 to pick up new sdk ([#1787](https://github.com/tambo-ai/tambo-cloud/issues/1787)) ([6c27e07](https://github.com/tambo-ai/tambo-cloud/commit/6c27e0744349c7287d9806d3bae1f7026fee6b45))
* **deps:** bump uuid from 12.0.0 to 13.0.0 ([#1777](https://github.com/tambo-ai/tambo-cloud/issues/1777)) ([d0f3c96](https://github.com/tambo-ai/tambo-cloud/commit/d0f3c96aab7154eec36af402b3e0a1c7c3414155))
* **lint:** Disallow nested ternaries ([#1788](https://github.com/tambo-ai/tambo-cloud/issues/1788)) ([80b077c](https://github.com/tambo-ai/tambo-cloud/commit/80b077c6ad9c3f53c37f8ae9094d71344a8442f9))
* remove producthunt banners, bubbles and widgets ([#1785](https://github.com/tambo-ai/tambo-cloud/issues/1785)) ([bfa6191](https://github.com/tambo-ai/tambo-cloud/commit/bfa6191984da80ec6731032e6384efc68105bd3f))


### Tests

* **misc:** Add some tests for stuff in apps/web/lib ([#1769](https://github.com/tambo-ai/tambo-cloud/issues/1769)) ([3870db5](https://github.com/tambo-ai/tambo-cloud/commit/3870db5133562fcb8f559a964f13e4d9beaa2a2d))

## [0.107.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.106.2...repo-v0.107.0) (2025-09-12)


### Features

* **agents:** add custom headers, use them in MCP settings, and enable pydantic-ai ([#1745](https://github.com/tambo-ai/tambo-cloud/issues/1745)) ([881c26e](https://github.com/tambo-ai/tambo-cloud/commit/881c26ea87809a6b979fcc116551079c3f35b8a8))
* Replace TamboHackBanner with ProductHuntBanner ([#1703](https://github.com/tambo-ai/tambo-cloud/issues/1703)) ([afc63cd](https://github.com/tambo-ai/tambo-cloud/commit/afc63cd666e396e78ae13fdf1f720873d081b8dc))


### Miscellaneous Chores

* add tambo + inkeep blog ([#1660](https://github.com/tambo-ai/tambo-cloud/issues/1660)) ([42a63d5](https://github.com/tambo-ai/tambo-cloud/commit/42a63d5a7f5e89c8704f03b740b12cfd413c97a8))
* **migrations:** missing migration ([#1748](https://github.com/tambo-ai/tambo-cloud/issues/1748)) ([3a60a9c](https://github.com/tambo-ai/tambo-cloud/commit/3a60a9ce517dd79cd985e2d858c20d94b4c413b4))
* **tests:** Set up initial testing in apps/web ([#1747](https://github.com/tambo-ai/tambo-cloud/issues/1747)) ([16c6b6f](https://github.com/tambo-ai/tambo-cloud/commit/16c6b6f807ef6e86eccc49d8fe95e6d132f6da0c))

## [0.106.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.106.1...repo-v0.106.2) (2025-09-12)


### Miscellaneous Chores

* **deps:** bump ai to v5, including telemetry ([#1742](https://github.com/tambo-ai/tambo-cloud/issues/1742)) ([1a4cc2b](https://github.com/tambo-ai/tambo-cloud/commit/1a4cc2b7d8440b48b4e27d9db3fc4d6b40eb300d))

## [0.106.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.106.0...repo-v0.106.1) (2025-09-11)


### Bug Fixes

* **agents:** Handle some error cases ([#1740](https://github.com/tambo-ai/tambo-cloud/issues/1740)) ([0b303e6](https://github.com/tambo-ai/tambo-cloud/commit/0b303e67e3df0cbdc47b2791dac7af56ac638276))

## [0.106.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.105.0...repo-v0.106.0) (2025-09-11)


### Features

* **agents:** add llamaindex support ([#1737](https://github.com/tambo-ai/tambo-cloud/issues/1737)) ([f395efb](https://github.com/tambo-ai/tambo-cloud/commit/f395efb43125456b3f9f85983c2bf2c3740960b1))
* **thread-state:** heighten the AI’s Awareness of useTamboComponentState ([#1733](https://github.com/tambo-ai/tambo-cloud/issues/1733)) ([985dd87](https://github.com/tambo-ai/tambo-cloud/commit/985dd870e43e5624c62c6a4bd7c5cb61e9cc84d0))


### Miscellaneous Chores

* **deps:** bump to @tambo-ai/react@0.49  ([#1739](https://github.com/tambo-ai/tambo-cloud/issues/1739)) ([2cc1afe](https://github.com/tambo-ai/tambo-cloud/commit/2cc1afe5eab193e7782650450cda13f86f91fdd0))
* **deps:** Fix hono vulnerability ([#1736](https://github.com/tambo-ai/tambo-cloud/issues/1736)) ([aecaf94](https://github.com/tambo-ai/tambo-cloud/commit/aecaf9430957a5c7ef73658e239b2c09ab7988ff))
* **performance:** pre-cache some trpc calls that should be on all authed pages ([#1728](https://github.com/tambo-ai/tambo-cloud/issues/1728)) ([6d7ccab](https://github.com/tambo-ai/tambo-cloud/commit/6d7ccabc5ec4b605fd888b4624f0998dc10b7c1f))

## [0.105.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.104.2...repo-v0.105.0) (2025-09-09)


### Features

* add useTamboComponentState back into landing demo component ([#1669](https://github.com/tambo-ai/tambo-cloud/issues/1669)) ([e5c2d6f](https://github.com/tambo-ai/tambo-cloud/commit/e5c2d6f9155e99a1d2dd8cca4ac7eb725d08b8d2))
* **agents:** add "beta" UI for agent configuration ([#1731](https://github.com/tambo-ai/tambo-cloud/issues/1731)) ([40eeb25](https://github.com/tambo-ai/tambo-cloud/commit/40eeb253fa901960b162d2896232a819b6d93fe5))
* **agents:** Agents support without mastra ([#1701](https://github.com/tambo-ai/tambo-cloud/issues/1701)) ([4269852](https://github.com/tambo-ai/tambo-cloud/commit/4269852377ea61574046f0e830e2b7666675d599))
* convert image part correctly to ai sdk format ([#1729](https://github.com/tambo-ai/tambo-cloud/issues/1729)) ([b61b893](https://github.com/tambo-ai/tambo-cloud/commit/b61b89310d9351883cded411483738c1d9b68a00))


### Bug Fixes

* **agents:** Agent name is not required ([#1734](https://github.com/tambo-ai/tambo-cloud/issues/1734)) ([58afd73](https://github.com/tambo-ai/tambo-cloud/commit/58afd73a67ae6af208e05b4f96dbf0c4133cf5c9))


### Documentation

* add unified AGENTS.md and update CLAUDE.md ([#1730](https://github.com/tambo-ai/tambo-cloud/issues/1730)) ([ade0ddc](https://github.com/tambo-ai/tambo-cloud/commit/ade0ddc84d5151256e08a4a531d5d1eafa2421ba))


### Miscellaneous Chores

* **deps-dev:** bump jest from 30.1.2 to 30.1.3 in the testing group ([#1707](https://github.com/tambo-ai/tambo-cloud/issues/1707)) ([ed355dc](https://github.com/tambo-ai/tambo-cloud/commit/ed355dc3c890e4f576fcfba8ae5cb378275c2528))
* **deps-dev:** bump the eslint group with 3 updates ([#1706](https://github.com/tambo-ai/tambo-cloud/issues/1706)) ([1bcb68b](https://github.com/tambo-ai/tambo-cloud/commit/1bcb68b1c0dd018a62fa3ebe2d43f366565901b0))
* **deps:** bump @modelcontextprotocol/sdk from 1.17.4 to 1.17.5 ([#1726](https://github.com/tambo-ai/tambo-cloud/issues/1726)) ([15aa749](https://github.com/tambo-ai/tambo-cloud/commit/15aa749cdda0f3595a6456d880f88ab32af2f6c8))
* **deps:** bump @tambo-ai/react from 0.46.4 to 0.47.0 in the tambo-ai group ([#1710](https://github.com/tambo-ai/tambo-cloud/issues/1710)) ([c4e0d2b](https://github.com/tambo-ai/tambo-cloud/commit/c4e0d2b5a9629abb7dd7cb5c6361cedf32defda0))
* **deps:** bump @tanstack/react-query from 5.85.6 to 5.87.1 ([#1725](https://github.com/tambo-ai/tambo-cloud/issues/1725)) ([358d351](https://github.com/tambo-ai/tambo-cloud/commit/358d351dbd3c99e122fa3ba2d3272928ec07ff4f))
* **deps:** bump geist from 1.4.2 to 1.5.1 ([#1714](https://github.com/tambo-ai/tambo-cloud/issues/1714)) ([6cdde53](https://github.com/tambo-ai/tambo-cloud/commit/6cdde534ad2473f95c8a0b8aeb19f33edbbbc9ad))
* **deps:** bump openai from 5.18.1 to 5.19.1 ([#1724](https://github.com/tambo-ai/tambo-cloud/issues/1724)) ([6831758](https://github.com/tambo-ai/tambo-cloud/commit/68317586f816ad7cae971d8fc204183142ee3cbf))
* **deps:** bump resend from 6.0.1 to 6.0.3 ([#1721](https://github.com/tambo-ai/tambo-cloud/issues/1721)) ([64accf7](https://github.com/tambo-ai/tambo-cloud/commit/64accf7c854fe12bde442664406bb05e5eb16a45))
* **deps:** bump rxjs from 7.8.1 to 7.8.2 ([#1727](https://github.com/tambo-ai/tambo-cloud/issues/1727)) ([a65dc02](https://github.com/tambo-ai/tambo-cloud/commit/a65dc0242f994cc88b04648d1bd18fb476c3afd0))
* **deps:** bump the ag-ui group with 2 updates ([#1720](https://github.com/tambo-ai/tambo-cloud/issues/1720)) ([33d3b58](https://github.com/tambo-ai/tambo-cloud/commit/33d3b5896e8105fef459461ed7108ad42eaa4d23))
* **deps:** bump the sentry group with 3 updates ([#1712](https://github.com/tambo-ai/tambo-cloud/issues/1712)) ([6884cf2](https://github.com/tambo-ai/tambo-cloud/commit/6884cf28828c5e0005b530c91b32c059c2172954))
* **deps:** bump the small-safe-packages group across 1 directory with 8 updates ([#1732](https://github.com/tambo-ai/tambo-cloud/issues/1732)) ([cad2c4c](https://github.com/tambo-ai/tambo-cloud/commit/cad2c4c06841a01fba14371c99bcee8f51fe4771))
* **deps:** bump the small-safe-packages group with 3 updates ([#1711](https://github.com/tambo-ai/tambo-cloud/issues/1711)) ([cd4d236](https://github.com/tambo-ai/tambo-cloud/commit/cd4d236822a7729e1833f6855b027035bde2b0c6))
* **deps:** bump the trpc group with 3 updates ([#1705](https://github.com/tambo-ai/tambo-cloud/issues/1705)) ([5791740](https://github.com/tambo-ai/tambo-cloud/commit/5791740d3f08d1a346e5167d1c612af4a50bfdc5))
* **deps:** bump use-debounce from 10.0.5 to 10.0.6 ([#1722](https://github.com/tambo-ai/tambo-cloud/issues/1722)) ([4074e88](https://github.com/tambo-ai/tambo-cloud/commit/4074e88cf6f01e9a83b335cbc59a761104bc31b4))
* **deps:** bump uuid from 11.1.0 to 12.0.0 ([#1713](https://github.com/tambo-ai/tambo-cloud/issues/1713)) ([829426c](https://github.com/tambo-ai/tambo-cloud/commit/829426ce89fb2a6615fcb1b6967eb7f2df58d080))
* **deps:** npm audit fix plus dependabot updates for ag-ui ([#1717](https://github.com/tambo-ai/tambo-cloud/issues/1717)) ([eb14300](https://github.com/tambo-ai/tambo-cloud/commit/eb14300b068ba02e72dac28df2e73b985ede29ea))
* **onboarding:** add analytics template to onboarding wizard ([#1698](https://github.com/tambo-ai/tambo-cloud/issues/1698)) ([2765a1c](https://github.com/tambo-ai/tambo-cloud/commit/2765a1c9ca5a0a241b7848566310f737401c4099))


### Code Refactoring

* **ui:** Use combined combobox rather that duplicating code ([#1735](https://github.com/tambo-ai/tambo-cloud/issues/1735)) ([1ab614f](https://github.com/tambo-ai/tambo-cloud/commit/1ab614fe2f2d79f73484b5bbeadf4bc15511f20a))

## [0.104.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.104.1...repo-v0.104.2) (2025-09-04)


### Bug Fixes

* emit informational tool call message ([#1696](https://github.com/tambo-ai/tambo-cloud/issues/1696)) ([45bd767](https://github.com/tambo-ai/tambo-cloud/commit/45bd7676846a5d086a7812fac116f776c63eef02))
* Update TamboEmailButton to hide when thread has messages and fix text color on dashboard ([#1695](https://github.com/tambo-ai/tambo-cloud/issues/1695)) ([32b1fe7](https://github.com/tambo-ai/tambo-cloud/commit/32b1fe710290ceab995bc97ce55a2a5a2a9e2eba))


### Documentation

* update README for MCP endpoint path ([#1692](https://github.com/tambo-ai/tambo-cloud/issues/1692)) ([e9b2fbf](https://github.com/tambo-ai/tambo-cloud/commit/e9b2fbf1380ec3fa130afbeb09b1dbbad49a3640))


### Miscellaneous Chores

* **tools:** Create a simple tool for doing SSE debugging ([#1694](https://github.com/tambo-ai/tambo-cloud/issues/1694)) ([32b9103](https://github.com/tambo-ai/tambo-cloud/commit/32b9103f20d3e6fda09b34fdb5fa8b12d2ef62b4))


### Code Refactoring

* **agents:** A bunch of minor code improvements found during agent work ([#1697](https://github.com/tambo-ai/tambo-cloud/issues/1697)) ([7ac2877](https://github.com/tambo-ai/tambo-cloud/commit/7ac28771ab206870046acd127810a43a8f8850e0))
* **decision-loop:** Consolidate tool-limit logic ([#1685](https://github.com/tambo-ai/tambo-cloud/issues/1685)) ([aa05b07](https://github.com/tambo-ai/tambo-cloud/commit/aa05b07386e0e0ccdf2ec8723648d8ae9c06a606))
* **tools:** consolidate client + server tools into known types ([#1686](https://github.com/tambo-ai/tambo-cloud/issues/1686)) ([2d14920](https://github.com/tambo-ai/tambo-cloud/commit/2d149201b781defd35ce5356d8141a84effa784c))

## [0.104.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.104.0...repo-v0.104.1) (2025-09-03)


### Bug Fixes

* **build:** try upping target to 2023 to fix iterators? ([#1689](https://github.com/tambo-ai/tambo-cloud/issues/1689)) ([506f9d8](https://github.com/tambo-ai/tambo-cloud/commit/506f9d892f25b630666132351423470a2f3eee30))
* **iterators:** add an await as an experiment ([#1690](https://github.com/tambo-ai/tambo-cloud/issues/1690)) ([ed54830](https://github.com/tambo-ai/tambo-cloud/commit/ed54830af197cc2ee0b6ba4ebb1a9effa49390f8))


### Miscellaneous Chores

* **deps:** bump both openai and @ai-sdk/openai ([#1687](https://github.com/tambo-ai/tambo-cloud/issues/1687)) ([8c312ec](https://github.com/tambo-ai/tambo-cloud/commit/8c312ec5551b65beb66aa4180b106f1cc46133d0))

## [0.104.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.103.2...repo-v0.104.0) (2025-09-02)


### Features

* add docs MCP to mcp.tambo.co (TAM-214) ([#1657](https://github.com/tambo-ai/tambo-cloud/issues/1657)) ([3f1d405](https://github.com/tambo-ai/tambo-cloud/commit/3f1d4057cb4d930fbd8953fecd20838505e76e39))


### Documentation

* a few more hydra-&gt;tambo things I missed ([#1668](https://github.com/tambo-ai/tambo-cloud/issues/1668)) ([c53fc05](https://github.com/tambo-ai/tambo-cloud/commit/c53fc05efc6ca1e683815ac5c7d85909b6238ed2))
* Do some really basic formatting and linking alignment ([#1667](https://github.com/tambo-ai/tambo-cloud/issues/1667)) ([1a735e7](https://github.com/tambo-ai/tambo-cloud/commit/1a735e73bf191567235a3659b5989859cf939ce9))


### Miscellaneous Chores

* **deps-dev:** bump jest from 30.0.5 to 30.1.2 in the testing group ([#1674](https://github.com/tambo-ai/tambo-cloud/issues/1674)) ([54e172d](https://github.com/tambo-ai/tambo-cloud/commit/54e172d6e42b8f76a486184fa7357ecb8e0a63ca))
* **deps:** bump @tanstack/react-query from 5.85.5 to 5.85.6 ([#1681](https://github.com/tambo-ai/tambo-cloud/issues/1681)) ([62cde47](https://github.com/tambo-ai/tambo-cloud/commit/62cde47f64b86f1c1cd8a50606aa7e691961e985))
* **deps:** bump langfuse-vercel from 3.38.4 to 3.38.5 ([#1682](https://github.com/tambo-ai/tambo-cloud/issues/1682)) ([221762c](https://github.com/tambo-ai/tambo-cloud/commit/221762c55b4c8c4dd84bccf30effb48c68ca8fb7))
* **deps:** bump openai from 5.15.0 to 5.16.0 ([#1683](https://github.com/tambo-ai/tambo-cloud/issues/1683)) ([f45f412](https://github.com/tambo-ai/tambo-cloud/commit/f45f412ab4db3f210bd28ab007ecd5656f44bcb7))
* **deps:** bump the next group with 2 updates ([#1676](https://github.com/tambo-ai/tambo-cloud/issues/1676)) ([4fb7925](https://github.com/tambo-ai/tambo-cloud/commit/4fb792587f458319abd6058e1b6221b0715c4804))
* **deps:** bump the sentry group with 3 updates ([#1679](https://github.com/tambo-ai/tambo-cloud/issues/1679)) ([946155f](https://github.com/tambo-ai/tambo-cloud/commit/946155fe2125d357c64d643827154a6269c0539e))
* **deps:** bump the small-safe-packages group with 3 updates ([#1680](https://github.com/tambo-ai/tambo-cloud/issues/1680)) ([c198942](https://github.com/tambo-ai/tambo-cloud/commit/c198942a1c538e6974f7d00bbd6861edc97cf91e))
* **deps:** bump the tambo-ai group with 2 updates ([#1678](https://github.com/tambo-ai/tambo-cloud/issues/1678)) ([663b3c8](https://github.com/tambo-ai/tambo-cloud/commit/663b3c86675bfebb97db1a7e1de65b2d9d10a94a))


### Code Refactoring

* deprecate actionType for consistency ([#1670](https://github.com/tambo-ai/tambo-cloud/issues/1670)) ([3fbb9f7](https://github.com/tambo-ai/tambo-cloud/commit/3fbb9f72ce3fe3c838bb8318c54f893b7ca97104))


### Tests

* **api:** Add thread service test and mock object factories for generalized testing ([#1665](https://github.com/tambo-ai/tambo-cloud/issues/1665)) ([4b9335c](https://github.com/tambo-ai/tambo-cloud/commit/4b9335c0990161027456ba072812dba49a392f00))

## [0.103.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.103.1...repo-v0.103.2) (2025-08-27)


### Bug Fixes

* **sentry:** add nested options for llm.model, etc ([#1664](https://github.com/tambo-ai/tambo-cloud/issues/1664)) ([0250d5f](https://github.com/tambo-ai/tambo-cloud/commit/0250d5fe193e0eea09a345197d84a8d3e157c676))


### Miscellaneous Chores

* create tambo getting started and contributing guides ([#1661](https://github.com/tambo-ai/tambo-cloud/issues/1661)) ([d990738](https://github.com/tambo-ai/tambo-cloud/commit/d990738c3784d7b26b501849fbcc45b910aa6249))


### Code Refactoring

* **threads:** Cleanup/generalize some thread handling to make agent integration smoother ([#1662](https://github.com/tambo-ai/tambo-cloud/issues/1662)) ([017bf8c](https://github.com/tambo-ai/tambo-cloud/commit/017bf8c3dfad7985f0c73c93fe3738678d27fa12))

## [0.103.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.103.0...repo-v0.103.1) (2025-08-26)


### Bug Fixes

* avoid prefetching errors ([#1659](https://github.com/tambo-ai/tambo-cloud/issues/1659)) ([8976b88](https://github.com/tambo-ai/tambo-cloud/commit/8976b8843f967b84ba9244049910f0dcf700619e))


### Miscellaneous Chores

* Update header link and redirect to mcp section ([#1652](https://github.com/tambo-ai/tambo-cloud/issues/1652)) ([0295929](https://github.com/tambo-ai/tambo-cloud/commit/02959299b230c53c610fb13486a1a546184f228c))

## [0.103.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.102.1...repo-v0.103.0) (2025-08-26)


### Features

* **agents:** add types and db schema for agent support ([#1656](https://github.com/tambo-ai/tambo-cloud/issues/1656)) ([df2dd00](https://github.com/tambo-ai/tambo-cloud/commit/df2dd0021ec1e83b4df79b26bb41b3ad17faba88))


### Code Refactoring

* **agents:** Start to generalize thread updating, by separating concerns ([#1646](https://github.com/tambo-ai/tambo-cloud/issues/1646)) ([8f670a8](https://github.com/tambo-ai/tambo-cloud/commit/8f670a8bfb225201041977031cd5f0a20f3a570b))

## [0.102.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.102.0...repo-v0.102.1) (2025-08-26)


### Bug Fixes

* tambohack banner closing issue ([#1653](https://github.com/tambo-ai/tambo-cloud/issues/1653)) ([49c7f09](https://github.com/tambo-ai/tambo-cloud/commit/49c7f09eb9b91a6fcb03414738fa74b982822a1a))

## [0.102.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.9...repo-v0.102.0) (2025-08-26)


### Features

* add blog with nextra ([#1647](https://github.com/tambo-ai/tambo-cloud/issues/1647)) ([9102fa4](https://github.com/tambo-ai/tambo-cloud/commit/9102fa45af04186111e3b0e2819f622708d8ec49))


### Miscellaneous Chores

* fix dashboard demo layout ([#1651](https://github.com/tambo-ai/tambo-cloud/issues/1651)) ([86e3004](https://github.com/tambo-ai/tambo-cloud/commit/86e3004d2a0576aabeca4e292a068c782be020c2))

## [0.101.9](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.8...repo-v0.101.9) (2025-08-26)


### Bug Fixes

* **api-keys:** Fix updating when an API key was last updated ([#1649](https://github.com/tambo-ai/tambo-cloud/issues/1649)) ([0282c55](https://github.com/tambo-ai/tambo-cloud/commit/0282c5533475ca2a477d481c687d851629e02bc7))


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 3 updates ([#1619](https://github.com/tambo-ai/tambo-cloud/issues/1619)) ([464c085](https://github.com/tambo-ai/tambo-cloud/commit/464c085ee8870b84010cba95074f34d76cfba7e7))

## [0.101.8](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.7...repo-v0.101.8) (2025-08-26)


### Bug Fixes

* **smoketest:** Fix colors + layout on smoketest ([#1641](https://github.com/tambo-ai/tambo-cloud/issues/1641)) ([4b888d3](https://github.com/tambo-ai/tambo-cloud/commit/4b888d34482463cd7656272c101f776e893049c6))


### Performance Improvements

* **auth:** Speed up ApiKeyGuard by simplifying API key lookup ([#1644](https://github.com/tambo-ai/tambo-cloud/issues/1644)) ([5cf5248](https://github.com/tambo-ai/tambo-cloud/commit/5cf5248259732bc15304331fa6e14451120430c7))


### Miscellaneous Chores

* **ci:** add commit depth to let sentry find history ([#1645](https://github.com/tambo-ai/tambo-cloud/issues/1645)) ([ece043f](https://github.com/tambo-ai/tambo-cloud/commit/ece043f3ed51cc645ad295c9778a76a68ab5bd09))
* **ci:** Add sentry release to github actions ([#1642](https://github.com/tambo-ai/tambo-cloud/issues/1642)) ([f258fd4](https://github.com/tambo-ai/tambo-cloud/commit/f258fd4054bfa5cf85b705f64313e2f50b804336))
* **ci:** fix sentry release action to pull the branch too ([#1643](https://github.com/tambo-ai/tambo-cloud/issues/1643)) ([5703ed7](https://github.com/tambo-ai/tambo-cloud/commit/5703ed7e602802e7ec35ba670c6ba8f0ef5786fd))
* **deps:** npm dedupe && npm audit fix to clean up packages before agent branch lands ([#1639](https://github.com/tambo-ai/tambo-cloud/issues/1639)) ([4c34001](https://github.com/tambo-ai/tambo-cloud/commit/4c34001347cc9a65a33a20caa6efc4e8180ea08f))

## [0.101.7](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.6...repo-v0.101.7) (2025-08-25)


### Performance Improvements

* **db:** Minor query improvements, span naming ([#1638](https://github.com/tambo-ai/tambo-cloud/issues/1638)) ([5b038bd](https://github.com/tambo-ai/tambo-cloud/commit/5b038bd1551d3704f0f3f2b3b546552a460da380))


### Miscellaneous Chores

* **deps-dev:** bump ts-loader from 9.5.2 to 9.5.4 ([#1636](https://github.com/tambo-ai/tambo-cloud/issues/1636)) ([f1be9dc](https://github.com/tambo-ai/tambo-cloud/commit/f1be9dc3f6cbac6124d57d4847f02c8008463643))
* **deps:** bump @tambo-ai/react from 0.46.2 to 0.46.3 in the tambo-ai group ([#1635](https://github.com/tambo-ai/tambo-cloud/issues/1635)) ([18313f1](https://github.com/tambo-ai/tambo-cloud/commit/18313f1715c4a0c807f4eaa5322a840e4253cf29))
* **deps:** bump drizzle-orm from 0.44.4 to 0.44.5 in the drizzle group ([#1632](https://github.com/tambo-ai/tambo-cloud/issues/1632)) ([1ae3bfc](https://github.com/tambo-ai/tambo-cloud/commit/1ae3bfc366c85d5ec8736cefcf7efb819d1b4e2d))

## [0.101.6](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.5...repo-v0.101.6) (2025-08-25)


### Performance Improvements

* **db:** remove support for projects' legacy_id, it isn't used and is slowing down our queries ([#1630](https://github.com/tambo-ai/tambo-cloud/issues/1630)) ([7b2177e](https://github.com/tambo-ai/tambo-cloud/commit/7b2177eb14f68190e6e21dbe4380e4ad61d8bdbd))


### Miscellaneous Chores

* **deps-dev:** bump tsx from 4.20.4 to 4.20.5 ([#1626](https://github.com/tambo-ai/tambo-cloud/issues/1626)) ([c62746b](https://github.com/tambo-ai/tambo-cloud/commit/c62746bfa00e086b18b3f8f69221d38d3abdddc4))
* **deps:** bump @modelcontextprotocol/sdk from 1.17.3 to 1.17.4 ([#1625](https://github.com/tambo-ai/tambo-cloud/issues/1625)) ([9b90f34](https://github.com/tambo-ai/tambo-cloud/commit/9b90f340babee19a297a94c522893ce0fa3a46ad))
* **deps:** bump @tanstack/react-query from 5.85.3 to 5.85.5 ([#1627](https://github.com/tambo-ai/tambo-cloud/issues/1627)) ([d9c971c](https://github.com/tambo-ai/tambo-cloud/commit/d9c971ccfe358fdb5808c55eb7e8bf4b7099af59))
* **deps:** bump the next group with 2 updates ([#1620](https://github.com/tambo-ai/tambo-cloud/issues/1620)) ([8745dae](https://github.com/tambo-ai/tambo-cloud/commit/8745daeb2e749822cef4077b0e96335d42ec5b52))
* **deps:** bump the small-safe-packages group with 3 updates ([#1624](https://github.com/tambo-ai/tambo-cloud/issues/1624)) ([db7febb](https://github.com/tambo-ai/tambo-cloud/commit/db7febb83493b66cf3f2c7e16426895f9aa1dc0a))
* **deps:** bump the trpc group with 3 updates ([#1618](https://github.com/tambo-ai/tambo-cloud/issues/1618)) ([fc326f6](https://github.com/tambo-ai/tambo-cloud/commit/fc326f66537babcb80e9d83a2e39f0ac95666673))
* **deps:** bump tldts from 7.0.11 to 7.0.12 ([#1623](https://github.com/tambo-ai/tambo-cloud/issues/1623)) ([4852bfd](https://github.com/tambo-ai/tambo-cloud/commit/4852bfdab826a303c29ae8ed17fe43e70e24a09d))
* update tambohack banner and chatwithtambo to be responsive ([#1629](https://github.com/tambo-ai/tambo-cloud/issues/1629)) ([38aa313](https://github.com/tambo-ai/tambo-cloud/commit/38aa3137a01229d0d271ac4a72754e25f23ceb81))

## [0.101.5](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.4...repo-v0.101.5) (2025-08-23)


### Bug Fixes

* bump tambo-ai/react version and message-input to allow suggestions application ([#1613](https://github.com/tambo-ai/tambo-cloud/issues/1613)) ([980b243](https://github.com/tambo-ai/tambo-cloud/commit/980b2431e925311653eba3cccd301066893c9837))

## [0.101.4](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.3...repo-v0.101.4) (2025-08-22)


### Performance Improvements

* **db:** Add missing indexes from supabases perf advisor ([#1610](https://github.com/tambo-ai/tambo-cloud/issues/1610)) ([fdc207e](https://github.com/tambo-ai/tambo-cloud/commit/fdc207ed26a1b60f71067c9d4e89b2a753172ec6))


### Miscellaneous Chores

* bump tsconfig for more modern compiled code in the nestjs project ([#1612](https://github.com/tambo-ai/tambo-cloud/issues/1612)) ([d9a17b3](https://github.com/tambo-ai/tambo-cloud/commit/d9a17b3d194fd70fd468f035e48d65c5aa8788e9))

## [0.101.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.2...repo-v0.101.3) (2025-08-22)


### Performance Improvements

* **db:** Add some indexes to speed up some slow queries ([#1608](https://github.com/tambo-ai/tambo-cloud/issues/1608)) ([4a30cca](https://github.com/tambo-ai/tambo-cloud/commit/4a30cca89d8550c16e007cde68a6c5bbd8aae088))


### Miscellaneous Chores

* **observability:** Allow setting sentry environment by env var ([#1606](https://github.com/tambo-ai/tambo-cloud/issues/1606)) ([adc32ec](https://github.com/tambo-ai/tambo-cloud/commit/adc32ec79f977408b24795d55bc902a8c803cdc8))
* **observability:** monitor SQL calls with sentry ([#1603](https://github.com/tambo-ai/tambo-cloud/issues/1603)) ([82dc68f](https://github.com/tambo-ai/tambo-cloud/commit/82dc68f30f164516b0a34f131724e00479691048))
* **observability:** pull in different pg instrumentation, see if this works in nestjs ([#1607](https://github.com/tambo-ai/tambo-cloud/issues/1607)) ([04197da](https://github.com/tambo-ai/tambo-cloud/commit/04197da7d0be061f997e30f87850f2dbb829d320))

## [0.101.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.1...repo-v0.101.2) (2025-08-22)


### Bug Fixes

* **cancellation:** get rid of unawaited verification task, made transactions non-deterministic ([#1600](https://github.com/tambo-ai/tambo-cloud/issues/1600)) ([6c9a6b3](https://github.com/tambo-ai/tambo-cloud/commit/6c9a6b35d2468eb39557d48a721e228601310d9a))


### Miscellaneous Chores

* **eslint:** Add rule for no-floating-promises and fix occurrances ([#1601](https://github.com/tambo-ai/tambo-cloud/issues/1601)) ([75f9bc9](https://github.com/tambo-ai/tambo-cloud/commit/75f9bc9c74c55e8c2ad2abafe38a6c384fb0c096))
* update seo metadata ([#1597](https://github.com/tambo-ai/tambo-cloud/issues/1597)) ([e18b55a](https://github.com/tambo-ai/tambo-cloud/commit/e18b55a471b69bc7d1c66a4f8fd5aebc4b06f55c))

## [0.101.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.101.0...repo-v0.101.1) (2025-08-21)


### Bug Fixes

* relax isolation levels ([#1598](https://github.com/tambo-ai/tambo-cloud/issues/1598)) ([5eee3b4](https://github.com/tambo-ai/tambo-cloud/commit/5eee3b4252bed8562f90d18ceceaebea24068094))

## [0.101.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.10...repo-v0.101.0) (2025-08-21)


### Features

* **webhooks:** add authentication for signup webhook ([#1578](https://github.com/tambo-ai/tambo-cloud/issues/1578)) ([b6a7e8b](https://github.com/tambo-ai/tambo-cloud/commit/b6a7e8be62a85709a5d1c971a4aae72329093850))

## [0.100.10](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.9...repo-v0.100.10) (2025-08-20)


### Bug Fixes

* avoid email component re-rendering ([#1576](https://github.com/tambo-ai/tambo-cloud/issues/1576)) ([aab04a7](https://github.com/tambo-ai/tambo-cloud/commit/aab04a73b51d3f3387306892f722da8ed72afd8f))


### Miscellaneous Chores

* **deps:** bump the react versions ([#1575](https://github.com/tambo-ai/tambo-cloud/issues/1575)) ([6d51976](https://github.com/tambo-ai/tambo-cloud/commit/6d51976d14a747eafff16988a3707c479d2be65a))

## [0.100.9](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.8...repo-v0.100.9) (2025-08-19)


### Bug Fixes

* **revert:** Revert "fix: ignore context key in advance for thread" ([#1572](https://github.com/tambo-ai/tambo-cloud/issues/1572)) ([349a300](https://github.com/tambo-ai/tambo-cloud/commit/349a30009b8c9916c1914c51bf4ee5a789a44a3e))
* **security:** Do not leak contextKey out through our APIs ([#1574](https://github.com/tambo-ai/tambo-cloud/issues/1574)) ([2fb929a](https://github.com/tambo-ai/tambo-cloud/commit/2fb929aa5341f1d20e65c3b8d56d4780d03df701))

## [0.100.8](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.7...repo-v0.100.8) (2025-08-19)


### Bug Fixes

* ignore context key in advance for thread ([#1570](https://github.com/tambo-ai/tambo-cloud/issues/1570)) ([f6f7f8e](https://github.com/tambo-ai/tambo-cloud/commit/f6f7f8e6aca3373484205078b76c9815d6839146))

## [0.100.7](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.6...repo-v0.100.7) (2025-08-19)


### Bug Fixes

* **sentry:** customize Sentry integrations to exclude default Http integration and adjust request body size handling ([#1569](https://github.com/tambo-ai/tambo-cloud/issues/1569)) ([3270a21](https://github.com/tambo-ai/tambo-cloud/commit/3270a214b8b04086120aaaabe84e740c4fc7ba55))


### Miscellaneous Chores

* **deps:** remove libretto dependency ([#1567](https://github.com/tambo-ai/tambo-cloud/issues/1567)) ([753d20a](https://github.com/tambo-ai/tambo-cloud/commit/753d20a2796b75619205e0a382e92dee97433812))

## [0.100.6](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.5...repo-v0.100.6) (2025-08-19)


### Bug Fixes

* Add back in sentry exception filter ([#1566](https://github.com/tambo-ai/tambo-cloud/issues/1566)) ([ad2fdcf](https://github.com/tambo-ai/tambo-cloud/commit/ad2fdcf0f9bfd1a6ec16e7069f60298e5f22646c))


### Miscellaneous Chores

* **deps-dev:** bump tsx from 4.20.3 to 4.20.4 ([#1554](https://github.com/tambo-ai/tambo-cloud/issues/1554)) ([62e52e4](https://github.com/tambo-ai/tambo-cloud/commit/62e52e4cd716bcaeb1df05585d8735b7a76f9333))
* **deps-dev:** bump turbo from 2.5.5 to 2.5.6 ([#1557](https://github.com/tambo-ai/tambo-cloud/issues/1557)) ([763539e](https://github.com/tambo-ai/tambo-cloud/commit/763539e4dc2ee6e4cf7609d717299c0526d5ba89))
* **deps:** bump helmet from 7.2.0 to 8.1.0 ([#1556](https://github.com/tambo-ai/tambo-cloud/issues/1556)) ([7808d24](https://github.com/tambo-ai/tambo-cloud/commit/7808d24f9083c422a0df2026bee2e6f4fad92f64))
* **deps:** bump resend from 4.8.0 to 6.0.1 ([#1555](https://github.com/tambo-ai/tambo-cloud/issues/1555)) ([42c6a21](https://github.com/tambo-ai/tambo-cloud/commit/42c6a219260e6e19dcb5825a8460db1957ac2c42))

## [0.100.5](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.4...repo-v0.100.5) (2025-08-18)


### Bug Fixes

* temp remove filters ([#1563](https://github.com/tambo-ai/tambo-cloud/issues/1563)) ([10c600b](https://github.com/tambo-ai/tambo-cloud/commit/10c600b995b4aaf5348351dd0c97d02a47a0f532))

## [0.100.4](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.3...repo-v0.100.4) (2025-08-18)


### Bug Fixes

* put contextkey extraction into try/catch ([#1561](https://github.com/tambo-ai/tambo-cloud/issues/1561)) ([c1b2d39](https://github.com/tambo-ai/tambo-cloud/commit/c1b2d39a4e13bc4b71d136d71801b9fa8c5ad149))

## [0.100.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.2...repo-v0.100.3) (2025-08-18)


### Miscellaneous Chores

* **mcp:** replace button with video and add documentation link ([#1559](https://github.com/tambo-ai/tambo-cloud/issues/1559)) ([00e9bc6](https://github.com/tambo-ai/tambo-cloud/commit/00e9bc6fae8f36ab5b22300d971acb4dcda4aa08))

## [0.100.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.1...repo-v0.100.2) (2025-08-18)


### Bug Fixes

* use non-tambo graph in dashboard ([#1558](https://github.com/tambo-ai/tambo-cloud/issues/1558)) ([baedaf0](https://github.com/tambo-ai/tambo-cloud/commit/baedaf09e35a9c97ad0a28e5538b5804894549ea))


### Documentation

* add init architecture diagram ([#1550](https://github.com/tambo-ai/tambo-cloud/issues/1550)) ([dc4e463](https://github.com/tambo-ai/tambo-cloud/commit/dc4e463f2706649f1a63b946908683490441bfcb))

## [0.100.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.100.0...repo-v0.100.1) (2025-08-16)


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 2 updates ([#1537](https://github.com/tambo-ai/tambo-cloud/issues/1537)) ([58d04f6](https://github.com/tambo-ai/tambo-cloud/commit/58d04f639b356e2888f1a62204f30551e986fb43))
* **deps:** bump @opentelemetry/auto-instrumentations-node from 0.62.0 to 0.62.1 ([#1542](https://github.com/tambo-ai/tambo-cloud/issues/1542)) ([12728a6](https://github.com/tambo-ai/tambo-cloud/commit/12728a6c1a44ed343da3cab0013063d125dfc328))
* **deps:** bump @tambo-ai/react from 0.43.1 to 0.44.0 in the tambo-ai group ([#1539](https://github.com/tambo-ai/tambo-cloud/issues/1539)) ([e0ae06a](https://github.com/tambo-ai/tambo-cloud/commit/e0ae06a6bbdf2133fc4e92b1ade108f6c22de715))
* **deps:** bump @tanstack/react-query from 5.84.2 to 5.85.3 ([#1543](https://github.com/tambo-ai/tambo-cloud/issues/1543)) ([174e9e1](https://github.com/tambo-ai/tambo-cloud/commit/174e9e1154257c8b8084d1b3a5565b05bac6635e))
* **deps:** bump recharts from 3.1.0 to 3.1.2 ([#1548](https://github.com/tambo-ai/tambo-cloud/issues/1548)) ([0873b1d](https://github.com/tambo-ai/tambo-cloud/commit/0873b1d2857c76efe485724840f9112d9acb628a))
* **deps:** bump the radix-ui group with 14 updates ([#1536](https://github.com/tambo-ai/tambo-cloud/issues/1536)) ([80a1bd0](https://github.com/tambo-ai/tambo-cloud/commit/80a1bd048006c41338e91ea9ae560ba34def6f02))
* **deps:** bump the sentry group with 2 updates ([#1547](https://github.com/tambo-ai/tambo-cloud/issues/1547)) ([fa8936c](https://github.com/tambo-ai/tambo-cloud/commit/fa8936c7be2dadf45b37279aa1c8918763540999))
* **deps:** bump the small-safe-packages group with 2 updates ([#1540](https://github.com/tambo-ai/tambo-cloud/issues/1540)) ([c021598](https://github.com/tambo-ai/tambo-cloud/commit/c02159892e9ae4736e8b1634438a4cc35fc9a5c8))
* **deps:** group all the sentry stuff together ([#1546](https://github.com/tambo-ai/tambo-cloud/issues/1546)) ([00b8afc](https://github.com/tambo-ai/tambo-cloud/commit/00b8afc2541603d6a0bab0f31bb2e6f404661919))
* **docker:** fix docker startup by making vars effectively optional ([#1549](https://github.com/tambo-ai/tambo-cloud/issues/1549)) ([6732082](https://github.com/tambo-ai/tambo-cloud/commit/673208242ed5e7649cd8968f3a368eb3b23f31d9))
* **docs:** remove old fumadocs, use next to do redirects directlyi ([#1534](https://github.com/tambo-ai/tambo-cloud/issues/1534)) ([2d79816](https://github.com/tambo-ai/tambo-cloud/commit/2d7981609fb41b7452ddd228b84416643644bcd0))
* **hero:** update hero title to what we had before ([#1551](https://github.com/tambo-ai/tambo-cloud/issues/1551)) ([1d5e9f3](https://github.com/tambo-ai/tambo-cloud/commit/1d5e9f3df71e8ac32420b2dfcaf28f729948dcd7))

## [0.100.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.99.0...repo-v0.100.0) (2025-08-14)


### Features

* **sentry:** integrate Sentry for error tracking and performance monitoring ([#1506](https://github.com/tambo-ai/tambo-cloud/issues/1506)) ([6a27574](https://github.com/tambo-ai/tambo-cloud/commit/6a27574c89dc46b50c2e6bbe3224e7914f8d442d))


### Bug Fixes

* update openai SDK and deal with new "custom functions" type fallout ([#1530](https://github.com/tambo-ai/tambo-cloud/issues/1530)) ([f0579aa](https://github.com/tambo-ai/tambo-cloud/commit/f0579aac5e7cc9422979796f37d590fc0094ef70))


### Code Refactoring

* **onboarding-wizard:** remove conversational form template ([#1532](https://github.com/tambo-ai/tambo-cloud/issues/1532)) ([b61ccbb](https://github.com/tambo-ai/tambo-cloud/commit/b61ccbbb209c43b648f4bdbefb1fba81c2b0397c))

## [0.99.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.98.0...repo-v0.99.0) (2025-08-14)


### Features

* add TamboHackBanner into dashboard header and main page layout ([#1524](https://github.com/tambo-ai/tambo-cloud/issues/1524)) ([2a5200a](https://github.com/tambo-ai/tambo-cloud/commit/2a5200af6db468586353087c3fde6d1ee3e20c94))


### Bug Fixes

* add project setting to require bearer token  ([#1529](https://github.com/tambo-ai/tambo-cloud/issues/1529)) ([ce58acd](https://github.com/tambo-ai/tambo-cloud/commit/ce58acda7c0efffc4852d84d5750da17a1d700ab))
* update redirect URL in HackPage to use environment variable ([#1528](https://github.com/tambo-ai/tambo-cloud/issues/1528)) ([86d213c](https://github.com/tambo-ai/tambo-cloud/commit/86d213cd2c97b192266de548bc276435d7cd7525))


### Code Refactoring

* **hero, pricing:** update hero title and pricing info ([#1522](https://github.com/tambo-ai/tambo-cloud/issues/1522)) ([747fd0f](https://github.com/tambo-ai/tambo-cloud/commit/747fd0ff013bfcf2175346a44e403da2911bd408))

## [0.98.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.97.0...repo-v0.98.0) (2025-08-14)


### Features

* add 'add tambo mcp to ide' button on homepage  ([#1526](https://github.com/tambo-ai/tambo-cloud/issues/1526)) ([de580a7](https://github.com/tambo-ai/tambo-cloud/commit/de580a762aa49a2da1f16acfe4aa90e87ac22009))


### Bug Fixes

* update docker setup to no longer require node ([#1525](https://github.com/tambo-ai/tambo-cloud/issues/1525)) ([684cba3](https://github.com/tambo-ai/tambo-cloud/commit/684cba3f2da652db3c701532c9caaea041c98f7e))


### Documentation

* update main readme with links to react repo and docs ([#1523](https://github.com/tambo-ai/tambo-cloud/issues/1523)) ([3addf96](https://github.com/tambo-ai/tambo-cloud/commit/3addf964f40c6c7e9320b4aabbd04c4133dfdce7))


### Miscellaneous Chores

* remove some old info ([#1520](https://github.com/tambo-ai/tambo-cloud/issues/1520)) ([5c5bdfd](https://github.com/tambo-ai/tambo-cloud/commit/5c5bdfdddf7f7cd8ab31505412d621b31be84443))

## [0.97.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.96.0...repo-v0.97.0) (2025-08-13)


### Features

* show complete endpoint for openai-compatible ([#1519](https://github.com/tambo-ai/tambo-cloud/issues/1519)) ([cba3c8a](https://github.com/tambo-ai/tambo-cloud/commit/cba3c8a6fd44793bc126a61bb70eb79c56c27a53))


### Documentation

* update selfhosting instructions in docker readme ([#1517](https://github.com/tambo-ai/tambo-cloud/issues/1517)) ([176b19e](https://github.com/tambo-ai/tambo-cloud/commit/176b19e141170eebdbc1cee7c690590fa4026ca5))

## [0.96.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.95.1...repo-v0.96.0) (2025-08-12)


### Features

* **api:** configure Helmet security headers (CSP/HSTS) ([#1511](https://github.com/tambo-ai/tambo-cloud/issues/1511)) ([f936452](https://github.com/tambo-ai/tambo-cloud/commit/f9364521931f848e19655d05e1e8330d5685d6c5))
* **auth:** secure per-project secret for OAuth bearer tokens (TAM-416) ([#1515](https://github.com/tambo-ai/tambo-cloud/issues/1515)) ([290a05f](https://github.com/tambo-ai/tambo-cloud/commit/290a05f49b9da3f3a5015c4fd908a500a5f439ab))


### Bug Fixes

* **api:** stop logging message payloads in addMessage ([#1513](https://github.com/tambo-ai/tambo-cloud/issues/1513)) ([fb371b7](https://github.com/tambo-ai/tambo-cloud/commit/fb371b7148a3bfd4178363b6279e940fba27df55))
* **auth:** pin HS256 for MCP JWT verification ([#1514](https://github.com/tambo-ai/tambo-cloud/issues/1514)) ([66f005a](https://github.com/tambo-ai/tambo-cloud/commit/66f005a73d9e25d5228e939021079a6104b3b2c5))
* **auth:** stop logging raw API keys in ApiKeyGuard ([#1508](https://github.com/tambo-ai/tambo-cloud/issues/1508)) ([a2ebe49](https://github.com/tambo-ai/tambo-cloud/commit/a2ebe4994013796f9f766d4a8024d56799d073ed))
* **oauth:** remove sensitive logging from  [TAM-418] ([#1510](https://github.com/tambo-ai/tambo-cloud/issues/1510)) ([2651a35](https://github.com/tambo-ai/tambo-cloud/commit/2651a35cfffe48eb47a42e84fe1cc8ab52af239b))
* **self-hosting:** fix url in env variable formatting ([#1507](https://github.com/tambo-ai/tambo-cloud/issues/1507)) ([7b5c5b0](https://github.com/tambo-ai/tambo-cloud/commit/7b5c5b0b9e9564a103933cdaf280e55798a898b8))
* **self-hosting:** keep database password in sync via POSTGRES_PASSWORD ([#1504](https://github.com/tambo-ai/tambo-cloud/issues/1504)) ([2c9bea4](https://github.com/tambo-ai/tambo-cloud/commit/2c9bea402c8d6041c21142812956682ac6a05b53))
* update welcome message from hydra to tambo ([#1516](https://github.com/tambo-ai/tambo-cloud/issues/1516)) ([2425025](https://github.com/tambo-ai/tambo-cloud/commit/24250255e51dd009eb164f9d77950afc7fe89234))


### Documentation

* **self-hosting/docker:** OAuth setup for Google and GitHub (TAM-427) ([#1512](https://github.com/tambo-ai/tambo-cloud/issues/1512)) ([d27990c](https://github.com/tambo-ai/tambo-cloud/commit/d27990c54bc9f3b31e5a14a2e8a99579476c0ff9))


### Miscellaneous Chores

* **auth:** remove AdminKeyGuard and ADMIN_KEYS handling ([#1509](https://github.com/tambo-ai/tambo-cloud/issues/1509)) ([084a51e](https://github.com/tambo-ai/tambo-cloud/commit/084a51ed17d395d79ac5808fa27db7824e70dfdb))

## [0.95.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.95.0...repo-v0.95.1) (2025-08-11)


### Miscellaneous Chores

* **deps-dev:** bump the eslint group with 2 updates ([#1496](https://github.com/tambo-ai/tambo-cloud/issues/1496)) ([f60892e](https://github.com/tambo-ai/tambo-cloud/commit/f60892e4e3043a18774bab197d7877c17a434296))
* **deps:** bump @tambo-ai/react from 0.43.0 to 0.43.1 in the tambo-ai group ([#1497](https://github.com/tambo-ai/tambo-cloud/issues/1497)) ([6d821b1](https://github.com/tambo-ai/tambo-cloud/commit/6d821b1a3644b9322a83d6d40ed3954ba2a317d5))
* **deps:** bump @tanstack/react-query from 5.84.1 to 5.84.2 ([#1499](https://github.com/tambo-ai/tambo-cloud/issues/1499)) ([9b2a380](https://github.com/tambo-ai/tambo-cloud/commit/9b2a3802926f5ffe91387f0d9855f87f5b463960))
* **deps:** bump docker/build-push-action from 5 to 6 ([#1492](https://github.com/tambo-ai/tambo-cloud/issues/1492)) ([8c72093](https://github.com/tambo-ai/tambo-cloud/commit/8c72093e1cb7d2080815fae4f2d096d89b753d60))
* **deps:** bump js-tiktoken from 1.0.20 to 1.0.21 ([#1500](https://github.com/tambo-ai/tambo-cloud/issues/1500)) ([eb0fcc4](https://github.com/tambo-ai/tambo-cloud/commit/eb0fcc469274bcd36801753342103c28ab0243b7))
* **deps:** bump the nestjs group with 4 updates ([#1493](https://github.com/tambo-ai/tambo-cloud/issues/1493)) ([93cc633](https://github.com/tambo-ai/tambo-cloud/commit/93cc633ade41a4a446e3860baea5e4fa9c8d2470))
* **deps:** bump the next group with 2 updates ([#1495](https://github.com/tambo-ai/tambo-cloud/issues/1495)) ([126bee0](https://github.com/tambo-ai/tambo-cloud/commit/126bee07d93d0f3cec7294f2db6b15dacb5ce5f5))
* **deps:** bump the small-safe-packages group with 4 updates ([#1498](https://github.com/tambo-ai/tambo-cloud/issues/1498)) ([21ac1cf](https://github.com/tambo-ai/tambo-cloud/commit/21ac1cfb634ac4a15c42b25263bfca9b8e654d0c))
* **deps:** bump tldts from 7.0.10 to 7.0.11 ([#1501](https://github.com/tambo-ai/tambo-cloud/issues/1501)) ([27f4b94](https://github.com/tambo-ai/tambo-cloud/commit/27f4b94f5caee0f18c7a45d860837fdc8949bb4f))
* **legal:** License with Apache 2.0 ([#1503](https://github.com/tambo-ai/tambo-cloud/issues/1503)) ([2e1627a](https://github.com/tambo-ai/tambo-cloud/commit/2e1627a09f1c91db749d582570777b9be7945078))

## [0.95.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.94.1...repo-v0.95.0) (2025-08-08)


### Features

* add a way for tambo to know about the page it's on ([#1450](https://github.com/tambo-ai/tambo-cloud/issues/1450)) ([40bfaf0](https://github.com/tambo-ai/tambo-cloud/commit/40bfaf04c9e07e535615da907f31de71eca2818c))
* Add database setup for user/auth tables and working RLS ([#1480](https://github.com/tambo-ai/tambo-cloud/issues/1480)) ([be93f02](https://github.com/tambo-ai/tambo-cloud/commit/be93f02508732c20adbac77a81f0d19470ad3b3f))
* **auth:** restrict OAuth logins to verified email domain ([#1488](https://github.com/tambo-ai/tambo-cloud/issues/1488)) ([78060d8](https://github.com/tambo-ai/tambo-cloud/commit/78060d8f59c03fb0995f2d1918f30286b78ab306))
* **login:** Allow google/github to be turned off, allow email login ([#1490](https://github.com/tambo-ai/tambo-cloud/issues/1490)) ([6fdfca1](https://github.com/tambo-ai/tambo-cloud/commit/6fdfca1a09ed13e8c50c429abe8c4ca321ecfe05))
* update LLM model configurations and add gpt-5 and gemini support ([#1489](https://github.com/tambo-ai/tambo-cloud/issues/1489)) ([77461b9](https://github.com/tambo-ai/tambo-cloud/commit/77461b96030716e44c603fbef339b12eb5459050))
* **web:** basic whitelabel header support (TAM-397) ([#1487](https://github.com/tambo-ai/tambo-cloud/issues/1487)) ([591b3cf](https://github.com/tambo-ai/tambo-cloud/commit/591b3cf0ff0b177ec5a6d41ddac909a181df776a))


### Miscellaneous Chores

* **deps-dev:** bump @types/luxon from 3.6.2 to 3.7.1 ([#1478](https://github.com/tambo-ai/tambo-cloud/issues/1478)) ([d048b80](https://github.com/tambo-ai/tambo-cloud/commit/d048b80949dca24682d7f8c9f9b3589df4094d60))
* **deps-dev:** bump typescript from 5.8.3 to 5.9.2 ([#1481](https://github.com/tambo-ai/tambo-cloud/issues/1481)) ([ba6741f](https://github.com/tambo-ai/tambo-cloud/commit/ba6741fd61690956d3e5046d745b4a0dfdcc3125))
* **deps:** bump openai from 5.10.2 to 5.11.0 ([#1477](https://github.com/tambo-ai/tambo-cloud/issues/1477)) ([31254bb](https://github.com/tambo-ai/tambo-cloud/commit/31254bbe219e2c59809c5a5663f586c4066b8377))
* **deps:** bump react-hook-form from 7.61.1 to 7.62.0 ([#1482](https://github.com/tambo-ai/tambo-cloud/issues/1482)) ([2a3580b](https://github.com/tambo-ai/tambo-cloud/commit/2a3580be90023127b9588f9849520d52e4791002))
* **deps:** bump the next group with 2 updates ([#1467](https://github.com/tambo-ai/tambo-cloud/issues/1467)) ([947d7e3](https://github.com/tambo-ai/tambo-cloud/commit/947d7e3350e5febdf1a32939d268504d536aec85))
* **env:** remove legacy environment variables ([#1485](https://github.com/tambo-ai/tambo-cloud/issues/1485)) ([dc80876](https://github.com/tambo-ai/tambo-cloud/commit/dc80876bef583817409db51053e291356874f82b))
* **tests:** Get rid of require.resolve for prettier ([#1491](https://github.com/tambo-ai/tambo-cloud/issues/1491)) ([823cac7](https://github.com/tambo-ai/tambo-cloud/commit/823cac76c70945e2b8972b20332bbe0f55c91d8b))


### Tests

* add CI/CD for docker setup ([#1483](https://github.com/tambo-ai/tambo-cloud/issues/1483)) ([ef581fe](https://github.com/tambo-ai/tambo-cloud/commit/ef581fe6cb0f7a2004218c3c1a0f97404049170f))

## [0.94.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.94.0...repo-v0.94.1) (2025-08-04)


### Bug Fixes

* don't await during chunk handling ([#1476](https://github.com/tambo-ai/tambo-cloud/issues/1476)) ([ad47eff](https://github.com/tambo-ai/tambo-cloud/commit/ad47efff91ed05944616b7a689599afc72fe5eb0))


### Miscellaneous Chores

* add test log ([#1473](https://github.com/tambo-ai/tambo-cloud/issues/1473)) ([2fc6349](https://github.com/tambo-ai/tambo-cloud/commit/2fc63494f97e7a08347930f82aedc48200ded3f9))
* combine ai-sdk, make some smaller package groups ([#1462](https://github.com/tambo-ai/tambo-cloud/issues/1462)) ([09ceff7](https://github.com/tambo-ai/tambo-cloud/commit/09ceff7a0981863aeb86535ed9d0da8ba6d90f6d))
* **deps-dev:** bump @types/pg from 8.15.4 to 8.15.5 ([#1472](https://github.com/tambo-ai/tambo-cloud/issues/1472)) ([0fdda71](https://github.com/tambo-ai/tambo-cloud/commit/0fdda71937cfa2d20282208cb778513e569131dd))
* **deps-dev:** bump lint-staged from 16.1.2 to 16.1.4 ([#1457](https://github.com/tambo-ai/tambo-cloud/issues/1457)) ([cb2c437](https://github.com/tambo-ai/tambo-cloud/commit/cb2c437190e80f03923dd2038a490b344e6ac50a))
* **deps-dev:** bump the nestjs group with 2 updates ([#1451](https://github.com/tambo-ai/tambo-cloud/issues/1451)) ([563bce7](https://github.com/tambo-ai/tambo-cloud/commit/563bce7163748c44ac8fecd228eab012501bc02b))
* **deps-dev:** bump ts-jest from 29.4.0 to 29.4.1 in the testing group ([#1454](https://github.com/tambo-ai/tambo-cloud/issues/1454)) ([e5ae64b](https://github.com/tambo-ai/tambo-cloud/commit/e5ae64b1ddda45e1943d095721409722e570e52a))
* **deps-dev:** bump typescript-eslint from 8.38.0 to 8.39.0 in the eslint group ([#1464](https://github.com/tambo-ai/tambo-cloud/issues/1464)) ([0c4ab25](https://github.com/tambo-ai/tambo-cloud/commit/0c4ab25d8acec52cb7785c501cf87a9ac7600930))
* **deps:** bump @hookform/resolvers from 5.2.0 to 5.2.1 ([#1470](https://github.com/tambo-ai/tambo-cloud/issues/1470)) ([c2aa7ce](https://github.com/tambo-ai/tambo-cloud/commit/c2aa7cea56ff764a90b8bb864276d59921246dfc))
* **deps:** bump @modelcontextprotocol/sdk from 1.17.0 to 1.17.1 ([#1453](https://github.com/tambo-ai/tambo-cloud/issues/1453)) ([0f412b4](https://github.com/tambo-ai/tambo-cloud/commit/0f412b48c5f58d9ec02aa3d051df331acd0f921e))
* **deps:** bump @splinetool/runtime from 1.10.38 to 1.10.39 ([#1455](https://github.com/tambo-ai/tambo-cloud/issues/1455)) ([d8a94da](https://github.com/tambo-ai/tambo-cloud/commit/d8a94dae063e8235ac55ceb419115499dfc711c7))
* **deps:** bump @tambo-ai/react from 0.41.0 to 0.41.2 ([#1459](https://github.com/tambo-ai/tambo-cloud/issues/1459)) ([e000c26](https://github.com/tambo-ai/tambo-cloud/commit/e000c263f675066af2b1daface53f20ec42f8a37))
* **deps:** bump @tanstack/react-query from 5.83.0 to 5.84.1 ([#1458](https://github.com/tambo-ai/tambo-cloud/issues/1458)) ([cbe4d73](https://github.com/tambo-ai/tambo-cloud/commit/cbe4d7313d7b5a11916741acc14027de33c00da1))
* **deps:** bump drizzle-orm from 0.44.3 to 0.44.4 in the drizzle group ([#1452](https://github.com/tambo-ai/tambo-cloud/issues/1452)) ([439e303](https://github.com/tambo-ai/tambo-cloud/commit/439e303bc82806ab8c7388e9b0f923c815255561))
* **deps:** bump framer-motion from 12.23.11 to 12.23.12 ([#1471](https://github.com/tambo-ai/tambo-cloud/issues/1471)) ([c060fac](https://github.com/tambo-ai/tambo-cloud/commit/c060facb9a4c9e5171a142e3844497cab2c02ba7))
* **deps:** bump resend from 4.7.0 to 4.8.0 ([#1469](https://github.com/tambo-ai/tambo-cloud/issues/1469)) ([f94c4a3](https://github.com/tambo-ai/tambo-cloud/commit/f94c4a339ac2e65b398f9f0ef299941bd4a2f502))
* **deps:** bump the small-safe-packages group with 3 updates ([#1468](https://github.com/tambo-ai/tambo-cloud/issues/1468)) ([92de20a](https://github.com/tambo-ai/tambo-cloud/commit/92de20adaf593f91a8d179e44585fb60d52c29fb))
* **deps:** bump the trpc group with 3 updates ([#1463](https://github.com/tambo-ai/tambo-cloud/issues/1463)) ([72fc972](https://github.com/tambo-ai/tambo-cloud/commit/72fc972c45ccf2634148644e8c998864acd9f0e0))
* test update thread fetch logic ([#1474](https://github.com/tambo-ai/tambo-cloud/issues/1474)) ([7362c6d](https://github.com/tambo-ai/tambo-cloud/commit/7362c6d17f3296049d43a8b0599a057d75a15d48))

## [0.94.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.93.0...repo-v0.94.0) (2025-08-01)


### Features

* update observability tab to show additional context separately to user message ([#1449](https://github.com/tambo-ai/tambo-cloud/issues/1449)) ([56fa97a](https://github.com/tambo-ai/tambo-cloud/commit/56fa97a40341dff91b16eca8990d4bd0f23aac79))


### Miscellaneous Chores

* bump packages ([#1447](https://github.com/tambo-ai/tambo-cloud/issues/1447)) ([eb1e36e](https://github.com/tambo-ai/tambo-cloud/commit/eb1e36eedd5ef25aa1e6a174407b360dabdb94f3))

## [0.93.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.92.0...repo-v0.93.0) (2025-07-31)


### Features

* small change to trigger typescript-sdk release ([#1445](https://github.com/tambo-ai/tambo-cloud/issues/1445)) ([82149a4](https://github.com/tambo-ai/tambo-cloud/commit/82149a4cb6fdda7b644ef8625b55d59fb3f8a729))

## [0.92.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.91.0...repo-v0.92.0) (2025-07-31)


### Features

* add additionalContext field to message and thread DTOs, and update related services and database schema ([#1443](https://github.com/tambo-ai/tambo-cloud/issues/1443)) ([ce0d594](https://github.com/tambo-ai/tambo-cloud/commit/ce0d594b6d013ef4f1e79eb928e93d4d138aad0e))

## [0.91.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.90.1...repo-v0.91.0) (2025-07-30)


### Features

* add server-side pagination, search, and sorting to thread list component ([#1434](https://github.com/tambo-ai/tambo-cloud/issues/1434)) ([9804102](https://github.com/tambo-ai/tambo-cloud/commit/9804102aa2181088db74fa1c8a2f7843ec11abcc))


### Bug Fixes

* free message count not incrementing ([#1441](https://github.com/tambo-ai/tambo-cloud/issues/1441)) ([1cdaa0f](https://github.com/tambo-ai/tambo-cloud/commit/1cdaa0f2b2e20c62d41f9df92669d412b216d13d))
* remove test logs ([#1442](https://github.com/tambo-ai/tambo-cloud/issues/1442)) ([f63598c](https://github.com/tambo-ai/tambo-cloud/commit/f63598c9b15d8906a5fb3da76040e00127e9499e))

## [0.90.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.90.0...repo-v0.90.1) (2025-07-29)


### Bug Fixes

* only check for cancelled on timer interval ([#1439](https://github.com/tambo-ai/tambo-cloud/issues/1439)) ([21e0d39](https://github.com/tambo-ai/tambo-cloud/commit/21e0d391045bc863b1b092e38360a6d65f30a765))
* propagate userId (contextKey) to langfuse ([#1436](https://github.com/tambo-ai/tambo-cloud/issues/1436)) ([5b99937](https://github.com/tambo-ai/tambo-cloud/commit/5b999375ae466b09ad46c2f8a6e98963830c6fbb))

## [0.90.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.89.0...repo-v0.90.0) (2025-07-29)


### Features

* strawman docker-compose config ([#1363](https://github.com/tambo-ai/tambo-cloud/issues/1363)) ([d1d4ebe](https://github.com/tambo-ai/tambo-cloud/commit/d1d4ebe038e0de427e7a777d099f827514b33a1e))


### Bug Fixes

* give suggestions a slightly different chain/session id ([#1435](https://github.com/tambo-ai/tambo-cloud/issues/1435)) ([e8a2a5b](https://github.com/tambo-ai/tambo-cloud/commit/e8a2a5bc9ee38df6480c711cc2d2424671b649b9))


### Miscellaneous Chores

* add test logs ([#1437](https://github.com/tambo-ai/tambo-cloud/issues/1437)) ([dca801d](https://github.com/tambo-ai/tambo-cloud/commit/dca801d0de2ec284c3fe5ed993cbc4d90ff952ad))
* remove unnecessary components ([#1432](https://github.com/tambo-ai/tambo-cloud/issues/1432)) ([95aa7bf](https://github.com/tambo-ai/tambo-cloud/commit/95aa7bfda7c939151a286b2cdcb7fd1e0ee2958e))

## [0.89.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.88.1...repo-v0.89.0) (2025-07-28)


### Features

* switch from supabase auth to nextauth ([#1395](https://github.com/tambo-ai/tambo-cloud/issues/1395)) ([b21f075](https://github.com/tambo-ai/tambo-cloud/commit/b21f075c31f20e4e9c76affcf438a618e0f13c01))


### Miscellaneous Chores

* add some example vars for new auth stuff ([#1410](https://github.com/tambo-ai/tambo-cloud/issues/1410)) ([527f174](https://github.com/tambo-ai/tambo-cloud/commit/527f174683d3a908aff0102ead1d7d13bc7859ba))
* **deps-dev:** bump @nestjs/cli from 11.0.7 to 11.0.8 in the nestjs group ([#1423](https://github.com/tambo-ai/tambo-cloud/issues/1423)) ([e03b85b](https://github.com/tambo-ai/tambo-cloud/commit/e03b85bc97e9b1166a2dfdb842d70bfe05a32d01))
* **deps-dev:** bump @next/eslint-plugin-next from 15.4.2 to 15.4.4 ([#1427](https://github.com/tambo-ai/tambo-cloud/issues/1427)) ([b421f28](https://github.com/tambo-ai/tambo-cloud/commit/b421f28a28578633f730ff44d3c64de280ccc1e5))
* **deps-dev:** bump jest from 30.0.4 to 30.0.5 in the testing group ([#1413](https://github.com/tambo-ai/tambo-cloud/issues/1413)) ([f473962](https://github.com/tambo-ai/tambo-cloud/commit/f47396263e00eca0b0a70585be26d430aa1587e5))
* **deps-dev:** bump supertest from 7.1.3 to 7.1.4 ([#1422](https://github.com/tambo-ai/tambo-cloud/issues/1422)) ([10e0cca](https://github.com/tambo-ai/tambo-cloud/commit/10e0ccabb2638346841c528cd8941a95140ce35e))
* **deps-dev:** bump the eslint group with 2 updates ([#1414](https://github.com/tambo-ai/tambo-cloud/issues/1414)) ([0e0e15e](https://github.com/tambo-ai/tambo-cloud/commit/0e0e15edeea7327c65062b9ea8279eebfb387cd1))
* **deps:** bump @hookform/resolvers from 5.1.1 to 5.2.0 ([#1430](https://github.com/tambo-ai/tambo-cloud/issues/1430)) ([f18e99c](https://github.com/tambo-ai/tambo-cloud/commit/f18e99ca0f7dd54dec0e1cdecda1c5eaa14d6aa6))
* **deps:** bump @modelcontextprotocol/sdk from 1.16.0 to 1.17.0 ([#1415](https://github.com/tambo-ai/tambo-cloud/issues/1415)) ([9dde30a](https://github.com/tambo-ai/tambo-cloud/commit/9dde30adcf654fbab01092242de7268fac00198b))
* **deps:** bump @splinetool/runtime from 1.10.33 to 1.10.38 ([#1428](https://github.com/tambo-ai/tambo-cloud/issues/1428)) ([80d0a9d](https://github.com/tambo-ai/tambo-cloud/commit/80d0a9dfd4a717005c46b98d3da81ebe112f77bf))
* **deps:** bump @vercel/og from 0.7.2 to 0.8.5 ([#1425](https://github.com/tambo-ai/tambo-cloud/issues/1425)) ([b5998b9](https://github.com/tambo-ai/tambo-cloud/commit/b5998b9664260f7968a77aaa25c1fb8a9c3ccdef))
* **deps:** bump framer-motion from 12.23.6 to 12.23.11 ([#1424](https://github.com/tambo-ai/tambo-cloud/issues/1424)) ([15d5d1d](https://github.com/tambo-ai/tambo-cloud/commit/15d5d1dc65cdcef47c813b337e409b6ca43b314b))
* **deps:** bump jiti from 2.4.2 to 2.5.1 ([#1416](https://github.com/tambo-ai/tambo-cloud/issues/1416)) ([e55445e](https://github.com/tambo-ai/tambo-cloud/commit/e55445e740cb8c9a7538e0544077e4316fd3b25c))
* **deps:** bump lucide-react from 0.525.0 to 0.526.0 ([#1421](https://github.com/tambo-ai/tambo-cloud/issues/1421)) ([260eaa3](https://github.com/tambo-ai/tambo-cloud/commit/260eaa30fc494cd105b973b40a028079fa76c1e3))
* **deps:** bump lucide-react from 0.526.0 to 0.532.0 ([#1426](https://github.com/tambo-ai/tambo-cloud/issues/1426)) ([873a71d](https://github.com/tambo-ai/tambo-cloud/commit/873a71de79aeb38d7e15434e2cbad520c2dd2e7a))
* **deps:** bump next from 15.4.2 to 15.4.4 ([#1420](https://github.com/tambo-ai/tambo-cloud/issues/1420)) ([b4c5d25](https://github.com/tambo-ai/tambo-cloud/commit/b4c5d25faf4652c3bd3c399c6529ca881ba6bb03))
* **deps:** bump openai from 5.10.1 to 5.10.2 ([#1429](https://github.com/tambo-ai/tambo-cloud/issues/1429)) ([272eaba](https://github.com/tambo-ai/tambo-cloud/commit/272eabaa1535338a562ddf1c6ae2f6c96bc06952))
* **deps:** bump posthog-js from 1.257.1 to 1.258.2 ([#1419](https://github.com/tambo-ai/tambo-cloud/issues/1419)) ([3ed7529](https://github.com/tambo-ai/tambo-cloud/commit/3ed7529c193007eb8592ac1bd78e18f9f7b6b730))
* **deps:** bump react-hook-form from 7.60.0 to 7.61.1 ([#1418](https://github.com/tambo-ai/tambo-cloud/issues/1418)) ([7d697c6](https://github.com/tambo-ai/tambo-cloud/commit/7d697c6014a68e091716de0a574cb2c877cad0c4))
* **deps:** bump ytanikin/pr-conventional-commits from 1.4.1 to 1.4.2 ([#1412](https://github.com/tambo-ai/tambo-cloud/issues/1412)) ([85fafbb](https://github.com/tambo-ai/tambo-cloud/commit/85fafbb886a362304c16a28255a2ad468e6c075f))
* remove supabase packages ([#1411](https://github.com/tambo-ai/tambo-cloud/issues/1411)) ([1f516dc](https://github.com/tambo-ai/tambo-cloud/commit/1f516dccd79da9cf8d14d08d237ce747cd1e9a89))

## [0.88.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.88.0...repo-v0.88.1) (2025-07-25)


### Miscellaneous Chores

* bump sdk versions ([#1407](https://github.com/tambo-ai/tambo-cloud/issues/1407)) ([defbe4c](https://github.com/tambo-ai/tambo-cloud/commit/defbe4c80e0b2135f8a80444ac92494e7fa02ff3))

## [0.88.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.87.1...repo-v0.88.0) (2025-07-24)


### Features

* add additionalContext support ([#1402](https://github.com/tambo-ai/tambo-cloud/issues/1402)) ([ce4f888](https://github.com/tambo-ai/tambo-cloud/commit/ce4f8881b35a54f1aa88ee08b8a450a896cc1aa8))

## [0.87.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.87.0...repo-v0.87.1) (2025-07-24)


### Bug Fixes

* update docs link on landing page ([#1405](https://github.com/tambo-ai/tambo-cloud/issues/1405)) ([7376ec7](https://github.com/tambo-ai/tambo-cloud/commit/7376ec766fcdda070613059a03669ca4fb7da90a))


### Miscellaneous Chores

* **deps-dev:** bump form-data from 4.0.2 to 4.0.4 in /scripts ([#1403](https://github.com/tambo-ai/tambo-cloud/issues/1403)) ([2a7a776](https://github.com/tambo-ai/tambo-cloud/commit/2a7a776c80f7f1a47b80b7c823e1b1f53ca83f3c))

## [0.87.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.86.1...repo-v0.87.0) (2025-07-23)


### Features

* redirect old docs and remove old content ([#1401](https://github.com/tambo-ai/tambo-cloud/issues/1401)) ([ef4b8ac](https://github.com/tambo-ai/tambo-cloud/commit/ef4b8ac678ebf145839ce731401cf4c99975b611))


### Miscellaneous Chores

* add and update CALENDAR_URL to email reactivation template ([#1399](https://github.com/tambo-ai/tambo-cloud/issues/1399)) ([1a09659](https://github.com/tambo-ai/tambo-cloud/commit/1a096592b0247f093499dd77725f5dfdf292665d))
* bump components to the latest version ([#1396](https://github.com/tambo-ai/tambo-cloud/issues/1396)) ([cf5d8eb](https://github.com/tambo-ai/tambo-cloud/commit/cf5d8ebfb44d003c40689be270b4d9bfd85861ea))
* update create-project-dialogue in cli-auth ([#1398](https://github.com/tambo-ai/tambo-cloud/issues/1398)) ([340e7ec](https://github.com/tambo-ai/tambo-cloud/commit/340e7ec76d16f7b0b58cacab21389634b76b67db))
* update docs links to the new domain ([#1400](https://github.com/tambo-ai/tambo-cloud/issues/1400)) ([49595eb](https://github.com/tambo-ai/tambo-cloud/commit/49595ebb37fd704eb76cd3c419a9d8e0f118064b))

## [0.86.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.86.0...repo-v0.86.1) (2025-07-22)


### Bug Fixes

* update turbo env vars with required new variables ([#1393](https://github.com/tambo-ai/tambo-cloud/issues/1393)) ([5a2f54f](https://github.com/tambo-ai/tambo-cloud/commit/5a2f54f87a025fec7d8ef8fd687181f04dafaeba))

## [0.86.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.85.0...repo-v0.86.0) (2025-07-22)


### Features

* **api, web:** enhance provider-key section with combined provider-model selection and validation for OpenAI API keys ([#1374](https://github.com/tambo-ai/tambo-cloud/issues/1374)) ([4f12e0b](https://github.com/tambo-ai/tambo-cloud/commit/4f12e0b432431cc60fdd34d00ebda870159f7b36))
* implement gmail notifications for users ([#1368](https://github.com/tambo-ai/tambo-cloud/issues/1368)) ([ecd0ce7](https://github.com/tambo-ai/tambo-cloud/commit/ecd0ce72d832c44c2758e6812842da194096ab68))


### Documentation

* add "Start Here" page ([#1392](https://github.com/tambo-ai/tambo-cloud/issues/1392)) ([ef15dac](https://github.com/tambo-ai/tambo-cloud/commit/ef15daca0d3a47e0e64e8420f8d9456950eba3d6))
* add init what is tambo doc ([#1377](https://github.com/tambo-ai/tambo-cloud/issues/1377)) ([af57ccb](https://github.com/tambo-ai/tambo-cloud/commit/af57ccb937506f67b31ef506838d9e7e113cb9cd))
* reorg docs draft ([#1370](https://github.com/tambo-ai/tambo-cloud/issues/1370)) ([df77901](https://github.com/tambo-ai/tambo-cloud/commit/df779010b9fa2d9b727650399cfa280b2a2d740e))
* update docs styles ([#1391](https://github.com/tambo-ai/tambo-cloud/issues/1391)) ([61b6edd](https://github.com/tambo-ai/tambo-cloud/commit/61b6eddbd2ae099b1ef5a8c0b18cba1b4107a7bf))


### Miscellaneous Chores

* **deps-dev:** bump @next/eslint-plugin-next from 15.3.5 to 15.4.2 ([#1386](https://github.com/tambo-ai/tambo-cloud/issues/1386)) ([60254f4](https://github.com/tambo-ai/tambo-cloud/commit/60254f48c08f4b53cc74829de71d28358304c593))
* **deps:** a bunch of minor package updates ([#1389](https://github.com/tambo-ai/tambo-cloud/issues/1389)) ([1aba401](https://github.com/tambo-ai/tambo-cloud/commit/1aba40117bd67ff41709b5572ed92ebca3147d77))
* **deps:** bump @splinetool/react-spline from 4.0.0 to 4.1.0 ([#1381](https://github.com/tambo-ai/tambo-cloud/issues/1381)) ([068079a](https://github.com/tambo-ai/tambo-cloud/commit/068079a85224722e72de098e15765ed4cab0a23e))
* **deps:** bump @splinetool/runtime from 1.10.27 to 1.10.33 ([#1384](https://github.com/tambo-ai/tambo-cloud/issues/1384)) ([61ad558](https://github.com/tambo-ai/tambo-cloud/commit/61ad55856894e7c2c028a125f9a7f4b946e242cd))
* **deps:** bump @tambo-ai/typescript-sdk from 0.61.0 to 0.63.0 ([#1385](https://github.com/tambo-ai/tambo-cloud/issues/1385)) ([82cabba](https://github.com/tambo-ai/tambo-cloud/commit/82cabba51683ad9587812b3bd7bd96cb2ea85da1))
* **deps:** bump ai from 4.3.17 to 4.3.19 ([#1387](https://github.com/tambo-ai/tambo-cloud/issues/1387)) ([74851fd](https://github.com/tambo-ai/tambo-cloud/commit/74851fd395ec6dc3a4303b0135f50b246da9a904))
* **deps:** bump drizzle-orm from 0.44.2 to 0.44.3 in the drizzle group ([#1379](https://github.com/tambo-ai/tambo-cloud/issues/1379)) ([7544378](https://github.com/tambo-ai/tambo-cloud/commit/75443785e9107fd3f01ee828ba67ed8df86d93da))
* **deps:** bump framer-motion from 12.23.3 to 12.23.6 ([#1383](https://github.com/tambo-ai/tambo-cloud/issues/1383)) ([c02eb73](https://github.com/tambo-ai/tambo-cloud/commit/c02eb7305781daf30767848df8285de591342d77))
* **deps:** bump openai from 5.8.3 to 5.10.1 ([#1380](https://github.com/tambo-ai/tambo-cloud/issues/1380)) ([93ca491](https://github.com/tambo-ai/tambo-cloud/commit/93ca49153c698a68eb45e867a91daee94cb1aa65))
* **deps:** bump the nestjs group with 4 updates ([#1378](https://github.com/tambo-ai/tambo-cloud/issues/1378)) ([a98287a](https://github.com/tambo-ai/tambo-cloud/commit/a98287a1ad07687ca7005c706df9e4d90ed26f81))
* **docs:** update documentation style guide and update streaming component docs ([#1376](https://github.com/tambo-ai/tambo-cloud/issues/1376)) ([2039042](https://github.com/tambo-ai/tambo-cloud/commit/20390423c9e1be9eaff22d3c68078dd5f49958e8))

## [0.85.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.84.0...repo-v0.85.0) (2025-07-17)


### Features

* **dashboard:** implement onboarding wizard for new users and refactor project creation dialog ([#1373](https://github.com/tambo-ai/tambo-cloud/issues/1373)) ([b3707e3](https://github.com/tambo-ai/tambo-cloud/commit/b3707e39cdfbc725130bcdcbcd04380a3161781f))
* **script:** Add script for fetching Namecheap DNS records ([#1359](https://github.com/tambo-ai/tambo-cloud/issues/1359)) ([fea8827](https://github.com/tambo-ai/tambo-cloud/commit/fea88277a39d242b5eab491ec10ce268e847b247))


### Miscellaneous Chores

* add Pricing component in landing page ([#1366](https://github.com/tambo-ai/tambo-cloud/issues/1366)) ([dca394a](https://github.com/tambo-ai/tambo-cloud/commit/dca394aa63030e62882e8af2fe0882c14cceef22))

## [0.84.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.83.0...repo-v0.84.0) (2025-07-15)


### Features

* **web:** major landing page overhaul with improved UX and content ([#1345](https://github.com/tambo-ai/tambo-cloud/issues/1345)) ([e74339b](https://github.com/tambo-ai/tambo-cloud/commit/e74339b2143bc8ef6c04dbfe6088e1b83541fd61))


### Miscellaneous Chores

* comment out Pricing component in landing page for the time being ([#1365](https://github.com/tambo-ai/tambo-cloud/issues/1365)) ([00b8fd9](https://github.com/tambo-ai/tambo-cloud/commit/00b8fd98dd91e9ad8b9309af59a906cf3c0e61c2))

## [0.83.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.82.0...repo-v0.83.0) (2025-07-14)


### Features

* add CLI section to documentation and update files ([#1339](https://github.com/tambo-ai/tambo-cloud/issues/1339)) ([54c2fcb](https://github.com/tambo-ai/tambo-cloud/commit/54c2fcbcdb4a2ce3ff236a91244a2c7048881bb0))
* add search functionality to observability components with highlighting ([#1341](https://github.com/tambo-ai/tambo-cloud/issues/1341)) ([9a43c8e](https://github.com/tambo-ai/tambo-cloud/commit/9a43c8ec46ba4f95054b7997657ee7b5b9fb9095))
* In project list, show "Last message" column (TAM-309) ([#1342](https://github.com/tambo-ai/tambo-cloud/issues/1342)) ([6ae0b53](https://github.com/tambo-ai/tambo-cloud/commit/6ae0b5322140ede8996b1f8271e0b0ae191d952b))
* Integrate langfuse with vercel AI SDK ([#1337](https://github.com/tambo-ai/tambo-cloud/issues/1337)) ([6635066](https://github.com/tambo-ai/tambo-cloud/commit/6635066e3539938c701a3f47b804dfe3514998be))
* major landing page refresh and fixed many landing page issue. ([9afbdc2](https://github.com/tambo-ai/tambo-cloud/commit/9afbdc22b55bb5f8354fb28171892f212503a3c3))


### Bug Fixes

* correct page reference in CLI meta.json from ellipsis to full name ([#1362](https://github.com/tambo-ai/tambo-cloud/issues/1362)) ([5357532](https://github.com/tambo-ai/tambo-cloud/commit/5357532c6631581dc8d7fea4f74cb12f2af43718))
* replace window.location.href with router.push for navigation in ProjectSettings component ([#1346](https://github.com/tambo-ai/tambo-cloud/issues/1346)) ([e8dad53](https://github.com/tambo-ai/tambo-cloud/commit/e8dad53e5e12b312a7efa9112f226e2591349644))
* show all threads in thread-table ([#1340](https://github.com/tambo-ai/tambo-cloud/issues/1340)) ([cdb0a16](https://github.com/tambo-ai/tambo-cloud/commit/cdb0a161805f0d2c0414eaf1eea64a6a7f439691))
* show auth errors on login screen ([#1360](https://github.com/tambo-ai/tambo-cloud/issues/1360)) ([8d0496b](https://github.com/tambo-ai/tambo-cloud/commit/8d0496b58bef9c536c9ea0952ba3ce6972c2cab7))


### Documentation

* add example integrations for auth ([#1343](https://github.com/tambo-ai/tambo-cloud/issues/1343)) ([b626251](https://github.com/tambo-ai/tambo-cloud/commit/b626251fd47d603a6dee9f8bd73ac225935f5de5))


### Miscellaneous Chores

* add redirect pages for social links and GitHub ([#1344](https://github.com/tambo-ai/tambo-cloud/issues/1344)) ([7deeeb7](https://github.com/tambo-ai/tambo-cloud/commit/7deeeb7f0eedb23519289c28f61861c2535c9ccb))
* **deps-dev:** bump the eslint group with 2 updates ([#1356](https://github.com/tambo-ai/tambo-cloud/issues/1356)) ([6cfcb05](https://github.com/tambo-ai/tambo-cloud/commit/6cfcb05836b7cae7d0c1c5abc04f3e4f2270677b))
* **deps:** bump @modelcontextprotocol/sdk from 1.15.0 to 1.15.1 ([#1357](https://github.com/tambo-ai/tambo-cloud/issues/1357)) ([a016023](https://github.com/tambo-ai/tambo-cloud/commit/a01602356b52104c821255456cbcaca7bae4770e))
* **deps:** bump @splinetool/runtime from 1.10.24 to 1.10.27 ([#1352](https://github.com/tambo-ai/tambo-cloud/issues/1352)) ([9040424](https://github.com/tambo-ai/tambo-cloud/commit/904042456e8dc98f1b2d0d45de22c33156a8bb0c))
* **deps:** bump @supabase/supabase-js from 2.50.3 to 2.50.5 ([#1348](https://github.com/tambo-ai/tambo-cloud/issues/1348)) ([9dde900](https://github.com/tambo-ai/tambo-cloud/commit/9dde9008ff79bd0d32f61d18b0a34248333637f3))
* **deps:** bump @tambo-ai/react from 0.37.1 to 0.37.3 ([#1349](https://github.com/tambo-ai/tambo-cloud/issues/1349)) ([364fd92](https://github.com/tambo-ai/tambo-cloud/commit/364fd920b0b9a9dc5fdf215de6860821c1cef0de))
* **deps:** bump @tanstack/react-query from 5.81.5 to 5.83.0 ([#1351](https://github.com/tambo-ai/tambo-cloud/issues/1351)) ([034c4db](https://github.com/tambo-ai/tambo-cloud/commit/034c4dbcf808e2f9e6a0d8e05de5decf031cb92e))
* **deps:** bump @vercel/og from 0.7.1 to 0.7.2 ([#1355](https://github.com/tambo-ai/tambo-cloud/issues/1355)) ([8e0c85f](https://github.com/tambo-ai/tambo-cloud/commit/8e0c85f0babe0bf954a83c9c3e4d68f031f5e2c4))
* **deps:** bump framer-motion from 12.23.0 to 12.23.3 ([#1353](https://github.com/tambo-ai/tambo-cloud/issues/1353)) ([76365b0](https://github.com/tambo-ai/tambo-cloud/commit/76365b0ae37cba304e98215f6bc39f5f7f418cbb))
* **deps:** bump luxon from 3.6.1 to 3.7.1 ([#1354](https://github.com/tambo-ai/tambo-cloud/issues/1354)) ([3000ffc](https://github.com/tambo-ai/tambo-cloud/commit/3000ffcdbcbb9c5b955b080236ddda1f7cf9c97d))
* **deps:** bump posthog-js from 1.256.2 to 1.257.0 ([#1350](https://github.com/tambo-ai/tambo-cloud/issues/1350)) ([073a60e](https://github.com/tambo-ai/tambo-cloud/commit/073a60e0b9404c1f3a0a54ba985c644a5a68a166))
* **deps:** bump slackapi/slack-github-action from 2.1.0 to 2.1.1 ([#1347](https://github.com/tambo-ai/tambo-cloud/issues/1347)) ([326fc73](https://github.com/tambo-ai/tambo-cloud/commit/326fc734b1afbd677a466d9c7f78b56b779b3453))
* Enhance streaming-props.mdx with pain points, pitfalls, perf metrics, glossary, and edge-case note ([#1305](https://github.com/tambo-ai/tambo-cloud/issues/1305)) ([d61f825](https://github.com/tambo-ai/tambo-cloud/commit/d61f825c45ae00af757f7338e745a33a4a9bceb5))
* make the exhaustive-deps rule required ([#1361](https://github.com/tambo-ai/tambo-cloud/issues/1361)) ([86166df](https://github.com/tambo-ai/tambo-cloud/commit/86166dfab119a77740973acac3b663e10bf995ac))
* register and update new components to work with tambo chat ([#1358](https://github.com/tambo-ai/tambo-cloud/issues/1358)) ([d1d5277](https://github.com/tambo-ai/tambo-cloud/commit/d1d52778fef1c4f33984159649844d2d9e5d1990))

## [0.82.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.81.0...repo-v0.82.0) (2025-07-10)


### Features

* add settings section to set toolcall limit for project ([#1334](https://github.com/tambo-ai/tambo-cloud/issues/1334)) ([0ac2cc1](https://github.com/tambo-ai/tambo-cloud/commit/0ac2cc1dc32399d140333733327f1aa04174fc59))


### Bug Fixes

* remove tokenjs from the build ([#1335](https://github.com/tambo-ai/tambo-cloud/issues/1335)) ([6205f9a](https://github.com/tambo-ai/tambo-cloud/commit/6205f9a10bdcee1e9a3f28ae63b6bc7409525ec1))

## [0.81.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.80.1...repo-v0.81.0) (2025-07-10)


### Features

* switch to AI SDK from forked tokenjs ([#1324](https://github.com/tambo-ai/tambo-cloud/issues/1324)) ([715cfa3](https://github.com/tambo-ai/tambo-cloud/commit/715cfa319803508e5e40c0ebfdb2a1267f99e29c))


### Bug Fixes

* correctly pass api key to provider ([#1329](https://github.com/tambo-ai/tambo-cloud/issues/1329)) ([de1cb92](https://github.com/tambo-ai/tambo-cloud/commit/de1cb92e526ccacc91469c9025f541de30e2aaa0))
* deal with edge cases in email validation ([#1332](https://github.com/tambo-ai/tambo-cloud/issues/1332)) ([d89fe73](https://github.com/tambo-ai/tambo-cloud/commit/d89fe7388586fbb68c42860c5aa772be37f206c3))
* handle punycode domains ([#1333](https://github.com/tambo-ai/tambo-cloud/issues/1333)) ([6defc17](https://github.com/tambo-ai/tambo-cloud/commit/6defc172ab9eee94b99d12e367843fa4a7508edf))
* make smoketest use a separate API key than the rest of the app ([#1331](https://github.com/tambo-ai/tambo-cloud/issues/1331)) ([d4803f1](https://github.com/tambo-ai/tambo-cloud/commit/d4803f1c538e0530cb30276535993b5904625c28))
* remove deep-email-validator for security issues ([#1326](https://github.com/tambo-ai/tambo-cloud/issues/1326)) ([3c70f63](https://github.com/tambo-ai/tambo-cloud/commit/3c70f631d8db68805b19fa6658eb100f7792126f))
* remove unused package with security issue ([#1328](https://github.com/tambo-ai/tambo-cloud/issues/1328)) ([8560cbf](https://github.com/tambo-ai/tambo-cloud/commit/8560cbf7e5bae648956e6352b233e49c19867219))


### Miscellaneous Chores

* **deps:** bump @vercel/og from 0.6.8 to 0.7.1 ([#1319](https://github.com/tambo-ai/tambo-cloud/issues/1319)) ([1afa684](https://github.com/tambo-ai/tambo-cloud/commit/1afa684f5c691b384a9ef088c7b11f0b785f286c))

## [0.80.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.80.0...repo-v0.80.1) (2025-07-09)


### Bug Fixes

* add proper types for toolCallCounts ([#1322](https://github.com/tambo-ai/tambo-cloud/issues/1322)) ([58c9c34](https://github.com/tambo-ai/tambo-cloud/commit/58c9c349021604e7a45b149b7ff3ef456f0183d5))

## [0.80.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.79.2...repo-v0.80.0) (2025-07-09)


### Features

* update project field to store max toolcall limit ([#1320](https://github.com/tambo-ai/tambo-cloud/issues/1320)) ([df5196e](https://github.com/tambo-ai/tambo-cloud/commit/df5196eb5ee168de1599a0546a47ddfdf709b8ce))

## [0.79.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.79.1...repo-v0.79.2) (2025-07-08)


### Miscellaneous Chores

* **deps-dev:** bump @next/eslint-plugin-next from 15.3.4 to 15.3.5 ([#1313](https://github.com/tambo-ai/tambo-cloud/issues/1313)) ([78103c6](https://github.com/tambo-ai/tambo-cloud/commit/78103c6feece910f8c308e62b3a7c4faef8d9567))
* **deps-dev:** bump globals from 16.2.0 to 16.3.0 ([#1315](https://github.com/tambo-ai/tambo-cloud/issues/1315)) ([72eb4b2](https://github.com/tambo-ai/tambo-cloud/commit/72eb4b26d4163843ee3ac5d3c2c25e2eaa0212f7))
* **deps-dev:** bump prettier from 3.6.0 to 3.6.2 ([#1312](https://github.com/tambo-ai/tambo-cloud/issues/1312)) ([e786fa9](https://github.com/tambo-ai/tambo-cloud/commit/e786fa94bcbcd9b0d4a49b81b8b8812a1dea3305))
* **deps-dev:** bump supertest from 7.1.1 to 7.1.3 ([#1314](https://github.com/tambo-ai/tambo-cloud/issues/1314)) ([17e5158](https://github.com/tambo-ai/tambo-cloud/commit/17e5158350f3fd5390e00f8fe00127010b7fc1ca))
* **deps-dev:** bump typescript-eslint from 8.35.1 to 8.36.0 in the eslint group ([#1306](https://github.com/tambo-ai/tambo-cloud/issues/1306)) ([785402a](https://github.com/tambo-ai/tambo-cloud/commit/785402a1dfb4315d7b78b2c691d6573e57d4dd64))
* **deps:** bump @modelcontextprotocol/sdk from 1.13.3 to 1.15.0 ([#1317](https://github.com/tambo-ai/tambo-cloud/issues/1317)) ([dd3dc7c](https://github.com/tambo-ai/tambo-cloud/commit/dd3dc7c4ffe853c411bb2ef50a6f57a34adcbf1c))
* **deps:** bump @splinetool/runtime from 1.10.16 to 1.10.24 ([#1308](https://github.com/tambo-ai/tambo-cloud/issues/1308)) ([8a4dd96](https://github.com/tambo-ai/tambo-cloud/commit/8a4dd966276df6d98c16aaf03105e7df0cfe78ed))
* **deps:** bump framer-motion from 12.19.1 to 12.23.0 ([#1310](https://github.com/tambo-ai/tambo-cloud/issues/1310)) ([ca8b3e7](https://github.com/tambo-ai/tambo-cloud/commit/ca8b3e7764e14b6f29dfc3394af59dd34ce887e3))
* **deps:** bump lucide-react from 0.523.0 to 0.525.0 ([#1309](https://github.com/tambo-ai/tambo-cloud/issues/1309)) ([50ea56a](https://github.com/tambo-ai/tambo-cloud/commit/50ea56ae689bb427337f44b0816f1757544eb05a))
* **deps:** bump openai from 5.8.2 to 5.8.3 ([#1311](https://github.com/tambo-ai/tambo-cloud/issues/1311)) ([1f7eab8](https://github.com/tambo-ai/tambo-cloud/commit/1f7eab8b7ec5790e53bed28590589fa6a133068b))
* **deps:** bump posthog-js from 1.255.1 to 1.256.2 ([#1318](https://github.com/tambo-ai/tambo-cloud/issues/1318)) ([dbb95f1](https://github.com/tambo-ai/tambo-cloud/commit/dbb95f1626cf4e3582c32cac423f5b18a58ed0d7))
* **deps:** bump zod from 3.25.74 to 3.25.76 ([#1307](https://github.com/tambo-ai/tambo-cloud/issues/1307)) ([18431a3](https://github.com/tambo-ai/tambo-cloud/commit/18431a38955a328c175c63bff0bdd05c28d519b0))

## [0.79.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.79.0...repo-v0.79.1) (2025-07-07)


### Documentation

* add user auth docs ([#1302](https://github.com/tambo-ai/tambo-cloud/issues/1302)) ([6876c96](https://github.com/tambo-ai/tambo-cloud/commit/6876c96ca79cf81f199a461052d04323fa792b8f))

## [0.79.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.78.6...repo-v0.79.0) (2025-07-07)


### Features

* change contextKey format to be more secure ([#1301](https://github.com/tambo-ai/tambo-cloud/issues/1301)) ([1f0824d](https://github.com/tambo-ai/tambo-cloud/commit/1f0824dc40a539399f3c5c80a807ff26a1c0e777))


### Miscellaneous Chores

* **deps-dev:** bump jest from 30.0.3 to 30.0.4 in the testing group ([#1289](https://github.com/tambo-ai/tambo-cloud/issues/1289)) ([0eaadf2](https://github.com/tambo-ai/tambo-cloud/commit/0eaadf2905aebff11e136285c71735801387341c))
* **deps-dev:** bump the eslint group with 3 updates ([#1290](https://github.com/tambo-ai/tambo-cloud/issues/1290)) ([59e5b89](https://github.com/tambo-ai/tambo-cloud/commit/59e5b89dfa156aa9ef15bd0d7741153d1d6c19cc))
* **deps:** bump @supabase/supabase-js from 2.50.1 to 2.50.3 ([#1298](https://github.com/tambo-ai/tambo-cloud/issues/1298)) ([cbee55d](https://github.com/tambo-ai/tambo-cloud/commit/cbee55d0c19c44d683fcabb8c9a60f495918e19d))
* **deps:** bump @tambo-ai/react from 0.37.0 to 0.37.1 ([#1297](https://github.com/tambo-ai/tambo-cloud/issues/1297)) ([722cb07](https://github.com/tambo-ai/tambo-cloud/commit/722cb0772956e378212e42a268ca3707bffdf9ab))
* **deps:** bump next from 15.3.4 to 15.3.5 ([#1292](https://github.com/tambo-ai/tambo-cloud/issues/1292)) ([6529cfd](https://github.com/tambo-ai/tambo-cloud/commit/6529cfd62a5ae7ac222211ff77c9467bd3ffce01))
* **deps:** bump openai from 5.7.0 to 5.8.2 ([#1293](https://github.com/tambo-ai/tambo-cloud/issues/1293)) ([fab0dd1](https://github.com/tambo-ai/tambo-cloud/commit/fab0dd1cbc19a8c0beb6d04eaea70dd2c67bcecd))
* **deps:** bump react-hook-form from 7.59.0 to 7.60.0 ([#1294](https://github.com/tambo-ai/tambo-cloud/issues/1294)) ([32a4139](https://github.com/tambo-ai/tambo-cloud/commit/32a413962c3670bfec0a68e477564ba9f6dd47c0))
* **deps:** bump tldts from 7.0.9 to 7.0.10 ([#1296](https://github.com/tambo-ai/tambo-cloud/issues/1296)) ([7b55a99](https://github.com/tambo-ai/tambo-cloud/commit/7b55a99de8235771703e00c31c2bf57d039488f4))
* **deps:** bump zod from 3.25.67 to 3.25.74 ([#1291](https://github.com/tambo-ai/tambo-cloud/issues/1291)) ([209376e](https://github.com/tambo-ai/tambo-cloud/commit/209376e16959c59dec85edfbe5898aea78f213d8))

## [0.78.6](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.78.5...repo-v0.78.6) (2025-07-06)


### Bug Fixes

* prompt to be more specific about previous context ([#1287](https://github.com/tambo-ai/tambo-cloud/issues/1287)) ([ba7814b](https://github.com/tambo-ai/tambo-cloud/commit/ba7814b5bae57c539a35cd6131a03c01948941f2))

## [0.78.5](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.78.4...repo-v0.78.5) (2025-07-06)


### Bug Fixes

* add rule to suggestions to respond in user's language ([#1285](https://github.com/tambo-ai/tambo-cloud/issues/1285)) ([f5b2af5](https://github.com/tambo-ai/tambo-cloud/commit/f5b2af5dd9233bcdff5adba62a1fe17bd5be1c40))

## [0.78.4](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.78.3...repo-v0.78.4) (2025-07-05)


### Bug Fixes

* tambo chat toolresult scrolling ([#1283](https://github.com/tambo-ai/tambo-cloud/issues/1283)) ([3abff5a](https://github.com/tambo-ai/tambo-cloud/commit/3abff5a50eebe7bbbaeff2caaa434a1c66455c8f))

## [0.78.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.78.2...repo-v0.78.3) (2025-07-04)


### Bug Fixes

* update tambo-dash components to handle tool response ([#1281](https://github.com/tambo-ai/tambo-cloud/issues/1281)) ([5553ead](https://github.com/tambo-ai/tambo-cloud/commit/5553ead4f220f3cb4a2f0054d6d84985371c14f8))

## [0.78.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.78.1...repo-v0.78.2) (2025-07-03)


### Bug Fixes

* add BetterAuth and Octa presets ([#1279](https://github.com/tambo-ai/tambo-cloud/issues/1279)) ([99528be](https://github.com/tambo-ai/tambo-cloud/commit/99528be03ed4c99079e17b9e22ea9212c39c35b2))


### Miscellaneous Chores

* **deps-dev:** bump the testing group with 2 updates ([#1240](https://github.com/tambo-ai/tambo-cloud/issues/1240)) ([a8c726b](https://github.com/tambo-ai/tambo-cloud/commit/a8c726bc3fbf2a6bcfeabb9697e93f1fcfd419f1))

## [0.78.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.78.0...repo-v0.78.1) (2025-07-03)


### Documentation

* add section about `useTamboStreamStatus` ([#1277](https://github.com/tambo-ai/tambo-cloud/issues/1277)) ([de40ab5](https://github.com/tambo-ai/tambo-cloud/commit/de40ab5543e35bc97584f9e5e3b6cef0397f52e7))

## [0.78.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.77.2...repo-v0.78.0) (2025-07-03)


### Features

* update observability colors and toolbar condension ([#1275](https://github.com/tambo-ai/tambo-cloud/issues/1275)) ([3ca06d7](https://github.com/tambo-ai/tambo-cloud/commit/3ca06d778f8e1af9617ab8e47aa233fb44a128c7))
* use new userToken in smoketest ([#1273](https://github.com/tambo-ai/tambo-cloud/issues/1273)) ([1addd50](https://github.com/tambo-ai/tambo-cloud/commit/1addd50b2182fb40a25b0b79b44e61f1e3fce3ee))


### Bug Fixes

* do not error out the input if no context key ([#1276](https://github.com/tambo-ai/tambo-cloud/issues/1276)) ([0d1fce4](https://github.com/tambo-ai/tambo-cloud/commit/0d1fce4784bc89445df8c81aad1a43f19482fd8d))

## [0.77.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.77.1...repo-v0.77.2) (2025-07-03)


### Bug Fixes

* remove problematic additionalProperties, as this is most often a string ([#1271](https://github.com/tambo-ai/tambo-cloud/issues/1271)) ([954a385](https://github.com/tambo-ai/tambo-cloud/commit/954a38591567ea093783691b2ff95d8ad4f715f5))

## [0.77.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.77.0...repo-v0.77.1) (2025-07-02)


### Bug Fixes

* add bearer as a requirement ([#1269](https://github.com/tambo-ai/tambo-cloud/issues/1269)) ([4ec1341](https://github.com/tambo-ai/tambo-cloud/commit/4ec134155a0a942e7b69390fd5687217ec99f80e))

## [0.77.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.76.0...repo-v0.77.0) (2025-07-02)


### Features

* add UI for Auth setup ([#1266](https://github.com/tambo-ai/tambo-cloud/issues/1266)) ([9401369](https://github.com/tambo-ai/tambo-cloud/commit/9401369c32390a3d9c74dd4344458845ab3a92b1))


### Bug Fixes

* add missing bearer auth from oauth definition ([#1268](https://github.com/tambo-ai/tambo-cloud/issues/1268)) ([e06384c](https://github.com/tambo-ai/tambo-cloud/commit/e06384cf8316a1e9ce5dbfa6db373ece23eada5c))
* replace regexes with explicit, safer alternatives ([#1263](https://github.com/tambo-ai/tambo-cloud/issues/1263)) ([de86c13](https://github.com/tambo-ai/tambo-cloud/commit/de86c1358119adce18e875f3e93733fa1ee02ae1))

## [0.76.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.75.0...repo-v0.76.0) (2025-07-02)


### Features

* allow requesting a thread with internal messages ([#1264](https://github.com/tambo-ai/tambo-cloud/issues/1264)) ([986afd0](https://github.com/tambo-ai/tambo-cloud/commit/986afd0ed0e09886c8e9afb54f57002b25dddc31))

## [0.75.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.74.1...repo-v0.75.0) (2025-07-02)


### Features

* implement symmetric and oauth validation with secret key ([#1260](https://github.com/tambo-ai/tambo-cloud/issues/1260)) ([501e154](https://github.com/tambo-ai/tambo-cloud/commit/501e1540f63e70927363c18d38e2bba7f6d7c3c4))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/react to get updated getToken signature ([#1262](https://github.com/tambo-ai/tambo-cloud/issues/1262)) ([8bf5b4e](https://github.com/tambo-ai/tambo-cloud/commit/8bf5b4e0f88d70e7bbd8455434cc029e13e3a499))

## [0.74.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.74.0...repo-v0.74.1) (2025-07-01)


### Bug Fixes

* open hero pill link in new tab ([#1259](https://github.com/tambo-ai/tambo-cloud/issues/1259)) ([a3255c8](https://github.com/tambo-ai/tambo-cloud/commit/a3255c86e64c7d135d9606be2c4c96e414385953))


### Documentation

* update hero pill to point to customhack ([#1257](https://github.com/tambo-ai/tambo-cloud/issues/1257)) ([4d27a9e](https://github.com/tambo-ai/tambo-cloud/commit/4d27a9e645389072a38cff902625af3e5ec6fc24))

## [0.74.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.73.3...repo-v0.74.0) (2025-07-01)


### Features

* **UI:** implementation of phase 4 ([#1255](https://github.com/tambo-ai/tambo-cloud/issues/1255)) ([540bf3f](https://github.com/tambo-ai/tambo-cloud/commit/540bf3fb1f923625ae1fcecf01ee75ca64dbd65f))

## [0.73.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.73.2...repo-v0.73.3) (2025-07-01)


### Bug Fixes

* make contextKey optional ([#1253](https://github.com/tambo-ai/tambo-cloud/issues/1253)) ([ff975e5](https://github.com/tambo-ai/tambo-cloud/commit/ff975e5114bf659940ef1d1fd8103a44f1437a03))

## [0.73.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.73.1...repo-v0.73.2) (2025-06-30)


### Bug Fixes

* put context key in the url ([#1251](https://github.com/tambo-ai/tambo-cloud/issues/1251)) ([c49a4aa](https://github.com/tambo-ai/tambo-cloud/commit/c49a4aa8d11ac66b2c26b134797087d7c95c1e84))

## [0.73.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.73.0...repo-v0.73.1) (2025-06-30)


### Bug Fixes

* don't doublerender toolcall info ([#1249](https://github.com/tambo-ai/tambo-cloud/issues/1249)) ([83454e1](https://github.com/tambo-ai/tambo-cloud/commit/83454e1738c7dd6a7feebc256d2ee6ac9b14246a))

## [0.73.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.72.0...repo-v0.73.0) (2025-06-30)


### Features

* oauth endpoint and support for bearer tokens in api ([#1237](https://github.com/tambo-ai/tambo-cloud/issues/1237)) ([c058eb6](https://github.com/tambo-ai/tambo-cloud/commit/c058eb68ad2c03ad38941f347bcd4fc5a6b25f9e))


### Miscellaneous Chores

* **deps-dev:** bump drizzle-kit from 0.31.2 to 0.31.4 in the drizzle group ([#1239](https://github.com/tambo-ai/tambo-cloud/issues/1239)) ([913da66](https://github.com/tambo-ai/tambo-cloud/commit/913da66f75cbcc957b627434b7c6d2a55e636af5))
* **deps-dev:** bump the eslint group with 2 updates ([#1243](https://github.com/tambo-ai/tambo-cloud/issues/1243)) ([aca8a2d](https://github.com/tambo-ai/tambo-cloud/commit/aca8a2d8ddb4e2981919ef5887f77e1a13a96339))
* **deps:** bump @splinetool/runtime from 1.10.14 to 1.10.16 ([#1241](https://github.com/tambo-ai/tambo-cloud/issues/1241)) ([32b5e3a](https://github.com/tambo-ai/tambo-cloud/commit/32b5e3ac325c5d8b3584e658a1c8b31f38a867a0))
* **deps:** bump @tambo-ai/typescript-sdk from 0.55.0 to 0.56.0 ([#1244](https://github.com/tambo-ai/tambo-cloud/issues/1244)) ([ec97424](https://github.com/tambo-ai/tambo-cloud/commit/ec97424b1410c70bc00df00fc4a43489a95ce9a2))
* **deps:** bump @tanstack/react-query from 5.81.2 to 5.81.5 ([#1246](https://github.com/tambo-ai/tambo-cloud/issues/1246)) ([eb6a1dd](https://github.com/tambo-ai/tambo-cloud/commit/eb6a1dd9e2b5e113d447e129efd4062bc846b359))
* **deps:** bump pg from 8.16.2 to 8.16.3 ([#1247](https://github.com/tambo-ai/tambo-cloud/issues/1247)) ([26a5826](https://github.com/tambo-ai/tambo-cloud/commit/26a58269698b36c18bbe0847c0520592c7314654))
* **deps:** bump react-hook-form from 7.58.1 to 7.59.0 ([#1245](https://github.com/tambo-ai/tambo-cloud/issues/1245)) ([053c88a](https://github.com/tambo-ai/tambo-cloud/commit/053c88a00ef155d872e389b448817a6d2415a5fa))
* **deps:** bump recharts from 3.0.0 to 3.0.2 ([#1242](https://github.com/tambo-ai/tambo-cloud/issues/1242)) ([8899d91](https://github.com/tambo-ai/tambo-cloud/commit/8899d91940d6b99ae284c7ff0001c2b4f8902254))
* **deps:** bump the trpc group with 3 updates ([#1238](https://github.com/tambo-ai/tambo-cloud/issues/1238)) ([e8f28e5](https://github.com/tambo-ai/tambo-cloud/commit/e8f28e50eea424ad1d9a3ff65781db1f494d27b0))

## [0.72.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.71.0...repo-v0.72.0) (2025-06-27)


### Features

* encode API keys with base64 and add “tambo_” prefix ([#1230](https://github.com/tambo-ai/tambo-cloud/issues/1230)) ([1f83110](https://github.com/tambo-ai/tambo-cloud/commit/1f83110622f1b8f3d95c4ec37f6f27ae1c73f374))
* **UI:** Dashboard redesign phase 3 ([#1233](https://github.com/tambo-ai/tambo-cloud/issues/1233)) ([b608f9e](https://github.com/tambo-ai/tambo-cloud/commit/b608f9e0bbf47db7969dcce608f2dd6ed67199a2))


### Bug Fixes

* stop using getSession, fix await behavior in useEffect ([#1235](https://github.com/tambo-ai/tambo-cloud/issues/1235)) ([eda01ee](https://github.com/tambo-ai/tambo-cloud/commit/eda01eed2f345463cfb233db5468fdb7564867c0))


### Documentation

* Small updates based on feedback ([#1236](https://github.com/tambo-ai/tambo-cloud/issues/1236)) ([cc8456b](https://github.com/tambo-ai/tambo-cloud/commit/cc8456b7330553101e084c5c0b0d505bce945a78))

## [0.71.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.70.0...repo-v0.71.0) (2025-06-26)


### Features

* make sure to return isCancelled field with message types ([#1231](https://github.com/tambo-ai/tambo-cloud/issues/1231)) ([8454e13](https://github.com/tambo-ai/tambo-cloud/commit/8454e13fa652ec0f2e67191beb1556fc5099228a))

## [0.70.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.69.0...repo-v0.70.0) (2025-06-26)


### Features

* add isCancelled field to message schema ([#1229](https://github.com/tambo-ai/tambo-cloud/issues/1229)) ([136b870](https://github.com/tambo-ai/tambo-cloud/commit/136b870cdca8d9817da570628c5ca40ddf12e8ea))


### Miscellaneous Chores

* charlie rules updates (TAM-217) ([#1199](https://github.com/tambo-ai/tambo-cloud/issues/1199)) ([0bfa917](https://github.com/tambo-ai/tambo-cloud/commit/0bfa917b321b4ba66caf2c839afdc2bac05f8b90))
* **deps-dev:** bump prettier from 3.5.3 to 3.6.0 ([#1227](https://github.com/tambo-ai/tambo-cloud/issues/1227)) ([8d14f73](https://github.com/tambo-ai/tambo-cloud/commit/8d14f7375a82d956556d682deb7ecce26c04c9c3))
* **deps-dev:** bump typescript-eslint from 8.34.1 to 8.35.0 in the eslint group ([#1219](https://github.com/tambo-ai/tambo-cloud/issues/1219)) ([f93c4eb](https://github.com/tambo-ai/tambo-cloud/commit/f93c4eb6c36bf2184db2a4c67715a59e4e0cd94b))
* **deps:** bump @modelcontextprotocol/sdk from 1.13.0 to 1.13.1 ([#1225](https://github.com/tambo-ai/tambo-cloud/issues/1225)) ([3c5969e](https://github.com/tambo-ai/tambo-cloud/commit/3c5969e3a3312781fce9c554bcb9dc91d910925c))
* **deps:** bump @splinetool/runtime from 1.9.98 to 1.10.14 ([#1223](https://github.com/tambo-ai/tambo-cloud/issues/1223)) ([71e927e](https://github.com/tambo-ai/tambo-cloud/commit/71e927e92ae28d2da7bed716a90b0ffa4eed4793))
* **deps:** bump @supabase/supabase-js from 2.50.0 to 2.50.1 ([#1222](https://github.com/tambo-ai/tambo-cloud/issues/1222)) ([63dd352](https://github.com/tambo-ai/tambo-cloud/commit/63dd352f413d9b925aa6b1a0a574c2e524bae229))
* **deps:** bump @tambo-ai/react from 0.32.0 to 0.32.1 ([#1220](https://github.com/tambo-ai/tambo-cloud/issues/1220)) ([3c04d9b](https://github.com/tambo-ai/tambo-cloud/commit/3c04d9b218675a610f1a45321e4beacd745e7c01))
* **deps:** bump @tambo-ai/typescript-sdk from 0.53.0 to 0.55.0 ([#1226](https://github.com/tambo-ai/tambo-cloud/issues/1226)) ([59df3f3](https://github.com/tambo-ai/tambo-cloud/commit/59df3f3f6bd2e49ceb0242077887de86adefe497))
* **deps:** bump lucide-react from 0.522.0 to 0.523.0 ([#1221](https://github.com/tambo-ai/tambo-cloud/issues/1221)) ([9ae6cca](https://github.com/tambo-ai/tambo-cloud/commit/9ae6cca2303b677e21b033b90948aff58301e03e))
* **deps:** bump openai from 5.5.1 to 5.7.0 ([#1224](https://github.com/tambo-ai/tambo-cloud/issues/1224)) ([0250157](https://github.com/tambo-ai/tambo-cloud/commit/0250157307637641c412f9cdd7a21ec12127ea64))
* **package:** remove test:suggestions script from package.json ([#1198](https://github.com/tambo-ai/tambo-cloud/issues/1198)) ([c39c00e](https://github.com/tambo-ai/tambo-cloud/commit/c39c00e9c74ce3f581494391a7b573370c4c45e4))

## [0.69.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.68.0...repo-v0.69.0) (2025-06-24)


### Features

* Add thread cancellation route and logic ([#1216](https://github.com/tambo-ai/tambo-cloud/issues/1216)) ([d71340a](https://github.com/tambo-ai/tambo-cloud/commit/d71340a7530e8fa6b53dd49047ff5c853d4069c8))
* remove all composio stuff ([#1212](https://github.com/tambo-ai/tambo-cloud/issues/1212)) ([1a6e9dd](https://github.com/tambo-ai/tambo-cloud/commit/1a6e9dd25fe881d936b1316fa00c374777619063))


### Bug Fixes

* project/thread id truncation, and then a few other random bits ([#1215](https://github.com/tambo-ai/tambo-cloud/issues/1215)) ([6fe7566](https://github.com/tambo-ai/tambo-cloud/commit/6fe756669219c20d83af35eb0c5502e0778791c3))

## [0.68.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.67.1...repo-v0.68.0) (2025-06-23)


### Features

* **UI:** implement new UI redesign ([#1209](https://github.com/tambo-ai/tambo-cloud/issues/1209)) ([9b03cd0](https://github.com/tambo-ai/tambo-cloud/commit/9b03cd028ec3ffd045ffc6a1c05553fd875c2ff6))

## [0.67.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.67.0...repo-v0.67.1) (2025-06-23)


### Bug Fixes

* try plural "prs" to get PR number in release-please slack announcement ([#1210](https://github.com/tambo-ai/tambo-cloud/issues/1210)) ([23c7fbc](https://github.com/tambo-ai/tambo-cloud/commit/23c7fbca61b7fc2d1c6bedae32cfab3a7c8e1ddf))

## [0.67.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.66.0...repo-v0.67.0) (2025-06-23)


### Features

* **logs:** implement per-project logs table, API, dashboard alerts, and backend instrumentation ([#1164](https://github.com/tambo-ai/tambo-cloud/issues/1164)) ([1d8b6a6](https://github.com/tambo-ai/tambo-cloud/commit/1d8b6a6a697a9f2b03a4d4752e804110884af46e))
* start returning mcpAccessToken in response to advance ([#1150](https://github.com/tambo-ai/tambo-cloud/issues/1150)) ([6511a30](https://github.com/tambo-ai/tambo-cloud/commit/6511a301a18421d732bc02f7a10ef56ee5d18f87))


### Miscellaneous Chores

* **deps-dev:** bump @next/eslint-plugin-next from 15.3.3 to 15.3.4 ([#1203](https://github.com/tambo-ai/tambo-cloud/issues/1203)) ([89cb03e](https://github.com/tambo-ai/tambo-cloud/commit/89cb03e5364c6dac32792e60f04fbc586be313fe))
* **deps:** bump @supabase/supabase-js from 2.49.9 to 2.50.0 ([#1207](https://github.com/tambo-ai/tambo-cloud/issues/1207)) ([223fd29](https://github.com/tambo-ai/tambo-cloud/commit/223fd2917f2be4813440303705768a814c182d7e))
* **deps:** bump @tambo-ai/react from 0.31.3 to 0.32.0 ([#1206](https://github.com/tambo-ai/tambo-cloud/issues/1206)) ([89bdfb7](https://github.com/tambo-ai/tambo-cloud/commit/89bdfb7e6978902be0b935acd6329f371b9f8865))
* **deps:** bump @tanstack/react-query from 5.80.10 to 5.81.2 ([#1205](https://github.com/tambo-ai/tambo-cloud/issues/1205)) ([23a246f](https://github.com/tambo-ai/tambo-cloud/commit/23a246f24b39b8b8bcef9f943ee0913b91a805b3))
* **deps:** bump framer-motion from 12.15.0 to 12.18.1 ([#1188](https://github.com/tambo-ai/tambo-cloud/issues/1188)) ([12d96f8](https://github.com/tambo-ai/tambo-cloud/commit/12d96f84ed5c6b7e2bd48ff463d2100d08b3e6fd))
* **deps:** bump lucide-react from 0.513.0 to 0.522.0 ([#1200](https://github.com/tambo-ai/tambo-cloud/issues/1200)) ([e67787c](https://github.com/tambo-ai/tambo-cloud/commit/e67787c2fcb4868ad5667012228e5740e4f32b12))
* **deps:** bump next from 15.3.3 to 15.3.4 ([#1208](https://github.com/tambo-ai/tambo-cloud/issues/1208)) ([8c1aafe](https://github.com/tambo-ai/tambo-cloud/commit/8c1aafe23900facb992865f8b16dc2b7736f3503))
* **deps:** bump pg from 8.16.0 to 8.16.2 ([#1204](https://github.com/tambo-ai/tambo-cloud/issues/1204)) ([03ebc41](https://github.com/tambo-ai/tambo-cloud/commit/03ebc410f40140ac91611151250f9ffaf7b8ba74))
* **deps:** bump posthog-js from 1.255.0 to 1.255.1 ([#1201](https://github.com/tambo-ai/tambo-cloud/issues/1201)) ([6c96b81](https://github.com/tambo-ai/tambo-cloud/commit/6c96b8189175bb93e5d04920dd0ec1cfea83011d))

## [0.66.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.65.0...repo-v0.66.0) (2025-06-19)


### Features

* Allow max input token setting for all models ([#1190](https://github.com/tambo-ai/tambo-cloud/issues/1190)) ([8edc4ec](https://github.com/tambo-ai/tambo-cloud/commit/8edc4ec70917463be4f00551a6cfea831e52a193))


### Bug Fixes

* minor doc rewording, cut down noise from smoketest ([#1192](https://github.com/tambo-ai/tambo-cloud/issues/1192)) ([4e11d00](https://github.com/tambo-ai/tambo-cloud/commit/4e11d00e28c503559461a244306e27eb4465fe63))


### Miscellaneous Chores

* Add Claude Code GitHub Workflow ([#1191](https://github.com/tambo-ai/tambo-cloud/issues/1191)) ([6dd513e](https://github.com/tambo-ai/tambo-cloud/commit/6dd513e3ba81a8aecaa13cc6ef620441dfeaefe7))
* **deps-dev:** bump @types/jsonwebtoken from 9.0.9 to 9.0.10 ([#1183](https://github.com/tambo-ai/tambo-cloud/issues/1183)) ([ed16341](https://github.com/tambo-ai/tambo-cloud/commit/ed1634140ef3ccc495b80853aa943d042a9ae255))
* **deps-dev:** bump typescript-eslint from 8.34.0 to 8.34.1 in the eslint group ([#1182](https://github.com/tambo-ai/tambo-cloud/issues/1182)) ([445b756](https://github.com/tambo-ai/tambo-cloud/commit/445b7565f82d586a27eac60513640f14b3778bfe))
* **deps:** bump @t3-oss/env-nextjs from 0.13.6 to 0.13.8 ([#1184](https://github.com/tambo-ai/tambo-cloud/issues/1184)) ([211cd0a](https://github.com/tambo-ai/tambo-cloud/commit/211cd0ac21adf9181abe3793f8fa7e707cb83105))
* **deps:** bump @tanstack/react-query from 5.80.7 to 5.80.10 ([#1185](https://github.com/tambo-ai/tambo-cloud/issues/1185)) ([84ef9bc](https://github.com/tambo-ai/tambo-cloud/commit/84ef9bcd7699f946b41dcef956d078945b724814))
* **deps:** bump posthog-js from 1.249.0 to 1.255.0 ([#1186](https://github.com/tambo-ai/tambo-cloud/issues/1186)) ([e07e5da](https://github.com/tambo-ai/tambo-cloud/commit/e07e5da44f7f199b8dc3e9892979f863d49dfebd))
* **deps:** bump react-hook-form from 7.57.0 to 7.58.1 ([#1189](https://github.com/tambo-ai/tambo-cloud/issues/1189)) ([bcae3de](https://github.com/tambo-ai/tambo-cloud/commit/bcae3de5b931be43357da976f366a2f8da3ea317))
* **deps:** bump slackapi/slack-github-action from 2.0.0 to 2.1.0 ([#1179](https://github.com/tambo-ai/tambo-cloud/issues/1179)) ([1969e02](https://github.com/tambo-ai/tambo-cloud/commit/1969e0273567eca0da0e735c66922a145b02d99c))
* **deps:** bump the trpc group with 3 updates ([#1181](https://github.com/tambo-ai/tambo-cloud/issues/1181)) ([a0b43c4](https://github.com/tambo-ai/tambo-cloud/commit/a0b43c41fa005ac46e3052c1ba153ca23c313877))
* **deps:** bump tldts from 7.0.8 to 7.0.9 ([#1187](https://github.com/tambo-ai/tambo-cloud/issues/1187)) ([a7268d6](https://github.com/tambo-ai/tambo-cloud/commit/a7268d60ec06b56c1af7ff7741bd80fb20452195))
* **deps:** bump ytanikin/pr-conventional-commits from 1.4.0 to 1.4.1 ([#1180](https://github.com/tambo-ai/tambo-cloud/issues/1180)) ([11ff8b4](https://github.com/tambo-ai/tambo-cloud/commit/11ff8b440d0a2a86fd67fbefddc1a6c2eac41f61))
* update to node 22 ([#1177](https://github.com/tambo-ai/tambo-cloud/issues/1177)) ([369f985](https://github.com/tambo-ai/tambo-cloud/commit/369f985306a1f9cff54b3bda97936c3eb2d8ba6c))

## [0.65.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.64.0...repo-v0.65.0) (2025-06-18)


### Features

* limit prompt tokens when over model's max ([#1171](https://github.com/tambo-ai/tambo-cloud/issues/1171)) ([c96e1ac](https://github.com/tambo-ai/tambo-cloud/commit/c96e1acef94662a068fd8eba3aa618eb66bcafc8))
* update smoketest to get latest tool behavior ([#1175](https://github.com/tambo-ai/tambo-cloud/issues/1175)) ([563ebe5](https://github.com/tambo-ai/tambo-cloud/commit/563ebe50898e7db17e66f03aea4c37a7e26e35ac))


### Bug Fixes

* allow inspection of non-authing servers ([#1174](https://github.com/tambo-ai/tambo-cloud/issues/1174)) ([f52df15](https://github.com/tambo-ai/tambo-cloud/commit/f52df1594f7df0d76245f540bb1801c5ffdf7b53))
* properly display mcp transport type ([#1173](https://github.com/tambo-ai/tambo-cloud/issues/1173)) ([551d0ac](https://github.com/tambo-ai/tambo-cloud/commit/551d0ac6e8a0fe0b194012fbda3cc4d91a890824))

## [0.64.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.63.1...repo-v0.64.0) (2025-06-17)


### Features

* fill in some tool call stuff for server-side tool calls ([#1168](https://github.com/tambo-ai/tambo-cloud/issues/1168)) ([197fb3b](https://github.com/tambo-ai/tambo-cloud/commit/197fb3b91cca705630279766beb4fe8eb03e7614))
* include user email in demo email subject and verify Resend audience subscription ([#1148](https://github.com/tambo-ai/tambo-cloud/issues/1148)) ([78ec20f](https://github.com/tambo-ai/tambo-cloud/commit/78ec20f013797a3e7d6eabe81a5e0910629b5447))
* **slack:** update channel provisioning to assign full-access permissions ([#1167](https://github.com/tambo-ai/tambo-cloud/issues/1167)) ([1656dba](https://github.com/tambo-ai/tambo-cloud/commit/1656dba06240ce32ed6db9b24b0b18bed06bdb2f))
* stub out MCP server for future proxy use ([#1146](https://github.com/tambo-ai/tambo-cloud/issues/1146)) ([4396188](https://github.com/tambo-ai/tambo-cloud/commit/4396188d1a0bd954f1b60dfe7ca4e8b672db682a))
* throttle streaming to 50ms updates ([#1165](https://github.com/tambo-ai/tambo-cloud/issues/1165)) ([508e121](https://github.com/tambo-ai/tambo-cloud/commit/508e12171188478fd99d6286d7a12ada306e47b2))


### Bug Fixes

* do not explode if the MCP server is not configured correctly, just log for now ([#1163](https://github.com/tambo-ai/tambo-cloud/issues/1163)) ([bda71e7](https://github.com/tambo-ai/tambo-cloud/commit/bda71e7615e1a994476928c78e38707f1e7f125e))


### Documentation

* clarify docs with an example ([#1162](https://github.com/tambo-ai/tambo-cloud/issues/1162)) ([9636d8d](https://github.com/tambo-ai/tambo-cloud/commit/9636d8d8aae3c7949de6a25be69adf0edc4c277f))


### Miscellaneous Chores

* **deps-dev:** bump lint-staged from 16.1.0 to 16.1.2 ([#1154](https://github.com/tambo-ai/tambo-cloud/issues/1154)) ([69469b8](https://github.com/tambo-ai/tambo-cloud/commit/69469b8276d19166923814035335bc3e6d08964e))
* **deps-dev:** bump the eslint group with 3 updates ([#1152](https://github.com/tambo-ai/tambo-cloud/issues/1152)) ([64c6e43](https://github.com/tambo-ai/tambo-cloud/commit/64c6e43c218f35d88cbad95c63cedb9dcdc1970a))
* **deps-dev:** bump tsx from 4.19.4 to 4.20.3 ([#1156](https://github.com/tambo-ai/tambo-cloud/issues/1156)) ([85ad109](https://github.com/tambo-ai/tambo-cloud/commit/85ad1095a152b56bb31bb3aec23e6aa2b3611f52))
* **deps:** bump @hookform/resolvers from 5.0.1 to 5.1.1 ([#1158](https://github.com/tambo-ai/tambo-cloud/issues/1158)) ([5a8676c](https://github.com/tambo-ai/tambo-cloud/commit/5a8676cdfdb49b66c203831980244e5d7b634ff0))
* **deps:** bump @tambo-ai/react from 0.29.0 to 0.30.0 ([#1160](https://github.com/tambo-ai/tambo-cloud/issues/1160)) ([243ff20](https://github.com/tambo-ai/tambo-cloud/commit/243ff203447f7a5cfa28859773ee3d0ea77707f1))
* **deps:** bump openai from 5.2.0 to 5.3.0 ([#1159](https://github.com/tambo-ai/tambo-cloud/issues/1159)) ([5716792](https://github.com/tambo-ai/tambo-cloud/commit/5716792de841d9c5d0998d0f4f44d85fc65ca03c))
* **deps:** bump resend from 4.5.2 to 4.6.0 ([#1155](https://github.com/tambo-ai/tambo-cloud/issues/1155)) ([bf014e5](https://github.com/tambo-ai/tambo-cloud/commit/bf014e516d6b6c099a19cc42f833e6ca4b76bc19))
* **deps:** bump the trpc group with 3 updates ([#1151](https://github.com/tambo-ai/tambo-cloud/issues/1151)) ([d6844dc](https://github.com/tambo-ai/tambo-cloud/commit/d6844dc6d444b67b487ec76c69717f1c79a84658))
* get rid of duplicated encryption logic ([#1147](https://github.com/tambo-ai/tambo-cloud/issues/1147)) ([3310938](https://github.com/tambo-ai/tambo-cloud/commit/33109385c808df59467d245e803da01b2b5e94d9))
* standardize license as Apache-2.0 for now ([#1144](https://github.com/tambo-ai/tambo-cloud/issues/1144)) ([61025ca](https://github.com/tambo-ai/tambo-cloud/commit/61025caf95b389477373f4e00be4395520fc0300))

## [0.63.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.63.0...repo-v0.63.1) (2025-06-12)


### Bug Fixes

* if we hit the tool call limits, do not leave the thread in an indeterminate state ([#1143](https://github.com/tambo-ai/tambo-cloud/issues/1143)) ([669a85f](https://github.com/tambo-ai/tambo-cloud/commit/669a85f9996530cd2bc762e383c5ed3a789c9640))
* update RLS to follow supabase perf recommendations ([#1142](https://github.com/tambo-ai/tambo-cloud/issues/1142)) ([542821d](https://github.com/tambo-ai/tambo-cloud/commit/542821da070cd79a37da2ed92f756325fd9b3762))


### Miscellaneous Chores

* **deps:** bump @supabase/auth-js and @supabase/supabase-js in /scripts ([#1141](https://github.com/tambo-ai/tambo-cloud/issues/1141)) ([428b1be](https://github.com/tambo-ai/tambo-cloud/commit/428b1bef942638371309486665ff3a652094576e))
* **deps:** bump openai from 4.103.0 to 5.1.1 ([#1136](https://github.com/tambo-ai/tambo-cloud/issues/1136)) ([0529266](https://github.com/tambo-ai/tambo-cloud/commit/052926611fb88b2b69f44cb9f96d117b7df9ed4e))

## [0.63.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.62.2...repo-v0.63.0) (2025-06-09)


### Features

* **web:** add Discord icon link to top navigation bar ([#1139](https://github.com/tambo-ai/tambo-cloud/issues/1139)) ([2783bab](https://github.com/tambo-ai/tambo-cloud/commit/2783bab7b0fabb154d8bfa0a0fe8fb646924101e))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 20.17.57 to 20.19.0 ([#1133](https://github.com/tambo-ai/tambo-cloud/issues/1133)) ([f44d95d](https://github.com/tambo-ai/tambo-cloud/commit/f44d95d348a1d80bf4732d6ffdc474d81e36845a))
* **deps-dev:** bump typescript-eslint from 8.33.0 to 8.33.1 in the eslint group ([#1130](https://github.com/tambo-ai/tambo-cloud/issues/1130)) ([a91a3da](https://github.com/tambo-ai/tambo-cloud/commit/a91a3dae23bd43db8c387ca3d60d06ca3065bf5d))
* **deps:** bump @tanstack/react-query from 5.79.0 to 5.80.6 ([#1132](https://github.com/tambo-ai/tambo-cloud/issues/1132)) ([6235e6c](https://github.com/tambo-ai/tambo-cloud/commit/6235e6cd0a5dac0ff086d37faa7dab494ae7ea86))
* **deps:** bump drizzle-orm from 0.44.1 to 0.44.2 in the drizzle group ([#1129](https://github.com/tambo-ai/tambo-cloud/issues/1129)) ([a3b3954](https://github.com/tambo-ai/tambo-cloud/commit/a3b3954f268ade195f4835baab45dafffa8095a9))
* **deps:** bump lucide-react from 0.511.0 to 0.513.0 ([#1134](https://github.com/tambo-ai/tambo-cloud/issues/1134)) ([22f5932](https://github.com/tambo-ai/tambo-cloud/commit/22f59320842526d83c773a414ac148b01d1b78d7))
* **deps:** bump resend from 4.5.1 to 4.5.2 ([#1135](https://github.com/tambo-ai/tambo-cloud/issues/1135)) ([05d6ccb](https://github.com/tambo-ai/tambo-cloud/commit/05d6ccb14643a2831aedd822f7ad6832d7728f8b))
* **deps:** bump the nestjs group with 4 updates ([#1128](https://github.com/tambo-ai/tambo-cloud/issues/1128)) ([8fe024c](https://github.com/tambo-ai/tambo-cloud/commit/8fe024cd5c9ef6283e53c6c9d677a0e879c10a22))
* **deps:** bump the trpc group with 3 updates ([#1127](https://github.com/tambo-ai/tambo-cloud/issues/1127)) ([7e2210c](https://github.com/tambo-ai/tambo-cloud/commit/7e2210cf5b4091b99d2348f7e1a13bc66848b8ab))
* **deps:** bump use-debounce from 10.0.4 to 10.0.5 ([#1131](https://github.com/tambo-ai/tambo-cloud/issues/1131)) ([02fb1db](https://github.com/tambo-ai/tambo-cloud/commit/02fb1dbc9986ea0dfa3851c634dfbe055e6b4b3e))

## [0.62.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.62.1...repo-v0.62.2) (2025-06-03)


### Bug Fixes

* do not double-strictify mcp tool schema ([#1124](https://github.com/tambo-ai/tambo-cloud/issues/1124)) ([47899b5](https://github.com/tambo-ai/tambo-cloud/commit/47899b51356558c177c331f67f927031d391a87a))

## [0.62.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.62.0...repo-v0.62.1) (2025-06-03)


### Documentation

* add supabase demo to example docs ([#1122](https://github.com/tambo-ai/tambo-cloud/issues/1122)) ([930fa13](https://github.com/tambo-ai/tambo-cloud/commit/930fa13adb8369ea03b39a91ab5272e6f0df1558))

## [0.62.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.61.3...repo-v0.62.0) (2025-06-03)


### Features

* **home:** add Showcase component to the main page ([#1119](https://github.com/tambo-ai/tambo-cloud/issues/1119)) ([df70137](https://github.com/tambo-ai/tambo-cloud/commit/df70137ab5c93fdf5e7be359473ed74c37104ddd))


### Documentation

* add chat starter template to docs ([#1121](https://github.com/tambo-ai/tambo-cloud/issues/1121)) ([5554f03](https://github.com/tambo-ai/tambo-cloud/commit/5554f03c17328a235134137e76d0679583fbc3d1))

## [0.61.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.61.2...repo-v0.61.3) (2025-06-02)


### Miscellaneous Chores

* **deps-dev:** bump @next/eslint-plugin-next from 15.3.2 to 15.3.3 ([#1110](https://github.com/tambo-ai/tambo-cloud/issues/1110)) ([280185a](https://github.com/tambo-ai/tambo-cloud/commit/280185afc04fff9f110dbc21dcfc497b8dd41c4b))
* **deps-dev:** bump @types/node from 20.17.51 to 20.17.57 ([#1104](https://github.com/tambo-ai/tambo-cloud/issues/1104)) ([2542477](https://github.com/tambo-ai/tambo-cloud/commit/2542477b5da8300962dee565003f18ecc6f7f4dc))
* **deps-dev:** bump @types/pg from 8.15.2 to 8.15.4 ([#1114](https://github.com/tambo-ai/tambo-cloud/issues/1114)) ([44a6405](https://github.com/tambo-ai/tambo-cloud/commit/44a6405f0603273b17709cc5c867f3bc03043835))
* **deps-dev:** bump lint-staged from 16.0.0 to 16.1.0 ([#1111](https://github.com/tambo-ai/tambo-cloud/issues/1111)) ([cbdbd5b](https://github.com/tambo-ai/tambo-cloud/commit/cbdbd5b65ac2aa05a8ee8dce623f7fdf29d9b377))
* **deps-dev:** bump postcss from 8.5.3 to 8.5.4 ([#1103](https://github.com/tambo-ai/tambo-cloud/issues/1103)) ([8b9c72a](https://github.com/tambo-ai/tambo-cloud/commit/8b9c72a6b5a3db794d689e748061c33b83095bef))
* **deps-dev:** bump the eslint group with 3 updates ([#1098](https://github.com/tambo-ai/tambo-cloud/issues/1098)) ([965aa92](https://github.com/tambo-ai/tambo-cloud/commit/965aa92aacb64cc33f0450a517c260bff76e4666))
* **deps-dev:** bump turbo from 2.5.3 to 2.5.4 ([#1102](https://github.com/tambo-ai/tambo-cloud/issues/1102)) ([b30177b](https://github.com/tambo-ai/tambo-cloud/commit/b30177b169f0c36a4d33acda5e02f4b1b02322ff))
* **deps:** bump @splinetool/runtime from 1.9.97 to 1.9.98 ([#1108](https://github.com/tambo-ai/tambo-cloud/issues/1108)) ([2699071](https://github.com/tambo-ai/tambo-cloud/commit/2699071baaa39e563fcdbc62b819fc841137e856))
* **deps:** bump @supabase/supabase-js from 2.49.8 to 2.49.9 ([#1107](https://github.com/tambo-ai/tambo-cloud/issues/1107)) ([4cc8a8e](https://github.com/tambo-ai/tambo-cloud/commit/4cc8a8ee40d6ad6472f005c449b0289f46a08d7e))
* **deps:** bump @tambo-ai/react from 0.28.0 to 0.29.0 ([#1117](https://github.com/tambo-ai/tambo-cloud/issues/1117)) ([6ec8cec](https://github.com/tambo-ai/tambo-cloud/commit/6ec8cecb596885f3fc10b647cad4f9b5957b5a6d))
* **deps:** bump @tanstack/react-query from 5.77.2 to 5.79.0 ([#1112](https://github.com/tambo-ai/tambo-cloud/issues/1112)) ([c824764](https://github.com/tambo-ai/tambo-cloud/commit/c82476497cd49881a6f300c8dd978691feb01b71))
* **deps:** bump drizzle-orm from 0.43.1 to 0.44.1 in the drizzle group ([#1097](https://github.com/tambo-ai/tambo-cloud/issues/1097)) ([4eb866b](https://github.com/tambo-ai/tambo-cloud/commit/4eb866b6f7470463dfa714c8210e05cd19be320f))
* **deps:** bump framer-motion from 12.12.2 to 12.15.0 ([#1113](https://github.com/tambo-ai/tambo-cloud/issues/1113)) ([f18b044](https://github.com/tambo-ai/tambo-cloud/commit/f18b04458bfe342a363270ac7594bf19f1960afc))
* **deps:** bump next from 15.3.2 to 15.3.3 ([#1115](https://github.com/tambo-ai/tambo-cloud/issues/1115)) ([ef3d0da](https://github.com/tambo-ai/tambo-cloud/commit/ef3d0da27dce4e5f991b92b2fa4c181e822c1068))
* **deps:** bump posthog-js from 1.246.0 to 1.249.0 ([#1116](https://github.com/tambo-ai/tambo-cloud/issues/1116)) ([7d0a86c](https://github.com/tambo-ai/tambo-cloud/commit/7d0a86ccbfcbecafe992119a565ace3a910e6f2d))
* **deps:** bump react-hook-form from 7.56.4 to 7.57.0 ([#1109](https://github.com/tambo-ai/tambo-cloud/issues/1109)) ([515e31a](https://github.com/tambo-ai/tambo-cloud/commit/515e31ab65e2b5968cb5efa4fbc35fdcc32ae21b))
* **deps:** bump the trpc group with 3 updates ([#1096](https://github.com/tambo-ai/tambo-cloud/issues/1096)) ([94d7084](https://github.com/tambo-ai/tambo-cloud/commit/94d7084c750f1748ed2800867266ed301d2fa2fe))
* **deps:** bump tldts from 7.0.7 to 7.0.8 ([#1105](https://github.com/tambo-ai/tambo-cloud/issues/1105)) ([428e09e](https://github.com/tambo-ai/tambo-cloud/commit/428e09e8c756897c975460f3b34ae7cfc0f416a5))
* **deps:** bump zod from 3.25.31 to 3.25.46 ([#1100](https://github.com/tambo-ai/tambo-cloud/issues/1100)) ([d6b5d49](https://github.com/tambo-ai/tambo-cloud/commit/d6b5d49428b311598c242b48229701d39052c358))
* **deps:** bump zod from 3.25.46 to 3.25.48 ([#1118](https://github.com/tambo-ai/tambo-cloud/issues/1118)) ([65516f6](https://github.com/tambo-ai/tambo-cloud/commit/65516f65a9a0f914e8af3006bc1e6f47af1f5b92))
* ignore fumadocs in dependabot ([#1092](https://github.com/tambo-ai/tambo-cloud/issues/1092)) ([0d109fc](https://github.com/tambo-ai/tambo-cloud/commit/0d109fc1fb5f024045525a23ecddc64bdbfa340f))

## [0.61.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.61.1...repo-v0.61.2) (2025-05-31)


### Bug Fixes

* **api:** use fallback OpenAI key when project has non-OpenAI provider keys ([#1093](https://github.com/tambo-ai/tambo-cloud/issues/1093)) ([f49e60f](https://github.com/tambo-ai/tambo-cloud/commit/f49e60f5da5ac547a3dfa86366535fa865c39f7e))

## [0.61.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.61.0...repo-v0.61.1) (2025-05-31)


### Bug Fixes

* enhance provider key section and message component styling ([#1086](https://github.com/tambo-ai/tambo-cloud/issues/1086)) ([9ab8b7d](https://github.com/tambo-ai/tambo-cloud/commit/9ab8b7d065683d0b183712bf03c47647ee102767))
* make sure MCP oauth redirects to the right environment ([#1089](https://github.com/tambo-ai/tambo-cloud/issues/1089)) ([deac12c](https://github.com/tambo-ai/tambo-cloud/commit/deac12c7f932bd951a25cf4869dcd17c381bf069))


### Miscellaneous Chores

* **deps:** bump @tambo-ai/react ([#1091](https://github.com/tambo-ai/tambo-cloud/issues/1091)) ([dbc9318](https://github.com/tambo-ai/tambo-cloud/commit/dbc9318e5f45a3fdb3a3b77cf80fbb4bf932f8ae))

## [0.61.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.60.0...repo-v0.61.0) (2025-05-30)


### Features

* bump ([#1087](https://github.com/tambo-ai/tambo-cloud/issues/1087)) ([5f60038](https://github.com/tambo-ai/tambo-cloud/commit/5f60038c3a5297ca932a2777c19f78e1974acce8))

## [0.60.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.59.2...repo-v0.60.0) (2025-05-30)


### Features

* bump spec ([#1085](https://github.com/tambo-ai/tambo-cloud/issues/1085)) ([a87d325](https://github.com/tambo-ai/tambo-cloud/commit/a87d3252a3f0ec16bf8799b614390a9706ddd6e1))


### Miscellaneous Chores

* bump spec ([#1083](https://github.com/tambo-ai/tambo-cloud/issues/1083)) ([054afc1](https://github.com/tambo-ai/tambo-cloud/commit/054afc14d8c5875d858038678649649e13d6675f))

## [0.59.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.59.1...repo-v0.59.2) (2025-05-30)


### Bug Fixes

* update message component to include expandable tool call and fix markdown lists ([#1081](https://github.com/tambo-ai/tambo-cloud/issues/1081)) ([4e09a65](https://github.com/tambo-ai/tambo-cloud/commit/4e09a65b88c54142e527becba6e218fc1d11917b))

## [0.59.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.59.0...repo-v0.59.1) (2025-05-30)


### Miscellaneous Chores

* small change ([#1079](https://github.com/tambo-ai/tambo-cloud/issues/1079)) ([d3f11e9](https://github.com/tambo-ai/tambo-cloud/commit/d3f11e99cc560577fac062b35786552567fee137))

## [0.59.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.58.0...repo-v0.59.0) (2025-05-30)


### Features

* add 'name' field to thread type ([#1076](https://github.com/tambo-ai/tambo-cloud/issues/1076)) ([07b9111](https://github.com/tambo-ai/tambo-cloud/commit/07b91116ac6ae6a402463ce857af90ef15d110b6))
* add route for thread name autogeneration ([#1078](https://github.com/tambo-ai/tambo-cloud/issues/1078)) ([bd2be92](https://github.com/tambo-ai/tambo-cloud/commit/bd2be92c26f4f53f90ef024a47f3cd6612bf23a6))

## [0.58.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.57.0...repo-v0.58.0) (2025-05-30)


### Features

* enhance ProjectTable component with compact mode and loading state ([#1073](https://github.com/tambo-ai/tambo-cloud/issues/1073)) ([aa2e24d](https://github.com/tambo-ai/tambo-cloud/commit/aa2e24d3559f1bf0c350d26773e4438ac81197e1))


### Documentation

* update some old docs ([#1074](https://github.com/tambo-ai/tambo-cloud/issues/1074)) ([a284046](https://github.com/tambo-ai/tambo-cloud/commit/a2840467dba6a090c3498adf188245baeac348bc))

## [0.57.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.56.1...repo-v0.57.0) (2025-05-29)


### Features

* implement API key validation in ProviderKeySection ([#1059](https://github.com/tambo-ai/tambo-cloud/issues/1059)) ([fad05a9](https://github.com/tambo-ai/tambo-cloud/commit/fad05a9e937f61ca05f2c1c7f9e2896550f9511e))
* improve tool defaults, cache system tools, default status ([#1071](https://github.com/tambo-ai/tambo-cloud/issues/1071)) ([9dbde61](https://github.com/tambo-ai/tambo-cloud/commit/9dbde61230e062e6937151cd9cd451dd6d265fed))


### Miscellaneous Chores

* remove test page ([#1072](https://github.com/tambo-ai/tambo-cloud/issues/1072)) ([9afa52a](https://github.com/tambo-ai/tambo-cloud/commit/9afa52a529bf2692a90855c1277d152c1597bde2))

## [0.56.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.56.0...repo-v0.56.1) (2025-05-29)


### Documentation

* Add a bunch of MCP docs + clarification ([#1068](https://github.com/tambo-ai/tambo-cloud/issues/1068)) ([23c3759](https://github.com/tambo-ai/tambo-cloud/commit/23c3759ee8390422e3723cdd752722a0595829a8))

## [0.56.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.55.2...repo-v0.56.0) (2025-05-29)


### Features

* enhance loading states in API key list, available MCP servers, and custom instructions editor components ([#1062](https://github.com/tambo-ai/tambo-cloud/issues/1062)) ([e3b81dc](https://github.com/tambo-ai/tambo-cloud/commit/e3b81dc60d0d28ebfb0934f17d0fbe2c20970ffe))


### Bug Fixes

* combine tool depth and duplicate tool tests ([#1060](https://github.com/tambo-ai/tambo-cloud/issues/1060)) ([485c9c4](https://github.com/tambo-ai/tambo-cloud/commit/485c9c432172986fe4f69171f6e62421f54898e6))
* yield tool call request for server-side tool message ([#1064](https://github.com/tambo-ai/tambo-cloud/issues/1064)) ([40bdc0c](https://github.com/tambo-ai/tambo-cloud/commit/40bdc0c82a11708eba5ede8a10097a6d809dce00))


### Miscellaneous Chores

* add test page for cors check ([#1067](https://github.com/tambo-ai/tambo-cloud/issues/1067)) ([2ff6e1c](https://github.com/tambo-ai/tambo-cloud/commit/2ff6e1c7f3f73215d78032a6462eb63ca6e6bfd3))


### Tests

* add some basic tests for the tool call tracking stuff ([#1066](https://github.com/tambo-ai/tambo-cloud/issues/1066)) ([e63f2ba](https://github.com/tambo-ai/tambo-cloud/commit/e63f2bab2e9e8c36d4210d4ccbf89d1e2eb9fbe2))

## [0.55.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.55.1...repo-v0.55.2) (2025-05-28)


### Bug Fixes

* re-add chat with gpt-4o-mini ([#1063](https://github.com/tambo-ai/tambo-cloud/issues/1063)) ([d79df55](https://github.com/tambo-ai/tambo-cloud/commit/d79df550c814bb5cdb7ff4b621c3899585f800d7))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 20.17.50 to 20.17.51 ([#1057](https://github.com/tambo-ai/tambo-cloud/issues/1057)) ([2888634](https://github.com/tambo-ai/tambo-cloud/commit/28886346442a4d6bd17c3dc0a7a98aacc1d9eb9f))
* **deps-dev:** bump typescript-eslint from 8.32.1 to 8.33.0 in the eslint group ([#1050](https://github.com/tambo-ai/tambo-cloud/issues/1050)) ([a38db89](https://github.com/tambo-ai/tambo-cloud/commit/a38db89dceb4ce8ac9f6b1075aa17293ee3c0518))
* **deps:** bump @splinetool/runtime from 1.9.96 to 1.9.97 ([#1056](https://github.com/tambo-ai/tambo-cloud/issues/1056)) ([9affe17](https://github.com/tambo-ai/tambo-cloud/commit/9affe17ff55fb9870086aceb9e2b9ff34241a700))
* **deps:** bump @t3-oss/env-nextjs from 0.13.4 to 0.13.6 ([#1055](https://github.com/tambo-ai/tambo-cloud/issues/1055)) ([58cae0d](https://github.com/tambo-ai/tambo-cloud/commit/58cae0d2805bc26869e327419489d626b142ff45))
* **deps:** bump @tambo-ai/react from 0.26.0 to 0.26.3 ([#1052](https://github.com/tambo-ai/tambo-cloud/issues/1052)) ([53b6fed](https://github.com/tambo-ai/tambo-cloud/commit/53b6fed941841be434f80d493f4f7093c682aa9b))
* **deps:** bump @tanstack/react-query from 5.77.1 to 5.77.2 ([#1053](https://github.com/tambo-ai/tambo-cloud/issues/1053)) ([9bb8ed6](https://github.com/tambo-ai/tambo-cloud/commit/9bb8ed6a280547356757bfd973e8c4c91b28ba08))
* **deps:** bump the nestjs group with 4 updates ([#1049](https://github.com/tambo-ai/tambo-cloud/issues/1049)) ([0d3d6ad](https://github.com/tambo-ai/tambo-cloud/commit/0d3d6ad97705b52f63c330e82d49a6bb9e34ae09))
* **deps:** bump the trpc group with 3 updates ([#1048](https://github.com/tambo-ai/tambo-cloud/issues/1048)) ([8dda140](https://github.com/tambo-ai/tambo-cloud/commit/8dda140cdaca4b836fc360d1dc89f23e84db4fde))
* **deps:** bump zod from 3.25.28 to 3.25.31 ([#1054](https://github.com/tambo-ai/tambo-cloud/issues/1054)) ([a26de0a](https://github.com/tambo-ai/tambo-cloud/commit/a26de0ab91b94b491dda111e8f74dd912883025a))

## [0.55.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.55.0...repo-v0.55.1) (2025-05-27)


### Bug Fixes

* remove use of react-syntax-highlighter for security, consistent with component library ([#1045](https://github.com/tambo-ai/tambo-cloud/issues/1045)) ([0e7c298](https://github.com/tambo-ai/tambo-cloud/commit/0e7c298fb04b28b760ac78e9df2ad0280582514d))


### Miscellaneous Chores

* comment out chat popup for the time being ([#1058](https://github.com/tambo-ai/tambo-cloud/issues/1058)) ([898902a](https://github.com/tambo-ai/tambo-cloud/commit/898902a9231b37c0b52ad1235c6ff5346e62f9f6))

## [0.55.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.54.1...repo-v0.55.0) (2025-05-27)


### Features

* add chat with tambo assistant ([#1021](https://github.com/tambo-ai/tambo-cloud/issues/1021)) ([0af2adc](https://github.com/tambo-ai/tambo-cloud/commit/0af2adcb648c478f741b6b1f7899534347806717))


### Bug Fixes

* Make sure toolcallrequest chunks have actionType ([#1046](https://github.com/tambo-ai/tambo-cloud/issues/1046)) ([c3cf317](https://github.com/tambo-ai/tambo-cloud/commit/c3cf31768113f950fd3510986c20f33d9c9396d7))


### Miscellaneous Chores

* **deps:** bump @libretto/token.js from `2a03c46` to `293523b` ([#1035](https://github.com/tambo-ai/tambo-cloud/issues/1035)) ([2b19cdc](https://github.com/tambo-ai/tambo-cloud/commit/2b19cdc389726f053e804b6a95ff31154664f24a))
* **deps:** bump @modelcontextprotocol/sdk from 1.11.4 to 1.12.0 ([#1032](https://github.com/tambo-ai/tambo-cloud/issues/1032)) ([1b6b428](https://github.com/tambo-ai/tambo-cloud/commit/1b6b428784e2e627109aa689fa40654431665ad6))

## [0.54.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.54.0...repo-v0.54.1) (2025-05-27)


### Bug Fixes

* create SimpleProjectResponse so we are not bleeding fields into other APIs ([#1043](https://github.com/tambo-ai/tambo-cloud/issues/1043)) ([9ef4923](https://github.com/tambo-ai/tambo-cloud/commit/9ef49231bf82eaec107fed31946664c5870900f3))


### Miscellaneous Chores

* **deps-dev:** bump globals from 16.1.0 to 16.2.0 ([#1037](https://github.com/tambo-ai/tambo-cloud/issues/1037)) ([1f4659c](https://github.com/tambo-ai/tambo-cloud/commit/1f4659cf9ca1a55b99800372b2e64f659eb906b9))
* **deps:** bump @tanstack/react-query from 5.76.2 to 5.77.1 ([#1036](https://github.com/tambo-ai/tambo-cloud/issues/1036)) ([731bd65](https://github.com/tambo-ai/tambo-cloud/commit/731bd65f98da32b65e31ae2a7e0129d5ac2a03f1))
* **deps:** bump zod from 3.25.27 to 3.25.28 ([#1034](https://github.com/tambo-ai/tambo-cloud/issues/1034)) ([e6911de](https://github.com/tambo-ai/tambo-cloud/commit/e6911de96516c43cc83fa8adbff3ed6974558b33))

## [0.54.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.53.0...repo-v0.54.0) (2025-05-26)


### Features

* use gpt-4o as default model  ([#1040](https://github.com/tambo-ai/tambo-cloud/issues/1040)) ([a0545d5](https://github.com/tambo-ai/tambo-cloud/commit/a0545d5eb15634974c854d35dbc4f936470f712f))

## [0.53.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.52.5...repo-v0.53.0) (2025-05-26)


### Features

* update openai-compatible host suggestions and enforce safe host validation ([#1007](https://github.com/tambo-ai/tambo-cloud/issues/1007)) ([c1f3bbb](https://github.com/tambo-ai/tambo-cloud/commit/c1f3bbb5e472942c65fdd965d230afb7640f746e))


### Bug Fixes

* Block identical toolcall loops ([#1038](https://github.com/tambo-ai/tambo-cloud/issues/1038)) ([1432d3d](https://github.com/tambo-ai/tambo-cloud/commit/1432d3d620f369068be53c551b1bfe92d1c4b25c))


### Miscellaneous Chores

* **config:** enable beta.forceAllCheckCommands in charlie config ([#1018](https://github.com/tambo-ai/tambo-cloud/issues/1018)) ([b25d633](https://github.com/tambo-ai/tambo-cloud/commit/b25d633b27878691c80001825d17b8792ce1db5e))
* **deps-dev:** bump @types/node from 20.17.48 to 20.17.50 ([#1030](https://github.com/tambo-ai/tambo-cloud/issues/1030)) ([d940898](https://github.com/tambo-ai/tambo-cloud/commit/d940898d8c1772e72dcc4d97d8ebdc1955129bdd))
* **deps:** bump @supabase/supabase-js from 2.49.4 to 2.49.8 ([#1029](https://github.com/tambo-ai/tambo-cloud/issues/1029)) ([8be28cb](https://github.com/tambo-ai/tambo-cloud/commit/8be28cb4e631f941f5c6223a7b263cbe1c8be851))
* **deps:** bump @tanstack/react-query from 5.76.1 to 5.76.2 ([#1025](https://github.com/tambo-ai/tambo-cloud/issues/1025)) ([affc13e](https://github.com/tambo-ai/tambo-cloud/commit/affc13efff5831f7ed72cb46a998b77e92f5ad0d))
* **deps:** bump framer-motion from 12.12.1 to 12.12.2 ([#1028](https://github.com/tambo-ai/tambo-cloud/issues/1028)) ([2d45bb6](https://github.com/tambo-ai/tambo-cloud/commit/2d45bb6eea6ddaf6aa1c42b7ba7c49674f9b9147))
* **deps:** bump openai from 4.100.0 to 4.103.0 ([#1031](https://github.com/tambo-ai/tambo-cloud/issues/1031)) ([2bdb3f9](https://github.com/tambo-ai/tambo-cloud/commit/2bdb3f926f621687ee8a2ba39e9689423b6f7824))
* **deps:** bump posthog-js from 1.240.6 to 1.246.0 ([#1027](https://github.com/tambo-ai/tambo-cloud/issues/1027)) ([f9430ce](https://github.com/tambo-ai/tambo-cloud/commit/f9430ce56dbac037683142e896aa9f9cba405130))
* **deps:** bump the radix-ui group with 16 updates ([#1023](https://github.com/tambo-ai/tambo-cloud/issues/1023)) ([e765590](https://github.com/tambo-ai/tambo-cloud/commit/e7655907ff13947abfd028152d69914db8d6c13a))
* **deps:** bump zod from 3.24.4 to 3.25.27 ([#1026](https://github.com/tambo-ai/tambo-cloud/issues/1026)) ([bdaaede](https://github.com/tambo-ai/tambo-cloud/commit/bdaaede04a5f6c4d7d952dc410b243e64c0ce295))

## [0.52.5](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.52.4...repo-v0.52.5) (2025-05-22)


### Bug Fixes

* filter out tambo params from ui tools ([#1019](https://github.com/tambo-ai/tambo-cloud/issues/1019)) ([bbdc4d0](https://github.com/tambo-ai/tambo-cloud/commit/bbdc4d067f3d0eb79ea2516e8d92c38b47765858))

## [0.52.4](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.52.3...repo-v0.52.4) (2025-05-21)


### Bug Fixes

* update provider key config ux ([#1014](https://github.com/tambo-ai/tambo-cloud/issues/1014)) ([40935b3](https://github.com/tambo-ai/tambo-cloud/commit/40935b35c3fb0ffce5fd046d3319d3560d6fef12))

## [0.52.3](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.52.2...repo-v0.52.3) (2025-05-21)


### Bug Fixes

* handle tool calls with [] parameters ([#1012](https://github.com/tambo-ai/tambo-cloud/issues/1012)) ([e1b5d42](https://github.com/tambo-ai/tambo-cloud/commit/e1b5d42eae9f06fb877e104b2126d1effdc56ab8))

## [0.52.2](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.52.1...repo-v0.52.2) (2025-05-20)


### Miscellaneous Chores

* **docs:** more neutral doc colors ([#965](https://github.com/tambo-ai/tambo-cloud/issues/965)) ([44cdb50](https://github.com/tambo-ai/tambo-cloud/commit/44cdb50b747db262483e747729508b906e23d405))

## [0.52.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.52.0...repo-v0.52.1) (2025-05-19)


### Bug Fixes

* add back fallback provider key for openai ([#1003](https://github.com/tambo-ai/tambo-cloud/issues/1003)) ([4a2225e](https://github.com/tambo-ai/tambo-cloud/commit/4a2225ea3d0cbd9c3448b289b3ea97611afb6d75))

## [0.52.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.51.1...repo-v0.52.0) (2025-05-19)


### Features

* add multiple llm providers ([#988](https://github.com/tambo-ai/tambo-cloud/issues/988)) ([e1a4ac8](https://github.com/tambo-ai/tambo-cloud/commit/e1a4ac8db5e7d38c73e91a518fb68c466bcfe10c))
* add tool inspector ([#1002](https://github.com/tambo-ai/tambo-cloud/issues/1002)) ([138271f](https://github.com/tambo-ai/tambo-cloud/commit/138271f30936c63be981528b1e62f4685df70f30))


### Miscellaneous Chores

* **deps-dev:** bump @next/eslint-plugin-next from 15.3.1 to 15.3.2 ([#991](https://github.com/tambo-ai/tambo-cloud/issues/991)) ([50462f7](https://github.com/tambo-ai/tambo-cloud/commit/50462f79c84df2c1e568b9d0ff6e422a34af913d))
* **deps-dev:** bump @types/node from 20.17.46 to 20.17.48 ([#985](https://github.com/tambo-ai/tambo-cloud/issues/985)) ([a1e5cd6](https://github.com/tambo-ai/tambo-cloud/commit/a1e5cd65f08408d3b15f7a7dac39da7d331b65f2))
* **deps-dev:** bump the eslint group with 3 updates ([#979](https://github.com/tambo-ai/tambo-cloud/issues/979)) ([c090e78](https://github.com/tambo-ai/tambo-cloud/commit/c090e78d9cd49ab1819ec9c12e3e1b55e865335c))
* **deps-dev:** bump ts-jest from 29.3.2 to 29.3.4 in the testing group ([#981](https://github.com/tambo-ai/tambo-cloud/issues/981)) ([749ea3e](https://github.com/tambo-ai/tambo-cloud/commit/749ea3ea17573101a01fa4242d6467dce8fb9649))
* **deps:** bump @modelcontextprotocol/sdk from 1.11.2 to 1.11.4 ([#998](https://github.com/tambo-ai/tambo-cloud/issues/998)) ([1aae348](https://github.com/tambo-ai/tambo-cloud/commit/1aae3485d3c460d9c04b9eabfb53f81ae7d6ed33))
* **deps:** bump @splinetool/runtime from 1.9.93 to 1.9.96 ([#984](https://github.com/tambo-ai/tambo-cloud/issues/984)) ([a586361](https://github.com/tambo-ai/tambo-cloud/commit/a586361d57bfb8c7bc0eea5656489eae0902e266))
* **deps:** bump @tambo-ai/react from 0.23.1 to 0.26.0 ([#982](https://github.com/tambo-ai/tambo-cloud/issues/982)) ([0830723](https://github.com/tambo-ai/tambo-cloud/commit/0830723878453e152a5397ac0a2fa9bd39435d37))
* **deps:** bump @tanstack/react-query from 5.75.2 to 5.76.1 ([#986](https://github.com/tambo-ai/tambo-cloud/issues/986)) ([3baab27](https://github.com/tambo-ai/tambo-cloud/commit/3baab27ba7fa3f45fbea57808154e8db6dcb19ee))
* **deps:** bump composio-core from 0.5.36 to 0.5.39 ([#993](https://github.com/tambo-ai/tambo-cloud/issues/993)) ([036d9ec](https://github.com/tambo-ai/tambo-cloud/commit/036d9eccc312d503bf801ffa44f1b6445c0b3a8e))
* **deps:** bump framer-motion from 12.11.0 to 12.12.1 ([#994](https://github.com/tambo-ai/tambo-cloud/issues/994)) ([ed8f73c](https://github.com/tambo-ai/tambo-cloud/commit/ed8f73c519247eccf42cc29a4efb64d08614977a))
* **deps:** bump lucide-react from 0.510.0 to 0.511.0 ([#997](https://github.com/tambo-ai/tambo-cloud/issues/997)) ([aa67f59](https://github.com/tambo-ai/tambo-cloud/commit/aa67f59338145f171df447fe9151f75a56877d71))
* **deps:** bump next from 15.3.1 to 15.3.2 ([#987](https://github.com/tambo-ai/tambo-cloud/issues/987)) ([c86bc27](https://github.com/tambo-ai/tambo-cloud/commit/c86bc2793a0eab9522b066ad649b7e9dc05f8a33))
* **deps:** bump openai from 4.98.0 to 4.100.0 ([#992](https://github.com/tambo-ai/tambo-cloud/issues/992)) ([35cb769](https://github.com/tambo-ai/tambo-cloud/commit/35cb76993ca818b7bd68323730fad05cad5a0b99))
* **deps:** bump pg and @types/pg ([#983](https://github.com/tambo-ai/tambo-cloud/issues/983)) ([84cef05](https://github.com/tambo-ai/tambo-cloud/commit/84cef053bc8613b4c026c7c94cc092001fcc0ebe))
* **deps:** bump react-hook-form from 7.56.2 to 7.56.4 ([#995](https://github.com/tambo-ai/tambo-cloud/issues/995)) ([5010fc4](https://github.com/tambo-ai/tambo-cloud/commit/5010fc4dda1949647c6d5c858e57617d11b8324c))
* **deps:** bump the nestjs group with 4 updates ([#978](https://github.com/tambo-ai/tambo-cloud/issues/978)) ([937681e](https://github.com/tambo-ai/tambo-cloud/commit/937681ee8071bf990173cc4190130fbd6f5d6d66))
* **deps:** bump tldts from 7.0.6 to 7.0.7 ([#996](https://github.com/tambo-ai/tambo-cloud/issues/996)) ([d6d29c0](https://github.com/tambo-ai/tambo-cloud/commit/d6d29c0aa7986e7e0be98980626e8b237a2e245f))
* **deps:** remove @google-cloud/firestore from api dependencies ([#1001](https://github.com/tambo-ai/tambo-cloud/issues/1001)) ([2ea5242](https://github.com/tambo-ai/tambo-cloud/commit/2ea52420137a0e9282658833f67c27b06a248913))

## [0.51.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.51.0...repo-v0.51.1) (2025-05-16)


### Bug Fixes

* minor code cleanup + crash fix found while debugging ([#975](https://github.com/tambo-ai/tambo-cloud/issues/975)) ([e519a64](https://github.com/tambo-ai/tambo-cloud/commit/e519a64ad7678003c303af21c6ed5a6fcdbfdfcc))


### Code Refactoring

* fix naming consistency for thread message stuff ([#977](https://github.com/tambo-ai/tambo-cloud/issues/977)) ([e6a5392](https://github.com/tambo-ai/tambo-cloud/commit/e6a5392930916ac6ab7e90d7e4d129e0452fc3ad))

## [0.51.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.50.1...repo-v0.51.0) (2025-05-16)


### Features

* add UI for authenticating OAuth MCP servers ([#970](https://github.com/tambo-ai/tambo-cloud/issues/970)) ([acb0366](https://github.com/tambo-ai/tambo-cloud/commit/acb036695a5cc24afdae627139625c92374b70d5))
* finalize oauth UI flow for single-user ([#972](https://github.com/tambo-ai/tambo-cloud/issues/972)) ([842bfb8](https://github.com/tambo-ai/tambo-cloud/commit/842bfb860eca99254c151367570adef6b8f319ce))
* give dashboard pages a title to make it easier to distinguish them ([#973](https://github.com/tambo-ai/tambo-cloud/issues/973)) ([f6e5fb7](https://github.com/tambo-ai/tambo-cloud/commit/f6e5fb7465f4298cd49deca5a698abb1355b79a2))


### Bug Fixes

* handle cases where auth has not been set up yet ([#974](https://github.com/tambo-ai/tambo-cloud/issues/974)) ([852303c](https://github.com/tambo-ai/tambo-cloud/commit/852303c0ce3b69c877762c6cf6785bfb309249f9))

## [0.50.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.50.0...repo-v0.50.1) (2025-05-14)


### Miscellaneous Chores

* **landing:** update landing and add mcp page ([#962](https://github.com/tambo-ai/tambo-cloud/issues/962)) ([224338b](https://github.com/tambo-ai/tambo-cloud/commit/224338b398107b905d2179b7127592cd2ce07e03))

## [0.50.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.49.0...repo-v0.50.0) (2025-05-14)


### Features

* add error field to messages ([#968](https://github.com/tambo-ai/tambo-cloud/issues/968)) ([c6e68b2](https://github.com/tambo-ai/tambo-cloud/commit/c6e68b2beed1d1789a23dd90d3559a5b61b9a75f))
* introduce mcp oauth entrypoints, store auth to db ([#966](https://github.com/tambo-ai/tambo-cloud/issues/966)) ([d4b6ea7](https://github.com/tambo-ai/tambo-cloud/commit/d4b6ea76c62880e9fbe3e299c33ac201ae1e1ad2))

## [0.49.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.48.0...repo-v0.49.0) (2025-05-13)


### Features

* allow forced tool call on request ([#963](https://github.com/tambo-ai/tambo-cloud/issues/963)) ([dc6e997](https://github.com/tambo-ai/tambo-cloud/commit/dc6e997ac12b52b275f2a4303e8df094d9886e09))

## [0.48.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.47.1...repo-v0.48.0) (2025-05-12)


### Features

* move suggestions to tool calling ([#950](https://github.com/tambo-ai/tambo-cloud/issues/950)) ([e551590](https://github.com/tambo-ai/tambo-cloud/commit/e5515904bba43f784136ecfa163d1276bd09235d))

## [0.47.1](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.47.0...repo-v0.47.1) (2025-05-12)


### Bug Fixes

* "unstrictify" tool calls ([#937](https://github.com/tambo-ai/tambo-cloud/issues/937)) ([928dba8](https://github.com/tambo-ai/tambo-cloud/commit/928dba83542de2e38bba25f6698c0f0098c360e1))


### Documentation

* add page on mcp ([#960](https://github.com/tambo-ai/tambo-cloud/issues/960)) ([a90b448](https://github.com/tambo-ai/tambo-cloud/commit/a90b448e5d9eb581810a96eebe443b027b4125dd))


### Miscellaneous Chores

* **deps-dev:** bump @types/node from 20.17.32 to 20.17.46 ([#945](https://github.com/tambo-ai/tambo-cloud/issues/945)) ([ed7cc13](https://github.com/tambo-ai/tambo-cloud/commit/ed7cc13f325d083710a6a47e9b9aa59ba07b90bc))
* **deps-dev:** bump @types/pg from 8.11.14 to 8.15.1 ([#949](https://github.com/tambo-ai/tambo-cloud/issues/949)) ([00f6e79](https://github.com/tambo-ai/tambo-cloud/commit/00f6e79c6c573fe1e1b287b84003cf3d813746f9))
* **deps-dev:** bump globals from 16.0.0 to 16.1.0 ([#943](https://github.com/tambo-ai/tambo-cloud/issues/943)) ([e51063d](https://github.com/tambo-ai/tambo-cloud/commit/e51063d301d6f62edcf21f9b0b105801116ff75a))
* **deps-dev:** bump lint-staged from 15.5.1 to 16.0.0 ([#953](https://github.com/tambo-ai/tambo-cloud/issues/953)) ([6ee064e](https://github.com/tambo-ai/tambo-cloud/commit/6ee064e459e330e1bc94ad3262ff83ff0bf05b46))
* **deps-dev:** bump supertest from 7.1.0 to 7.1.1 ([#958](https://github.com/tambo-ai/tambo-cloud/issues/958)) ([8e93cb0](https://github.com/tambo-ai/tambo-cloud/commit/8e93cb0b4b0bcd437339fe7b38f777f3075cbf84))
* **deps-dev:** bump the eslint group with 2 updates ([#941](https://github.com/tambo-ai/tambo-cloud/issues/941)) ([10472b8](https://github.com/tambo-ai/tambo-cloud/commit/10472b8fbf5dac2ed68ada12fcdecfcb2af5da85))
* **deps-dev:** bump tsx from 4.19.3 to 4.19.4 ([#956](https://github.com/tambo-ai/tambo-cloud/issues/956)) ([83e215c](https://github.com/tambo-ai/tambo-cloud/commit/83e215cddad359b1ed6fa0781e329d4b23176ad3))
* **deps-dev:** bump turbo from 2.5.2 to 2.5.3 ([#955](https://github.com/tambo-ai/tambo-cloud/issues/955)) ([433399a](https://github.com/tambo-ai/tambo-cloud/commit/433399abe8c1c9530d56f07a311bf9f0e2f4c6e7))
* **deps:** bump @splinetool/runtime from 1.9.89 to 1.9.92 ([#947](https://github.com/tambo-ai/tambo-cloud/issues/947)) ([164ad09](https://github.com/tambo-ai/tambo-cloud/commit/164ad09e77aa490565f618318ce144a1da516c64))
* **deps:** bump @splinetool/runtime from 1.9.92 to 1.9.93 ([#957](https://github.com/tambo-ai/tambo-cloud/issues/957)) ([42f06b4](https://github.com/tambo-ai/tambo-cloud/commit/42f06b454ea17e16fa9e5c6a8e9c1c3c02ae6ee5))
* **deps:** bump framer-motion from 12.10.5 to 12.11.0 ([#959](https://github.com/tambo-ai/tambo-cloud/issues/959)) ([0d8521b](https://github.com/tambo-ai/tambo-cloud/commit/0d8521b098cf093fa11a9b102a5d541d309f57a2))
* **deps:** bump framer-motion from 12.9.7 to 12.10.5 ([#944](https://github.com/tambo-ai/tambo-cloud/issues/944)) ([c77c4a6](https://github.com/tambo-ai/tambo-cloud/commit/c77c4a6adc5d83ad202b03007d01d3c9769077b7))
* **deps:** bump geist from 1.3.1 to 1.4.2 ([#954](https://github.com/tambo-ai/tambo-cloud/issues/954)) ([210ee01](https://github.com/tambo-ai/tambo-cloud/commit/210ee01613c82ed0d267beb3d966e9b1e67dfe27))
* **deps:** bump lucide-react from 0.503.0 to 0.510.0 ([#952](https://github.com/tambo-ai/tambo-cloud/issues/952)) ([d554ec3](https://github.com/tambo-ai/tambo-cloud/commit/d554ec35931cb6342102849262f886a96852bf8a))
* **deps:** bump openai from 4.96.0 to 4.98.0 ([#948](https://github.com/tambo-ai/tambo-cloud/issues/948)) ([be67268](https://github.com/tambo-ai/tambo-cloud/commit/be672682ef0c7ab3e1dfdc91ad8881cd240c9bf7))
* **deps:** bump posthog-js from 1.239.1 to 1.240.6 ([#946](https://github.com/tambo-ai/tambo-cloud/issues/946)) ([a32d741](https://github.com/tambo-ai/tambo-cloud/commit/a32d741e824a108f09669dbe7c8a9bca01ddc4e2))
* **deps:** bump the radix-ui group with 16 updates ([#940](https://github.com/tambo-ai/tambo-cloud/issues/940)) ([7b19c48](https://github.com/tambo-ai/tambo-cloud/commit/7b19c484d528387e6b26db0ac13c5cc13a0ec0b2))


### Code Refactoring

* consolidate strict/unstrict code, move tests, setup jest in core ([#939](https://github.com/tambo-ai/tambo-cloud/issues/939)) ([81b2d79](https://github.com/tambo-ai/tambo-cloud/commit/81b2d79d5e38ac412f5babf54100b599ed928c18))

## [0.47.0](https://github.com/tambo-ai/tambo-cloud/compare/repo-v0.46.2...repo-v0.47.0) (2025-05-09)


### Features

* allow MCP servers to be passed in via smoketest url ([#934](https://github.com/tambo-ai/tambo-cloud/issues/934)) ([92062d3](https://github.com/tambo-ai/tambo-cloud/commit/92062d370763ed8bf7ecd434227c5f5f924b7f2c))


### Bug Fixes

* fix param edge cases in smoketest ([#936](https://github.com/tambo-ai/tambo-cloud/issues/936)) ([0a42a25](https://github.com/tambo-ai/tambo-cloud/commit/0a42a25167fd1f4d1dad6a11690df065e2fa04e8))

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
