import axios from 'axios';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "../context/auth";
import { useAppStore } from '@/state';
import "../global.css"

export default function Login() {
  const { user, setUser } = useAuth();
  const [salesPersonCode, setSalesPersonCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { fetchUrl } = useAppStore()
  const FETCH_URL = fetchUrl + "/auth/employee";

  const isFormValid = salesPersonCode !== "" && password !== "";

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      console.log('Coordenadas:', location.coords);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (user) return;

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const savedBiometricUser = await AsyncStorage.getItem('biometricUser');
        if (savedBiometricUser) {
          const biometricAuth = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Inicia sesión con tu huella o Face ID',
            fallbackLabel: 'Ingresar manualmente',
            biometricsSecurityLevel: 'strong',
            cancelLabel: 'Ingresar manualmente',
          });

          if (biometricAuth.success) {
            const parsedUser = JSON.parse(savedBiometricUser);
            setUser(parsedUser);
            await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
          }
        }
      }
    })();
  }, [user]);

  const handleLogin = async () => {
    if (loading || !isFormValid) return;
    setLoading(true);

    try {
      const deviceToken = "";

      const response = await axios.post(FETCH_URL, {
        employeeCode: Number(salesPersonCode),
        password: password,
        token: deviceToken,
        salesPersonCode: Number(salesPersonCode)
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;

      const userData = {
        employeeCode: data.salesPersonCode,
        salesPersonCode: data.salesPersonCode,
        fullName: data.fullName,
        token: data.token
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      Alert.alert(
        'Autenticación rápida',
        '¿Deseas activar el inicio con huella o Face ID para futuros ingresos?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí',
            onPress: async () => {
              await AsyncStorage.setItem('biometricUser', JSON.stringify(userData));
              console.log('Biometría activada');
            }
          }
        ]
      );

    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Credenciales incorrectas. Verifica tu código y contraseña.');
      } else if (error.response?.status >= 500) {
        Alert.alert('Error', 'Error del servidor. Intenta más tarde.');
      } else if (error.request) {
        Alert.alert('Error', 'No se pudo conectar al servidor. Revisa tu conexión.');
      } else {
        Alert.alert('Error', 'Ocurrió un error inesperado al iniciar sesión.');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Redirect href="/(tabs)" />;

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/LogoAlfayOmega.png')}
        style={{ height: 120, width: 260, resizeMode: 'contain', alignSelf: 'center', marginBottom: 60 }}
      />

      <View style={{ gap: 24 }}>
        <View>
          <Text style={{ fontFamily: 'Poppins-Medium', letterSpacing: -0.8, fontSize: 15 }}>Código de Vendedor</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingrese su Código de Vendedor"
            value={salesPersonCode}
            onChangeText={setSalesPersonCode}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        <View>
          <Text style={{ fontFamily: 'Poppins-Medium', letterSpacing: -0.8, fontSize: 15 }}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingrese su Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            keyboardType="numeric"
            editable={!loading}
          />
        </View>
      </View>

      <TouchableOpacity
        style={{
          marginTop: 16,
          backgroundColor: isFormValid && !loading ? '#3b82f6' : '#d1d5db',
          padding: 16,
          height: 56,
          borderRadius: 99,
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onPress={handleLogin}
        disabled={!isFormValid || loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={{ color: isFormValid && !loading ? '#fff' : '#6b7280', textAlign: 'center', fontFamily: 'Poppins-SemiBold', lineHeight: 12 }}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      <View className='w-full items-center justify-center mt-16'>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
        >
          <Text className='font-[Poppins-Medium] tracking-[-0.3px] text-[#3b82f6]'>Configuraciones</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "white"
  },
  input: {
    height: 56,
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    paddingHorizontal: 24,
    borderRadius: 24,
    fontFamily: 'Poppins-Medium'
  }
});