import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#141923] text-[#FAF5EA] border border-[#C9A24D]/40 shadow-sm hover:bg-[#1E2533] hover:border-[#C9A24D] active:scale-[0.99]",
        gold:
          "bg-gradient-to-r from-[#B4862C] via-[#CFA751] to-[#DFBC6F] text-[#11141B] shadow-sm hover:brightness-105 active:scale-[0.99]",
        emerald:
          "bg-[#0D6E52] text-white shadow-sm hover:bg-[#0A5942] active:scale-[0.99]",
        outline:
          "border border-[#DFD3BD] bg-[#FFFDF9] text-[#1E2430] shadow-xs hover:bg-[#F7F1E5] hover:border-[#C9A24D]",
        secondary:
          "bg-[#EDE5D5] text-[#262B36] hover:bg-[#E4D9C4]",
        ghost: "text-[#3D4350] hover:bg-[#EFE8DA] hover:text-[#141923]",
        destructive:
          "bg-red-700 text-white shadow-xs hover:bg-red-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
