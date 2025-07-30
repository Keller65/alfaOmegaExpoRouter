import CartIcon from '@/assets/icons/CartIcon';
import MinusIcon from '@/assets/icons/MinusIcon';
import PlusIcon from '@/assets/icons/PlusIcon';
import TrashIcon from '@/assets/icons/TrashIcon';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state/index';
import { OrderDataType } from '@/types/types';
import { Feather, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetFlatList, BottomSheetFooter, BottomSheetFooterProps, BottomSheetModal, } from '@gorhom/bottom-sheet';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import '../../global.css';
import BottomSheetCart from '@/components/BottomSheetCart/page'

interface CartItemType {
  itemCode: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  tiers: {
    qty: number;
    price: number;
    percent: number;
    expiry: string;
  }[];
}

interface CartItemProps {
  item: CartItemType;
  onUpdateQty: (code: string, qty: number) => void;
  onRemove: (code: string, name: string) => void;
}

const snapPoints: string[] = ['60%', '85%'];

const areEqual = (prev: CartItemProps, next: CartItemProps) =>
  prev.item.itemCode === next.item.itemCode &&
  prev.item.quantity === next.item.quantity;

const CartItem = memo(({ item, onUpdateQty, onRemove }: CartItemProps) => {
  const removeRequested = useRef(false);

  const effectivePrice = useMemo(() => {
    const applicableTiers = item.tiers
      ?.filter(t => item.quantity >= t.qty)
      .sort((a, b) => b.qty - a.qty);
    return applicableTiers?.[0]?.price ?? item.unitPrice;
  }, [item.tiers, item.quantity]);

  const subtotal = useMemo(() => effectivePrice * item.quantity, [effectivePrice, item.quantity]);

  const handleChange = useCallback((type: 'add' | 'sub') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newQty = type === 'add' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
    onUpdateQty(item.itemCode, newQty);
  }, [item, onUpdateQty]);

  const handleRemove = useCallback(() => {
    if (removeRequested.current) return;
    removeRequested.current = true;
    onRemove(item.itemCode, item.itemName);
  }, [item, onRemove]);

  return (
    <View className="mb-3 border-b pb-3 border-gray-200 px-4">
      <View className="flex-row gap-4 items-center">
        <View className="size-[100px] bg-gray-200 rounded-lg items-center justify-center">
          <Text className="text-gray-400">Imagen</Text>
        </View>

        <View className="flex-1">
          <Text className="font-[Poppins-SemiBold] tracking-[-0.3px]" numberOfLines={2}>
            {item.itemName.toLowerCase()}
          </Text>

          <View className="flex-row items-center my-2 gap-2">
            <TouchableOpacity
              onPress={() => handleChange('sub')}
              className="bg-gray-200 p-2 rounded-full"
              disabled={item.quantity <= 1}
            >
              <MinusIcon size={16} color={item.quantity <= 1 ? "#ccc" : "#000"} />
            </TouchableOpacity>

            <TextInput
              className="border border-gray-300 rounded-md px-2 py-1 text-center w-[50px] text-black"
              keyboardType="numeric"
              value={String(item.quantity)}
              onChangeText={(text) => {
                const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(num)) onUpdateQty(item.itemCode, Math.max(1, num));
              }}
              maxLength={3}
            />

            <TouchableOpacity
              onPress={() => handleChange('add')}
              className="bg-gray-200 p-2 rounded-full"
            >
              <PlusIcon size={16} />
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-[Poppins-Regular] text-gray-600">
            Precio: L. {effectivePrice.toFixed(2)}
          </Text>
          <Text className="text-sm font-[Poppins-SemiBold] mt-1">
            Total: L. {subtotal.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRemove}
          className="p-2 rounded-full bg-red-100 self-start"
        >
          <TrashIcon size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );
}, areEqual);

const EmptyCart: React.FC<{ onClose: () => void; onAddProducts: () => void }> = ({ onClose, onAddProducts }) => (
  <View className="flex-1 items-center justify-center pb-20 px-4">
    <View className="bg-gray-100 p-6 rounded-full mb-4">
      <CartIcon size={32} color="#999" />
    </View>
    <Text className="text-gray-500 text-lg font-medium mb-2 text-center">
      Tu carrito está vacío
    </Text>
    <Text className="text-gray-400 text-center mb-6">
      Añade productos para continuar con tu compra
    </Text>
    <TouchableOpacity
      onPress={() => {
        onClose();
        onAddProducts();
      }}
      className="px-6 py-3 bg-black rounded-full"
      activeOpacity={0.7}
    >
      <Text className="text-white font-semibold">Explorar productos</Text>
    </TouchableOpacity>
  </View>
);

