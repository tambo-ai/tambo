"use client";

import { Button } from "@/components/ui/button";
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

export function AddToIdeDropdown() {
  const handleCursorClick = () => {
    //deeplink to install MCP in Cursor
    window.location.href = `${process.env.NEXT_PUBLIC_CURSOR_MCP_DEEPLINK}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 hover:opacity-80 p-4 border border-slate-200 dark:border-slate-700 max-w-fit shadow-sm hover:shadow-md transition-shadow transition-opacity duration-300"
        >
          <Code2 className="h-4 w-4" />
          Add to IDE
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 gap-2"
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
  );
}
