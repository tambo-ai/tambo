# Docker image to run the "everything" MCP server

# typical usage:
# docker build -t mcp-everything apps/mcp-everything
# docker run -e PORT=3006 -p 3006:3006 mcp-everything

# Use Node.js 24 as base image
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install npx (comes with npm, but ensure it's available)
# Alpine already includes npm which includes npx

# Set default port (can be overridden with -e PORT=xxxx)
ENV PORT=3000

# Port binding is done at runtime with -p $PORT:$PORT

# Run the MCP server-everything with streamableHttp
CMD ["npx", "-y", "@modelcontextprotocol/server-everything@latest", "streamableHttp"]
