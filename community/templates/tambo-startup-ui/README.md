# Tambo Startup Landing Page + Dashboard UI Template

A modern, responsive, and production-ready React + Tailwind CSS starter template for SaaS startups. This is a **UI-first template** designed to help you quickly launch your startup's frontend with a beautiful landing page and dashboard interface.

## 🎯 Important Notice

**This is a UI-ONLY starter template — Tambo-ready, but NOT Tambo-integrated.**

- ✅ Complete, ready-to-run React application
- ✅ Beautiful landing page with hero, features, and pricing sections
- ✅ Authentication pages (Login & Register)
- ✅ Dashboard interface with sidebar and stats
- ✅ **Built to integrate seamlessly with Tambo** — just plug in your backend
- ❌ **Tambo is NOT implemented** (no backend, no authentication logic, no APIs)
- ✅ **Zero backend dependencies** — pure frontend template

**What this means:** This template provides the complete visual foundation. When you're ready, you can integrate it with Tambo or any backend service of your choice in minutes, not hours.

### Why UI-First?

This approach lets you:
- 🚀 **Launch faster** — Start building your product immediately
- 🎨 **Validate designs** — Show stakeholders a working prototype
- 🔌 **Stay flexible** — Integrate with Tambo, Firebase, Supabase, or custom backends
- 📦 **Learn by doing** — Perfect for developers new to React + Tailwind

## 🚀 Features

### Landing Page
- Responsive navigation bar
- Eye-catching hero section
- Features showcase (3 cards)
- Pricing section (Free, Pro, Enterprise)
- Clean footer

### Authentication Pages
- Login page with email/password fields
- Register page with name/email/password fields
- Links between login and register pages

### Dashboard
- Sidebar navigation (Dashboard, Analytics, Settings, Logout)
- Dynamic section routing with URL search params
- Top header with contextual titles and descriptions
- 3 stat cards with placeholder data
- Recent activity table with user actions
- Clean placeholder views for Analytics and Settings
- Clean, professional layout
- Fully responsive design

## 🛠️ Tech Stack

- **React** (via Vite)
- **Tailwind CSS** (for styling)
- **react-router-dom** (for routing)
- **JavaScript** (no TypeScript)
- **No external UI libraries** (pure custom components)

## 📦 Installation

1. **Clone or download this template**

```bash
cd tambo-startup-ui
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the development server**

```bash
npm run dev
```

4. **Open your browser**

Navigate to `http://localhost:5173` (or the URL shown in your terminal)

## 📁 Project Structure

```
src/
 ├─ components/
 │   ├─ Navbar.jsx          # Navigation bar component
 │   ├─ Hero.jsx            # Hero section component
 │   ├─ Features.jsx        # Features section component
 │   └─ Pricing.jsx         # Pricing section component
 │
 ├─ pages/
 │   ├─ Landing.jsx         # Landing page (/)
 │   ├─ Login.jsx           # Login page (/login)
 │   ├─ Register.jsx        # Register page (/register)
 │   └─ Dashboard.jsx       # Dashboard page (/dashboard)
 │
 ├─ App.jsx                 # Main app with routing
 ├─ main.jsx                # Entry point
 └─ index.css               # Tailwind CSS imports
```

## 🎨 Customization

### Colors
The template uses a neutral SaaS color palette (indigo/gray). To customize:
- Edit `tailwind.config.js` to extend the theme
- Update color classes in components (e.g., `bg-indigo-600` → `bg-blue-600`)

### Content
- Update text in components (`Hero.jsx`, `Features.jsx`, `Pricing.jsx`)
- Modify pricing plans in `Pricing.jsx`
- Customize dashboard stats in `Dashboard.jsx`

### Styling
All styling is done with Tailwind CSS utility classes. No custom CSS required!

## 🔗 Integrating with Tambo (or any backend)

When you're ready to add backend functionality:

1. **Authentication**: Add form submission handlers in `Login.jsx` and `Register.jsx`
2. **API Calls**: Install axios or use fetch to connect to your backend
3. **State Management**: Add React Context or a state management library
4. **Protected Routes**: Wrap the Dashboard route with authentication checks
5. **Environment Variables**: Create `.env` file for API endpoints

Example integration point in `Login.jsx`:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  // Add your Tambo authentication logic here
  const response = await fetch('YOUR_API_ENDPOINT/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  // Handle response...
};
```

## 📱 Responsive Design

This template is fully responsive and works on:
- 📱 Mobile devices
- 💻 Tablets
- 🖥️ Desktop screens

## 🤝 Contributing

This template is part of the Tambo community templates. Contributions are welcome!

Suggested location: `community/templates/tambo-startup-ui`

## 📄 License

Free to use for personal and commercial projects.

## 🙏 Credits

Built with ❤️ for the Tambo community.

---

**Ready to build something amazing? Start customizing this template and bring your startup vision to life!** 🚀
