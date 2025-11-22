# Test MCP Server

A test MCP server with tools for testing elicitation and sampling functionality.

## Tools

### `ask_user_for_choice`

Asks the user to choose among a list of string options using MCP elicitation.

**Parameters:**

- `choices` (required): Array of string choices for the user to select from
- `prompt` (optional): Custom prompt message (defaults to "Please choose from the following options:")

**Example:**

```json
{
  "choices": ["Option 1", "Option 2", "Option 3"],
  "prompt": "Which option would you prefer?"
}
```

### `emojify_via_llm`

Sends a message to the caller's LLM using MCP sampling.

**Parameters:**

- `message` (required): The message to send to the LLM

**Example:**

```json
{
  "message": "What is the capital of France?"
}
```

## Development

### Prerequisites

- Node.js 22+
- npm 10+

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

## Usage

The server runs on HTTP transport and can be accessed at `http://localhost:3004/mcp` (or another port if 3004 is unavailable).

### Command Line Options

- `-p, --port <number>`: Specify the port to listen on (default: 3004)
- Environment variable `PORT` can also be used to set the port

### Usage with MCP Clients

The server exposes an HTTP endpoint at `/mcp` that accepts MCP protocol requests. You can test it with curl:

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### Usage with Claude for Desktop

To use this server with Claude for Desktop, add it to your `claude_desktop_config.json` as an HTTP server:

```json
{
  "mcpServers": {
    "test-mcp-server": {
      "url": "http://localhost:3004/mcp"
    }
  }
}
```

## Testing

The server provides mock implementations of elicitation and sampling. In a real MCP environment:

1. `ask_user_for_choice` would trigger MCP elicitation to get user input
2. `emojify_via_llm` would use MCP sampling to transform a message into emojis

Currently, both tools return formatted responses showing what would happen in a real implementation.

## Architecture

The server follows the same pattern as other MCP servers in this repository:

- `src/test-tools.ts`: Tool definitions and handlers
- `src/test-service.ts`: Service configuration
- `src/mcp-service.ts`: Shared MCP service interface and registry
- `src/index.ts`: Main server entry point with HTTP transport

The server uses the Model Context Protocol SDK for Node.js and communicates via HTTP transport using the StreamableHTTPServerTransport.
