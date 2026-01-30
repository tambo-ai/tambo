import { Link } from "react-router-dom";
import tamboLogo from "@/assets/Octo-Icon.svg";
import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import { KeyFilesSection } from "@/components/KeyFilesSection";

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <main className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center">
          <a href="https://tambo.co" target="_blank">
            <img src={tamboLogo} alt="Tambo AI" className="w-20 h-20 mb-4" />
          </a>
          <h1 className="text-4xl text-center">tambo-ai chat template</h1>
        </div>

        <div className="bg-white px-8 py-4">
          <h2 className="text-xl font-semibold mb-4">Setup Checklist</h2>

          <ApiKeyCheck>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/chat"
                className="px-6 py-3 rounded-md bg-green-200 hover:bg-green-300"
              >
                Go to Chat →
              </Link>

              <Link
                to="/interactables"
                className="px-6 py-3 rounded-md bg-yellow-200 hover:bg-yellow-300"
              >
                Interactables Demo →
              </Link>
            </div>
          </ApiKeyCheck>
        </div>

        <KeyFilesSection />
      </main>
    </div>
  );
}
