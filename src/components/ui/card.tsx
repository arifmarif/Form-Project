import { cn } from "@/lib/utils";
import type { FormStatus } from "@/generated/prisma/enums";

export const STATUS_LABELS: Record<FormStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

const STATUS_STYLES: Record<FormStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-amber-100 text-amber-700",
};

export function StatusBadge({ status, className }: { status: FormStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-neutral-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
}

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
