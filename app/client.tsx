import { useCallback, useEffect, useState, memo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import ClientIcon from '../assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAppStore } from '@/state/index';
import { Customer } from '@/types/types';
import { FlashList } from '@shopify/flash-list';

const ClientScreen = memo(() => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const setSelectedCustomer = useAppStore((state) => state.setSelectedCustomer);
  const FETCH_URL = process.env.EXPO_PUBLIC_API_URL + "/sap/customers/";

  useEffect(() => {
    if (!user?.salesPersonCode || !user?.token) {
      setLoading(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }

    setLoading(true);
    setError(null);

    axios.get(`${FETCH_URL}by-salesperson?slpCode=${user.salesPersonCode}&page=1&pageSize=20`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => {
        setCustomers(res.data.items || []);
        setFilteredCustomers(res.data.items || []);
        console.log('Clientes cargados:', res.data.items);
      })
      .catch((err) => {
        console.error('Error al cargar clientes:', err);
        setError(err.response?.data?.message || err.message || 'Error desconocido al cargar clientes.');
        setCustomers([]);
        setFilteredCustomers([]);
      })
      .finally(() => setLoading(false));
  }, [user?.salesPersonCode, user?.token]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    const lowerSearch = search.toLowerCase();
    setFilteredCustomers(
      customers.filter(
        (c) =>
          c.cardName.toLowerCase().includes(lowerSearch) ||
          c.cardCode.toLowerCase().includes(lowerSearch) ||
          (c.federalTaxID && c.federalTaxID.toLowerCase().includes(lowerSearch))
      )
    );
  }, [search, customers]);

  const handleCustomerPress = useCallback(
    async (customer: Customer) => {
      try {
        setSelectedCustomer(customer);
        console.log('Cliente seleccionado en Zustand:', customer);

        router.push({
          pathname: '/shop',
          params: {
            cardCode: customer.cardCode,
            priceListNum: customer.priceListNum
          },
        });
      } catch (err) {
        console.error('Error al navegar:', err);
        Alert.alert('Error de navegación', 'No se pudo abrir la pantalla de pedido. Por favor, inténtalo de nuevo.');
      }
    },
    [router, setSelectedCustomer]
  );

  const renderCustomerItem = useCallback(
    ({ item: customer }: { item: Customer }) => (
      <TouchableOpacity
        onPress={() => handleCustomerPress(customer)}
        className="flex-row items-center gap-3 px-4 my-2"
      >
        <View className="bg-[#fcde41] w-[50px] h-[50px] items-center justify-center rounded-full">
          <ClientIcon size={24} color="#000" />
        </View>

        <View className="flex-1 justify-center gap-2">
          <Text className="font-[Poppins-SemiBold] text-lg text-black tracking-[-0.3px] leading-4">
            {customer.cardName}
          </Text>

          <View className="flex-row gap-2">
            <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">
              Código: <Text className="font-[Poppins-Regular] tracking-[-0.3px]">{customer.cardCode}</Text>
            </Text>
            <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">
              RTN: <Text className="font-[Poppins-Regular] tracking-[-0.3px]">{customer.federalTaxID}</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleCustomerPress]
  );

  if (!user?.token) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-center text-red-500 text-base font-normal">No has iniciado sesión o tu sesión ha expirado.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="mt-3 text-gray-700 text-base font-normal">Cargando clientes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-red-500 text-base font-normal text-center mb-2">{error}</Text>
        <Text className="text-gray-500 text-sm text-center">Tu sesión ha expirado. Por favor, inicia sesión nuevamente</Text>
      </View>
    );
  }

  if (customers.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-gray-500 text-base font-normal text-center">No se encontraron clientes asociados a tu cuenta.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, código o RTN"
          className="border border-gray-300 rounded-full px-6 py-3 mb-2 text-base font-[Poppins-Regular] text-black"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlashList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.cardCode}
        estimatedItemSize={80}
        ListEmptyComponent={
          <View className="justify-center items-center py-10">
            <Text className="text-gray-500 text-base font-normal text-center">No se encontraron clientes con ese criterio.</Text>
          </View>
        }
      />
    </View>
  );
});

export default ClientScreen;
