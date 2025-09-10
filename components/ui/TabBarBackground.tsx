import { StyleSheet, View } from 'react-native';

// This is a shim for web and Android where the tab bar is generally opaque.
export default function TabBarBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(79, 70, 229, 0.08)' }]} />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
