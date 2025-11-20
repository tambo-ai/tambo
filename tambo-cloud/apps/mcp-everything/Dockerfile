# Docker image to run the "everything" MCP server

# typical usage:
# docker build -t mcp-everything apps/mcp-everything
# docker run -e PORT=3006 -p 3006:3006 mcp-everything

# Use Node.js 24 as base image
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install the MCP server-everything package globally
RUN npm install -g @modelcontextprotocol/server-everything

# Set default port (can be overridden with -e PORT=xxxx)
ENV PORT=3000

# Port binding is done at runtime with -p $PORT:$PORT

# Run the MCP server-everything with streamableHttp
CMD ["mcp-server-everything", "streamableHttp"]
