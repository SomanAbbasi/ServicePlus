import os

filepath = r'd:\serviceplus\frontend\src\frontend\components\admin\shell.tsx'
with open(filepath, 'r', encoding='utf-8') as f: content = f.read()

# 1. Update PageHeader to take breadcrumbs
content = content.replace('export function PageHeader({\n  title,\n  description,\n  actions,\n}: {\n  title: string;\n  description?: string;\n  actions?: React.ReactNode;\n}) {', 
'''export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
}) {''')

content = content.replace('return (\n    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">', 
'''return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="w-full text-sm text-muted-foreground mb-1">
          {breadcrumbs.map((b, i) => (
            <span key={i}>
              {b.to ? <a href={b.to} className="hover:underline">{b.label}</a> : b.label}
              {i < breadcrumbs.length - 1 && " / "}
            </span>
          ))}
        </div>
      )}''')

# 2. Add PageActions
page_actions_code = '''
import { Button } from "@/frontend/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Search, Download, Plus } from "lucide-react";

export function PageActions({
  onSearchToggle,
  isSearchOpen,
  onExport,
  addNewLabel,
  addNewTo,
}: {
  onSearchToggle?: () => void;
  isSearchOpen?: boolean;
  onExport?: () => void;
  addNewLabel?: string;
  addNewTo?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {onSearchToggle && (
        <Button
          type="button"
          variant={isSearchOpen ? "default" : "outline"}
          onClick={onSearchToggle}
          className={`font-bold text-xs h-9 sm:h-10 px-4 rounded-xl shadow-2xs transition-all ${
            isSearchOpen
              ? "bg-primary text-primary-foreground"
              : "border-border text-foreground hover:bg-muted"
          }`}
        >
          <Search className="size-3.5 me-1.5" /> Search
        </Button>
      )}
      {onExport && (
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          className="border-border text-foreground hover:bg-muted font-bold text-xs h-9 sm:h-10 px-4 rounded-xl shadow-2xs"
        >
          <Download className="size-3.5 me-1.5" /> Export
        </Button>
      )}
      {addNewLabel && addNewTo && (
        <Button
          asChild
          className="font-bold text-xs h-9 sm:h-10 px-5 rounded-xl shadow-sm"
        >
          <Link to={addNewTo as any}>
            <Plus className="size-3.5 me-1.5" /> {addNewLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
'''

# 3. Add ActionIconButton
action_icon_code = '''
export function ActionIconButton({
  icon: Icon,
  label,
  action,
  onClick,
  to,
  search,
}: {
  icon: LucideIcon;
  label: string;
  action: string;
  onClick?: () => void;
  to?: string;
  search?: any;
}) {
  const content = (
    <Icon className="size-4 stroke-[2.5]" />
  );
  const className = `hover:scale-125 transition-transform inline-flex items-center justify-center p-1 ` + (
    action === 'delete' ? 'text-destructive' : 
    action === 'edit' ? 'text-primary' : 
    action === 'view' ? 'text-blue-500' :
    'text-muted-foreground hover:text-foreground'
  );

  if (to) {
    return (
      <Link to={to as any} search={search} title={label} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} title={label} className={className}>
      {content}
    </button>
  );
}
'''

content += page_actions_code + action_icon_code

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated shell.tsx')
