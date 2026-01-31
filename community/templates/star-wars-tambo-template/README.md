# Star Wars Tambo Template ⭐

An immersive Star Wars themed AI chat application with generative UI components. Built with Next.js, Tambo AI, and real Star Wars data from SWAPI.

![Star Wars Tambo Demo](https://github.com/user-attachments/assets/![alt text](image.png))

> **Note:** Add your screenshot by dragging and dropping an image into your PR description, then copy the generated URL here.

## 🎥 Demo Video

[Watch the demo video](https://youtu.be/plLW-FEHjMA)

## ✨ What This Template Demonstrates

This template showcases how to build engaging, themed AI applications using Tambo's generative UI capabilities:

- **Generative Components** - AI dynamically renders Star Wars character cards, starship specs, and cinematic opening crawls
- **Real Data Integration** - Fetches authentic Star Wars data via SWAPI using Tambo tools
- **Animated UI** - Hologram effects, glowing accents, and smooth transitions inspired by Star Wars
- **Type-Safe Components** - Full TypeScript with strict mode and Zod schemas

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Tambo API key from [cloud.tambo.co](https://cloud.tambo.co) (free tier available)

### Installation

1. **Clone or download this template**

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Tambo API key:

```
NEXT_PUBLIC_TAMBO_API_KEY=your_actual_api_key_here
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🎮 Try These Prompts

- "Show me Luke Skywalker"
- "Tell me about the Millennium Falcon"
- "Create an opening crawl for Episode 10"
- "Compare X-Wing and TIE Fighter"
- "Show me Darth Vader's profile"

## 🛠️ What's Included

### Technologies

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[Tambo AI](https://tambo.co)** - Generative UI SDK for React
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety (strict mode)
- **[Zod](https://zod.dev/)** - Schema validation
- **[SWAPI](https://swapi.dev/)** - Star Wars API for real data

### Components

| Component | Description |
|-----------|-------------|
| `CharacterCard` | Displays Star Wars characters with hologram effect, species, homeworld, and Force strength |
| `StarshipCard` | Shows starship specifications with animated UI and detailed stats |
| `OpeningCrawl` | Iconic scrolling text intro with perspective tilt (auto-dismisses after 20s) |

### Tools

| Tool | Description |
|------|-------------|
| `fetchStarWarsData` | Fetches real character and starship data from SWAPI before rendering components |

## 📁 Project Structure

```
star-wars-tambo-template/
├── src/
│   ├── app/
│   │   ├── globals.css          # Star Wars themed styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main app with TamboProvider
│   ├── components/
│   │   ├── ChatInterface.tsx     # Chat UI with message display
│   │   └── tambo/                # Tambo components
│   │       ├── CharacterCard.tsx
│   │       ├── StarshipCard.tsx
│   │       └── OpeningCrawl.tsx
│   └── lib/
│       ├── swapi-tool.ts         # SWAPI integration logic
│       └── tambo-config.ts       # Component and tool registry
├── .env.example                  # Environment variables template
├── package.json
├── tsconfig.json                 # TypeScript strict config
├── tailwind.config.js            # Star Wars color theme
└── README.md
```

## 🎨 Customization

### Adding New Components

1. Create a new component in `src/components/tambo/`
2. Register it in `src/lib/tambo-config.ts` with a Zod schema
3. Add clear descriptions for the AI to understand when to use it

### Modifying the Theme

Edit `tailwind.config.js` to customize colors, animations, and spacing. Current theme includes:

- `sw-yellow` - Iconic Star Wars yellow
- `sw-blue` - Hologram blue
- `sw-space` - Deep space background
- `sw-light` - Light side blue
- `sw-dark` - Dark side red

### Adding More Tools

Create new tools in `src/lib/` and register them in `tambo-config.ts`. Tools can:
- Fetch external APIs
- Process data
- Trigger animations
- Access browser features

## 🧪 Development Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Run production build
npm run lint       # Check code quality
npm run typecheck  # Verify TypeScript types
```

All checks must pass before deploying or submitting PRs.

## 🌟 Design Features

- **Hologram Effect** - Animated scan lines and flickering blue overlay
- **Glow Text** - Lightsaber-inspired text shadows
- **Starfield Background** - Animated twinkling stars
- **Responsive** - Works on mobile, tablet, and desktop
- **Smooth Animations** - Framer Motion transitions throughout
- **Accessibility** - Semantic HTML and keyboard navigation

## 📝 Notes

- The template uses Tambo Cloud by default (free tier: 10,000 messages/month)
- For self-hosted setup, run `npx tambo init` and select "Self-hosted"
- SWAPI is a free, public API - no API key needed
- Opening crawl auto-dismisses or click anywhere to skip

## 🤝 Contributing

Found a bug or want to improve something? Contributions are welcome!

1. Fork this template
2. Make your changes
3. Test with `npm run lint` and `npm run typecheck`
4. Submit a PR

## 📄 License

MIT License - feel free to use this template for any project!

## 🙏 Acknowledgments

- Star Wars data from [SWAPI](https://swapi.dev/)
- Built with [Tambo AI](https://tambo.co)
- Inspired by the Star Wars universe created by George Lucas

---

May the Force be with your app! 🌟