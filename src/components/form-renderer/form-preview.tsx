"use client";

import { useState } from "react";
import { FormRenderer } from "@/components/form-renderer/form-renderer";
import { Button } from "@/components/ui/button";
import type { FormSchema, FormValues } from "@/lib/form-schema";
import { cn } from "@/lib/utils";

/**
 * Preview surface (PRD §58): the renderer at desktop, tablet and mobile widths
 * with the same validation, conditional logic and submit behaviour.
 */

const DEVICES = [
  { id: "desktop", label: "Desktop", width: "max-w-3xl" },
  { id: "tablet", label: "Tablet", width: "max-w-xl" },
  { id: "mobile", label: "Mobile", width: "max-w-sm" },
] as const;

type Device = (typeof DEVICES)[number]["id"];

export function FormPreview({
  schema,
  title,
  description,
}: {
  schema: FormSchema;
  title: string;
  description?: string;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const [resetKey, setResetKey] = useState(0);
  const [values, setValues] = useState<FormValues>({});

  const deviceWidth = DEVICES.find((entry) => entry.id === device)?.width ?? "max-w-3xl";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Preview device" className="flex gap-1">
          {DEVICES.map((entry) => (
            <Button
              key={entry.id}
              type="button"
              size="sm"
              variant={device === entry.id ? "primary" : "secondary"}
              onClick={() => setDevice(entry.id)}
            >
              {entry.label}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            setResetKey((current) => current + 1);
            setValues({});
          }}
        >
          Reset answers
        </Button>
        <span className="text-xs text-neutral-500">
          {Object.keys(values).length} answered
        </span>
      </div>

      <div className={cn("mx-auto w-full transition-all", deviceWidth)}>
        <FormRenderer
          key={resetKey}
          schema={schema}
          mode="preview"
          title={title}
          description={description}
          onValuesChange={setValues}
        />
      </div>
    </div>
  );
}