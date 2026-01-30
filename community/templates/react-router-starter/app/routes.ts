import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/page.tsx"),
	route("chat", "routes/chat/page.tsx"),
	route("interactables", "routes/interactables/page.tsx"),
] satisfies RouteConfig;
