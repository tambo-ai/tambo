import { TamboProvider } from "@tambo-ai/react";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { components, tools } from "@/lib/tambo";
import type { Route } from "./+types/page";

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Chat - Tambo AI" },
		{ name: "description", content: "Chat with Tambo AI" },
	];
}

export default function ChatPage() {
	const mcpServers = useMcpServers();

	return (
		<TamboProvider
			apiKey={import.meta.env.VITE_TAMBO_API_KEY}
			components={components}
			tools={tools}
			tamboUrl={import.meta.env.VITE_TAMBO_URL}
			mcpServers={mcpServers}
		>
			<div className="h-screen">
				<MessageThreadFull />
			</div>
		</TamboProvider>
	);
}
