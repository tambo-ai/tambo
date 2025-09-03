"use client";

import { cn } from "@/lib/utils";
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { z } from "zod";
import { useTamboComponentState } from "../lib/thread-hooks";

// Media schema
export const listViewCardMediaSchema = z.object({
	type: z.enum(["avatar", "thumbnail", "icon"]).describe("Type of media to display"),
	src: z.string().describe("Source for the media (URL or emoji)"),
	alt: z.string().optional().describe("Alternative text for accessibility"),
});

// Item schema
export const listViewCardItemSchema = z.object({
	id: z.string().describe("Unique identifier for the item"),
	title: z.string().describe("Primary text for the item"),
	subtitle: z.string().optional().describe("Secondary text displayed below the title"),
	media: listViewCardMediaSchema.optional().describe("Optional media to display with the item"),
});

// Props schema
export const listViewCardSchema = z.object({
	items: z.array(listViewCardItemSchema).default([]).describe("Array of items to display"),
	selectionMode: z
		.enum(["none", "single", "multi"]) // default applied at runtime for clarity to registry
		.optional()
		.describe("Selection behavior for list items"),
	height: z.union([z.number(), z.string()]).optional().describe("Height in px or CSS value"),
	itemHeight: z.number().optional().describe("Height of each list item in pixels"),
	showCheckboxes: z.boolean().optional().describe("Show checkboxes in multi-select mode"),
	onSelect: z
		.function()
		.args(z.array(z.string()))
		.returns(z.void())
		.optional()
		.describe("Callback when selection changes"),
	onActivate: z
		.function()
		.args(z.string())
		.returns(z.void())
		.optional()
		.describe("Callback when an item is activated/clicked"),
	onLoadMore: z
		.function()
		.args(z.object({ cursor: z.string().optional() }))
		.returns(
			z.promise(
				z.object({ items: z.array(listViewCardItemSchema), cursor: z.string().optional() }),
			),
		)
		.optional()
		.describe("Callback for infinite scroll pagination"),
	className: z.string().optional().describe("Additional CSS classes for styling"),
	variant: z
		.enum(["default", "bordered", "elevated"]) // default applied at runtime
		.optional()
		.describe("Visual style variant of the list container"),
	size: z.enum(["sm", "md", "lg"]).optional().describe("Size variant affecting padding and text size"),
});

export type ListViewCardProps = z.infer<typeof listViewCardSchema>;
export type ListViewCardItem = z.infer<typeof listViewCardItemSchema>;
export type ListViewCardRef = {
	focusItem: (index: number) => void;
	scrollToItem: (index: number) => void;
	clearSelection: () => void;
	getSelectedItems: () => string[];
};

interface ListViewCardState {
	selectedIds: string[];
	focusedIndex: number;
	searchQuery: string;
	isLoading: boolean;
	cursor?: string;
}

const defaultState: ListViewCardState = {
	selectedIds: [],
	focusedIndex: 0,
	searchQuery: "",
	isLoading: false,
	cursor: undefined,
};

const sizeConfigs = {
	sm: { padding: "px-3 py-2", text: "text-sm" },
	md: { padding: "px-4 py-3", text: "text-base" },
	lg: { padding: "px-6 py-4", text: "text-lg" },
};

const variantConfigs: Record<string, string> = {
	default: "bg-background border border-border",
	bordered: "bg-background border-2 border-border",
	elevated: "bg-background border border-border shadow-lg",
};

function useVirtualization<T>(items: T[], itemHeight: number, containerHeight: number, overscan: number = 5) {
	const [scrollTop, setScrollTop] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	const totalHeight = items.length * itemHeight;
	const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
	const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);

	const visibleItems = items.slice(startIndex, endIndex);
	const offsetY = startIndex * itemHeight;

	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		setScrollTop(e.currentTarget.scrollTop);
	}, []);

	return { visibleItems, offsetY, totalHeight, handleScroll, containerRef };
}

