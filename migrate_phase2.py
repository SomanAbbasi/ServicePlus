import re
import glob

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace Breadcrumbs & Header Actions with PageHeader
    header_pattern = re.compile(
        r'<div>\s*<div className="flex items-center gap-1\.5 text-xs text-slate-400 font-medium mb-1">.*?<Link to="([^"]+)".*?>\s*(.*?)\s*</Link>.*?<span>/</span>.*?<span className="text-slate-600">(.*?)</span>.*?(?:<span>/</span>.*?<span className="text-slate-600">(.*?)</span>.*?)?</div>\s*<div className="flex flex-wrap items-center justify-between gap-3">(?:.*?<h1.*?>(.*?)</h1>.*?|<div.*?>\s*<h1.*?>(.*?)</h1>\s*<p.*?>(.*?)</p>\s*</div>\s*).*?(?:<Link to="([^"]+)">\s*<Button.*?>.*?<Plus.*?/>\s*(.*?)\s*</Button>\s*</Link>|<Button.*?asChild.*?>\s*<Link to="([^"]+)".*?>.*?<Plus.*?/>\s*(.*?)\s*</Link>\s*</Button>)\s*</div>\s*</div>',
        re.DOTALL
    )

    def header_replacer(match):
        to1, lbl1, lbl2, lbl3, title1, title2, desc, add_to1, add_lbl1, add_to2, add_lbl2 = match.groups()
        
        # Determine breadcrumbs
        breadcrumbs = f'{{ label: "{lbl1.strip()}", to: "{to1}" }}, {{ label: "{lbl2.strip()}" }}'
        if lbl3:
            breadcrumbs = f'{{ label: "{lbl1.strip()}", to: "{to1}" }}, {{ label: "{lbl2.strip()}" }}, {{ label: "{lbl3.strip()}" }}'
        
        title = (title1 or title2).strip()
        desc_prop = f'\n        description="{desc.strip()}"' if desc else ""
        add_to = add_to1 or add_to2
        add_lbl = add_lbl1 or add_lbl2

        actions_str = f'''
        actions={{
          <PageActions
            onSearchToggle={{() => setIsSearchOpen((v) => !v)}}
            isSearchOpen={{isSearchOpen}}
            addNewLabel="{add_lbl.strip()}"
            addNewTo="{add_to}"
          />
        }}'''
        
        # If there is no isSearchOpen state, remove those props
        if "isSearchOpen" not in content:
            actions_str = f'''
        actions={{
          <PageActions
            addNewLabel="{add_lbl.strip()}"
            addNewTo="{add_to}"
          />
        }}'''

        return f'''<PageHeader
        title="{title}"{desc_prop}
        breadcrumbs={{[{breadcrumbs}]}}{actions_str}
      />'''

    content = header_pattern.sub(header_replacer, content)

    # 2. Replace StatusBadges
    status_pattern = re.compile(
        r'<span\s+className=\{`inline-flex items-center.*?text-xs font-semibold.*?\b(isActive)\b.*?(?:bg-emerald-100.*?|bg-rose-100.*?)\`\}\s*>\s*\{.*?\? "(.*?)" : "(.*?)"\}\s*</span>',
        re.DOTALL
    )
    def status_replacer(match):
        is_active_var = match.group(1)
        active_label = match.group(2)
        inactive_label = match.group(3)
        return f'<StatusBadge status={{{is_active_var} ? "{active_label}" : "{inactive_label}"}} />'

    content = status_pattern.sub(status_replacer, content)

    # Replace specific status badge in admin.plans.index.tsx
    plan_status_pattern = re.compile(
        r'<button\s+type="button"\s+onClick=\{([^}]+)\}\s+className=\{`px-2 py-0\.5 rounded-full text-\[10px\] font-bold transition-colors \$\{\s*([^ }]+)\s*\?\s*"[^"]+"\s*:\s*"[^"]+"\s*\}\`\}\s*>\s*\{[^}]+\}\s*</button>',
        re.DOTALL
    )
    def plan_status_replacer(match):
        onclick = match.group(1)
        is_active = match.group(2)
        return f'<button type="button" onClick={{{onclick}}}><StatusBadge status={{{is_active} ? "Active" : "Inactive"}} /></button>'
    content = plan_status_pattern.sub(plan_status_replacer, content)

    # Category status badge
    cat_status_pattern = re.compile(
        r'<button\s+type="button"\s+onClick=\{([^}]+)\}\s+className=\{`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition-all hover:opacity-85 \$\{\s*([^ }]+)\s*\?\s*"[^"]+"\s*:\s*"[^"]+"\s*\}\`\}\s*>\s*\{[^}]+\}\s*</button>',
        re.DOTALL
    )
    def cat_status_replacer(match):
        onclick = match.group(1)
        is_active = match.group(2)
        return f'<button type="button" onClick={{{onclick}}}><StatusBadge status={{{is_active} ? "Activated" : "Deactivated"}} /></button>'
    content = cat_status_pattern.sub(cat_status_replacer, content)

    # 3. Replace Row Action Icon Buttons
    
    # Toggle status button
    toggle_pattern = re.compile(
        r'<button\s+type="button"\s+onClick=\{([^}]+)\}\s+title=\{(.*?)\}\s+className="[^"]+"\s*>\s*\{([^ \n]+)\s*\?\s*\(\s*<[^>]+>\s*\)\s*:\s*\(\s*<[^>]+>\s*\)\s*\}\s*</button>',
        re.DOTALL
    )
    def toggle_replacer(match):
        onclick = match.group(1)
        title = match.group(2)
        is_active = match.group(3)
        return f'<ActionIconButton icon={{{is_active} ? X : Check}} label={{{title}}} action={{{is_active} ? "delete" : "view"}} onClick={{{onclick}}} />'
    content = toggle_pattern.sub(toggle_replacer, content)

    # Edit link button
    edit_pattern = re.compile(
        r'<Link\s+to="([^"]+)"\s+search=\{([^}]+)\}\s+title="([^"]+)"\s+className="[^"]+"\s*>\s*<Sliders[^>]*/>\s*</Link>',
        re.DOTALL
    )
    def edit_replacer(match):
        to_link = match.group(1)
        search = match.group(2)
        title = match.group(3)
        return f'<ActionIconButton icon={{Sliders}} label="{title}" action="edit" to="{to_link}" search={{{search}}} />'
    content = edit_pattern.sub(edit_replacer, content)

    # Delete button (if standard button)
    delete_btn_pattern = re.compile(
        r'<button\s+type="button"\s+onClick=\{([^}]+)\}\s+title="([^"]+)"\s+className="[^"]+"\s*>\s*<Trash2[^>]*/>\s*</button>',
        re.DOTALL
    )
    def delete_btn_replacer(match):
        onclick = match.group(1)
        title = match.group(2)
        return f'<ActionIconButton icon={{Trash2}} label="{title}" action="delete" onClick={{{onclick}}} />'
    content = delete_btn_pattern.sub(delete_btn_replacer, content)
    
    # Plans Edit button 
    plan_edit_pattern = re.compile(
        r'<Link\s+to="([^"]+)"\s+search=\{([^}]+)\}\s+className="[^"]+"\s*>\s*<Sliders[^>]*/>\s*Edit Plan\s*</Link>',
        re.DOTALL
    )
    def plan_edit_replacer(match):
        to_link = match.group(1)
        search = match.group(2)
        return f'<ActionIconButton icon={{Sliders}} label="Edit Plan" action="edit" to="{to_link}" search={{{search}}} />'
    content = plan_edit_pattern.sub(plan_edit_replacer, content)

    # 4. Remove ErrorState, TableSkeleton from non-shell imports and leave them in shell import
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
    process_file(f)
    print("Processed", f)
