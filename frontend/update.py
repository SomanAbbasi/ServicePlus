import re

def update_reports():
    p = r'd:\serviceplus\frontend\src\routes\admin.reports.tsx'
    with open(p, 'r', encoding='utf-8') as f: content = f.read()
    if 'CHART_PRIMARY' not in content:
        content = content.replace('import { Bar,', 'import { CHART_PRIMARY } from \'@/frontend/lib/design-tokens\';\nimport { Bar,')
    content = content.replace('#12B8E8', 'CHART_PRIMARY')
    
    content = re.sub(r'<StatsCard label="Bookings" value=\{report\.bookings\.length\}\s*/>', '<StatsCard label="Bookings" value={report.bookings.length} accent="default" />', content)
    content = re.sub(r'<StatsCard label="Completed" value=\{report\.completed\}\s*/>', '<StatsCard label="Completed" value={report.completed} accent="success" />', content)
    content = re.sub(r'<StatsCard label="Cancelled" value=\{report\.cancelled\}\s*/>', '<StatsCard label="Cancelled" value={report.cancelled} accent="destructive" />', content)
    content = re.sub(r'<StatsCard label="Revenue" value=\{formatMoney\(report\.revenue\)\}\s*/>', '<StatsCard label="Revenue" value={formatMoney(report.revenue)} accent="primary" />', content)
    
    with open(p, 'w', encoding='utf-8') as f: f.write(content)

def update_customers():
    p = r'd:\serviceplus\frontend\src\routes\admin.customers.tsx'
    with open(p, 'r', encoding='utf-8') as f: content = f.read()
    if 'ActionIconButton' not in content:
        content = content.replace('StatusBadge,', 'StatusBadge,\n  ActionIconButton,')
    if 'import { Eye }' not in content:
        content = content.replace('import { Sheet', 'import { Eye } from \'lucide-react\';\nimport { Sheet')

    btn = r'<Button variant="ghost" size="sm" onClick=\{.*?\}\>\s*View\s*</Button>'
    repl = r'<ActionIconButton icon={Eye} label="View" action="view" onClick={() => setOpenId(r.id)} />'
    content = re.sub(btn, repl, content, flags=re.DOTALL)
    with open(p, 'w', encoding='utf-8') as f: f.write(content)

def update_support():
    p = r'd:\serviceplus\frontend\src\routes\admin.support.tsx'
    with open(p, 'r', encoding='utf-8') as f: content = f.read()
    if 'ActionIconButton' not in content:
        content = content.replace('StatusBadge,', 'StatusBadge,\n  ActionIconButton,')
    if 'import { Eye }' not in content:
        content = content.replace('import { Sheet', 'import { Eye } from \'lucide-react\';\nimport { Sheet')
    btn = r'<Button variant="ghost" size="sm" onClick=\{.*?\}\>\s*Open\s*</Button>'
    repl = r'<ActionIconButton icon={Eye} label="View" action="view" onClick={() => setOpenId(r.id)} />'
    content = re.sub(btn, repl, content, flags=re.DOTALL)
    with open(p, 'w', encoding='utf-8') as f: f.write(content)

def update_calendar():
    p = r'd:\serviceplus\frontend\src\routes\admin.calendar.tsx'
    with open(p, 'r', encoding='utf-8') as f: content = f.read()
    
    if 'PageHeader' not in content:
        content = content.replace('import { ErrorState, TableSkeleton }', 'import { ErrorState, TableSkeleton, PageHeader, StatusBadge }')
    
    new_header = """<PageHeader
        title="Calendar"
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Calendar" }]}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-400"></div> Pending</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Inprocess</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Completed</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Cancelled</div>
            </div>
            <Button asChild className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/admin/bookings">View Booking</Link>
            </Button>
          </div>
        }
      />"""
      
    content = re.sub(r'<div>\s*<div className="text-sm text-slate-500 mb-1">Dashboard / Calendar</div>.*?</Button>\s*</div>\s*</div>\s*</div>', new_header, content, flags=re.DOTALL)
    
    content = re.sub(r'<div className=\{cn\("px-2 py-1 text-xs rounded-full font-medium", getStatusColor\(b\.status\)\)\}>\s*\{b\.status\}\s*</div>', '<StatusBadge status={b.status} />', content)

    with open(p, 'w', encoding='utf-8') as f: f.write(content)

update_reports()
update_customers()
update_support()
update_calendar()
print('Done')
