import React from 'react';
import { View, Image } from 'react-native';
import { User } from 'lucide-react-native';

interface DefaultAvatarProps {
  uri?: string | null;
  size?: number;
}

export function DefaultAvatar({ uri, size = 48 }: DefaultAvatarProps) {
  const iconSize = Math.round(size * 0.45);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <User size={iconSize} color="#9CA3AF" strokeWidth={1.5} />
    </View>
  );
}
