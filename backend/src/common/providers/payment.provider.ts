export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface PaymentIntent {
  reference: string;
  status: 'PAID' | 'FAILED';
}

export interface PaymentProvider {
  charge(input: {
    amount: number;
    method: string;
    bookingNumber: string;
  }): Promise<PaymentIntent>;
}

export class MockPaymentProvider implements PaymentProvider {
  async charge({
    amount,
    method,
    bookingNumber,
  }: {
    amount: number;
    method: string;
    bookingNumber: string;
  }): Promise<PaymentIntent> {
    console.info(
      `[MockPaymentProvider] ${method} charge of ${amount} for ${bookingNumber}`,
    );
    if (method === 'cash') {
      return { reference: `cash_${bookingNumber}`, status: 'PAID' };
    }
    return { reference: `mock_${Date.now().toString(36)}`, status: 'PAID' };
  }
}
