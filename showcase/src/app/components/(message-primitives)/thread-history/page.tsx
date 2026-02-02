"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
} from "@tambo-ai/ui-registry/components/thread-history";
import { TamboStubProvider, TamboThread } from "@tambo-ai/react";

const mockThreads: TamboThread[] = [
  {
    id: "1",
    name: "Mock Thread",
    messages: [
      {
        componentState: {},
        content: [{ type: "text", text: "Hello, world!" }],
        createdAt: new Date().toISOString(),
        id: "1",
        role: "user",
        threadId: "1",
      },
    ],
    createdAt: new Date().toISOString(),
    projectId: "1",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Mock Thread 2",
    messages: [
      {
        componentState: {},
        content: [{ type: "text", text: "Hello, world!" }],
        createdAt: new Date().toISOString(),
        id: "2",
        role: "user",
        threadId: "2",
      },
    ],
    createdAt: new Date().toISOString(),
    projectId: "1",
    updatedAt: new Date().toISOString(),
  },
];

export default function ThreadHistoryPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Thread History
        </h1>
        <p className="text-lg text-muted-foreground">
          A primitive component that displays a sidebar with conversation
          history, search functionality, and thread management. Supports
          collapsible behavior and can be positioned on left or right.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Left Position (Expanded)"
            component={
              <div className="relative h-96 bg-muted rounded-lg overflow-hidden border">
                <TamboStubProvider
                  thread={mockThreads[0]}
                  threads={{
                    items: mockThreads,
                    total: 1,
                    count: 1,
                    hasNextPage: () => false,
                  }}
                  projectId="1"
                  contextKey="demo-left"
                >
                  <ThreadHistory
                    position="left"
                    defaultCollapsed={false}
                    className="relative bg-card border-r"
                  >
                    <ThreadHistoryHeader />
                    <ThreadHistoryNewButton />
                    <ThreadHistorySearch />
                    <ThreadHistoryList />
                  </ThreadHistory>
                </TamboStubProvider>
                <div className="ml-64 p-4 h-full">
                  <p className="text-muted-foreground">
                    Main content area would go here
                  </p>
                </div>
              </div>
            }
            code={`import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList,
} from "@/components/tambo/thread-history";

export function ChatSidebar() {
  return (
    <ThreadHistory position="left" defaultCollapsed={false}>
      <ThreadHistoryHeader />
      <ThreadHistoryNewButton />
      <ThreadHistorySearch />
      <ThreadHistoryList />
    </ThreadHistory>
  );
}`}
            previewClassName="p-0"
            fullBleed
          />

          <ComponentCodePreview
            title="Collapsed State"
            component={
              <div className="relative h-96 bg-muted rounded-lg overflow-hidden border">
                <TamboStubProvider
                  thread={mockThreads[0]}
                  threads={{
                    items: mockThreads,
                    total: 1,
                    count: 1,
                    hasNextPage: () => false,
                  }}
                  projectId="1"
                  contextKey="demo-collapsed"
                >
                  <ThreadHistory
                    position="left"
                    defaultCollapsed={true}
                    className="relative bg-card border-r"
                  >
                    <ThreadHistoryHeader />
                    <ThreadHistoryNewButton />
                    <ThreadHistorySearch />
                    <ThreadHistoryList />
                  </ThreadHistory>
                </TamboStubProvider>
                <div className="ml-12 p-4 h-full">
                  <p className="text-muted-foreground">
                    Main content area adjusts when sidebar is collapsed
                  </p>
                  <p className="text-sm text-muted-foreground/80 mt-2">
                    Click the arrow icon in the sidebar to expand
                  </p>
                </div>
              </div>
            }
            code={`import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList,
} from "@/components/tambo/thread-history";

export function CollapsedSidebar() {
  return (
    <ThreadHistory position="left" defaultCollapsed={true}>
      <ThreadHistoryHeader />
      <ThreadHistoryNewButton />
      <ThreadHistorySearch />
      <ThreadHistoryList />
    </ThreadHistory>
  );
}`}
            previewClassName="p-0"
            fullBleed
          />

          <ComponentCodePreview
            title="Right Position"
            component={
              <div className="relative h-96 bg-muted rounded-lg overflow-hidden border flex">
                <div className="flex-1 p-4 h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Main content area with right sidebar
                  </p>
                </div>
                <TamboStubProvider
                  thread={mockThreads[0]}
                  threads={{
                    items: mockThreads,
                    total: 1,
                    count: 1,
                    hasNextPage: () => false,
                  }}
                  projectId="1"
                  contextKey="demo-right"
                >
                  <ThreadHistory
                    position="right"
                    defaultCollapsed={false}
                    className="bg-card border-l"
                    style={{ position: "static" }}
                  >
                    <ThreadHistoryHeader />
                    <ThreadHistoryNewButton />
                    <ThreadHistorySearch />
                    <ThreadHistoryList />
                  </ThreadHistory>
                </TamboStubProvider>
              </div>
            }
            code={`import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList,
} from "@/components/tambo/thread-history";

export function RightSidebarLayout() {
  return (
    <div className="flex h-screen">
      <div className="flex-1 p-6">
        <p>Main content area with right sidebar</p>
      </div>
      <ThreadHistory
        position="right"
        defaultCollapsed={false}
        style={{ position: "static" }}
        className="border-l"
      >
        <ThreadHistoryHeader />
        <ThreadHistoryNewButton />
        <ThreadHistorySearch />
        <ThreadHistoryList />
      </ThreadHistory>
    </div>
  );
}`}
            previewClassName="p-0"
            fullBleed
          />

          <ComponentCodePreview
            title="Minimal (Header Only)"
            component={
              <div className="relative h-64 bg-muted rounded-lg overflow-hidden border">
                <TamboStubProvider
                  thread={mockThreads[0]}
                  threads={{
                    items: mockThreads,
                    total: 1,
                    count: 1,
                    hasNextPage: () => false,
                  }}
                  contextKey="demo-minimal"
                >
                  <ThreadHistory
                    position="left"
                    defaultCollapsed={false}
                    className="bg-card border-r h-full"
                    style={{ position: "absolute" }}
                  >
                    <ThreadHistoryHeader />
                    <ThreadHistoryList />
                  </ThreadHistory>
                </TamboStubProvider>
                <div className="ml-64 p-4 h-full">
                  <p className="text-muted-foreground">
                    Minimal sidebar with just header and list
                  </p>
                </div>
              </div>
            }
            code={`import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
} from "@/components/tambo/thread-history";

export function MinimalSidebar() {
  return (
    <ThreadHistory position="left" defaultCollapsed={false}>
      <ThreadHistoryHeader />
      <ThreadHistoryList />
    </ThreadHistory>
  );
}`}
            previewClassName="p-0"
            fullBleed
            minHeight={256}
          />
        </div>
      </section>

      <section>
        <InstallationSection cliCommand="npx tambo add thread-history" />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">ThreadHistory</h3>

            <table>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>position</td>
                  <td>&quot;left&quot; | &quot;right&quot;</td>
                  <td>&quot;left&quot;</td>
                  <td>Position of the sidebar</td>
                </tr>
                <tr>
                  <td>defaultCollapsed</td>
                  <td>boolean</td>
                  <td>true</td>
                  <td>Whether the sidebar starts collapsed</td>
                </tr>
                <tr>
                  <td>onThreadChange</td>
                  <td>() =&gt; void</td>
                  <td>-</td>
                  <td>Optional callback when thread is switched</td>
                </tr>
                <tr>
                  <td>children</td>
                  <td>React.ReactNode</td>
                  <td>-</td>
                  <td>The sub-components to render within the sidebar</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Sub-components</h3>

            <ul>
              <li>
                <strong>ThreadHistoryHeader</strong> - Header section with title
                and collapse/expand toggle button. Handles the sidebar
                visibility state and provides visual indication of current
                state.
              </li>
              <li>
                <strong>ThreadHistoryNewButton</strong> - Button to create a new
                conversation thread. Supports keyboard shortcut (Alt+Shift+N)
                and automatically refreshes the thread list after creation.
              </li>
              <li>
                <strong>ThreadHistorySearch</strong> - Search input for
                filtering through conversation history. Automatically expands
                the sidebar when focused from collapsed state and filters
                threads in real-time.
              </li>
              <li>
                <strong>ThreadHistoryList</strong> - Displays the list of
                previous conversation threads. Shows thread metadata like
                creation time, handles thread switching, and displays
                appropriate empty states.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Features</h3>

            <ul>
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
                <strong>Position Flexibility:</strong> Can be positioned on left
                or right side
              </li>
              <li>
                <strong>Responsive Behavior:</strong> Automatically adjusts
                layout based on collapse state
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
