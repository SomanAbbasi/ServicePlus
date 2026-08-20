export interface FrequencyOption {
  key: string;
  label: string;
  discountPct: number;
  badge?: string;
  popular?: boolean;
}

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { key: "one_time", label: "One Time", discountPct: 0 },
  { key: "biweekly", label: "Every 2 Weeks", discountPct: 5, badge: "5% Off" },
  { key: "weekly", label: "Once a Week", discountPct: 10, badge: "10% Off", popular: true },
  {
    key: "multi_weekly",
    label: "Multiple Times a Week",
    discountPct: 25,
    badge: "Up to 25% off",
  },
];
