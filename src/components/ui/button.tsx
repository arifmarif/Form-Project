import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
    "disabled:pointer-events-none disabled:opacity-50",
    size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm",
    variant === "primary" && "bg-indigo-600 text-white hover:bg-indigo-500",
    variant === "secondary" && "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
    variant === "ghost" && "text-neutral-700 hover:bg-neutral-100",
    variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />;
}
