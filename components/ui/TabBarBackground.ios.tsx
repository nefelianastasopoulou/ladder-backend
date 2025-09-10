import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

export default function BlurTabBarBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(79, 70, 229, 0.08)' }]}>
      <BlurView
        // System chrome material automatically adapts to the system's theme
        // and matches the native tab bar appearance on iOS.
        tint="systemChromeMaterial"
        intensity={100}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