export const ListViewCard = forwardRef<ListViewCardRef, ListViewCardProps>(
	(
		{
			items = [],
			selectionMode = "none",
			height = 400,
			itemHeight = 60,
			showCheckboxes = false,
			onSelect,
			onActivate,
			onLoadMore,
			className,
			variant = "default",
			size = "md",
		},
		ref,
	) => {
		const [state, setState] = useTamboComponentState<ListViewCardState>("list-view-card", defaultState);
		const currentState = state || defaultState;
		const { selectedIds, focusedIndex, searchQuery, isLoading, cursor } = currentState;

		const { visibleItems, offsetY, totalHeight, handleScroll, containerRef } = useVirtualization(items, itemHeight, typeof height === "number" ? height : 400);

		const listRef = useRef<HTMLDivElement>(null);
		const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

		const filteredItems = useMemo(() => {
			if (!searchQuery.trim()) return items;
			const query = searchQuery.toLowerCase();
			return items.filter((item) => item.title.toLowerCase().includes(query) || (item.subtitle && item.subtitle.toLowerCase().includes(query)));
		}, [items, searchQuery]);

		const handleItemSelect = useCallback(
			(itemId: string, checked: boolean) => {
				if (selectionMode === "none") return;

				let newSelectedIds: string[];
				if (selectionMode === "single") {
					newSelectedIds = checked ? [itemId] : [];
				} else {
					if (checked) {
						newSelectedIds = [...selectedIds, itemId];
					} else {
						newSelectedIds = selectedIds.filter((id) => id !== itemId);
					}
				}

				setState({ ...currentState, selectedIds: newSelectedIds });
				onSelect?.(newSelectedIds);
			},
			[selectionMode, selectedIds, onSelect, setState, currentState],
		);

		const handleItemActivate = useCallback(
			(itemId: string) => {
				onActivate?.(itemId);
			},
			[onActivate],
		);

		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent) => {
				if (!filteredItems.length) return;
				switch (e.key) {
					case "ArrowDown":
						e.preventDefault();
						setState({ ...currentState, focusedIndex: Math.min(focusedIndex + 1, filteredItems.length - 1) });
						break;
					case "ArrowUp":
						e.preventDefault();
						setState({ ...currentState, focusedIndex: Math.max(focusedIndex - 1, 0) });
						break;
					case "Home":
						e.preventDefault();
						setState({ ...currentState, focusedIndex: 0 });
						break;
					case "End":
						e.preventDefault();
						setState({ ...currentState, focusedIndex: filteredItems.length - 1 });
						break;
					case "Enter":
					case " ":
						e.preventDefault();
						if (filteredItems[focusedIndex]) {
							handleItemActivate(filteredItems[focusedIndex].id);
						}
						break;
					default:
						if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
							const newQuery = searchQuery + e.key.toLowerCase();
							setState({ ...currentState, searchQuery: newQuery });
						}
						break;
				}
			},
			[filteredItems, focusedIndex, searchQuery, handleItemActivate, setState, currentState],
		);

		const handleLoadMore = useCallback(async () => {
			if (!onLoadMore || isLoading) return;
			setState({ ...currentState, isLoading: true });
			try {
				const result = await onLoadMore({ cursor });
				setState({ ...currentState, isLoading: false, cursor: result.cursor });
			} catch (error) {
				setState({ ...currentState, isLoading: false });
				console.error("Error loading more items:", error);
			}
		}, [onLoadMore, isLoading, cursor, setState, currentState]);

		useImperativeHandle(
			ref,
			() => ({
				focusItem: (index: number) => {
					const item = itemRefs.current.get(index);
					if (item) {
						item.focus();
						setState({ ...currentState, focusedIndex: index });
					}
				},
				scrollToItem: (index: number) => {
					if (listRef.current) {
						const scrollTop = index * itemHeight;
						listRef.current.scrollTop = scrollTop;
					}
				},
				clearSelection: () => {
					setState({ ...currentState, selectedIds: [] });
					onSelect?.([]);
				},
				getSelectedItems: () => selectedIds,
			}),
			[itemHeight, onSelect, setState, currentState, selectedIds],
		);

		useEffect(() => {
			if (filteredItems.length > 0 && focusedIndex >= filteredItems.length) {
				setState({ ...currentState, focusedIndex: 0 });
			}
		}, [filteredItems.length, focusedIndex, setState, currentState]);

		useEffect(() => {
			if (!onLoadMore || !containerRef.current) return;
			const container = containerRef.current;
			const onScroll = () => {
				const { scrollTop, scrollHeight, clientHeight } = container;
				if (scrollTop + clientHeight >= scrollHeight - 100) {
					handleLoadMore();
				}
			};
			container.addEventListener("scroll", onScroll);
			return () => container.removeEventListener("scroll", onScroll);
		}, [onLoadMore, handleLoadMore]);

		const renderMedia = (media: z.infer<typeof listViewCardMediaSchema>) => {
			switch (media.type) {
				case "avatar":
					return <img src={media.src} alt={media.alt || ""} className="w-10 h-10 rounded-full object-cover" />;
				case "thumbnail":
					return <img src={media.src} alt={media.alt || ""} className="w-10 h-10 rounded object-cover" />;
				case "icon":
					return <span className="w-10 h-10 flex items-center justify-center text-2xl">{media.src}</span>;
				default:
					return null;
			}
		};

		const renderSelectionControl = (item: ListViewCardItem) => {
			if (selectionMode === "none") return null;
			const isSelected = selectedIds.includes(item.id);
			if (selectionMode === "single") {
				return (
					<input
						type="radio"
						name="list-selection"
						checked={isSelected}
						onChange={(e) => handleItemSelect(item.id, e.target.checked)}
						className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
						onClick={(e) => e.stopPropagation()}
					/>
				);
			}
			if (selectionMode === "multi" && showCheckboxes) {
				return (
					<input
						type="checkbox"
						checked={isSelected}
						onChange={(e) => handleItemSelect(item.id, e.target.checked)}
						className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
						onClick={(e) => e.stopPropagation()}
					/>
				);
			}
			return null;
		};

		if (filteredItems.length === 0) {
			return (
				<div
					className={cn("flex items-center justify-center p-8 text-muted-foreground", variantConfigs[variant], "rounded-lg", className)}
					style={{ height: typeof height === "number" ? `${height}px` : height }}
				>
					{searchQuery ? "No items match your search." : "No items to display."}
				</div>
			);
		}

		return (
			<div
				ref={listRef}
				className={cn("relative", variantConfigs[variant], "rounded-lg overflow-hidden", className)}
				style={{ height: typeof height === "number" ? `${height}px` : height }}
			>
				<div
					ref={containerRef}
					className="overflow-auto h-full"
					onScroll={handleScroll}
					onKeyDown={handleKeyDown}
					tabIndex={0}
					role="listbox"
					aria-label="List of items"
					aria-multiselectable={selectionMode === "multi"}
					aria-activedescendant={`item-${focusedIndex}`}
				>
					<div style={{ height: totalHeight, position: "relative" }}>
						<div style={{ transform: `translateY(${offsetY}px)` }}>
							{visibleItems.map((item) => {
								const actualIndex = filteredItems.findIndex((i) => i.id === item.id);
								const isFocused = actualIndex === focusedIndex;
								const isSelected = selectedIds.includes(item.id);
								return (
									<div
										key={item.id}
										ref={(el) => {
											if (el) itemRefs.current.set(actualIndex, el);
										}}
										id={`item-${actualIndex}`}
										className={cn(
											"flex items-center gap-3 cursor-pointer transition-colors",
											sizeConfigs[size].padding,
											sizeConfigs[size].text,
											isFocused && "bg-accent",
											isSelected && "bg-primary/10",
											"hover:bg-accent/50",
											"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
										)}
										tabIndex={-1}
										role="option"
										aria-selected={isSelected}
										onClick={() => handleItemActivate(item.id)}
										onFocus={() => setState({ ...currentState, focusedIndex: actualIndex })}
									>
										{renderSelectionControl(item)}
										{item.media && renderMedia(item.media)}
										<div className="flex-1 min-w-0">
											<div className="font-medium truncate">{item.title}</div>
											{item.subtitle && (
												<div className="text-sm text-muted-foreground truncate">{item.subtitle}</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{isLoading && (
					<div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 text-center text-sm text-muted-foreground">
						Loading more items...
					</div>
				)}
			</div>
		);
	},
);

ListViewCard.displayName = "ListViewCard";


