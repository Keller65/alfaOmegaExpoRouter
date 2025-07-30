import { Tabs } from 'expo-router';
import ProtectedLayout from '../ProtectedLayout';
import { Platform } from 'react-native';

import HomeIcon from '@/assets/icons/HomeIcon';
import InvoicesIcon from '@/assets/icons/InvoicesIcon';
import SettingsIcon from '@/assets/icons/SettingsIcon';
import OrderIcon from '@/assets/icons/OrdeIcon'

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';

export default function Layout() {
  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <ProtectedLayout>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: "#000",
              headerShown: false,
              tabBarStyle: Platform.select({
                ios: {
                  position: 'absolute',
                },
                default: {},
              }),
            }}>
            <Tabs.Screen
              name="index"
              options={{
                title: 'Inicio',
                tabBarIcon: ({ color }) => <HomeIcon size={26} color={color} />,
              }}
            />
            <Tabs.Screen
              name="explore"
              options={{
                title: 'Pedidos',
                tabBarIcon: ({ color }) => <OrderIcon size={26} color={color} />,
              }}
            />

            <Tabs.Screen
              name="invoices"
              options={{
                title: 'Facturas',
                tabBarIcon: ({ color }) => <InvoicesIcon size={26} color={color} />,
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                title: 'Ajustes',
                tabBarIcon: ({ color }) => <SettingsIcon size={26} color={color} />,
              }}
            />
          </Tabs>
        </ProtectedLayout>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
