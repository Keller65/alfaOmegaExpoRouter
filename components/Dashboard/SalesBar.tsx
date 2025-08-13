import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export type SalesBarProps = {
  title?: string;
  data: Array<{ label: string; value: number }>;
};

export default function SalesBar({ title = 'Ventas por día', data }: SalesBarProps) {
  const barData = data.map((d) => ({ value: d.value, label: d.label }));

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-full">
      <Text className="text-gray-600 text-xs mb-2">{title}</Text>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <BarChart
          data={barData}
          barWidth={22}
          spacing={18}
          roundedTop
          frontColor="#3b82f6"
          yAxisThickness={0}
          xAxisThickness={0}
          xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 10 }}
          noOfSections={4}
          maxValue={Math.max(10, ...data.map((d) => d.value))}
          rulesColor="#f3f4f6"
          xAxisColor="#e5e7eb"
          yAxisTextStyle={{ color: '#9ca3af' }}
        />
      </Animated.View>
    </View>
  );
}
