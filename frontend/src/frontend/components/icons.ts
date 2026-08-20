import {
  Armchair,
  Bed,
  Bug,
  Car,
  Building2,
  CalendarCheck,
  Droplets,
  Footprints,
  HeartPulse,
  Home,
  Package,
  Paintbrush,
  PawPrint,
  Scissors,
  ShieldCheck,
  Shirt,
  Snowflake,
  Sparkles,
  SprayCan,
  Stethoscope,
  SquareStack,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Armchair,
  Bed,
  Bug,
  Building2,
  CalendarCheck,
  Droplets,
  HeartPulse,
  Home,
  Package,
  Paintbrush,
  Scissors,
  Snowflake,
  Sparkles,
  SquareStack,
  Wrench,
};

export function iconByName(name: string | null | undefined): LucideIcon {
  return MAP[name ?? ""] ?? Sparkles;
}

export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80";

const KEYWORD_ICONS: Array<[RegExp, LucideIcon]> = [
  [/doctor|nurse|health|medical|iv |physio/i, Stethoscope],
  [/laundry|dry clean|iron|wash/i, Shirt],
  [/handyman|repair|maintenance|plumb|electric|fix/i, Wrench],
  [/pest|bug|cockroach|termite/i, Bug],
  [/deep clean/i, SprayCan],
  [/salon|hair|nail|beauty|spa|wax|massage/i, Scissors],
  [/ac |air condition|a\/c/i, Snowflake],
  [/sofa|mattress|carpet|curtain|upholstery/i, Armchair],
  [/paint/i, Paintbrush],
  [/move|packer|shifting/i, Package],
  [/disinfect|sanitiz|sanitis/i, ShieldCheck],
  [/pet|dog|cat/i, PawPrint],
  [/car |vehicle|auto/i, Car],
  [/shoe|bag|leather/i, Footprints],
  [/water tank|pool|tank/i, Droplets],
  [/clean/i, Sparkles],
];

export function iconForService(name: string, fallback?: string | null): LucideIcon {
  for (const [re, icon] of KEYWORD_ICONS) if (re.test(name)) return icon;
  return iconByName(fallback);
}
