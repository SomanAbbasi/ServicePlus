import re
file_path = 'd:/serviceplus/frontend/src/routes/admin.plans.index.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(
    r'<Link\s+to="([^"]+)"\s+search=\{([^}]+)\}\s+className="[^"]+"\s*>\s*<Sliders[^>]+>\s*Edit Plan\s*</Link>',
    r'<ActionIconButton icon={Sliders} label="Edit Plan" action="edit" to="\1" search={\2} />',
    c
)
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(c)
