import * as React from "react"
import { cva, VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chatThreadVariants = cva(
  "flex flex-col gap-4",
  {
    variants: {
      variant: {
        default: "",
        solid: [
          "[&_div[role='bubble']]:shadow",
          "[&_div[role='bubble']]:shadow-zinc-900/10",
          "[&_div[role='bubble']]:dark:shadow-zinc-900/20",
        ].join(" "),
        bordered: [
          "[&_div[role='bubble']]:border",
          "[&_div[role='bubble']]:border-zinc-200/40",
          "[&_div[role='bubble']]:dark:border-zinc-700/40",
        ].join(" "),
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

const bubbleVariants = cva(
  "relative inline-block rounded-lg px-3 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium",
  {
    variants: {
      role: {
        user: "bg-zinc-900 text-zinc-100 hover:bg-zinc-700",
        assistant: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
      }
    },
    defaultVariants: {
      role: "user"
    }
  }
)

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatThreadProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: Message[]
  variant?: VariantProps<typeof chatThreadVariants>["variant"]
}

const ChatThread = React.forwardRef<HTMLDivElement, ChatThreadProps>(
  ({ className, messages, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(chatThreadVariants({ variant }), className)}
        {...props}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "animate-in fade-in-0 slide-in-from-bottom-2",
              "duration-200 ease-in-out",
              message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
            )}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="flex flex-col gap-1.5 max-w-[85%]">
              <div className={cn(
                "flex",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
                <div 
                  role="bubble"
                  className={cn(
                    bubbleVariants({ role: message.role }),
                    "max-w-full"
                  )}
                >
                  <p className="break-words whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
              <span className={cn(
                "text-[11px] font-medium select-none",
                "text-zinc-400/40 dark:text-zinc-500/40",
                "group-hover:text-zinc-600/60 dark:group-hover:text-zinc-500/60",
                message.role === 'user' ? 'text-right mr-1' : 'text-left ml-1'
              )}>
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }
)
ChatThread.displayName = "ChatThread"

export { ChatThread, bubbleVariants } 