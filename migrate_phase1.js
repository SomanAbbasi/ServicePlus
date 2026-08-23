const fs = require('fs');
const path = require('path');

const files = [
  'd:/serviceplus/frontend/src/routes/admin.services.index.tsx',
  'd:/serviceplus/frontend/src/routes/admin.categories.index.tsx',
  'd:/serviceplus/frontend/src/routes/admin.addons.index.tsx',
  'd:/serviceplus/frontend/src/routes/admin.coupons.index.tsx',
  'd:/serviceplus/frontend/src/routes/admin.plans.index.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Imports
  content = content.replace(
    /import { ErrorState, TableSkeleton } from "@\/frontend\/components\/admin\/shell";/,
    'import { ErrorState, TableSkeleton, PageHeader, PageActions, StatusBadge, ActionIconButton } from "@/frontend/components/admin/shell";'
  );

  // 5. Typography
  content = content.replace(/font-extrabold/g, 'font-bold');
  content = content.replace(/font-black/g, 'font-bold');

  // 4. Colors
  // Buttons using cyan classes
  content = content.replace(/bg-cyan-600 hover:bg-cyan-700 text-white/g, '');
  content = content.replace(/bg-cyan-600 hover:bg-cyan-700/g, '');
  content = content.replace(/text-cyan-600 hover:text-cyan-700/g, 'text-primary hover:text-primary/80');
  content = content.replace(/text-cyan-600/g, 'text-primary');

  // Breadcrumbs text-cyan-600 was replaced by text-primary above.

  // 6. Pagination
  content = content.replace(
    /\`h-8 w-8 p-0 text-xs font-bold rounded-lg \$\{\s*p === currentPage \? "[^"]+" : "text-slate-600"\s*\}\`/g,
    '`h-8 w-8 p-0 text-xs font-bold rounded-lg ${p === currentPage ? "" : "text-slate-600"}`'
  );

  fs.writeFileSync(file, content);
}
console.log("Done phase 1");
