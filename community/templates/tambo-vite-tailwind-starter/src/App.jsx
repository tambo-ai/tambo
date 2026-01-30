import { useEffect, useState } from "react";
import Loader from "./components/Loader";
import UserForm from "./components/UserForm";
import DataTable from "./components/DataTable";
import InfoCard from "./components/InfoCard";
import { getAIResponse } from "./lib/ai";

// Hover loader component
const HoverLoader = ({ size = 6 }) => {
  return (
    <div className="flex justify-center items-center space-x-1 h-full">
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className={`inline-block w-${size} h-${size} bg-blue-500 rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.2}s` }}
        ></span>
      ))}
    </div>
  );
};

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState("");
  const [history, setHistory] = useState([]);
  const [dark, setDark] = useState(false);
  const [hovering, setHovering] = useState("");

  // Dark mode toggle
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Enter") handleSubmit();
      if (e.ctrlKey && e.key === "l") setPrompt("");
      if (e.ctrlKey && e.key === "d") setDark((d) => !d);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // Components to show
  const components = [
    { name: "Signup Form", component: "UserForm" },
    { name: "Analytics Table", component: "DataTable" },
    { name: "Info Card", component: "InfoCard" },
  ];

  // Simulate AI response
  async function handleSubmit() {
    if (!prompt) return;
    setLoading(true);

    if (!history.includes(prompt)) {
      setHistory([prompt, ...history].slice(0, 5));
    }

    const result = await getAIResponse(prompt);

    setTimeout(() => {
      setSelectedComponent(result);
      setLoading(false);
    }, 500);
  }

  // Auto-select hovered component after 1s (like AI preview)
  useEffect(() => {
    if (hovering) {
      const timer = setTimeout(() => {
        setSelectedComponent(hovering);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hovering]);

  // Render selected component
  const renderComponent = () => {
    if (loading) return <Loader />;
    if (selectedComponent === "UserForm") return <UserForm />;
    if (selectedComponent === "DataTable") return <DataTable />;
    if (selectedComponent === "InfoCard") return <InfoCard />;
    return <p className="text-gray-500 dark:text-gray-400">Type a prompt or select a card</p>;
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tambo Starter UI</h1>
          <button
            onClick={() => setDark(!dark)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm transition-colors"
          >
            🌙 {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Prompt Input */}
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type prompt: e.g., create a signup form"
          className="w-full p-3 mb-2 border rounded-lg text-black dark:text-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Enter: generate | Ctrl+D: dark mode | Ctrl+L: clear
        </p>

        {/* Animated Component Preview Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {components.map((c) => (
            <div
              key={c.component}
              onClick={() => setSelectedComponent(c.component)}
              onMouseEnter={() => setHovering(c.component)}
              onMouseLeave={() => setHovering("")}
              className={`relative cursor-pointer p-4 rounded-xl text-center font-medium transition-all transform
                duration-300 ease-in-out border
                ${selectedComponent === c.component
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400 shadow-lg scale-105"
                  : "border-gray-300 hover:border-gray-500 dark:border-gray-600 dark:hover:border-gray-400 hover:shadow-md hover:scale-105"
                }`}
            >
              {hovering === c.component && selectedComponent !== c.component ? (
                <HoverLoader />
              ) : (
                c.name
              )}
            </div>
          ))}
        </div>

        {/* Render Selected Component */}
        <div className="border rounded-xl p-6 min-h-[220px] bg-gray-50 dark:bg-gray-700 transition-colors">
          {renderComponent()}
        </div>

        {/* Prompt History */}
        {history.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Prompt History</h3>
            <ul className="space-y-1">
              {history.map((h, i) => (
                <li
                  key={i}
                  onClick={() => setPrompt(h)}
                  className="cursor-pointer text-blue-500 hover:underline"
                >
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
