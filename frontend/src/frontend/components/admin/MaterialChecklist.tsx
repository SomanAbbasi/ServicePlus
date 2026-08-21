import React from "react";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { Sparkles } from "lucide-react";

export const AVAILABLE_MATERIALS = [
  "Glass Cleaner",
  "Mops",
  "Microfiber Cloths",
  "Squeegees",
  "Toilet Brushes",
  "Rubber Gloves",
  "Sanitizers",
  "HEPA Vacuum Cleaner",
  "Floor Polish & Buffer",
  "Degreaser & Oven Cleaner",
  "Trash Bags & Liners",
  "Bucket & Wringer Set",
];

interface MaterialChecklistProps {
  selectedMaterials?: string[];
  selected?: string[];
  onChange: (materials: string[]) => void;
}

export function MaterialChecklist({
  selectedMaterials,
  selected,
  onChange,
}: MaterialChecklistProps) {
  const currentSelected = Array.isArray(selectedMaterials)
    ? selectedMaterials
    : Array.isArray(selected)
    ? selected
    : [];

  const handleToggle = (item: string, checked: boolean) => {
    if (checked) {
      onChange([...currentSelected, item]);
    } else {
      onChange(currentSelected.filter((m) => m !== item));
    }
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) onChange([...AVAILABLE_MATERIALS]);
    else onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-cyan-600" /> Allocated Materials & Equipment
          </h4>
          <p className="text-xs text-slate-500">Check the supplies carried by this professional/team.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSelectAll(true)}
            className="text-[11px] font-semibold text-cyan-600 hover:underline cursor-pointer"
          >
            Select All
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => handleSelectAll(false)}
            className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
        {AVAILABLE_MATERIALS.map((mat) => {
          const checked = currentSelected.includes(mat);
          return (
            <label
              key={mat}
              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                checked
                  ? "border-cyan-400 bg-cyan-50/70 text-cyan-950 font-semibold shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(c) => handleToggle(mat, Boolean(c))}
              />
              <span className="truncate select-none">{mat}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
