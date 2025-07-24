# create-tambo-app

A command-line tool to create new Tambo applications with zero configuration.

## Overview

`create-tambo-app` is the official way to create new [tambo](https://tambo.co) applications. It provides a streamlined experience for setting up new tambo projects with all the necessary configurations and dependencies.

## Requirements

- Node.js >= 20
- npm >= 10

## Quick Start

You can create a new Tambo application using any of these methods:

```bash
# Using npm
npm create tambo-app@latest my-app

# Using yarn
yarn create tambo-app my-app

# Using pnpm
pnpm create tambo-app my-app

# Using npx directly
npx create-tambo-app my-app
```

## Command Line Options

All arguments passed to `create-tambo-app` will be forwarded to the Tambo CLI's `create-app` command. For example:

```bash
npm create tambo-app@latest my-app
```

## What's Next?

After creating your application:

1. Navigate to your project directory: `cd my-app`
2. Start the development server: `npm run dev`
3. Open your browser to see your new Tambo application

## License

This project is part of the Tambo ecosystem. See the Tambo repository for license details.

## Links

- [Tambo Documentation](https://docs.tambo.co)
- [GitHub Repository](https://github.com/tambo-ai/tambo)
