import * as React from "react"
import { cva, VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
// import { useHydra } from "@hydra-ai/react" // Uncomment when using Hydra

const messageVariants = cva(
  "flex",
  {
    variants: {
      variant: {
        default: "",
        solid: [
          "[&_div]:shadow",
          "[&_div]:shadow-zinc-900/10",
          "[&_div]:dark:shadow-zinc-900/20",
        ].join(" "),
        bordered: [
          "[&_div]:border",
          "[&_div]:border-border",
        ].join(" "),
      },
      align: {
        user: "justify-end",
        assistant: "justify-start"
      }
    },
    defaultVariants: {
      variant: "default",
      align: "user"
    }
  }
)

const bubbleVariants = cva(
  "relative inline-block rounded-lg px-3 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full",
  {
    variants: {
      role: {
        user: "bg-primary text-primary-foreground hover:bg-primary/90",
        assistant: "bg-muted text-foreground hover:bg-muted/90",
      }
    },
    defaultVariants: {
      role: "user"
    }
  }
)

// Remove this interface when using Hydra - it will use Hydra's Message type instead
export interface MessageProps {
  role: 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string }>
  variant?: VariantProps<typeof messageVariants>["variant"]
  className?: string
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, role, content, variant, ...props }, ref) => { 
    return (
      <div
        ref={ref}
        className={cn(messageVariants({ variant, align: role }), className)}
        {...props}
      >
        <div
          className={cn(
            bubbleVariants({ role })
          )}
        >
          {/* When using Hydra, uncomment this block and remove the simple content rendering below */}
          {/* {Array.isArray(content) ? (
            content.map((item, index) => (
              <div key={index}>
                {item.type === "text" 
                  ? item.text
                  : `[Unhandled ${item.type}]`}
              </div>
            ))
          ) : ( */}
            <p className="break-words whitespace-pre-wrap">{content as string}</p>
          {/* )} */}
        </div>
      </div>
    )
  }
)
Message.displayName = "Message"

export { Message, messageVariants } 