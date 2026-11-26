import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-[#C9A24D]/40 bg-[#141923] text-[#F4E6C3]",
        navy: "border-[#C9A24D]/45 bg-[#F8F1E1] text-[#6B4F14]",
        emerald: "border-emerald-300/70 bg-emerald-50 text-[#0D6E52]",
        amber: "border-amber-300/80 bg-amber-50 text-amber-900",
        slate: "border-[#DDD2BE] bg-[#F2ECE0] text-[#454139]",
        destructive: "border-red-200 bg-red-50 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