export default function PedidosScreen() {
  const router = useRouter();
  const products = useAppStore((s) => s.products);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeProduct = useAppStore((s) => s.removeProduct);
  const clearCart = useAppStore((s) => s.clearCart);
  const customerSelected = useAppStore((s) => s.selectedCustomer);
  const setLastOrderDocEntry = useAppStore((s) => s.setLastOrderDocEntry);
  const docEntry = useAppStore((s) => s.lastOrderDocEntry);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { user } = useAuth();
  const token = user?.token || '';
  const [orderData, setOrderData] = useState<OrderDataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const FETCH_URL = process.env.EXPO_PUBLIC_API_URL + "/sap/quotations";
  const FETCH_URL_CREATE_ORDER = process.env.EXPO_PUBLIC_API_URL + "/sap/orders";

  console.log(FETCH_URL)

  const fetchOrders = useCallback(async (docEntryToFetch: string | number) => {
    if (!docEntryToFetch) {
      setOrderData(null);
      return;
    }
    setIsRefreshing(true);
    try {
      const res = await axios.get(`${FETCH_URL}/${docEntryToFetch}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setOrderData(res.data as OrderDataType);
    } catch (err) {
      console.error('Error al obtener órdenes:', err);
      Alert.alert('Error', 'No se pudieron obtener las órdenes. Intenta nuevamente.');
      setOrderData(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [token]);

  const handleSubmitOrder = useCallback(async () => {
    if (!customerSelected || products.length === 0) {
      Alert.alert('Error', 'Faltan datos para enviar el pedido.');
      return;
    }

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Tegucigalpa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const [{ value: year }, , { value: month }, , { value: day }] = formatter.formatToParts(now);
    const hondurasDate = `${year}-${month}-${day}`;

    const lines = products.map(p => {
      const applicableTiers = p.tiers
        ?.filter(t => p.quantity >= t.qty)
        .sort((a, b) => b.qty - a.qty);
      const price = applicableTiers?.[0]?.price ?? p.unitPrice;

      return {
        itemCode: p.itemCode,
        quantity: p.quantity,
        priceList: p.unitPrice,
        priceAfterVAT: price,
        taxCode: p.taxType,
      };
    });

    const payload = {
      cardCode: customerSelected.cardCode,
      docDate: hondurasDate,
      docDueDate: hondurasDate,
      comments: 'Pedido desde app móvil',
      lines,
    };

    console.log(payload)

    try {
      setIsLoading(true);
      const res = await axios.post(FETCH_URL_CREATE_ORDER, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      Alert.alert('Éxito', 'Pedido enviado correctamente.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeCart();
      clearCart();

      if (res.data.docEntry) {
        setLastOrderDocEntry(res.data.docEntry);
      }

      await fetchOrders(res.data.docEntry);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          Alert.alert('Error', 'No se encontró la ruta del servidor (Error 404). Por favor, verifica la dirección de la API.');
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Error', `No se pudo enviar el pedido. Código: ${err.response?.status || 'Desconocido'}. Mensaje: ${err.response?.data?.message || 'Intenta nuevamente.'}`);
        }
      } else {
        Alert.alert('Error', 'No se pudo enviar el pedido. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [products, customerSelected, token, fetchOrders, setLastOrderDocEntry, clearCart]);

  const total = useMemo(() => {
    return products.reduce((sum, item) => {
      const applicableTiers = item.tiers
        ?.filter(t => item.quantity >= t.qty)
        .sort((a, b) => b.qty - a.qty);
      const price = applicableTiers?.[0]?.price ?? item.unitPrice;
      return sum + item.quantity * price;
    }, 0);
  }, [products]);

  const openCart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetRef.current?.present();
  }, []);

  const closeCart = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) closeCart();
  }, [closeCart]);

  const handleUpdateQuantity = useCallback((itemCode: string, newQty: number) => {
    updateQuantity(itemCode, Math.max(1, newQty));
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((itemCode: string, itemName: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${itemName}" del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeProduct(itemCode);
          },
        },
      ]
    );
  }, [removeProduct]);

  const renderItem = useCallback(({ item }: { item: CartItemType }) => (
    <CartItem
      item={item}
      onUpdateQty={handleUpdateQuantity}
      onRemove={handleRemoveItem}
    />
  ), [handleUpdateQuantity, handleRemoveItem]);

  const renderFooter = useCallback((props: BottomSheetFooterProps) => (
    <BottomSheetFooter {...props} bottomInset={0}>
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        <View className="flex-row justify-between items-center">
          <Text className='text-base text-gray-700 font-[Poppins-Medium]'>Cliente</Text>
          <Text className='font-[Poppins-Bold] text-black'>{customerSelected?.cardName}</Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base text-gray-700 font-[Poppins-Medium]">Total</Text>
          <Text className="text-xl font-[Poppins-Bold] text-black">L. {total.toFixed(2)}</Text>
        </View>

        <View className='flex-row w-full gap-2 justify-between'>
          <TouchableOpacity
            className="flex items-center justify-center w-[50px] h-[50px] bg-[#000] rounded-full">
            <MaterialIcons name="chat" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row flex-1 items-center justify-center h-[50px] bg-[#000] rounded-full"
            onPress={handleSubmitOrder}
          >
            <CartIcon color="white" />
            <Text className="text-white font-[Poppins-Regular] ml-2">Realizar Pedido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetFooter>
  ), [total, customerSelected?.cardName, handleSubmitOrder]);

  const handleRefresh = useCallback(() => {
    if (docEntry) {
      fetchOrders(docEntry);
    }
  }, [docEntry, fetchOrders]);

  useEffect(() => {
    if (docEntry) {
      fetchOrders(docEntry);
    }
  }, [docEntry, fetchOrders]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}>
      <View className="absolute bottom-8 right-8 gap-3 items-end z-10">
        {products.length > 0 && (
          <TouchableOpacity
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-black"
            onPress={openCart}
          >
            <BottomSheetCart />
            <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{products.length}</Text>
            </View>
          </TouchableOpacity>
        )}

        {products.length < 1 && (
          <TouchableOpacity
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-black"
            onPress={() => router.push('/client')}
          >
            <PlusIcon color="white" />
          </TouchableOpacity>
        )}
      </View>

      {orderData ? (
        <ScrollView
          className="flex-1 mt-4"
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          <View className='w-full'>
            <View className="bg-white rounded-2xl p-4 border border-gray-200 w-full shadow-sm">
              {/* Encabezado */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center space-x-2">
                  <MaterialIcons name="local-shipping" size={20} color="#555" />
                  <Text className="text-sm text-gray-500">
                    Pedido <Text className="font-[Poppins-Medium] text-gray-500">#{orderData.docEntry}</Text>
                  </Text>
                </View>
                <Text className="text-xs text-orange-600 font-[Poppins-Medium] bg-orange-100 px-2 py-1 rounded-full">
                  En Proceso
                </Text>
              </View>

              {/* Cliente */}
              <View className="flex-row items-center mb-2 space-x-2 gap-3">
                <Ionicons name="person-outline" size={24} color="#6B7280" />
                <View>
                  <Text className="text-sm text-gray-500">Cliente</Text>
                  <Text className="text-base font-[Poppins-Medium] text-gray-800 leading-4">{orderData.cardName}</Text>
                </View>
              </View>

              {/* Fecha */}
              <View className="flex-row items-center mb-2 space-x-2 gap-3">
                <Feather name="calendar" size={24} color="#6B7280" />
                <View>
                  <Text className="text-sm text-gray-500">Fecha</Text>
                  <Text className="text-base font-[Poppins-Medium] text-gray-800 leading-4">{orderData.docDate}</Text>
                </View>
              </View>

              {/* Total */}
              <View className="flex-row items-center mb-4 space-x-2 gap-3">
                <FontAwesome6 name="file-invoice" size={24} color="#6B7280" />
                <View>
                  <Text className="text-sm text-gray-500">Total</Text>
                  <Text className="text-base font-[Poppins-Medium] text-gray-800 leading-4">L. {orderData.docTotal.toLocaleString()}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/order',
                  params: {
                    OrderDetails: orderData.docEntry
                  }
                })}
                className="w-full bg-black py-3 rounded-full items-center justify-center h-[50px]">
                <Text className="text-sm font-[Poppins-SemiBold] text-white">Ver más detalles</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center bg-white">
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
          <Text className="text-lg text-gray-500">No hay pedidos cargados.</Text>
        </View>
      )}

      {isLoading && (
        <View className="absolute inset-0 z-20 bg-white/80 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-4 text-gray-500">Enviando pedido...</Text>
        </View>
      )}

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        footerComponent={renderFooter}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
      >
        <>
          <Text className="text-lg font-[Poppins-Bold] tracking-[-0.3px] mb-4 px-4">Resumen del Pedido</Text>
          {products.length === 0 ? (
            <EmptyCart onClose={closeCart} onAddProducts={() => router.push('/client')} />
          ) : (
            <BottomSheetFlatList
              className="mb-[100px]"
              data={products}
              keyExtractor={(item) => item.itemCode}
              renderItem={renderItem}
              getItemLayout={(_, index) => ({ length: 150, offset: 150 * index, index })}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={10}
              contentContainerStyle={{ paddingBottom: 30 }}
              ListHeaderComponent={<View className="pt-2" />}
            />
          )}
        </>
      </BottomSheetModal>
    </View>
  );
}