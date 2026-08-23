import re

def fix_edit_links(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Edit Link
    content = re.sub(
        r'<Link\s+to="([^"]+)"\s+search=\{([^}]+)\}\s+title="([^"]+)"\s+className="text-primary hover:scale-125 transition-transform inline-flex items-center justify-center"\s*>\s*<Sliders className="size-4 text-primary stroke-\[2\.5\]" />\s*</Link>',
        r'<ActionIconButton icon={Sliders} label="\3" action="edit" to="\1" search={\2} />',
        content
    )
    
    # Plans Edit Link
    content = re.sub(
        r'<Link\s+to="([^"]+)"\s+search=\{([^}]+)\}\s+className="inline-flex items-center justify-center border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 rounded-md text-xs font-bold transition-colors"\s*>\s*<Sliders className="size-3\.5 me-1 text-slate-500" /> Edit Plan\s*</Link>',
        r'<ActionIconButton icon={Sliders} label="Edit Plan" action="edit" to="\1" search={\2} />',
        content
    )
    
    # Plans Delete button
    content = re.sub(
        r'<Button\s+type="button"\s+variant="ghost"\s+size="sm"\s+onClick=\{([^}]+)\}\s+className="h-8 text-xs text-rose-600 hover:bg-rose-50"\s*>\s*<Trash2 className="size-3\.5" />\s*</Button>',
        r'<ActionIconButton icon={Trash2} label="Delete Plan" action="delete" onClick={\1} />',
        content
    )
    
    # Formatting fixes: remove newline in StatusBadge
    content = content.replace("status={isActive\n ? \"Activated\" : \"Deactivated\"}", "status={isActive ? \"Activated\" : \"Deactivated\"}")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    'd:/serviceplus/frontend/src/routes/admin.services.index.tsx',
    'd:/serviceplus/frontend/src/routes/admin.categories.index.tsx',
    'd:/serviceplus/frontend/src/routes/admin.addons.index.tsx',
    'd:/serviceplus/frontend/src/routes/admin.coupons.index.tsx',
    'd:/serviceplus/frontend/src/routes/admin.plans.index.tsx'
]

for f in files:
    fix_edit_links(f)
    print("Fixed edit links in", f)
