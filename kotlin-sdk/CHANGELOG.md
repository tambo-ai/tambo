# Changelog

All notable changes to the Tambo Kotlin SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-24

### Added
- Initial release of Tambo Kotlin SDK
- Core TamboClient with HTTP and WebSocket support
- Jetpack Compose integration with TamboProvider
- Component registration system with schema validation
- Tool system for custom function execution
- Pre-built Compose components (TamboChat, MessageBubble, LoadingIndicator, ErrorMessage)
- Hooks: useTambo, useTamboThread, useTamboThreadInput
- MCP protocol support for server integration
- Streaming message support via WebSocket
- Thread management (create, get, delete)
- Comprehensive documentation and examples
- Unit tests for core functionality

### Features
- Kotlin 2.0+ support
- Jetpack Compose 1.7+ integration
- Coroutines-based async operations
- Flow-based streaming
- Type-safe component and tool schemas
- Material3 design system integration
- Automatic component and tool registration
- Error handling and retry logic
- Debug logging support

### Documentation
- README with installation and usage guide
- Getting Started tutorial
- API Reference documentation
- Example applications (basic chat, custom components, custom tools)

### Dependencies
- Kotlin 2.0.21
- Ktor 3.0.3
- Kotlinx Serialization 1.7.3
- Kotlinx Coroutines 1.9.0
- Jetpack Compose Runtime 1.7.6

[0.1.0]: https://github.com/tambo-ai/tambo/releases/tag/kotlin-sdk-v0.1.0
