export const OTP_PROVIDER = 'OTP_PROVIDER';

export interface OtpProvider {
  send(phone: string, code: string): Promise<void>;
}

export class MockOtpProvider implements OtpProvider {
  async send(phone: string, code: string): Promise<void> {
    console.info(`[MockOtpProvider] OTP for ${phone}: ${code}`);
  }
}
