import { Injectable } from '@nestjs/common';

export const SERVICE_FEE_PCT = 5;
export const TAX_PCT = 0;

export interface PricingService {
  booking_type: string;
  base_price: number;
  hourly_rate: number | null;
  materials_price: number;
  extra_professional_pct: number;
}

export interface PricingLine {
  label: string;
  unit_price: number;
  quantity: number;
}

export interface PricingCoupon {
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount: number | null;
  min_amount: number;
}

export interface PricingInput {
  service: PricingService;
  hours: number;
  professionals: number;
  materials: boolean;
  items?: PricingLine[];
  addons?: PricingLine[];
  coupon?: PricingCoupon | null;
  citySurchargePct?: number;
  frequencyDiscountPct?: number;
}

export interface PriceBreakdown {
  subtotal: number;
  items: number;
  addons: number;
  materials: number;
  surcharge: number;
  discount: number;
  frequencyDiscount: number;
  fees: number;
  tax: number;
  total: number;
  couponCode: string | null;
}

export interface FrequencyOption {
  key: string;
  label: string;
  discountPct: number;
  badge?: string;
  popular?: boolean;
}

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { key: 'one_time', label: 'One Time', discountPct: 0 },
  { key: 'biweekly', label: 'Every 2 Weeks', discountPct: 5, badge: '5% Off' },
  { key: 'weekly', label: 'Once a Week', discountPct: 10, badge: '10% Off', popular: true },
  {
    key: 'multi_weekly',
    label: 'Multiple Times a Week',
    discountPct: 25,
    badge: 'Up to 25% off',
  },
];

export function frequencyDiscountPct(key: string | null | undefined): number {
  return FREQUENCY_OPTIONS.find((o) => o.key === key)?.discountPct ?? 0;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class PricingServiceEngine {
  calculateBookingPrice(input: PricingInput): PriceBreakdown {
    const { service, hours, professionals, materials } = input;
    const items = input.items ?? [];
    const addons = input.addons ?? [];

    let base = 0;
    if (service.booking_type === 'hourly') {
      const rate = service.hourly_rate ?? service.base_price;
      base = rate * Math.max(1, hours);
      const extras = Math.max(0, professionals - 1);
      base +=
        ((rate * Math.max(1, hours) * service.extra_professional_pct) / 100) *
        extras;
    } else if (service.booking_type === 'variant') {
      base = 0;
    } else {
      base = service.base_price * Math.max(1, professionals);
    }

    const itemsTotal = items.reduce(
      (sum, l) => sum + l.unit_price * l.quantity,
      0,
    );
    const addonsTotal = addons.reduce(
      (sum, l) => sum + l.unit_price * l.quantity,
      0,
    );
    const materialsTotal = materials ? service.materials_price : 0;

    const subtotal = base + itemsTotal;
    const preDiscount = subtotal + addonsTotal + materialsTotal;
    const surcharge = round(
      (preDiscount * (input.citySurchargePct ?? 0)) / 100,
    );

    let discount = 0;
    const coupon = input.coupon;
    if (coupon && preDiscount + surcharge >= coupon.min_amount) {
      discount =
        coupon.discount_type === 'percentage'
          ? ((preDiscount + surcharge) * coupon.discount_value) / 100
          : coupon.discount_value;
      if (coupon.max_discount != null)
        discount = Math.min(discount, coupon.max_discount);
      discount = Math.min(discount, preDiscount + surcharge);
    }

    const frequencyDiscount = round(
      ((preDiscount + surcharge - discount) *
        Math.max(0, input.frequencyDiscountPct ?? 0)) /
        100,
    );

    const taxable = preDiscount + surcharge - discount - frequencyDiscount;
    const fees = round((taxable * SERVICE_FEE_PCT) / 100);
    const tax = round((taxable * TAX_PCT) / 100);
    const total = Math.max(0, round(taxable + fees + tax));

    return {
      subtotal: round(base),
      items: round(itemsTotal),
      addons: round(addonsTotal),
      materials: round(materialsTotal),
      surcharge,
      discount: round(discount),
      frequencyDiscount,
      fees,
      tax,
      total,
      couponCode: discount > 0 && coupon ? coupon.code : null,
    };
  }
}
