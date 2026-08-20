import {
  Armchair,
  Bed,
  Bug,
  Car,
  Building2,
  CalendarCheck,
  Droplets,
  Flower2,
  FlaskConical,
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
  TestTube,
  User,
  Wrench,
  Wind,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Armchair,
  Bed,
  Bug,
  Building2,
  CalendarCheck,
  Droplets,
  Flower2,
  FlaskConical,
  Footprints,
  HeartPulse,
  Home,
  Package,
  Paintbrush,
  Scissors,
  Snowflake,
  Sparkles,
  SquareStack,
  TestTube,
  User,
  Wrench,
  Wind,
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
  [/salon|hair|nail|beauty|wax|massage/i, Scissors],
  [/spa|facial|body scrub/i, Flower2],
  [/ac |air condition|a\/c/i, Snowflake],
  [/sofa|mattress|carpet|curtain|upholstery/i, Armchair],
  [/paint/i, Paintbrush],
  [/move|packer|shifting/i, Package],
  [/disinfect|sanitiz|sanitis/i, ShieldCheck],
  [/pet|dog|cat/i, PawPrint],
  [/car |vehicle|auto/i, Car],
  [/shoe|bag|leather/i, Footprints],
  [/water tank|pool|tank/i, Droplets],
  [/pcr|swab|covid/i, FlaskConical],
  [/lab|blood|test|sample/i, TestTube],
  [/groom|barber|shave/i, User],
  [/clean/i, Sparkles],
];

export function iconForService(name: string, fallback?: string | null): LucideIcon {
  for (const [re, icon] of KEYWORD_ICONS) if (re.test(name)) return icon;
  return iconByName(fallback);
}
