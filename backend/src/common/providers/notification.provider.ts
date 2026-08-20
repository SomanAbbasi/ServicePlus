export const NOTIFICATION_PROVIDER = 'NOTIFICATION_PROVIDER';

export interface NotificationProvider {
  send(input: {
    channel: 'push' | 'sms' | 'email';
    to: string | null;
    event: string;
    title: string;
    body: string;
  }): Promise<void>;
}

export class MockNotificationProvider implements NotificationProvider {
  async send(input: {
    channel: string;
    to: string | null;
    event: string;
    title: string;
    body: string;
  }): Promise<void> {
    console.info(
      `[MockNotificationProvider] ${input.channel} -> ${input.to ?? '-'}: ${input.title}`,
    );
  }
}
