import { ChatInput } from "@/components/ui/chat-input";
import { ChatThread } from "@/components/ui/chat-thread";
import { FormComponent, FormField } from "@/components/ui/form";
import { Graph } from "@/components/ui/graph";

export function ExamplesComponent() {
  const revenueData = {
    type: "line" as const,
    labels: Array.from(
      { length: 12 },
      (_, i) =>
        [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][i],
    ),
    datasets: [
      {
        label: "Revenue",
        data: [
          14500, 16800, 15200, 17300, 16900, 18431.52, 19200, 20100, 21500,
          22800, 23400, 25000,
        ],
        color: "hsl(var(--chart-1))",
      },
    ],
  };

  const subscriptionData = {
    type: "bar" as const,
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "New Users",
        data: [320, 410, 480, 520, 630, 840, 1020],
        color: "hsl(var(--chart-2))",
      },
    ],
  };

  const exerciseData = {
    type: "line" as const,
    labels: Array.from({ length: 12 }, (_, i) => `${i + 1}h`),
    datasets: [
      {
        label: "Today",
        data: [180, 420, 340, 260, 410, 450, 390, 320, 290, 310, 285, 405],
        color: "hsl(var(--chart-3))",
      },
      {
        label: "Average",
        data: [230, 310, 290, 315, 335, 365, 375, 360, 355, 380, 370, 385],
        color: "hsl(var(--chart-4))",
      },
    ],
  };

  const activityData = {
    type: "bar" as const,
    labels: Array.from({ length: 12 }, (_, i) => `${i + 1}`),
    datasets: [
      {
        label: "Activity",
        data: [52, 38, 41, 33, 37, 43, 35, 42, 73, 38, 34, 41],
        color: "hsl(var(--primary))",
      },
    ],
  };

  const formFields = [
    {
      id: "email",
      label: "Email",
      type: "text",
      placeholder: "Enter your email",
      required: true,
    },
    {
      id: "accountType",
      label: "Account Type",
      type: "select",
      options: ["Personal", "Business", "Enterprise"],
      placeholder: "Select account type",
      required: true,
    },
    {
      id: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter your full name",
      required: true,
    },
  ];

  return (
    <main className="flex flex-col items-center gap-8 px-[12%]">
      <div className="grid grid-cols-12 gap-4 w-full">
        <div className="col-span-4 p-6 border rounded-lg bg-card">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold">Total Revenue</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">$18,431.52</span>
              <span className="text-sm text-muted-foreground">
                +23.5% from last month
              </span>
            </div>
            <Graph
              data={revenueData}
              variant="default"
              className="h-96 mt-6 -mb-6"
            />
          </div>
        </div>

        <div className="col-span-4 p-6 border rounded-lg bg-card">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold">Subscriptions</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">+2840</span>
              <span className="text-sm text-muted-foreground">
                +195.3% from last month
              </span>
            </div>
            <Graph
              data={subscriptionData}
              variant="default"
              className="h-96 mt-6 -mb-6"
            />
          </div>
        </div>

        <div className="col-span-4 p-6 border rounded-lg bg-card">
          <h2 className="font-semibold mb-4">Create an account</h2>
          <FormComponent
            fields={formFields as FormField[]}
            onSubmit={(data) => console.log(data)}
            submitText="Create Account"
            variant="bordered"
          />
        </div>

        <div className="col-span-3 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Chat Threads</h2>
            <button className="p-2 rounded-full hover:bg-muted">
              <span className="sr-only">Add new chat</span>+
            </button>
          </div>
          <div className="space-y-4">
            <div className="p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10" />
                <div>
                  <p className="text-sm font-medium">Account Support</p>
                  <p className="text-xs text-muted-foreground">
                    Last message 2h ago
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10" />
                <div>
                  <p className="text-sm font-medium">Billing Questions</p>
                  <p className="text-xs text-muted-foreground">
                    Last message 5h ago
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10" />
                <div>
                  <p className="text-sm font-medium">Technical Support</p>
                  <p className="text-xs text-muted-foreground">
                    Last message 1d ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-6 p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-full bg-primary/10" />
            <div>
              <h2 className="font-semibold">Sofia Davis</h2>
              <p className="text-sm text-muted-foreground">m@example.com</p>
            </div>
            <button className="ml-auto p-2 rounded-full hover:bg-muted">
              <span className="sr-only">Add participant</span>+
            </button>
          </div>

          <div className="h-px bg-border/40 mb-4 -mt-6" />

          <div className="space-y-4 mt-10">
            <ChatThread
              messages={[
                { role: "assistant", content: "Hi, how can I help you today?" },
                {
                  role: "user",
                  content: "Hey, I'm having trouble with my account.",
                },
                { role: "assistant", content: "What seems to be the problem?" },
                { role: "user", content: "I can't log in." },
              ]}
              variant="bordered"
              className="h-[240px] mb-4"
            />

            <ChatInput
              variant="bordered"
              className="relative"
              placeholder="Type your message..."
              onValueSubmit={(value) => console.log(value)}
            />
          </div>
        </div>

        <div className="col-span-3 p-6 border rounded-lg bg-card">
          <h2 className="font-semibold">Daily Activity</h2>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold">425</span>
            <span className="text-sm text-muted-foreground">cal/day</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Daily activity breakdown
          </p>
          <Graph
            data={activityData}
            variant="default"
            className="h-72 mt-8 -ml-6 -mb-2"
          />
        </div>

        <div className="col-span-12 p-6 border rounded-lg bg-card mb-10">
          <h2 className="font-semibold mb-2">Exercise Minutes</h2>
          <p className="text-sm text-muted-foreground">
            Your exercise minutes are ahead of where you normally are.
          </p>
          <Graph
            data={exerciseData}
            variant="default"
            className="h-96 mt-6 -mb-6"
          />
        </div>
      </div>
    </main>
  );
}
