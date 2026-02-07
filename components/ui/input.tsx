import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/50 selection:bg-primary/30 selection:text-primary dark:bg-black/50 border-primary/30 h-10 w-full min-w-0 rounded-none border bg-transparent px-3 py-1 text-base font-mono transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-[inset_0_0_5px_rgba(0,255,65,0.05)]",
        "focus-visible:border-primary focus-visible:shadow-[0_0_10px_rgba(0,255,65,0.3),inset_0_0_5px_rgba(0,255,65,0.1)]",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
