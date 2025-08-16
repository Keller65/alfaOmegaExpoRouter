import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';

export function useExpoPushToken() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('No se concedieron permisos para notificaciones push');
          return;
        }
        const tokenData = await Notifications.getExpoPushTokenAsync();
        setExpoPushToken(tokenData.data);
      } else {
        alert('Debes usar un dispositivo físico para notificaciones push');
      }
    }
    registerForPushNotificationsAsync();
  }, []);

  return expoPushToken;
}