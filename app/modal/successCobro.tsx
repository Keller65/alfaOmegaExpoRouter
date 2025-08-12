import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const audioSource = require('@/assets/sound/success.mp3');

const successCobro = () => {
  const animation = useRef<LottieView>(null);
  const router = useRouter();

  const player = useAudioPlayer(audioSource);
  const { docEntry } = useLocalSearchParams();

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

      <Text style={{ fontSize: 28, color: '#1a753c', marginTop: 20, textAlign: 'center', fontFamily: 'Poppins-SemiBold', letterSpacing: -0.3 }}>
        ¡Cobro realizado con éxito!
      </Text>
      <Text style={{ fontSize: 14, color: '#333', marginTop: 10, marginBottom: 40, textAlign: 'center', fontFamily: 'Poppins-Regular', letterSpacing: -0.3 }}>
        el cobro se ha completado correctamente.
      </Text>

      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/invoicesDetails',
          params: {
            docEntry: docEntry
          }
        })}
        style={{ backgroundColor: '#28a745', width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 15 }}
      >
        <Text style={{ fontFamily: 'Poppins-Medium', color: '#fff', fontSize: 18, letterSpacing: -0.3 }}>
          Ver Cobro
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/invoices')}
        style={{ borderWidth: 2, borderColor: '#28a745', width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
      >
        <Text style={{ fontFamily: 'Poppins-Medium', color: '#28a745', fontSize: 18, letterSpacing: -0.3 }}>
          ver cobros
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default successCobro;