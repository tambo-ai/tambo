'use client';

import { z } from 'zod';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export const dataTablePropsSchema = z.object({
    data: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().nullable().optional(),
            status: z.enum(['todo', 'in_progress', 'done']),
            priority: z.enum(['low', 'medium', 'high']),
            createdAt: z.string(),
        })
    ),
});

type DataTableProps = z.infer<typeof dataTablePropsSchema>;

const statusConfig = {
    todo: {
        label: 'To Do',
        icon: '○',
        className: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700',
    },
    in_progress: {
        label: 'In Progress',
        icon: '◐',
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    },
    done: {
        label: 'Done',
        icon: '●',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    },
};

const priorityConfig = {
    low: {
        label: 'Low',
        className: 'bg-slate-100/80 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
    },
    medium: {
        label: 'Medium',
        className: 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    high: {
        label: 'High',
        className: 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    },
};

export function DataTable({ data }: DataTableProps) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full" />
                    <div className="relative rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                        <svg
                            className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                            />
                        </svg>
                    </div>
                </div>
                <h3 className="text-xl font-semibold mt-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                    No tasks yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs text-center">
                    Your task list is empty. Ask me to create a new task to get started!
                </p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 backdrop-blur-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">Your Tasks</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{data.length} task{data.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <TableHead className="w-[45%] font-semibold text-slate-700 dark:text-slate-300">Task</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Priority</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Created</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((task, index) => (
                        <TableRow
                            key={task.id}
                            className="group transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <TableCell className="py-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 h-5 w-5 rounded-md border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors">
                                        {task.status === 'done' && (
                                            <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`font-medium text-slate-900 dark:text-white leading-tight ${task.status === 'done' ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                                            {task.title}
                                        </p>
                                        {task.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${statusConfig[task.status].className}`}>
                                    <span className="text-[10px]">{statusConfig[task.status].icon}</span>
                                    {statusConfig[task.status].label}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${priorityConfig[task.priority].className}`}>
                                    {priorityConfig[task.priority].label}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(task.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: new Date(task.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                                    })}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
