const fs = require('fs');

const files = [
  'src/routes/admin.users.index.tsx',
  'src/routes/admin.staff.index.tsx',
  'src/routes/admin.professionals.index.tsx',
  'src/routes/admin.supervisors.index.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  // 1. ActionIconButtons
  // Replace individual buttons inside `<div className="flex items-center justify-center gap-2">` and similar wrappers
  const btnToggleStatus = /<button[^>]+onClick=\{\(\)\s*=>\s*handle(OpenAction|ToggleStatus)[^>]+title=\{[^}]+\}[^>]+>\s*\{([^}]+\?.*?X.*?Check.*?)\}\s*<\/button>/g;
  const btnEditLink = /<Link\s+to="([^"]+)"\s+search=\{\{\s*id:\s*([^ }]+)\s*\}\}\s+title="([^"]+)"[^>]+>\s*<Sliders[^>]+>\s*<\/Link>/g;
  const btnInfo = /<button[^>]+onClick=\{\(\)\s*=>\s*handleOpenAction\(([^,]+),\s*"info"\)\}[^>]+title="([^"]+)"[^>]+>\s*<Eye[^>]+>\s*<\/button>|<button[^>]+onClick=\{\(\)\s*=>\s*handleOpenAction\(([^,]+),\s*"info"\)\}[^>]+title="([^"]+)"[^>]+>\s*<Glasses[^>]+>\s*<\/button>/g;
  const btnPassword = /<button[^>]+onClick=\{\(\)\s*=>\s*handleOpenAction\(([^,]+),\s*"password"\)\}[^>]+title="([^"]+)"[^>]+>\s*<KeyRound[^>]+>\s*<\/button>|<button[^>]+onClick=\{\(\)\s*=>\s*handleOpenAction\(([^,]+),\s*"password"\)\}[^>]+title="([^"]+)"[^>]+>\s*<Lock[^>]+>\s*<\/button>/g;
  const btnDelete = /<button[^>]+onClick=\{\(\)\s*=>\s*handleOpenAction\(([^,]+),\s*"delete"\)\}[^>]+title="([^"]+)"[^>]+>\s*<Trash2[^>]+>\s*<\/button>|<button[^>]+onClick=\{\(\)\s*=>\s*handleDelete(Staff)?\(([^)]+)\)\}[^>]*>\s*(?:<Trash2[^>]+>\s*.*?)?<\/button>/g;
  const btnSendCreds = /<button[^>]+onClick=\{\(\)\s*=>\s*handleOpenAction\(([^,]+),\s*"send_credentials"\)\}[^>]+title="([^"]+)"[^>]+>\s*<Send[^>]+>\s*<\/button>/g;

  content = content.replace(btnToggleStatus, (match) => {
    if (content.includes("handleOpenAction(pro, \"toggle_status\")") && match.includes("pro,")) {
        return `<ActionIconButton icon={isActivated ? X : Check} label={isActivated ? "Deactivate" : "Activate"} action={isActivated ? "toggle_off" : "toggle_on"} onClick={() => handleOpenAction(pro, "toggle_status")} />`;
    }
    // we just fallback
    return match;
  });

  // Since regex on JSX is flaky, let's write a targeted function to string replace standard blocks for each file
  fs.writeFileSync(f, content);
  console.log('Processed', f);
});
