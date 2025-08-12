import { View } from 'react-native'
import { useEffect } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated'

const PulseView = ({ className }: { className?: string }) => {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, { duration: 500 }),
      -1,
      true
    )
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    }
  })

  return <Animated.View className={className} style={animatedStyle} />
}

export const Skeleton = () => {
  return (
    <View className='w-full h-[120px] flex-row gap-x-2 items-start justify-center px-[9px] py-2 rounded-2xl'>
      <PulseView className='bg-gray-200 w-[100px] h-[100px] rounded-xl my-auto' />
      <View className='flex-1 gap-2 justify-center h-full'>
        <PulseView className='w-[90%] h-[14px] bg-gray-200 rounded-full' />
        <PulseView className='w-[60%] h-[14px] bg-gray-200 rounded-full' />
        <PulseView className='w-[50%] h-[14px] bg-gray-200 rounded-full' />
        <PulseView className='w-[55%] h-[14px] bg-gray-200 rounded-full' />
      </View>
    </View>
  )
}
