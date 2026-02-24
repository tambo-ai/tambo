<div align="center">
  <img src="assets/octo-white-background-rounded.png" width="150">
  <h1>Tambo AI</h1>
  <h3>构建能与 UI 交流的智能体</h3>
  <p>专为 React 打造的开源生成式 UI 工具包。连接你的组件——Tambo 负责处理流式传输、状态管理和 MCP。</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@tambo-ai/react"><img src="https://img.shields.io/npm/v/%40tambo-ai%2Freact?logo=npm" alt="npm version" /></a>
  <a href="https://github.com/tambo-ai/tambo/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tambo-ai/tambo" alt="License" /></a>
  <a href="https://github.com/tambo-ai/tambo/commits/main"><img src="https://img.shields.io/github/last-commit/tambo-ai/tambo" alt="Last Commit" /></a>
  <a href="https://discord.gg/dJNvPEHth6"><img src="https://img.shields.io/discord/1251581895414911016?color=7289da&label=discord" alt="Discord"></a>
  <a href="https://github.com/tambo-ai/tambo"><img src="https://img.shields.io/github/stars/tambo-ai/tambo" alt="GitHub stars" /></a>
</p>

<p align="center">
  <a href="https://trendshift.io/repositories/15734" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/15734" alt="tambo-ai/tambo | Trendshift" width="250" height="55" /></a>
</p>

<p align="center">
  <a href="https://tambo.link/yXkF0hQ">免费开始使用</a> •
  <a href="https://docs.tambo.co">文档</a> •
  <a href="https://discord.gg/dJNvPEHth6">Discord</a>
</p>

<p align="center">
<a href="./README.md">English</a> | <b>简体中文</b>
</p>

---

