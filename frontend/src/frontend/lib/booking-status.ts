export const BOOKING_STATUSES = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "ASSIGNING",
  "ASSIGNED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
  "PAYMENT_FAILED",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const CUSTOMER_CANCELLABLE: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ASSIGNING",
  "ASSIGNED",
  "RESCHEDULED",
];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  ASSIGNING: "Finding a professional",
  ASSIGNED: "Assigned",
  EN_ROUTE: "On the way",
  ARRIVED: "Arrived",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  RESCHEDULED: "Rescheduled",
  PAYMENT_FAILED: "Payment failed",
};
