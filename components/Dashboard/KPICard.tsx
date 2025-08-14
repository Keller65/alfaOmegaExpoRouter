import React from 'react';
import { Text, View } from 'react-native';

type KPICardProps = {
  title: string;
  value: string | number;
  delta?: number; // percentage change vs previous period
  subtitle?: string;
};

const formatDelta = (delta?: number) => {
  if (delta === undefined || delta === null) return null;
  const sign = delta > 0 ? '+' : '';
  const color = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '■';
  return (
    <Text className={`${color} text-xs font-[Poppins-Regular] tracking-[-0.3px]`}>
      {arrow} {sign}
      {Math.abs(delta).toFixed(1)}%
    </Text>
  );
};

export default function KPICard({ title, value, delta, subtitle }: KPICardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100 w-[48%]">
      <Text
        className="text-gray-500 text-xs mb-1"
        style={{ fontFamily: 'Poppins-SemiBold', letterSpacing: -0.3 }}
      >
        {title}
      </Text>
      <Text
        className="text-gray-900 text-xl"
        style={{ fontFamily: 'Poppins-Regular', fontWeight: '600', letterSpacing: -0.3 }}
      >
        {value}
      </Text>
      <View className="mt-1 flex-row items-center justify-between">
        {formatDelta(delta)}
        {!!subtitle && (
          <Text
            className="text-gray-400 text-xs"
            style={{ fontFamily: 'Poppins-Regular', letterSpacing: -0.3 }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
