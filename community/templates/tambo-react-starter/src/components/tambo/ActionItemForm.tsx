/**
 * EXAMPLE COMPONENT: ActionItemForm
 *
 * Demonstrates how to create a Tambo component that:
 * - Handles interactive user input (add/remove items)
 * - Uses local React state alongside AI-provided props
 * - Renders forms and checkboxes
 *
 * Replace or modify this for your own use case.
 */

import { Calendar, CheckSquare, Plus, User, X } from "lucide-react";
import { useState } from "react";

interface ActionItem {
    task: string;
    assignee?: string;
    due?: string;
}

interface ActionItemFormProps {
    items: ActionItem[];
}

export function ActionItemForm({ items: initialItems = [] }: ActionItemFormProps) {
    const [items, setItems] = useState<ActionItem[]>(initialItems || []);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState<ActionItem>({ task: "", assignee: "", due: "" });

    const handleAddItem = () => {
        if (newItem.task.trim()) {
            setItems([...items, newItem]);
            setNewItem({ task: "", assignee: "", due: "" });
            setShowAddForm(false);
        }
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex justify-between items-center">
                <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Task List (Example)
                </h3>
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    {items.length} items
                </span>
            </div>

            <div className="p-4 space-y-3">
                {items.length === 0 && !showAddForm && (
                    <p className="text-sm text-gray-500 text-center italic py-2">No action items yet.</p>
                )}

                {items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
                        <input type="checkbox" className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 font-medium break-words">{item.task}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                {item.assignee && (
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" /> {item.assignee}
                                    </span>
                                )}
                                {item.due && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {item.due}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => handleRemoveItem(index)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                            aria-label="Remove item"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {showAddForm ? (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="text"
                            placeholder="Task description"
                            className="w-full px-3 py-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={newItem.task}
                            onChange={(e) => setNewItem({ ...newItem, task: e.target.value })}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Assignee"
                                className="flex-1 px-3 py-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newItem.assignee}
                                onChange={(e) => setNewItem({ ...newItem, assignee: e.target.value })}
                            />
                            <input
                                type="date"
                                className="flex-1 px-3 py-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newItem.due}
                                onChange={(e) => setNewItem({ ...newItem, due: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddItem}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                            >
                                Add Task
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-emerald-600 border border-dashed border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Action Item
                    </button>
                )}
            </div>
        </div>
    );
}
