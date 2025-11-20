"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Code2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function AddToIdeDropdown() {
  const handleCursorClick = () => {
    //deeplink to install MCP in Cursor
    window.location.href = `${process.env.NEXT_PUBLIC_CURSOR_MCP_DEEPLINK}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-900 p-4 lg:p-5 border border-slate-200 dark:border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <Code2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-800 dark:text-slate-200 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
              Add to IDE
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border p-4 gap-2"
        >
          <DropdownMenuLabel className="text-sm font-normal leading-snug">
            Code with our docs MCP server
            <Link
              href="https://www.inkeep.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              Powered by
              <Image
                src="assets/landing/inkeep-gray-monochrome.svg"
                alt=""
                aria-hidden="true"
                width={17}
                height={17}
                className="inline-block"
              />
              Inkeep
            </Link>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleCursorClick}
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Cursor</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Link
              href={`${process.env.NEXT_PUBLIC_TAMBO_DOCS_URL}/tambo-mcp-server#tab-vscode`}
              className="flex items-center justify-between"
            >
              <span>VS Code</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Link
              href={`${process.env.NEXT_PUBLIC_TAMBO_DOCS_URL}/tambo-mcp-server#tab-claude`}
              className="flex items-center justify-between"
            >
              <span>Claude (Desktop)</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Link
              href={`${process.env.NEXT_PUBLIC_TAMBO_DOCS_URL}/tambo-mcp-server#tab-windsurf`}
              className="flex items-center justify-between"
            >
              <span>Windsurf</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Link
              href={`${process.env.NEXT_PUBLIC_TAMBO_DOCS_URL}/tambo-mcp-server#tab-zed`}
              className="flex items-center justify-between"
            >
              <span>Zed</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
