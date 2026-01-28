import { TemplateConfig } from '@/app/page';

export function generateTemplateFiles(config: TemplateConfig): Record<string, string> {
  const files: Record<string, string> = {};

  files['README.md'] = generateReadme(config);
  files['package.json'] = generatePackageJson(config);
  files['tsconfig.json'] = generateTsConfig(config);
  files['.eslintrc.js'] = generateEslintConfig(config);
  files['.prettierrc'] = generatePrettierConfig();
  files['.env.example'] = generateEnvExample(config);
  files['.gitignore'] = generateGitignore();

  if (config.framework === 'nextjs') {
    files['next.config.js'] = generateNextConfig();
    files['src/app/layout.tsx'] = generateNextLayout(config);
    files['src/app/page.tsx'] = generateNextPage(config);
    files['src/app/globals.css'] = generateGlobalCSS();
  }

  files['src/lib/tambo.ts'] = generateTamboLib(config);
  files[`src/components/tambo/${config.exampleComponent}.tsx`] = generateExampleComponent(config);

  if (config.styling === 'tailwind') {
    files['tailwind.config.ts'] = generateTailwindConfig();
    files['postcss.config.js'] = generatePostCSSConfig();
  }

  return files;
}

function generateReadme(config: TemplateConfig): string {
  const techStack = [
    config.framework,
    config.styling,
    config.auth !== 'none' ? config.auth : null,
    config.database !== 'none' ? config.database : null,
    'Tambo',
  ].filter(Boolean);

  return `# ${config.name}

${config.description}

## What's Included

${techStack.map((tech) => `- **${tech}**`).join('\n')}

## Prerequisites

Before you begin, you'll need:

- Node.js 18+ installed
- A Tambo API key from [tambo.ai](https://tambo.ai)
${config.auth === 'clerk' ? '- A Clerk account and API keys\n' : ''}${config.auth === 'supabase' ? '- A Supabase project with auth enabled\n' : ''}${config.database === 'prisma' ? '- A PostgreSQL database (or other Prisma-supported DB)\n' : ''}

## Setup

1. Clone or download this template:

\`\`\`bash
cd community/templates/${config.name}
\`\`\`

2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Copy the environment variables:

\`\`\`bash
cp .env.example .env
\`\`\`

4. Add your API keys to \`.env\`:

\`\`\`env
TAMBO_API_KEY=your_tambo_api_key_here
${config.auth === 'clerk' ? 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here\nCLERK_SECRET_KEY=your_clerk_secret_here\n' : ''}${config.auth === 'supabase' ? 'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key\n' : ''}${config.database === 'prisma' ? 'DATABASE_URL=postgresql://...\n' : ''}
\`\`\`

5. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tambo Integration

This template demonstrates ${config.integrationFocus === 'components' ? 'component creation' : config.integrationFocus === 'tools' ? 'tool usage' : 'both components and tools'} with Tambo.

### Example Component: ${config.exampleComponent}

${config.componentDescription || 'A sample component showing Tambo integration.'}

The component is located in \`src/components/tambo/${config.exampleComponent}.tsx\` and is registered in \`src/lib/tambo.ts\`.

## Project Structure

\`\`\`
${config.name}/
├── src/
│   ├── app/              # ${config.framework === 'nextjs' ? 'Next.js App Router' : 'Application routes'}
│   ├── components/
│   │   └── tambo/        # Tambo components
│   └── lib/
│       └── tambo.ts      # Tambo configuration
├── .env.example          # Environment variables template
├── package.json
└── README.md
\`\`\`

## Development

- **Development server**: \`npm run dev\`
- **Build**: \`npm run build\`
- **Lint**: \`npm run lint\`
- **Type check**: \`npm run typecheck\`

## Learn More

- [Tambo Documentation](https://docs.tambo.ai)
- [Tambo Templates](https://github.com/tambo-ai/tambo/tree/main/community/templates)
${config.framework === 'nextjs' ? '- [Next.js Documentation](https://nextjs.org/docs)\n' : ''}${config.auth === 'clerk' ? '- [Clerk Documentation](https://clerk.com/docs)\n' : ''}

## Contributing

This template was created by ${config.author}. Feel free to submit issues or PRs!

## License

MIT
`;
}

