import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth, AuthProvider } from '@/context/auth';
import { View, Text, Platform } from 'react-native';

import ProtectedLayout from '../ProtectedLayout';

import HomeIcon from '@/assets/icons/HomeIcon';
import InvoicesIcon from '@/assets/icons/InvoicesIcon';
import SettingsIcon from '@/assets/icons/SettingsIcon';
import OrderIcon from '@/assets/icons/OrdeIcon';
import ClientIcon from '@/assets/icons/ClientIcon';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import IndexScreen from './index';
import ExploreScreen from './explore';
import InvoicesScreen from './invoices';
import SettingsScreen from './settings';

const Drawer = createDrawerNavigator();

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <AuthProvider>
          <ProtectedLayout>
            <DrawerWithCustomContent />
          </ProtectedLayout>
        </AuthProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function DrawerWithCustomContent() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: '#000',
        drawerStyle: Platform.select({
          ios: { backgroundColor: '#fff' },
          android: {},
        }),
        headerStyle: {
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontFamily: 'Poppins-SemiBold',
          letterSpacing: -0.6,
        },
        drawerLabelStyle: {
          fontFamily: 'Poppins-Medium',
          fontSize: 16,
          letterSpacing: -0.6,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="index"
        component={IndexScreen}
        options={{
          title: 'Inicio',
          drawerIcon: ({ color }) => <HomeIcon size={26} color={color} />,
        }}
      />
      <Drawer.Screen
        name="explore"
        component={ExploreScreen}
        options={{
          title: 'Pedidos',
          drawerIcon: ({ color }) => <OrderIcon size={26} color={color} />,
        }}
      />
      <Drawer.Screen
        name="invoices"
        component={InvoicesScreen}
        options={{
          title: 'Cobros',
          drawerIcon: ({ color }) => <InvoicesIcon size={26} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        component={SettingsScreen}
        options={{
          title: 'Ajustes',
          drawerIcon: ({ color }) => <SettingsIcon size={26} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

function CustomDrawerContent(props: any) {
  const { user } = useAuth();

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View className="bg-[#fcde41] w-[50px] h-[50px] items-center justify-center rounded-full">
          <ClientIcon size={30} color="#000" />
        </View>

        <View>
          <Text className="font-[Poppins-SemiBold] text-lg">
            {user?.fullName ?? 'Usuario'}
          </Text>
          <Text className="font-[Poppins-Regular] text-sm text-neutral-500">
            Codigo: {user?.employeeCode ?? 'correo@ejemplo.com'}
          </Text>
        </View>
      </View>

      {/* Lista de rutas */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}
