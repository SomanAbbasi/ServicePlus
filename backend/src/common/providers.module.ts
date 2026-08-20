import { Module } from '@nestjs/common';
import { MockOtpProvider, OTP_PROVIDER } from './providers/otp.provider';
import {
  MockPaymentProvider,
  PAYMENT_PROVIDER,
} from './providers/payment.provider';
import { STORAGE_PROVIDER } from './providers/storage.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';
import {
  MockNotificationProvider,
  NOTIFICATION_PROVIDER,
} from './providers/notification.provider';

function createStorageProvider() {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'r2') {
    return R2StorageProvider;
  }
  return LocalStorageProvider;
}

@Module({
  providers: [
    { provide: OTP_PROVIDER, useClass: MockOtpProvider },
    { provide: PAYMENT_PROVIDER, useClass: MockPaymentProvider },
    { provide: STORAGE_PROVIDER, useClass: createStorageProvider() },
    { provide: NOTIFICATION_PROVIDER, useClass: MockNotificationProvider },
  ],
  exports: [
    OTP_PROVIDER,
    PAYMENT_PROVIDER,
    STORAGE_PROVIDER,
    NOTIFICATION_PROVIDER,
  ],
})
export class ProvidersModule {}
