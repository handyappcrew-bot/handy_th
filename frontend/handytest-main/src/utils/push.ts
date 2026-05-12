import { PushNotifications } from '@capacitor/push-notifications';

export async function initPush() {
  await PushNotifications.requestPermissions();

  await PushNotifications.register();

  PushNotifications.addListener('registration', token => {
    console.log('FCM 토큰:', token.value);
  });

  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('푸시 수신:', notification);
  });
}
