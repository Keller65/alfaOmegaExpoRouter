import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../context/auth';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { TextInput } from 'react-native';
import { useAppStore } from '@/state/index';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  const rawSearchText = useAppStore(state => state.rawSearchText);
  const setRawSearchText = useAppStore(state => state.setRawSearchText);
  const setDebouncedSearchText = useAppStore(state => state.setDebouncedSearchText);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(rawSearchText);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [rawSearchText, setDebouncedSearchText]);

  const clearSearch = () => {
    setRawSearchText('');
    // Al limpiar, también actualiza el debouncedSearchText inmediatamente
    setDebouncedSearchText('');
  };

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
    'Poppins-ExtraLight': require('../assets/fonts/Poppins-ExtraLight.ttf'),
    'Poppins-Thin': require('../assets/fonts/Poppins-Thin.ttf'),
    'Poppins-ThinItalic': require('../assets/fonts/Poppins-ThinItalic.ttf'),
    'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
    'Poppins-Black': require('../assets/fonts/Poppins-Black.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().then(() => setAppReady(true));
    }
  }, [fontsLoaded, fontError]);

  if (!appReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <BottomSheetModalProvider>
          <Stack
            screenOptions={{
              headerShown: true,
              headerStyle: { backgroundColor: '#fff' },
              headerShadowVisible: false,
              headerTitleStyle: {
                fontFamily: "Poppins-SemiBold"
              }
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="client" options={{ headerShown: true, headerTitle: 'Seleccionar Cliente' }} />
            <Stack.Screen name="order" options={{ headerShown: true, headerTitle: 'Detalles del Pedido' }} />

            <Stack.Screen
              name="shop"
              options={{
                headerShown: true,
                headerTitle: () => (
                  <View className='flex-row items-center bg-[#f0f0f0] rounded-[20px] relative'>
                    <TextInput
                      placeholder="Buscar Producto"
                      style={{
                        backgroundColor: '#f0f0f0',
                        paddingHorizontal: 18,
                        paddingVertical: 4,
                        borderRadius: 20,
                        width: 300,
                        height: 36,
                        fontSize: 14,
                        fontFamily: 'Poppins-Regular',
                        paddingRight: 30,
                      }}
                      placeholderTextColor="#888"
                      value={rawSearchText}
                      onChangeText={setRawSearchText}
                      clearButtonMode="never"
                    />
                    {rawSearchText.length > 0 && (
                      <TouchableOpacity
                        className='absolute right-2'
                        onPress={clearSearch}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={20} color="#888" />
                      </TouchableOpacity>
                    )}
                  </View>
                ),
              }}
            />
          </Stack>
        </BottomSheetModalProvider>
      </AuthProvider>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}