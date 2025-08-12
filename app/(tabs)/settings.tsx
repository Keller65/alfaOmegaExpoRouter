import { useAuth } from '@/context/auth';
import api from '@/lib/api';
import { useAppStore } from '@/state';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const Settings = () => {
  const { logout, user } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [syncTime, setSyncTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // operaciones generales (logout / clear)
  const [syncLoading, setSyncLoading] = useState(false); // estado específico para sincronización
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const { fetchUrl } = useAppStore();
  const API_BASE_URL = fetchUrl;

  useEffect(() => {
    const loadData = async () => {
      const bioEnabled = await AsyncStorage.getItem('biometricEnabled');
      const lastSync = await AsyncStorage.getItem('lastSyncTime');
      if (bioEnabled) setBiometricEnabled(bioEnabled === 'true');
      if (lastSync) setSyncTime(lastSync);

      checkLocationServicesStatus();
    };
    loadData();
  }, []);

  const checkLocationServicesStatus = async () => {
    let enabled = await Location.hasServicesEnabledAsync();
    setLocationServicesEnabled(enabled);
    if (!enabled) {
      Alert.alert(
        'Ubicación Desactivada',
        'Por favor, activa los servicios de ubicación de tu dispositivo para usar todas las funciones.'
      );
    }
  };

  const handleClearData = async () => {
    Alert.alert('Confirmar', '¿Deseas borrar toda la data local?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, borrar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await AsyncStorage.clear();
          // await AsyncStorage.multiRemove(['biometricUser', 'user', 'user_acept_start']);
          setLoading(false);
          Alert.alert('Éxito', 'Los datos se han eliminado correctamente. Reinicia la app para que los cambios se apliquen.');
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Confirmar', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await logout();
          setLoading(false);
        },
      },
    ]);
  };

  const fetchPaymentAccounts = useCallback(async () => {
    if (syncLoading) return; // evitar doble tap
    setSyncLoading(true);
    try {
      // Agregamos un timestamp para forzar bypass de caché (aunque axios-cache-interceptor tenga data guardada).
      const withTs = (path: string) => `${API_BASE_URL}${path}${path.includes('?') ? '&' : '?'}_ts=${Date.now()}`;

      const urls = [
        withTs('/api/BankAccounts/PayCheque'),
        withTs('/api/BankAccounts/PayEfectivo'),
        withTs('/api/BankAccounts/PayTranferencia'),
        withTs('/api/BankAccounts/PayCreditCards'),
        withTs('/sap/items/categories')
      ];

      const results = await Promise.allSettled(urls.map(url => api.get(url, {
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        // Forzamos no usar caché para esta petición puntual.
        cache: {
          ttl: 0, // sin vida útil
          interpretHeader: false,
        },
      })));

      const chequeRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const efectivoRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const transfRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const creditCardRes = results[3].status === 'fulfilled' ? results[3].value : null;

      if (!chequeRes || !efectivoRes || !transfRes || !creditCardRes) {
        throw new Error('No se pudieron obtener los datos de una o más cuentas.');
      }

      const nowStr = new Date().toLocaleString();
      setSyncTime(nowStr);
      await AsyncStorage.setItem('lastSyncTime', nowStr);
      console.log('Información de pago sincronizada (forzada)');
      Alert.alert('Sincronización completa', 'Los datos se han actualizado.');
    } catch (err) {
      console.error('Error al cargar datos de cuentas:', err);
      Alert.alert('Error', 'No se pudieron sincronizar los datos. Intenta nuevamente.');
    } finally {
      setSyncLoading(false);
    }
  }, [API_BASE_URL, user?.token, syncLoading]);

  return (
    <ScrollView className="flex-1 bg-white">

      <View className="p-4">
        <Text className="text-xl font-[Poppins-SemiBold] text-gray-800 mb-3">Información del Sistema</Text>
        <Text className="text-gray-600 text-base font-[Poppins-Regular] tracking-[-0.3px] mb-1">Versión: {Constants.manifest?.version || 'Desconocida'}</Text>
        <Text className="text-gray-600 text-base font-[Poppins-Regular] tracking-[-0.3px] mb-1">Dispositivo: {Device.deviceName || 'No detectado'}</Text>
        <Text className="text-gray-600 text-base font-[Poppins-Regular] tracking-[-0.3px] mb-1">Plataforma: {Device.osName}</Text>
        <Text className="text-gray-600 text-base font-[Poppins-Regular] tracking-[-0.3px]">Ubicación: {locationServicesEnabled ? 'Activa' : 'Desactivada'}</Text>
      </View>

      <View className="h-px bg-gray-200 mx-4" />

      <View className="p-4">
        <View className="flex-row items-center gap-2 mb-3">
          <Feather name="settings" size={20} color="#4B5563" />
          <Text className="text-xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-800">Avanzado</Text>
        </View>

        {syncLoading && (
          <Text className="text-xs text-gray-500 mt-1 text-start font-[Poppins-Regular]">Obteniendo datos más recientes...</Text>
        )}
        {syncTime && !syncLoading && (
          <Text className="text-xs text-gray-500 mt-1 text-start font-[Poppins-Regular]">Última sincronización: {syncTime}</Text>
        )}

        <TouchableOpacity
          onPress={fetchPaymentAccounts}
          disabled={syncLoading}
          className={`bg-yellow-300 border border-yellow-300 rounded-full py-3 my-2 h-[50px] items-center justify-center ${syncLoading ? 'opacity-70' : ''}`}
        >
          <View className="flex-row items-center justify-center gap-2">
            {syncLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Feather name="refresh-cw" size={16} color="#000" />
            )}
            <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px]">
              {syncLoading ? 'Sincronizando datos...' : 'Sincronizar información'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClearData}
          className="bg-red-50 h-[50px] items-center justify-center border border-red-600 rounded-full py-3 my-2"
        >
          <View className="flex-row items-center justify-center gap-2">
            <Feather name="trash-2" size={16} color="#dc2626" />
            <Text className="text-red-600 font-[Poppins-SemiBold] tracking-[-0.3px]">Borrar Data Local</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 h-[50px] items-center justify-center border border-red-600 rounded-full py-3 my-2"
        >
          <View className="flex-row items-center justify-center gap-2">
            <Feather name="log-out" size={16} color="#dc2626" />
            <Text className="text-red-600 font-[Poppins-SemiBold] tracking-[-0.3px]">Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="h-px bg-gray-200 mx-4" />

      <View className="px-4 py-6">
        <Text className="text-center text-gray-400 text-sm font-[Poppins-Regular] tracking-[-0.3px]">
          © {new Date().getFullYear()} Grupo Alfa & Omega S. de R. L. de C. V. - Todos los derechos reservados
        </Text>
      </View>
    </ScrollView>
  );
};

export default Settings;