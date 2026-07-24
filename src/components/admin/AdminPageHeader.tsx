import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="admin-page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="admin-eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="admin-title text-2xl sm:text-3xl truncate">{title}</h1>
        {description && (
          <p className="text-sm text-[color:var(--admin-muted-fg)] mt-1.5 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
