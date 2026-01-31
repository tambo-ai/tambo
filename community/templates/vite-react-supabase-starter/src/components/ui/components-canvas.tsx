import { useCanvasStore, type CanvasComponent } from "@/lib/canvas-storage";
import { components } from "@/lib/tambo";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TamboComponent } from "@tambo-ai/react";
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import * as React from "react";

type CanvasComponentProps = CanvasComponent;

export const ComponentsCanvas: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    ...props
}) => {
    const {
        canvases,
        activeCanvasId,
        createCanvas,
        updateCanvas,
        removeCanvas,
        setActiveCanvas,
        clearCanvas,
        removeComponent,
        addComponent,
        moveComponent,
    } = useCanvasStore();

    const [editingCanvasId, setEditingCanvasId] = React.useState<string | null>(null);
    const [pendingDeleteCanvasId, setPendingDeleteCanvasId] = React.useState<string | null>(null);
    const [editingName, setEditingName] = React.useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    React.useEffect(() => {
        const existingStore = localStorage.getItem("tambo-canvas-storage");
        const hasExistingCanvases =
            existingStore && JSON.parse(existingStore)?.state?.canvases?.length > 0;

        if (!hasExistingCanvases && canvases.length === 0) {
            createCanvas("Notes");
        } else if (!activeCanvasId && canvases.length > 0) {
            setActiveCanvas(canvases[0].id);
        }
    }, []);

    const handleDrop = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (!activeCanvasId) return;

            const data = e.dataTransfer.getData("application/json");
            if (!data) return;

            try {
                const parsed = JSON.parse(data);
                if (!parsed.component || !parsed.props) return;

                const componentProps = parsed.props as CanvasComponentProps;
                const isMovingExisting =
                    componentProps._inCanvas && componentProps.componentId && componentProps.canvasId;
                const sourceCanvasId = componentProps.canvasId;
                const componentId =
                    componentProps.componentId ||
                    `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                if (isMovingExisting && sourceCanvasId === activeCanvasId) return;

                if (isMovingExisting && sourceCanvasId && sourceCanvasId !== activeCanvasId) {
                    moveComponent(sourceCanvasId, activeCanvasId, componentId);
                    return;
                }

                addComponent(activeCanvasId, {
                    ...componentProps,
                    componentId,
                    _inCanvas: true,
                    _componentType: parsed.component,
                });
            } catch (err) {
                console.error("Invalid drop data", err);
            }
        },
        [activeCanvasId, addComponent, moveComponent]
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === "move" ? "move" : "copy";
    };

    const handleCreateCanvas = React.useCallback(() => {
        createCanvas();
    }, [createCanvas]);

    const startRenameCanvas = React.useCallback(
        (id: string) => {
            const canvas = canvases.find((c) => c.id === id);
            if (!canvas) return;
            setEditingCanvasId(id);
            setEditingName(canvas.name);
            setPendingDeleteCanvasId(null);
        },
        [canvases]
    );

    const saveRenameCanvas = React.useCallback(() => {
        if (!editingCanvasId) return;
        const name = editingName.trim();
        if (name) updateCanvas(editingCanvasId, name);
        setEditingCanvasId(null);
    }, [editingCanvasId, editingName, updateCanvas]);

    const handleDeleteCanvas = React.useCallback(
        (id: string, confirmed = false) => {
            if (confirmed) {
                removeCanvas(id);
                setPendingDeleteCanvasId(null);
            } else {
                setPendingDeleteCanvasId(id);
                setTimeout(() => {
                    setPendingDeleteCanvasId((curr) => (curr === id ? null : curr));
                }, 5000);
            }
        },
        [removeCanvas]
    );

    const renderComponent = React.useCallback(
        (componentProps: CanvasComponentProps) => {
            const componentType = componentProps._componentType;
            const componentDef = components.find(
                (comp: TamboComponent) => comp.name === componentType
            );

            if (!componentDef) {
                return (
                    <div key={componentProps.componentId} className="p-3 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        Unknown: {componentType}
                    </div>
                );
            }

            const Component = componentDef.component;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _componentType, componentId, canvasId, _inCanvas, ...cleanProps } = componentProps;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const handleUpdate = (_id: string, title: string, content: string) => {
                if (canvasId) {
                    useCanvasStore.getState().updateComponent(canvasId, componentId, { title, content });
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const handleDelete = async (_id: string) => {
                if (canvasId) {
                    const { error } = await supabase
                        .from("sticky_notes")
                        .delete()
                        .eq("id", componentId);

                    if (error) {
                        console.error("Failed to delete note from Supabase:", error);
                    }

                    removeComponent(canvasId, componentId);
                }
            };

            return (
                <Component
                    {...cleanProps}
                    id={componentId}
                    createdAt={new Date().toISOString()}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            );
        },
        [removeComponent]
    );

    const SortableItem: React.FC<{ componentProps: CanvasComponentProps }> = ({
        componentProps,
    }) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
            useSortable({ id: componentProps.componentId });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? 50 : 1,
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={cn(
                    "cursor-grab active:cursor-grabbing select-none h-fit",
                    isDragging && "opacity-80 scale-[1.01] shadow-lg"
                )}
            >
                {renderComponent(componentProps)}
            </div>
        );
    };

    const handleDragEnd = React.useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || !activeCanvasId || active.id === over.id) return;

            const overIndex = useCanvasStore
                .getState()
                .getComponents(activeCanvasId)
                .findIndex((c) => c.componentId === over.id);
            if (overIndex !== -1) {
                useCanvasStore.getState().reorderComponent(activeCanvasId, active.id as string, overIndex);
            }
        },
        [activeCanvasId]
    );

    const activeCanvas = canvases.find((c) => c.id === activeCanvasId);

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn("w-full h-full flex flex-col relative bg-white", className)}
            data-canvas-space="true"
            {...props}
        >
            {/* Canvas tabs - premium design */}
            <div className="flex items-center gap-1 p-2.5 pr-14 bg-white border-b border-gray-100 overflow-x-auto">
                {canvases.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => {
                            setActiveCanvas(c.id);
                            setPendingDeleteCanvasId(null);
                        }}
                        className={cn(
                            "group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition-all",
                            activeCanvasId === c.id
                                ? "bg-gray-100 text-gray-800"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                    >
                        {editingCanvasId === c.id ? (
                            <div className="flex items-center gap-1.5">
                                <input
                                    autoFocus
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && saveRenameCanvas()}
                                    onBlur={saveRenameCanvas}
                                    className="w-20 px-2 py-0.5 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ) : (
                            <>
                                <span>{c.name}</span>

                                {/* Edit/Delete - always visible when active, hover otherwise */}
                                <div className={cn(
                                    "flex items-center gap-1",
                                    activeCanvasId === c.id ? "opacity-60" : "opacity-0 group-hover:opacity-60"
                                )}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startRenameCanvas(c.id); }}
                                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                                        title="Rename"
                                    >
                                        <PencilIcon className="h-3 w-3 text-gray-500" />
                                    </button>

                                    {canvases.length > 1 && (
                                        pendingDeleteCanvasId === c.id ? (
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 rounded text-xs text-red-600 font-medium">
                                                Delete?
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCanvas(c.id, true); }} className="p-0.5 hover:text-red-800">
                                                    <CheckIcon className="h-3 w-3" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setPendingDeleteCanvasId(null); }} className="p-0.5 hover:text-red-800">
                                                    <XIcon className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCanvas(c.id); }}
                                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                                                title="Delete canvas"
                                            >
                                                <Trash2Icon className="h-3 w-3 text-gray-500" />
                                            </button>
                                        )
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* New canvas button */}
            <div className="absolute top-2 right-2 z-10">
                <button
                    onClick={handleCreateCanvas}
                    className="p-2 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm"
                    title="New canvas"
                >
                    <PlusIcon className="h-4 w-4 text-gray-500" />
                </button>
            </div>

            {/* Clear canvas button */}
            {activeCanvasId && activeCanvas && activeCanvas.components.length > 0 && (
                <div className="absolute bottom-4 right-4 z-50">
                    <button
                        onClick={() => clearCanvas(activeCanvasId)}
                        className="px-3 py-2 bg-white border border-gray-100 text-gray-500 hover:text-gray-700 hover:border-gray-200 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-all"
                        title="Clear canvas"
                    >
                        <XIcon className="h-4 w-4" />
                        Clear all
                    </button>
                </div>
            )}

            {/* Canvas area - subtle dots on light gray */}
            <div
                className={cn(
                    "flex-1 overflow-auto p-6",
                    "[&::-webkit-scrollbar]:w-[6px]",
                    "[&::-webkit-scrollbar-thumb]:bg-gray-200",
                    // Subtle dotted pattern
                    "bg-[radial-gradient(circle,_#d1d5db_1px,_transparent_1px)]",
                    "[background-size:24px_24px]",
                    "dark:bg-gray-900"
                )}
            >
                {!activeCanvas || activeCanvas.components.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">
                            Tambo × Supabase
                        </div>
                        <div className="text-sm text-gray-400 dark:text-gray-600">
                            Sticky Notes Starter Template
                        </div>
                        <div className="text-xs text-gray-300 dark:text-gray-700 mt-4">
                            Ask AI to create a note
                        </div>
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext
                            items={activeCanvas.components.map((c) => c.componentId)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="flex flex-wrap gap-6 items-start">
                                {activeCanvas.components.map((c) => (
                                    <SortableItem key={c.componentId} componentProps={c} />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
};

export default ComponentsCanvas;
