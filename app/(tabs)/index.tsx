import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import "../../global.css"

export default function App() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { user } = useAuth();

  useEffect(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleStart = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['60%']}
        backgroundStyle={{ borderRadius: 26 }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetView className="flex-1 px-6 pt-6 pb-6">
          <View className="flex-1 justify-between">
            <View>
              <Text className="text-black text-2xl font-semibold font-[Poppins-SemiBold] tracking-[-0.3px] text-center">¡Bienvenido {user?.fullName}!</Text>
              <Text className="text-base text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] mt-6 leading-5">
                Aqui podras realizar todas las gestiones de ventas de manera rápida y sencilla.
              </Text>

              {/* Sección: Envío y Gestión de Pedidos */}
              <View className="flex-row items-start mt-6">
                <FontAwesome6 name="cart-flatbed" size={22} color="#333" className="mr-4 mt-1" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-black font-[Poppins-SemiBold]">Envío y Gestión de Pedidos</Text>
                  <Text className="text-base text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] leading-5 mt-1">
                    Tramita y organiza todas tus órdenes de manera eficiente, desde la creación hasta la entrega.
                  </Text>
                </View>
              </View>

              {/* Sección: Impresión de Facturas */}
              <View className="flex-row items-start mt-4">
                <FontAwesome6 name="print" size={24} color="#333" className="mr-4 mt-1" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-black font-[Poppins-SemiBold]">Impresión Instantánea de Facturas</Text>
                  <Text className="text-base text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] leading-5 mt-1">
                    Genera e imprime tus facturas al instante, manteniendo un registro claro y profesional.
                  </Text>
                </View>
              </View>

              {/* Sección: Datos de Ventas */}
              <View className="flex-row items-start mt-4">
                <MaterialCommunityIcons name="chart-line-variant" size={26} color="#333" className="mr-4 mt-1" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-black font-[Poppins-SemiBold]">Análisis de Datos de Ventas</Text>
                  <Text className="text-base text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] leading-5 mt-1">
                    Accede a estadísticas detalladas para un control total del rendimiento y crecimiento de tu negocio.
                  </Text>
                </View>
              </View>

            </View>

            <TouchableOpacity className='bg-black w-full h-[50px] rounded-full items-center justify-center mt-6 z-50' onPress={handleStart}>
              <Text className="text-white text-base font-[Poppins-Regular] font-semibold">Empezar</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View >
  );
}