import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import Constants from 'expo-constants';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useAuth } from '@/context/auth';

import { OrderDataType } from '@/types/types';

const OrderDetails = () => {
  const route = useRoute();
  const { OrderDetails } = route.params as { OrderDetails: string };
  const [orderData, setOrderData] = useState<OrderDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const FETCH_URL = process.env.EXPO_PUBLIC_API_URL + "/sap/quotations/";

  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(
          `${FETCH_URL}${OrderDetails}`
        );
        if (isMounted) {
          setOrderData(response.data);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        if (isMounted) {
          Alert.alert('Error', 'No se pudieron cargar los detalles del pedido.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (OrderDetails) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [OrderDetails]);

  const totalItems = useMemo(() => {
    return orderData?.lines.reduce((sum, line) => sum + line.quantity, 0) || 0;
  }, [orderData]);

  const handleShareAsPdf = useCallback(async () => {
    if (!orderData) {
      Alert.alert('Error', 'No hay datos del pedido para generar el PDF.');
      return;
    }

    setIsGeneratingPdf(true);

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
            * {
              font-family: 'Poppins', sans-serif;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              padding: 24px;
              background: #fff;
              color: #111;
            }
            h1 {
              font-size: 24px;
              font-weight: 600; /* SemiBold */
              margin-bottom: 16px;
            }
            h2 {
                font-size: 20px;
                font-weight: 600; /* SemiBold */
                margin-top: 24px;
                margin-bottom: 16px;
            }
            .info p {
              margin-bottom: 4px;
              font-size: 14px;
            }
            .info p strong {
                font-weight: 500; /* Medium */
            }
            table {
              width: 100%;
              margin-top: 24px;
              border-collapse: collapse;
              font-size: 14px;
            }
            th {
              text-align: left;
              padding: 8px 0; /* Ajusta el padding para que sea más limpio */
              font-weight: 500; /* Medium */
              color: #6B7280; /* gray-500 */
              text-transform: uppercase;
              font-size: 12px;
            }
            td {
              padding: 8px 0; /* Ajusta el padding */
              border-top: 1px solid #F3F4F6; /* gray-100 para líneas sutiles */
              font-weight: 400; /* Regular */
            }
            .product-table td {
                padding: 12px 0; /* Más espacio para los productos */
            }
            .product-table tr:last-child td {
                border-bottom: none; /* Sin borde en la última fila */
            }
            .text-right {
                text-align: right;
            }
            .text-center {
                text-align: center;
            }
            .font-semibold {
                font-weight: 600; /* SemiBold */
            }
            .total {
              text-align: right;
              font-weight: 700; /* Bold */
              margin-top: 16px;
              font-size: 18px; /* Bigger total */
            }
            .subtotal-row {
                font-weight: 500;
                border-top: 1px solid #ccc;
                padding-top: 8px;
                margin-top: 8px;
            }

            .header {
                width: 100%;
                display: flex;
                justify-content: space-between;
                aling-items: center;
            }
          </style>
        </head>
        <body>
          <header class="header">
            <h1>Resumen del Pedido</h1>
            <p><strong>Pedido #:</strong> ${orderData.docEntry}</p>
          </header>
          <div class="info">
            <p><strong>Cliente:</strong> ${orderData.cardName}</p>
            <p><strong>RTN:</strong> ${orderData.federalTaxID ?? 'N/A'}</p>
            <p><strong>Fecha:</strong> ${new Date(orderData.docDate).toLocaleDateString()}</p>
            <p><strong>Vendedor:</strong> ${user?.fullName ?? 'N/A'}</p>
          </div>

          <table class="product-table">
            <thead>
              <tr>
                <th style="width: 50%; text-align: left;">Producto</th>
                <th style="width: 15%; text-align: center;">Cant.</th>
                <th style="width: 15%; text-align: right;">Precio</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.lines
        .map(
          (item) => `
                  <tr>
                    <td>${item.itemDescription}</td>
                    <td class="text-center">${item.quantity.toLocaleString()}</td>
                    <td class="text-right">L. ${item.priceAfterVAT.toLocaleString()}</td>
                    <td class="text-right font-semibold">L. ${(item.quantity * item.priceAfterVAT).toLocaleString()}</td>
                  </tr>
                `
        )
        .join('')}
              <tr class="isv-row">
                <td colspan="3" class="text-right"><strong>ISV:</strong></td>
                <td class="text-right font-semibold">L. ${orderData.vatSum.toLocaleString()}</td>
              </tr>
              
              <tr class="subtotal-row">
                <td colspan="3" class="text-right"><strong>SubTotal:</strong></td>
                <td class="text-right font-semibold">L. ${(orderData.docTotal - orderData.vatSum).toLocaleString()}</td>
              </tr>

              <tr class="total-row">
                <td colspan="3" class="text-right"><strong>Total del Pedido:</strong></td>
                <td class="text-right font-semibold">L. ${orderData.docTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `Pedido #${orderData.docEntry} - ${orderData.cardName}`,
        });
      } else {
        Alert.alert('Compartir no disponible', 'Tu dispositivo no permite compartir archivos.');
      }
    } catch (error) {
      console.error('Error al generar o compartir el PDF:', error);
      Alert.alert('Error', 'No se pudo generar o compartir el PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [orderData, user]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-2 text-gray-600">Cargando detalles del pedido...</Text>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600">No se encontraron detalles para este pedido.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ marginTop: -Constants.statusBarHeight }}>
      <ScrollView className="flex-1 p-4 bg-gray-50">
        <View className="p-5 bg-white rounded-lg shadow-sm">
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-row items-center">
              <FontAwesome name="user-circle-o" size={24} color="#000" />
              <Text className="ml-2 text-lg font-[Poppins-SemiBold] tracking-[-0.3px]">
                {orderData.cardName}
              </Text>
            </View>
          </View>

          {/* Mostrar RTN del cliente */}
          <View className="mb-5">
            <Text className="text-sm text-gray-600 font-[Poppins-Regular]">
              RTN: {orderData.federalTaxID ?? 'No disponible'}
            </Text>
          </View>

          {/* Mostrar nombre del vendedor */}
          <View className="mb-5">
            <Text className="text-sm text-gray-600 font-[Poppins-Regular]">
              Vendedor: {user?.fullName ?? 'No disponible'}
            </Text>
          </View>

          <View className="flex-row justify-between mb-5">
            <View className="flex-1 p-3 bg-gray-50 rounded-lg mr-2">
              <Text className="text-xs text-gray-500">Estado</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="checkmark-circle" size={18} color="orange" />
                <Text className="ml-1 text-sm font-[Poppins-SemiBold] text-orange-500">
                  En Proceso
                </Text>
              </View>
            </View>
            <View className="flex-1 p-3 bg-gray-50 rounded-lg ml-2">
              <Text className="text-xs text-gray-500 font-[Poppins-Regular]">Fecha</Text>
              <Text className="text-sm font-[Poppins-SemiBold] mt-1">
                {new Date(orderData.docDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-5">
            <View className="flex-1 p-3 bg-gray-50 rounded-lg mr-2">
              <Text className="text-xs text-gray-500 font-[Poppins-Regular]">
                Total del Pedido
              </Text>
              <Text className="text-xl text-gray-900 mt-1 font-[Poppins-SemiBold]">
                L. {orderData.docTotal.toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 p-3 bg-gray-50 rounded-lg ml-2">
              <Text className="text-xs text-gray-500 font-[Poppins-Regular]">Items</Text>
              <Text className="text-xl font-[Poppins-SemiBold] text-gray-900 mt-1">
                {totalItems.toLocaleString()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="w-full bg-black h-[50px] rounded-full flex-row gap-3 p-2 items-center justify-center"
            onPress={handleShareAsPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <ActivityIndicator color="white" />
                <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px]">
                  Generando PDF
                </Text>
              </>
            ) : (
              <>
                <Entypo name="share" size={24} color="white" />
                <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px]">
                  Compartir como PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-5">
          <Text className="text-xl mb-4 font-[Poppins-SemiBold]">Productos</Text>
          {orderData.lines.map((item, index) => (
            <View
              key={index}
              className="flex-row items-center bg-white p-3 rounded-lg mb-3 shadow-sm"
            >
              <View className="bg-gray-200 p-2 rounded-full mr-3">
                <Ionicons name="bag-handle-outline" size={24} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold font-[Poppins-Regular] tracking-[-0.3px] leading-5">
                  {item.itemDescription}
                </Text>
                <Text className="text-sm text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">
                  Cantidad: {item.quantity}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-bold font-[Poppins-Regular] tracking-[-0.3px]">
                  L. {item.lineTotal.toLocaleString()}
                </Text>
                <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">
                  Precio Unitario: L. {item.priceAfterVAT.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderDetails;