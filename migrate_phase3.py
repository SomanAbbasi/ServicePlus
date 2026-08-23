import re
import os

files = [
    'd:/serviceplus/frontend/src/routes/admin.services.index.tsx',
    'd:/serviceplus/frontend/src/routes/admin.categories.index.tsx',
    'd:/serviceplus/frontend/src/routes/admin.addons.index.tsx',
    'd:/serviceplus/frontend/src/routes/admin.coupons.index.tsx',
    'd:/serviceplus/frontend/src/routes/admin.plans.index.tsx'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    if "PageHeader" not in content:
        content = re.sub(
            r'import \{ (.*?) \} from "@/frontend/components/admin/shell";',
            lambda m: f'import {{ {m.group(1)}, PageHeader, PageActions, StatusBadge, ActionIconButton, downloadCsv }} from "@/frontend/components/admin/shell";',
            content
        )

    # 2. Page Header
    # Match the whole <div> block that contains breadcrumbs and h1
    header_regex = re.compile(
        r'<div>\s*<div className="flex items-center gap-1\.5 text-xs text-slate-400 font-medium mb-1">.*?<Link to="([^"]+)".*?>\s*(.*?)\s*</Link>.*?<span>/</span>.*?<span className="text-slate-600">(.*?)</span>(?:.*?<span>/</span>.*?<span className="text-slate-600">(.*?)</span>)?\s*</div>\s*<div className="flex flex-wrap items-center justify-between gap-3">(.*?)</div>\s*</div>',
        re.DOTALL
    )

    def header_replacer(match):
        to1 = match.group(1)
        lbl1 = match.group(2)
        lbl2 = match.group(3)
        lbl3 = match.group(4)
        rest = match.group(5)
        
        # Determine breadcrumbs
        breadcrumbs = f'{{ label: "{lbl1.strip()}", to: "{to1}" }}, {{ label: "{lbl2.strip()}" }}'
        if lbl3:
            breadcrumbs += f', {{ label: "{lbl3.strip()}" }}'
            
        # Find Title
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', rest)
        title = title_match.group(1) if title_match else "Management"
        
        # Find description
        desc_match = re.search(r'<p[^>]*>(.*?)</p>', rest)
        desc_prop = f'\n        description="{desc_match.group(1)}"' if desc_match else ""
        
        # Find Add new button
        add_match = re.search(r'<Link to="([^"]+)">(?:\s*<Button.*?>)?.*?<Plus[^>]*/>\s*(.*?)\s*(?:</Button>\s*)?</Link>', rest, re.DOTALL)
        if not add_match:
            add_match = re.search(r'<Button.*?>\s*<Link to="([^"]+)".*?>.*?<Plus[^>]*/>\s*(.*?)\s*</Link>\s*</Button>', rest, re.DOTALL)
        
        add_to = add_match.group(1) if add_match else ""
        add_lbl = add_match.group(2) if add_match else ""
        
        has_search = "isSearchOpen" in content
        if has_search:
            actions_str = f'''
        actions={{
          <PageActions
            onSearchToggle={{() => setIsSearchOpen((v) => !v)}}
            isSearchOpen={{isSearchOpen}}
            addNewLabel="{add_lbl.strip()}"
            addNewTo="{add_to}"
          />
        }}'''
        else:
            if add_to:
                actions_str = f'''
        actions={{
          <PageActions
            addNewLabel="{add_lbl.strip()}"
            addNewTo="{add_to}"
          />
        }}'''
            else:
                actions_str = ""

        return f'''<PageHeader
        title="{title}"{desc_prop}
        breadcrumbs={{[{breadcrumbs}]}}{actions_str}
      />'''

    content = header_regex.sub(header_replacer, content)

    # 3. Status Badges
    content = re.sub(
        r'<span\s+className=\{`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold \$\{\s*([^ }]+)\s*\?\s*"[^"]+"\s*:\s*"[^"]+"\s*\}\`\}\s*>\s*\{[^}]+\}\s*</span>',
        r'<StatusBadge status={\1 ? "Activated" : "Deactivated"} />',
        content
    )
    
    # Plans Status badge
    content = re.sub(
        r'<button\s+type="button"\s+onClick=\{([^}]+)\}\s+className=\{`px-2 py-0\.5 rounded-full text-\[10px\] font-bold transition-colors \$\{\s*([^ }]+)\s*\?\s*"[^"]+"\s*:\s*"[^"]+"\s*\}\`\}\s*>\s*\{[^}]+\}\s*</button>',
        r'<button type="button" onClick={\1}><StatusBadge status={\2 ? "Active" : "Inactive"} /></button>',
        content
    )
    
    # Categories Status badge
    content = re.sub(
        r'<button\s+type="button"\s+onClick=\{([^}]+)\}\s+className=\{`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition-all hover:opacity-85 \$\{\s*([^ }]+)\s*\?\s*"[^"]+"\s*:\s*"[^"]+"\s*\}\`\}\s*>\s*\{[^}]+\}\s*</button>',
        r'<button type="button" onClick={\1}><StatusBadge status={\2 ? "Activated" : "Deactivated"} /></button>',
        content
    )

    # 4. Action Icon Buttons
    # Delete / deactivate button (toggle)
    content = re.sub(
        r'<button\s+type="button"\s+onClick=\{([^}]+)\}\s+title=\{(.*?)\}\s+className="text-rose-500 hover:scale-125 transition-transform"\s*>\s*\{([^ ]+)\s*\?\s*\(\s*<X[^>]*/>\s*\)\s*:\s*\(\s*<Check[^>]*/>\s*\)\s*\}\s*</button>',
        r'<ActionIconButton icon={\3 ? X : Check} label={\2} action={\3 ? "delete" : "view"} onClick={\1} />',
        content
    )
    
    # Simple Delete button
    content = re.sub(
        r'<button\s+type="button"\s+onClick=\{([^}]+)\}\s+title="([^"]+)"\s+className="text-rose-500 hover:scale-125 transition-transform"\s*>\s*<Trash2[^>]*/>\s*</button>',
        r'<ActionIconButton icon={Trash2} label="\2" action="delete" onClick={\1} />',
        content
    )
    
    # Edit Link
    content = re.sub(
        r'<Link\s+to="([^"]+)"\s+search=\{([^}]+)\}\s+title="([^"]+)"\s+className="text-cyan-600 hover:scale-125 transition-transform inline-flex items-center justify-center"\s*>\s*<Sliders[^>]*/>\s*</Link>',
        r'<ActionIconButton icon={Sliders} label="\3" action="edit" to="\1" search={\2} />',
        content
    )

    # Plans edit link
    content = re.sub(
        r'<Link\s+to="([^"]+)"\s+search=\{([^}]+)\}\s+className="inline-flex items-center justify-center border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 rounded-md text-xs font-bold transition-colors"\s*>\s*<Sliders[^>]*/>\s*Edit Plan\s*</Link>',
        r'<ActionIconButton icon={Sliders} label="Edit Plan" action="edit" to="\1" search={\2} />',
        content
    )
    
    # 5. Buttons and Colors
    content = re.sub(r'bg-cyan-600 hover:bg-cyan-700 text-white\s*', '', content)
    content = re.sub(r'bg-cyan-600 hover:bg-cyan-700\s*', '', content)
    content = re.sub(r'text-cyan-600 hover:text-cyan-700', 'text-primary hover:text-primary/80', content)
    content = re.sub(r'text-cyan-600', 'text-primary', content)
    content = re.sub(r'border-cyan-600', 'border-primary', content)
    content = re.sub(r'bg-cyan-50/40', 'bg-primary/10', content)
    
    # 6. Typography
    content = content.replace("font-extrabold", "font-bold")
    content = content.replace("font-black", "font-bold")
    
    # 7. Pagination Buttons
    content = re.sub(
        r'`h-8 w-8 p-0 text-xs font-bold rounded-lg \$\{\s*([^ ]+)\s*===\s*currentPage \? "bg-cyan-600 text-white hover:bg-cyan-700" : "text-slate-600"\s*\}`',
        r'`h-8 w-8 p-0 text-xs font-bold rounded-lg ${ \1 === currentPage ? "" : "text-slate-600" }`',
        content
    )
    
    # Also for buttons that lost className because of replacing bg-cyan-600 hover:bg-cyan-700 text-white
    content = content.replace('className="font-bold text-xs h-9 px-5 rounded-lg shadow-sm"', 'className="font-bold text-xs h-9 px-5 rounded-lg shadow-sm"')

    # Fix Button variant missing for primary
    # They should just work since variant="default" is standard for Button

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Migration script completed.")
