import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-[#DDD1BC] bg-white px-3.5 py-2 text-sm text-[#1B1F2A] placeholder:text-[#8E8677] focus:border-[#B8862D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/25 disabled:cursor-not-allowed disabled:bg-[#F5F0E6] disabled:opacity-60",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border border-[#DDD1BC] bg-white px-3.5 py-2 text-sm text-[#1B1F2A] placeholder:text-[#8E8677] focus:border-[#B8862D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/25 disabled:cursor-not-allowed disabled:bg-[#F5F0E6] disabled:opacity-60",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-xl border border-[#DDD1BC] bg-white px-3.5 py-2 text-sm text-[#1B1F2A] focus:border-[#B8862D] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/25 disabled:cursor-not-allowed disabled:bg-[#F5F0E6] disabled:opacity-60",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-[#5A5347]",
        className
      )}
      {...props}
    />
  );
}
