import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';

const audioSource = require('@/assets/sound/success.mp3');

const Success = () => {
  const animation = useRef<LottieView>(null);
  const router = useRouter();
  const player = useAudioPlayer(audioSource);
  const { OrderDetails } = useLocalSearchParams();

  useEffect(() => {
    animation.current?.play();

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      player.play()
    }, 350);
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: '#e0ffe7', flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
      <LottieView
        autoPlay
        loop={false}
        ref={animation}
        style={{
          width: 180,
          height: 180,
          backgroundColor: 'transparent',
        }}
        source={require('@/assets/animation/Check.json')}
      />

      <Text style={{ fontSize: 28, fontFamily: 'Poppins-SemiBold', color: '#1a753c', marginTop: 20, textAlign: 'center' }}>
        ¡Pedido realizado con exito!
      </Text>
      <Text style={{ fontSize: 16, color: '#333', marginTop: 10, marginBottom: 40, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>
        Tu pedido se ha enviado correctamente.
      </Text>

      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/order',
          params: {
            OrderDetails: OrderDetails
          }
        })}
        style={{ backgroundColor: '#28a745', width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 15 }}
      >
        <Text style={{ fontFamily: 'Poppins-Medium', color: '#fff', fontSize: 18 }}>
          Ver Pedido
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ borderWidth: 2, borderColor: '#28a745', width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
      >
        <Text style={{ fontFamily: 'Poppins-Medium', color: '#28a745', fontSize: 18 }}>
          ver pedidos
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Success;