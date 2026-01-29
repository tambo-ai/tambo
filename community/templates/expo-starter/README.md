# Tambo AI Expo Starter Template

A ready-to-use Expo/React Native starter template integrated with **Tambo AI** for building intelligent mobile applications with conversational AI capabilities.

## 🚀 Features

- ✅ **Tambo AI Integration** - Pre-configured Tambo AI client with TypeScript SDK
- ✅ **Chat Interface** - Beautiful, responsive chat UI component
- ✅ **Cross-Platform** - Works on iOS, Android, and Web
- ✅ **Expo Router** - File-based navigation with tabs
- ✅ **TypeScript** - Full type safety throughout the app
- ✅ **Dark Mode** - Built-in light/dark theme support
- ✅ **Modern UI** - Clean, professional design with animations

## 📋 Prerequisites

- Node.js 18+ installed
- Expo CLI (`npm install -g expo-cli`)
- Tambo AI API key ([Get one here](https://tambo.ai/dashboard))

## 🛠️ Getting Started

### 1. Clone and Install

```bash
# Navigate to the project
cd tambo-expo-starter

# Install dependencies
npm install
```

### 2. Configure Tambo AI

1. Copy the environment example file:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Tambo AI API key:

   ```
   EXPO_PUBLIC_TAMBO_API_KEY=your-actual-api-key-here
   ```

3. Get your API key from [Tambo AI Dashboard](https://tambo.ai/dashboard)

### 3. Run the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## 📁 Project Structure

```
tambo-expo-starter/
├── app/                      # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx         # Home screen
│   │   ├── explore.tsx       # Explore screen
│   │   ├── tambo.tsx         # Tambo AI chat screen ⭐
│   │   └── _layout.tsx       # Tab navigation
│   └── _layout.tsx           # Root layout
├── components/
│   ├── tambo-chat.tsx        # Tambo AI chat component ⭐
│   └── ...                   # Other components
├── lib/
│   └── tambo-config.ts       # Tambo AI configuration ⭐
├── constants/
│   └── theme.ts              # App theming
└── .env.example              # Environment variables template
```

## 🎨 Customization

### Modify Tambo AI Configuration

Edit `lib/tambo-config.ts` to customize:

```typescript
export const defaultTamboConfig = {
  model: "gpt-4", // Change AI model
  temperature: 0.7, // Adjust creativity (0-1)
  maxTokens: 1000, // Maximum response length
};
```

### Customize Chat UI

The chat component is located at `components/tambo-chat.tsx`. You can:

- Modify colors and styling
- Add message formatting
- Implement typing indicators
- Add message timestamps
- Integrate voice input

### Add More AI Features

Extend the Tambo AI integration by:

- Adding text-to-speech
- Implementing image generation
- Creating AI-powered forms
- Building recommendation systems

## 🧪 Using Tambo AI in Your Components

```typescript
import { tamboClient } from "@/lib/tambo-config";

async function generateText() {
  const response = await tamboClient.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-4",
  });

  console.log(response.choices[0].message.content);
}
```

## 📱 Building for Production

### Create Development Build

```bash
npm run development-builds
```

### Deploy to Production

```bash
npm run deploy
```

### Build for Specific Platform

```bash
# iOS App Store
npx eas build --platform ios --profile production

# Google Play Store
npx eas build --platform android --profile production
```

## 🔧 Troubleshooting

### API Key Issues

- Ensure your `.env` file is in the root directory
- Verify the API key is correct in [Tambo AI Dashboard](https://tambo.ai/dashboard)
- Restart the development server after changing `.env`

### Build Errors

- Run `npx expo doctor` to check for issues
- Clear cache: `npx expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Web Platform Issues

- Ensure `react-dom` and `react-native-web` are installed
- Check that web dependencies are compatible with Expo SDK version

## 📚 Resources

- [Tambo AI Documentation](https://docs.tambo.ai)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the 0BSD License - see the LICENSE file for details.

## 💬 Support

- [Tambo AI Support](https://tambo.ai/support)
- [Expo Community](https://forums.expo.dev)
- [GitHub Issues](https://github.com/your-repo/issues)

---

**Happy Building with Tambo AI! 🚀**
