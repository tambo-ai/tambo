# Contributing to Tambo Kotlin SDK

Thank you for your interest in contributing to the Tambo Kotlin SDK.

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/tambo-ai/tambo.git
cd tambo/kotlin-sdk
```

2. Build the project:

```bash
./gradlew build
```

3. Run tests:

```bash
./gradlew test
```

## Code Structure

- `src/main/kotlin/co/tambo/sdk/` - Core SDK code
  - `Models.kt` - Data models
  - `TamboClient.kt` - HTTP client
  - `StreamEvent.kt` - Streaming events
  - `component/` - Component system
  - `tool/` - Tool system
  - `compose/` - Jetpack Compose integration
  - `mcp/` - MCP protocol support

- `src/test/kotlin/` - Unit tests
- `examples/` - Example applications
- `docs/` - Documentation

## Making Changes

1. Create a new branch for your feature or fix
2. Make your changes
3. Add tests for new functionality
4. Run tests to ensure nothing breaks
5. Update documentation if needed
6. Submit a pull request

## Code Style

Follow Kotlin coding conventions:

- Use 4 spaces for indentation
- Maximum line length: 120 characters
- Use meaningful variable names
- Add KDoc comments for public APIs

## Testing

Write unit tests for new features using JUnit and MockK.

Run tests:

```bash
./gradlew test
```

## Documentation

Update documentation when adding features:

- Add examples to README.md
- Update API_REFERENCE.md for new APIs
- Add code examples in `examples/` directory

## Pull Request Process

1. Update the CHANGELOG.md with your changes
2. Ensure all tests pass
3. Update documentation
4. Submit PR with clear description
5. Address review feedback

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
