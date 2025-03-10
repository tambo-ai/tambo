import * as React from "react"
import { cva, VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputFieldsVariants = cva(
  "w-full rounded-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "",
        solid: [
          "shadow-lg shadow-zinc-900/10 dark:shadow-zinc-900/20",
          "[&_input]:bg-zinc-50 [&_input]:dark:bg-zinc-900",
        ].join(" "),
        bordered: [
          "[&_input]:border-2",
          "[&_input]:border-zinc-200/40 [&_input]:dark:border-zinc-700/40",
        ].join(" "),
      },
      size: {
        default: "[&_input]:p-2",
        sm: "[&_input]:p-1 [&_input]:text-sm",
        lg: "[&_input]:p-3 [&_input]:text-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface Field {
  id: string
  type: 'text' | 'number' | 'email' | 'password'
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export interface InputFieldsProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof inputFieldsVariants> {
  fields: Field[]
}

const InputFields = React.forwardRef<HTMLDivElement, InputFieldsProps>(
  ({ className, variant, size, fields, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(inputFieldsVariants({ variant, size }), className)}
        {...props}
      >
        {fields.map((field) => (
          <div key={field.id} className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              id={field.id}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 
                       bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-400"
            />
          </div>
        ))}
      </div>
    )
  }
)
InputFields.displayName = "InputFields"

export { InputFields, inputFieldsVariants } 