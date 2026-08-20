export const BOOKING_STATUSES = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'ASSIGNING',
  'ASSIGNED',
  'EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED',
  'PAYMENT_FAILED',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  CONFIRMED: ['ASSIGNING', 'ASSIGNED', 'RESCHEDULED', 'CANCELLED'],
  ASSIGNING: ['ASSIGNED', 'CANCELLED', 'RESCHEDULED'],
  ASSIGNED: ['EN_ROUTE', 'RESCHEDULED', 'CANCELLED', 'ASSIGNING'],
  EN_ROUTE: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  RESCHEDULED: ['CONFIRMED', 'ASSIGNING', 'ASSIGNED', 'CANCELLED'],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid booking status change: ${from} to ${to}`);
  }
}

export const CUSTOMER_CANCELLABLE: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'ASSIGNING',
  'ASSIGNED',
  'RESCHEDULED',
];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  ASSIGNING: 'Finding a professional',
  ASSIGNED: 'Assigned',
  EN_ROUTE: 'On the way',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
  PAYMENT_FAILED: 'Payment failed',
};
