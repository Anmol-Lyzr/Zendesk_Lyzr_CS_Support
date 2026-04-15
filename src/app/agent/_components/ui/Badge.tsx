import { cn } from "@/lib/cn";

export function Badge({
  className,
  variant = "neutral",
  children,
}: {
  className?: string;
  variant?: "neutral" | "info" | "warning" | "danger" | "success";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        variant === "neutral" && "border-slate-200 bg-white text-slate-700",
        variant === "info" && "border-blue-200 bg-blue-50 text-blue-700",
        variant === "warning" &&
          "border-amber-200 bg-amber-50 text-amber-800",
        variant === "danger" && "border-rose-200 bg-rose-50 text-rose-700",
        variant === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        className
      )}
    >
      {children}
    </span>
  );
}