function generatePackageJson(config: TemplateConfig): string {
  const deps: Record<string, string> = {
    react: '^18.3.0',
    'react-dom': '^18.3.0',
    tambo: '^latest',
    zod: '^3.22.0',
  };

  const devDeps: Record<string, string> = {
    '@types/react': '^18.3.0',
    '@types/react-dom': '^18.3.0',
    '@types/node': '^20.0.0',
    typescript: '^5.0.0',
    eslint: '^8.0.0',
    prettier: '^3.0.0',
  };

  if (config.framework === 'nextjs') {
    deps.next = '^14.2.0';
    devDeps['eslint-config-next'] = '^14.0.0';
  }

  if (config.styling === 'tailwind') {
    deps.tailwindcss = '^3.4.0';
    deps.autoprefixer = '^10.4.0';
    deps.postcss = '^8.4.0';
  }

  if (config.auth === 'clerk') {
    deps['@clerk/nextjs'] = '^5.0.0';
  }

  if (config.database === 'prisma') {
    deps['@prisma/client'] = '^5.0.0';
    devDeps.prisma = '^5.0.0';
  }

  return JSON.stringify(
    {
      name: config.name,
      version: '0.1.0',
      description: config.description,
      private: true,
      scripts: {
        dev: config.framework === 'nextjs' ? 'next dev' : 'vite',
        build: config.framework === 'nextjs' ? 'next build' : 'vite build',
        start: config.framework === 'nextjs' ? 'next start' : 'vite preview',
        lint: 'eslint .',
        typecheck: 'tsc --noEmit',
        format: 'prettier --write "**/*.{ts,tsx,js,jsx,json,md}"',
      },
      dependencies: deps,
      devDependencies: devDeps,
      author: config.author,
    },
    null,
    2
  );
}

function generateTsConfig(config: TemplateConfig): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        jsx: 'preserve',
        module: 'ESNext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        allowJs: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        incremental: true,
        paths: {
          '@/*': ['./src/*'],
        },
        ...(config.framework === 'nextjs' && {
          plugins: [{ name: 'next' }],
        }),
      },
      include: ['src', 'next-env.d.ts'],
      exclude: ['node_modules'],
    },
    null,
    2
  );
}

function generateEslintConfig(config: TemplateConfig): string {
  return `module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    ${config.framework === 'nextjs' ? "'next/core-web-vitals'," : "'plugin:react/recommended',"}
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
`;
}

function generatePrettierConfig(): string {
  return JSON.stringify(
    {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
    },
    null,
    2
  );
}

function generateEnvExample(config: TemplateConfig): string {
  let env = '# Tambo API Key\nTAMBO_API_KEY=your_tambo_api_key_here\n\n';

  if (config.auth === 'clerk') {
    env += '# Clerk\nNEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=\nCLERK_SECRET_KEY=\n\n';
  }

  if (config.auth === 'supabase') {
    env += '# Supabase\nNEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\n\n';
  }

  if (config.database === 'prisma') {
    env += '# Database\nDATABASE_URL=postgresql://user:password@localhost:5432/dbname\n\n';
  }

  return env;
}

function generateGitignore(): string {
  return `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build
/dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
}

function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
`;
}

function generateNextLayout(config: TemplateConfig): string {
  const imports = ["import './globals.css'"];

  if (config.auth === 'clerk') {
    imports.push("import { ClerkProvider } from '@clerk/nextjs'");
  }

  const wrapperStart = config.auth === 'clerk' ? '<ClerkProvider>' : '<>';
  const wrapperEnd = config.auth === 'clerk' ? '</ClerkProvider>' : '</>';

  return `${imports.join('\n')}

export const metadata = {
  title: '${config.name}',
  description: '${config.description}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        ${wrapperStart}
          {children}
        ${wrapperEnd}
      </body>
    </html>
  );
}
`;
}

function generateNextPage(config: TemplateConfig): string {
  return `export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">${config.name}</h1>
      <p className="text-lg text-gray-600 mb-8">${config.description}</p>

      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">🤖 Tambo Integration</h2>
        <p className="text-gray-700">
          This template includes the{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">${config.exampleComponent}</code>{' '}
          component. ${config.componentDescription || ''}
        </p>
      </div>
    </main>
  );
}
`;
}

function generateTamboLib(config: TemplateConfig): string {
  return `import { z } from 'zod';
import ${config.exampleComponent} from '@/components/tambo/${config.exampleComponent}';

export const ${config.exampleComponent}Schema = z.object({
  title: z.string().describe('The title to display'),
  value: z.string().optional().describe('Optional value to show'),
});

export type ${config.exampleComponent}Props = z.infer<typeof ${config.exampleComponent}Schema>;

export const components = {
  ${config.exampleComponent}: {
    name: '${config.exampleComponent}',
    description: '${config.componentDescription || 'A sample Tambo component'}',
    propsSchema: ${config.exampleComponent}Schema,
    component: ${config.exampleComponent},
  },
};

export type ComponentNames = keyof typeof components;
`;
}

function generateExampleComponent(config: TemplateConfig): string {
  return `'use client';

import { ${config.exampleComponent}Props } from '@/lib/tambo';

export default function ${config.exampleComponent}(props: ${config.exampleComponent}Props) {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-xl font-semibold mb-2">{props.title}</h3>
      {props.value && <p className="text-gray-600">{props.value}</p>}
      <div className="mt-4 text-sm text-gray-500">This is a Tambo-generated component!</div>
    </div>
  );
}
`;
}

function generateTailwindConfig(): string {
  return `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
}

function generatePostCSSConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

function generateGlobalCSS(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground: #000;
  --background: #fff;
}

body {
  color: var(--foreground);
  background: var(--background);
}
`;
}
