# CRM Intelligence

<div align="center">
  <h3>AI-Powered Relationship Management</h3>
  <p>Build relationships that adapt to your business with natural language CRM interactions.</p>
</div>

---

## 🚀 Features

- **Natural Language Interface** - Interact with your CRM using conversational AI
- **Smart Contact Management** - AI automatically organizes and enriches contact data
- **Intelligent Automation** - Automate routine tasks and focus on relationships
- **Real-time Dashboard** - View contacts, organizations, and analytics
- **Generative UI** - Dynamic components rendered based on AI responses

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI Framework**: Tambo AI SDK for generative UI
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS with professional dark theme
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Tambo API key (get one at [tambo.co](https://tambo.co))

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tambo-hono-crm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key_here
```

### 4. Database Setup

Initialize the database:

```bash
npm run db:generate
npm run db:migrate
```

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see your CRM Intelligence application.

## 🎯 Usage Guide

### Getting Started

1. **Homepage**: Navigate to the landing page with professional dark theme
2. **Get Started**: Click to open the AI chat interface
3. **Dashboard**: View all contacts and analytics

### AI Chat Commands

The AI assistant understands natural language. Try these examples:

```
Add a new contact: John Doe, email john@example.com, works at TechCorp
Search for contacts at Microsoft
Find all contacts with gmail addresses
Update John's notes to "Interested in our premium package"
Show me all contacts from last week
```

### Dashboard Features

- **Contact Statistics**: Total contacts, active organizations, daily leads
- **Search & Filter**: Find contacts by name, company, or email
- **Contact Management**: View detailed contact information
- **Navigation**: Easy switching between chat and dashboard views

## 🔧 Customization

### Adding New Contact Fields

1. Update the database schema in `src/db/schema.ts`:

```typescript
export const contacts = sqliteTable("contacts", {
  // ... existing fields
  phone: text("phone"),
  position: text("position"),
});
```

2. Update the Zod schemas in `src/lib/tambo.ts`:

```typescript
const addContactSchema = z.object({
  // ... existing fields
  phone: z.string().optional(),
  position: z.string().optional(),
});
```

3. Update the UI components to display new fields.

### Customizing AI Behavior

Modify the system prompt in `src/app/page.tsx`:

```typescript
const systemPrompt = `
You are a CRM assistant specialized in [your industry].
Focus on [specific behaviors].
Always [custom instructions].
`;
```

### Styling Customization

The app uses a professional dark theme with:
- **Primary Colors**: Emerald (#10b981) and Blue (#3b82f6)
- **Background**: Dark slate gradients
- **Accent**: Violet (#8b5cf6) for highlights

Modify colors in Tailwind classes throughout the components.

### Adding New AI Tools

Create new tools in `src/lib/tambo.ts`:

```typescript
export const tamboTools = [
  // ... existing tools
  {
    name: "export_contacts",
    description: "Export contacts to CSV format",
    tool: async (params) => {
      // Implementation
    },
    inputSchema: z.object({
      format: z.enum(["csv", "json"]),
    }),
  },
];
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/contacts/          # Contact API endpoints
│   ├── dashboard/             # Dashboard page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Homepage with chat
├── components/
│   └── tambo/                # Tambo UI components
├── db/
│   ├── index.ts              # Database connection
│   └── schema.ts             # Database schema
└── lib/
    └── tambo.ts              # Tambo configuration
```

## 🔌 API Endpoints

### Contacts API

- `GET /api/contacts` - List all contacts with optional search
- `POST /api/contacts` - Create new contact
- `PATCH /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Example API Usage

```javascript
// Add contact
const response = await fetch('/api/contacts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane@example.com',
    company: 'TechCorp'
  })
});

// Search contacts
const contacts = await fetch('/api/contacts?query=TechCorp');
```

## 🎨 UI Components

### Tambo Components

The app includes custom Tambo components:

- **ContactCard**: Display individual contact details
- **ContactList**: Show multiple contacts in a list

### Styling System

- **Dark Theme**: Professional slate/gray backgrounds
- **Gradients**: Emerald to blue for primary actions
- **Glassmorphism**: Backdrop blur effects for modern look
- **Responsive**: Mobile-first design approach

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app works on any Node.js hosting platform:
- Netlify
- Railway
- Render
- AWS Amplify

## 🔍 Troubleshooting

### Common Issues

**Missing API Key Error**
- Ensure `.env.local` file exists with correct API key
- Restart development server after adding environment variables

**Database Issues**
- Run `npm run db:generate` to create migrations
- Check SQLite file permissions

**Build Errors**
- Clear `.next` folder and rebuild
- Ensure all dependencies are installed

### Getting Help

- Check [Tambo Documentation](https://docs.tambo.co)
- Review the [GitHub Issues](https://github.com/tambo-ai/tambo/issues)
- Join the [Discord Community](https://discord.gg/dJNvPEHth6)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🙏 Acknowledgments

- Built with [Tambo AI](https://tambo.co) for generative UI
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons by [Lucide](https://lucide.dev)

---

<div align="center">
  <p>Made with ❤️ using Tambo AI</p>
</div>