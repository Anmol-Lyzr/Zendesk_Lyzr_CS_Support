import * as React from "react";
import { cn } from "@/lib/cn";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-8 px-3" : "h-9 px-3.5",
        variant === "primary" &&
          "border-transparent bg-[var(--z-brand)] text-white hover:bg-[color-mix(in_srgb,var(--z-brand)_85%,black)]",
        variant === "secondary" &&
          "border-[var(--z-border)] bg-white text-slate-900 hover:bg-slate-50",
        variant === "ghost" &&
          "border-transparent bg-transparent text-slate-700 hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}

