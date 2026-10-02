import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900",
        "placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1",
        "focus-visible:outline-indigo-600 disabled:bg-neutral-100",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900",
        "placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1",
        "focus-visible:outline-indigo-600 disabled:bg-neutral-100",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-neutral-800", className)}
      {...props}
    />
  );
}

export function FieldError({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1.5 text-sm text-red-600", className)} role="alert" {...props} />
  );
}

export function FormBanner({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        tone === "error" && "border-red-200 bg-red-50 text-red-700",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "info" && "border-indigo-200 bg-indigo-50 text-indigo-800",
      )}
    >
      {children}
    </div>
  );
}
