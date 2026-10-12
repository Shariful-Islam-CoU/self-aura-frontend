"use client";

// Reusable settings section: a titled card with optional description, body and
// footer (typically a SettingsSaveBar). Used by every settings section.

import type { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function SettingsSection({ title, description, children, footer }: SettingsSectionProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {footer && <div className="border-t px-6 py-4">{footer}</div>}
    </Card>
  );
}