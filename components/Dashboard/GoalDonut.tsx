import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type GoalDonutProps = {
  title?: string;
  current: number; // ventas actuales
  target: number;  // meta
};

export default function GoalDonut({ title = 'Meta mensual', current, target }: GoalDonutProps) {
  const progress = Math.max(0, Math.min(1, target === 0 ? 0 : current / target));
  const percent = Math.round(progress * 100);

  // Animaciones de entrada
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 90 }),
    ]).start();
  }, [opacity, scale]);

  // Conteo progresivo del porcentaje para animar el arco
  const [displayPercent, setDisplayPercent] = useState(0);
  useEffect(() => {
    const duration = 800;
    const frames = Math.max(1, Math.floor(duration / 16));
    const inc = percent / frames;
    let i = 0;
    let acc = 0;
    const id = setInterval(() => {
      i += 1;
      acc += inc;
      if (i >= frames) {
        setDisplayPercent(percent);
        clearInterval(id);
      } else {
        setDisplayPercent(Math.round(acc));
      }
    }, 16);
    return () => clearInterval(id);
  }, [percent]);

  // Parámetros del círculo
  const outerRadius = 70; // coincide con el anterior radius
  const strokeWidth = 20; // outer (70) - innerRadius (50) => 20
  const size = outerRadius * 2; // ancho/alto del SVG
  // Radio real del trazo (centra el stroke)
  const r = outerRadius - strokeWidth / 2; // 60
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - displayPercent / 100);

  const trackColor = '#f2f2f2';
  // Selección de color suave según rango de porcentaje final (no animado) para mantener consistencia durante la animación
  const progressColor = (() => {
    // Definimos rangos: [0,25) rojo, [25,50) amarillo, [50,75) azul (existente), [75,100+] verde
    // Elegimos tonos suaves con buen contraste sobre fondo blanco y track gris claro
    if (percent < 25) return '#ff7b72';      // Soft red coral
    if (percent < 50) return '#ffc94d';      // Warm soft amber
    if (percent < 75) return '#00a6ff';      // Existing pleasant blue
    return '#00e053';                        // Soft fresh green
  })();

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-full">
      <Text className="text-gray-600 text-xs mb-2 font-[Poppins-SemiBold] tracking-[-0.3px]">{title}</Text>
      <View className="items-center">
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
              {/* Track */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={trackColor}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progreso con extremos redondeados */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={progressColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                // Rotar -90° para que empiece arriba
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <Text className="text-gray-900 font-[Poppins-SemiBold] tracking-[-0.3px] text-xl">{displayPercent}%</Text>
              <Text className="text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] text-[10px]">${current.toLocaleString()} / ${target.toLocaleString()}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
