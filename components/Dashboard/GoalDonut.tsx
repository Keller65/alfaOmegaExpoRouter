import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

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

  const data = useMemo(() => [
    { value: displayPercent, color: '#00a6ff' },
    { value: Math.max(0, 100 - displayPercent), color: '#f2f2f2' },
  ], [displayPercent]);

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-full">
      <Text className="text-gray-600 text-xs mb-2 font-[Poppins-SemiBold] tracking-[-0.3px]">{title}</Text>
      <View className="items-center">
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <PieChart
            data={data}
            donut
            radius={70}
            innerRadius={50}
            innerCircleColor="#FFFFFF"
            showText={false}
            sectionAutoFocus={false}
            focusOnPress={false}
            font='Poppins-SemiBold'
            centerLabelComponent={() => (
              <View className="items-center">
                <Text className="text-gray-900 font-[Poppins-SemiBold] tracking-[-0.3px] text-xl">{displayPercent}%</Text>
                <Text className="text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] text-[10px]">${current.toLocaleString()} / ${target.toLocaleString()}</Text>
              </View>
            )}
          />
        </Animated.View>
      </View>
    </View>
  );
}
