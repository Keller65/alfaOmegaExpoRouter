import React from 'react';
import { Platform, Text, View } from 'react-native';

type KPICardProps = {
  title: string;
  value: string | number;
  delta?: number;
  subtitle?: string;
  iosSizes?: {
    delta?: number;
    subtitle?: number;
  };
  androidSizes?: {
    delta?: number;
    subtitle?: number;
  };
};

const formatDelta = (delta?: number, fontSize?: number) => {
  if (delta === undefined || delta === null) return null;
  const sign = delta > 0 ? '+' : '';
  const color = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '■';
  return (
    <Text
      className={`${color} font-[Poppins-Regular] tracking-[-0.3px]`}
      style={{ fontSize }}
    >
      {arrow} {sign}
      {Math.abs(delta).toFixed(1)}%
    </Text>
  );
};

export default function KPICard({
  title,
  value,
  delta,
  subtitle,
  iosSizes,
  androidSizes,
}: KPICardProps) {
  const isIOS = Platform.OS === 'ios';
  // Tamaños base (los "modificados" se aplican sólo a iOS)
  const deltaFontSize = isIOS
    ? (iosSizes?.delta ?? 10)
    : (androidSizes?.delta ?? 12); // Android mantiene tamaño previo (más grande)
  const subtitleFontSize = isIOS
    ? (iosSizes?.subtitle ?? 8)
    : (androidSizes?.subtitle ?? 10);

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100 flex-1 h-fit justify-center">
      <Text
        className="text-gray-500 text-xs mb-1"
        style={{ fontFamily: 'Poppins-SemiBold', letterSpacing: -0.3 }}
      >
        {title}
      </Text>
      <Text
        className="text-gray-900 text-xl"
        style={{ fontFamily: 'Poppins-Regular', letterSpacing: -0.3 }}
      >
        {value}
      </Text>
      <View className="mt-1 flex-row items-center gap-3">
        {formatDelta(delta, deltaFontSize)}
        {!!subtitle && (
          <Text
            className="text-gray-400"
            style={{ fontFamily: 'Poppins-Regular', letterSpacing: -0.3, fontSize: subtitleFontSize }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
