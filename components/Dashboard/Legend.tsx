import React from 'react';
import { Text, View } from 'react-native';

export type LegendItem = { color: string; label: string; value?: string | number };

export default function Legend({ items }: { items: LegendItem[] }) {
  return (
    <View className="w-full flex-row flex-wrap">
      {items.map((i, idx) => (
        <View key={idx} className="flex-row items-center mr-4 mb-2">
          <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: i.color }} />
          <Text className="text-gray-700 text-xs mr-1">{i.label}</Text>
          {i.value !== undefined && (
            <Text className="text-gray-500 text-xs">{i.value}</Text>
          )}
        </View>
      ))}
    </View>
  );
}
