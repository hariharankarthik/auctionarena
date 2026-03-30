import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 motion-reduce:transition-none motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-900/35 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-lg hover:shadow-emerald-800/25",
        secondary: "bg-neutral-800/90 text-neutral-100 ring-1 ring-neutral-700/80 hover:bg-neutral-700/90 hover:ring-neutral-600",
        outline:
          "border border-neutral-600/90 bg-neutral-950/40 text-neutral-100 hover:border-emerald-500/40 hover:bg-emerald-950/20",
        ghost: "text-neutral-300 hover:bg-neutral-900 hover:text-white",
        destructive: "bg-gradient-to-b from-red-600 to-red-700 text-white shadow-md shadow-red-950/40 hover:from-red-500 hover:to-red-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
