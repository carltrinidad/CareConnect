import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users } from 'lucide-react-native';

export default function CaregiverDetailScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} className="bg-[#1a365d]">
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <Text className="text-white font-semibold text-lg ml-4">Caregiver Profile</Text>
        </View>
      </SafeAreaView>
      <View className="flex-1 items-center justify-center px-8">
        <Users size={56} color="#D1D5DB" />
        <Text className="text-gray-700 text-xl font-bold mt-4">No caregiver found</Text>
        <Text className="text-gray-400 text-center mt-2">This profile is no longer available.</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-[#1a365d] px-8 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    </View>
  );
}
