import { CLI } from "@/components/cli";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
} from "@/components/ui/thread-history";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";

export default function ThreadHistoryPage() {
  const usageCode = `import { 
  ThreadHistory, 
  ThreadHistoryHeader, 
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList 
} from "@/components/ui/thread-history";

// Basic usage (left sidebar)
<ThreadHistory contextKey="my-app" position="left" defaultCollapsed={false}>
  <ThreadHistoryHeader />
  <ThreadHistoryNewButton />
  <ThreadHistorySearch />
  <ThreadHistoryList />
</ThreadHistory>

// Right sidebar with callbacks
<ThreadHistory 
  contextKey="my-app" 
  position="right" 
  defaultCollapsed={true}
  onThreadChange={() => console.log("Thread changed")}
>
  <ThreadHistoryHeader />
  <ThreadHistoryNewButton />
  <ThreadHistorySearch />
  <ThreadHistoryList />
</ThreadHistory>`;

  const installCommand = "npx tambo add thread-history";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Thread History</h1>
            <p className="text-lg text-secondary mb-6">
              A primitive component that displays a sidebar with conversation
              history, search functionality, and thread management. Supports
              collapsible behavior and can be positioned on left or right.
            </p>
          </div>

          {/* Installation */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
            <p className="text-sm text-muted-foreground italic mt-2">
              Note: This component is automatically included when you install
              any of the &quot;Message Thread&quot; blocks.
            </p>
          </div>

          {/* Sub-components */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Sub-components</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <ul className="space-y-3 text-sm">
                <li>
                  <strong>
                    <code>&lt;ThreadHistoryHeader /&gt;</code> -
                  </strong>{" "}
                  Header section with title and collapse/expand toggle button.
                  Handles the sidebar visibility state and provides visual
                  indication of current state.
                </li>
                <li>
                  <strong>
                    <code>&lt;ThreadHistoryNewButton /&gt;</code> -
                  </strong>{" "}
                  Button to create a new conversation thread. Supports keyboard
                  shortcut (Alt+Shift+N) and automatically refreshes the thread
                  list after creation.
                </li>
                <li>
                  <strong>
                    <code>&lt;ThreadHistorySearch /&gt;</code> -
                  </strong>{" "}
                  Search input for filtering through conversation history.
                  Automatically expands the sidebar when focused from collapsed
                  state and filters threads in real-time.
                </li>
                <li>
                  <strong>
                    <code>&lt;ThreadHistoryList /&gt;</code> -
                  </strong>{" "}
                  Displays the list of previous conversation threads. Shows
                  thread metadata like creation time, handles thread switching,
                  and displays appropriate empty states.
                </li>
              </ul>
            </div>
          </div>

          {/* Sample Code */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Usage</h2>
            <SyntaxHighlighter code={usageCode} language="tsx" />
          </div>

          {/* Left Position Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              Left Position (Expanded)
            </h3>
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden border">
              <ThreadHistory
                contextKey="demo-left"
                position="left"
                defaultCollapsed={false}
                className="relative bg-white border-r"
              >
                <ThreadHistoryHeader />
                <ThreadHistoryNewButton />
                <ThreadHistorySearch />
                <ThreadHistoryList />
              </ThreadHistory>
              <div className="ml-64 p-4 h-full">
                <p className="text-gray-500">Main content area would go here</p>
              </div>
            </div>
          </div>

          {/* Collapsed State Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Collapsed State</h3>
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden border">
              <ThreadHistory
                contextKey="demo-collapsed"
                position="left"
                defaultCollapsed={true}
                className="relative bg-white border-r"
              >
                <ThreadHistoryHeader />
                <ThreadHistoryNewButton />
                <ThreadHistorySearch />
                <ThreadHistoryList />
              </ThreadHistory>
              <div className="ml-12 p-4 h-full">
                <p className="text-gray-500">
                  Main content area adjusts when sidebar is collapsed
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Click the arrow icon in the sidebar to expand
                </p>
              </div>
            </div>
          </div>

          {/* Minimal Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Minimal (Header Only)</h3>
            <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden border">
              <ThreadHistory
                contextKey="demo-minimal"
                position="left"
                defaultCollapsed={false}
                className="relative bg-white border-r"
              >
                <ThreadHistoryHeader />
              </ThreadHistory>
              <div className="ml-64 p-4 h-full">
                <p className="text-gray-500">
                  Minimal sidebar with just header
                </p>
              </div>
            </div>
          </div>

          {/* Props Documentation */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Props</h2>

            <h3 className="text-lg font-medium mb-3">ThreadHistory</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Prop</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-mono">contextKey</td>
                    <td className="py-2">string</td>
                    <td className="py-2">
                      Optional context key to scope thread history
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">position</td>
                    <td className="py-2">
                      &quot;left&quot; | &quot;right&quot;
                    </td>
                    <td className="py-2">
                      Position of the sidebar (default: &quot;left&quot;)
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">defaultCollapsed</td>
                    <td className="py-2">boolean</td>
                    <td className="py-2">
                      Whether the sidebar starts collapsed (default: true)
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">onThreadChange</td>
                    <td className="py-2">() =&gt; void</td>
                    <td className="py-2">
                      Optional callback when thread is switched
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">children</td>
                    <td className="py-2">React.ReactNode</td>
                    <td className="py-2">
                      The sub-components to render within the sidebar
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium mb-3">Features</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>Collapsible Sidebar:</strong> Can be collapsed to save
                  space
                </li>
                <li>
                  <strong>Thread Management:</strong> Create new threads and
                  switch between existing ones
                </li>
                <li>
                  <strong>Search Functionality:</strong> Filter through
                  conversation history
                </li>
                <li>
                  <strong>Keyboard Shortcuts:</strong> Alt+Shift+N to create new
                  thread
                </li>
                <li>
                  <strong>Position Flexibility:</strong> Can be positioned on
                  left or right side
                </li>
                <li>
                  <strong>Responsive Behavior:</strong> Automatically adjusts
                  layout based on collapse state
                </li>
              </ul>
            </div>
          </div>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
