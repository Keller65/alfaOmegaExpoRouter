import PlusIcon from '@/assets/icons/PlusIcon';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { PaymentData } from '@/types/types';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const PAGE_SIZE = 20;

const Invoices = () => {
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<PaymentData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const salesPersonCode = user?.salesPersonCode;

  const formatMoney = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? Number(value) : value ?? 0;
    const safe = isNaN(Number(num)) ? 0 : Number(num);
    return safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchInvoices = useCallback(async () => {
    if (!salesPersonCode || loading || !hasMore) return;

    setLoading(true);
    try {
      const url = `${fetchUrl}/api/Payments/received/${salesPersonCode}?page=${page}&pageSize=${PAGE_SIZE}`;
      const response = await axios.get<PaymentData[]>(url);

      if (response.data.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setData(prev => [...prev, ...response.data]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [salesPersonCode, fetchUrl, page, loading, hasMore]);

  const handleRefresh = async () => {
    if (!salesPersonCode) return;

    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    try {
      const url = `${fetchUrl}/api/Payments/received/${salesPersonCode}?page=1&pageSize=${PAGE_SIZE}`;
      const response = await axios.get<PaymentData[]>(url);

      setData(response.data);
      if (response.data.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setPage(2);
    } catch (error) {
      console.error('Error refreshing invoices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const renderItem = ({ item }: { item: PaymentData }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/invoicesDetails',
          params: {
            item: JSON.stringify(item),
          },
        })
      }
      className="bg-white rounded-3xl mb-4 overflow-hidden border border-gray-200"
    >
      <View className="bg-blue-100 p-4 rounded-t-3xl">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center space-x-2">
            <View className="bg-yellow-300 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-blue-800 font-[Poppins-SemiBold]">
                {item.docNum}
              </Text>
            </View>
          </View>
          <View className="bg-blue-100 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-blue-800 font-[Poppins-SemiBold]">
              {new Date(item.docDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="w-[36px] h-[36px] bg-gray-800 rounded-full items-center justify-center">
            <MaterialCommunityIcons name="account-circle" size={30} color="#fde047" />
          </View>
          <View>
            <Text className="text-base font-[Poppins-Bold] text-gray-800">{item.cardName}</Text>
            <Text className="text-xs text-gray-700 font-[Poppins-Regular]">{item.cardCode}</Text>
          </View>
        </View>
      </View>

      <View className="bg-yellow-300 px-4 py-2 flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <FontAwesome name="credit-card" size={14} color="#374151" />
          <Text className="text-sm font-[Poppins-Regular] text-gray-700">
            {item.paymentMeans}
          </Text>
        </View>
        <Text className="text-sm font-[Poppins-SemiBold] text-gray-700">
          L. {formatMoney(item.total)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () =>
    loading ? (
      <View className="py-4">
        <ActivityIndicator size="small" color="#000" />
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-white px-4 relative">
      <View className="absolute bottom-8 right-8 gap-3 items-end z-10">
        <TouchableOpacity
          className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-yellow-300"
          onPress={() => router.push('/InvoiceClient')}
        >
          <PlusIcon color="black" />
        </TouchableOpacity>
      </View>

      <FlashList
        data={data}
        keyExtractor={(item) => item.docEntry.toString()}
        renderItem={renderItem}
        estimatedItemSize={120}
        onEndReached={fetchInvoices}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Invoices;