> **Tambo 1.0 现已发布！** 阅读公告：[介绍 Tambo：专为 React 打造的生成式 UI](https://tambo.co/blog/posts/introducing-tambo-generative-ui)

---

## 目录

- [什么是 Tambo？](#什么是-tambo)
- [快速开始](#快速开始)
- [工作原理](#工作原理)
- [功能特性](#功能特性)
- [对比](#对比)
- [社区](#社区)
- [许可证](#许可证)

## 什么是 Tambo？

Tambo 是一个用于构建能够渲染 UI 的智能体（也称为生成式 UI）的 React 工具包。

通过 Zod 模式注册你的组件。智能体会选择合适的组件并流式传输 Props，以便用户与之交互。“显示按地区排名的销售额”会渲染你的 `<Chart>` 组件。“添加任务”会更新你的 `<TaskBoard>`。

**[5 分钟内上手 →](#快速开始)**

https://github.com/user-attachments/assets/8381d607-b878-4823-8b24-ecb8053bef23

### 包含内容

Tambo 是一个为应用添加生成式 UI 的全栈解决方案。你将获得一个 React SDK 以及一个负责处理会话状态和智能体执行的后端。

**1. 内置智能体** — Tambo 为你运行 LLM 会话循环。你可以使用自己的 API 密钥（OpenAI、Anthropic、Gemini、Mistral 或任何兼容 OpenAI 的提供商）。支持与 LangChain 和 Mastra 等智能体框架配合使用，但并非必需。

**2. 流式传输基础设施** — 随着 LLM 的生成，Props 会流式传输到你的组件。取消、错误恢复和重连都已为你处理。

**3. Tambo Cloud 或自托管** — Cloud 是一个托管后端，管理会话状态和智能体编排。自托管通过 Docker 在你自己的基础设施上运行相同的后端。

大多数软件是围绕“一刀切”的思维模型构建的。我们构建 Tambo 是为了帮助开发者构建能够适应用户的软件。

## 快速开始

```bash
npm create tambo-app my-tambo-app  # 自动初始化 git + tambo 设置
cd my-tambo-app
npm run dev
```

[**Tambo Cloud**](https://tambo.link/yXkF0hQ) 是一个托管后端，免费开始并提供充足的额度。**自托管**则运行在自己的基础设施上。

查看[预构建组件库](https://ui.tambo.co)，获取智能体和生成式 UI 原型：

https://github.com/user-attachments/assets/6cbc103b-9cc7-40f5-9746-12e04c976dff

或者 Fork 一个模板：

| 模板                                                                     | 描述                                       |
| ------------------------------------------------------------------------ | ------------------------------------------ |
| [AI Chat with Generative UI](https://github.com/tambo-ai/tambo-template) | 带有动态组件生成的聊天界面                  |
| [AI Analytics Dashboard](https://github.com/tambo-ai/analytics-template) | 带有 AI 驱动的可视化分析仪表板             |

## 工作原理

告知 AI 它可以调用哪些组件。Zod 模式定义 Props。这些模式成为 LLM 的工具定义——智能体像调用函数一样调用它们，Tambo 负责渲染结果。

### 生成式组件 (Generative Components)

响应消息进行一次渲染。如图表、摘要、数据可视化。

https://github.com/user-attachments/assets/3bd340e7-e226-4151-ae40-aab9b3660d8b

```tsx
const components: TamboComponent[] = [
  {
    name: "Graph",
    description: "使用 Recharts 库将数据展示为图表",
    component: Graph,
    propsSchema: z.object({
      data: z.array(z.object({ name: z.string(), value: z.number() })),
      type: z.enum(["line", "bar", "pie"]),
    }),
  },
];
```

### 可交互组件 (Interactable Components)

随着用户细化请求而持久化并更新。如购物车、电子表格、任务板。

https://github.com/user-attachments/assets/12d957cd-97f1-488e-911f-0ff900ef4062

```tsx
const InteractableNote = withInteractable(Note, {
  componentName: "Note",
  description: "支持标题、内容和颜色修改的便签",
  propsSchema: z.object({
    title: z.string(),
    content: z.string(),
    color: z.enum(["white", "yellow", "blue", "green"]).optional(),
  }),
});
```

文档：[生成式组件](https://docs.tambo.co/concepts/generative-interfaces/generative-components), [可交互组件](https://docs.tambo.co/concepts/generative-interfaces/interactable-components)

### 提供商 (The Provider)

使用 `TamboProvider` 包裹你的应用。你必须提供 `userKey` 或 `userToken` 来标识会话所有者。

```tsx
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  userKey={currentUserId}
  components={components}
>
  <Chat />
  <InteractableNote id="note-1" title="我的便签" content="开始写作..." />
</TamboProvider>
```

在服务器端或受信任的环境中使用 `userKey`。在客户端应用中使用 `userToken`（OAuth 访问令牌），其中令牌包含用户身份。详见 [用户认证](https://docs.tambo.co/concepts/user-authentication)。

文档：[Provider 选项](https://docs.tambo.co/reference/react-sdk/providers)

### Hooks

`useTambo()` 是主要的 Hook —— 它为你提供消息、流式传输状态和会话管理。`useTamboThreadInput()` 处理用户输入和消息提交。

```tsx
const { messages, isStreaming } = useTambo();
const { value, setValue, submit, isPending } = useTamboThreadInput();
```

文档：[会话与消息](https://docs.tambo.co/concepts/conversation-storage), [流式传输状态](https://docs.tambo.co/concepts/generative-interfaces/component-state), [完整教程](https://docs.tambo.co/getting-started/quickstart)

## 功能特性

### MCP 集成

连接到 Linear、Slack、数据库或你自己的 MCP 服务器。Tambo 支持完整的 MCP 协议：工具、提示、探测和采样。

```tsx
import { MCPTransport } from "@tambo-ai/react/mcp";

const mcpServers = [
  {
    name: "filesystem",
    url: "http://localhost:8261/mcp",
    transport: MCPTransport.HTTP,
  },
];

<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  userKey={currentUserId}
  components={components}
  mcpServers={mcpServers}
>
  <App />
</TamboProvider>;
```

https://github.com/user-attachments/assets/c7a13915-8fed-4758-be1b-30a60fad0cda

文档：[MCP 集成](https://docs.tambo.co/concepts/model-context-protocol)

### 本地工具 (Local Tools)

有时你需要在浏览器中运行函数。DOM 操作、认证请求、访问 React 状态。将它们定义为工具，AI 即可调用。

```tsx
const tools: TamboTool[] = [
  {
    name: "getWeather",
    description: "获取特定位置的天气",
    tool: async (params: { location: string }) =>
      fetch(`/api/weather?q=${encodeURIComponent(params.location)}`).then((r) =>
        r.json(),
      ),
    inputSchema: z.object({
      location: z.string(),
    }),
    outputSchema: z.object({
      temperature: z.number(),
      condition: z.string(),
      location: z.string(),
    }),
  },
];

<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  userKey={currentUserId}
  tools={tools}
  components={components}
>
  <App />
</TamboProvider>;
```

文档：[本地工具](https://docs.tambo.co/guides/take-actions/register-tools)

### 上下文、认证与建议

**额外上下文** 允许你传递元数据，让 AI 提供更好的回复。用户状态、应用设置、当前页面。**用户认证** 传递来自你的认证提供商的令牌。**建议 (Suggestions)** 根据用户正在执行的操作生成可点击的提示。

```tsx
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  userToken={userToken}
  contextHelpers={{
    selectedItems: () => ({
      key: "selectedItems",
      value: selectedItems.map((i) => i.name).join(", "),
    }),
    currentPage: () => ({ key: "page", value: window.location.pathname }),
  }}
/>
```

```tsx
const { suggestions, accept } = useTamboSuggestions({ maxSuggestions: 3 });

suggestions.map((s) => (
  <button key={s.id} onClick={() => accept(s)}>
    {s.title}
  </button>
));
```

文档：[额外上下文](https://docs.tambo.co/concepts/additional-context), [用户认证](https://docs.tambo.co/concepts/user-authentication), [建议](https://docs.tambo.co/concepts/suggestions)

### 支持的 LLM 提供商

OpenAI、Anthropic、Cerebras、Google Gemini、Mistral 以及任何兼容 OpenAI 的提供商。[完整列表](https://docs.tambo.co/reference/llm-providers)。缺少您需要的？[告诉我们](https://github.com/tambo-ai/tambo/issues)。

## 对比

| 功能                           | Tambo                                 | Vercel AI SDK                    | CopilotKit                       | Assistant UI         |
| ------------------------------ | ------------------------------------- | -------------------------------- | -------------------------------- | -------------------- |
| **组件选择**                   | AI 决定渲染哪些组件                   | 手动的工具到组件映射             | 通过智能体框架 (LangGraph)       | 以聊天为中心的工具 UI |
| **MCP 集成**                   | 内置                                  | 实验性 (v4.2+)                   | 最近新增                         | 需要 AI SDK v5       |
| **持久状态组件**               | 支持                                  | 不支持                           | 共享状态模式                     | 不支持               |
| **客户端工具执行**             | 声明式，自动                          | 通过 onToolCall 手动处理         | 仅限智能体侧                     | 不支持               |
| **可自托管**                   | MIT (SDK + 后端)                      | Apache 2.0 (仅 SDK)              | MIT                              | MIT                  |
| **托管选项**                   | Tambo Cloud                           | 无                               | CopilotKit Cloud                 | Assistant Cloud      |
| **最佳适用场景**               | 全应用 UI 控制                        | 流式传输和工具抽象               | 多智能体工作流                   | 聊天界面             |

## 社区

加入 [Discord](https://discord.gg/dJNvPEHth6) 与其他开发者和核心团队交流。

有兴趣贡献吗？阅读 [贡献指南](./CONTRIBUTING.md)。

加入 Twitter 上的讨论并关注 [@tambo_ai](https://twitter.com/tambo_ai)。

## 许可证

除非另有说明，否则采用 [MIT](LICENSE)。某些工作区（如 `apps/api`）采用 [Apache-2.0](apps/api/LICENSE)。

---

<p align="center">
  <img src="assets/tambo-animation.gif" alt="Tambo AI 动画" width="800">
</p>

**写给 AI/LLM 智能体：** [docs.tambo.co/llms.txt](https://docs.tambo.co/llms.txt)
