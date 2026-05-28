import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  UserX,
  Trash2,
  Download,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';

const PURPLE_ACCENT = '#8B5CF6';

export default function PrivacyScreen() {
  const router = useRouter();
  const userType = useAppStore((s) => s.userType);
  const logout = useAppStore((s) => s.logout);

  const [profileVisible, setProfileVisible] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showPhone, setShowPhone] = useState(false);

  const getHeaderColor = () => {
    if (userType === 'volunteer') return PURPLE_ACCENT;
    if (userType === 'facility') return '#22C55E';
    if (userType === 'caregiver') return '#3B82F6';
    return '#1a365d';
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download Your Data',
      'We will prepare a copy of your data and send it to your email address.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: getHeaderColor() }}>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <Text className="text-white font-semibold text-lg">Privacy & Security</Text>
          <View className="w-10" />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          {/* Privacy Settings */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-gray-900 text-lg font-bold mb-2">Privacy Settings</Text>
            <Text className="text-gray-500 text-sm mb-4">
              Control who can see your information
            </Text>
          </Animated.View>

          <View className="gap-3 mb-6">
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <View className="bg-white rounded-xl p-4 flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${getHeaderColor()}15` }}
                >
                  <Eye size={20} color={getHeaderColor()} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold">Profile Visibility</Text>
                  <Text className="text-gray-500 text-sm">
                    Allow others to view your profile
                  </Text>
                </View>
                <Switch
                  value={profileVisible}
                  onValueChange={setProfileVisible}
                  trackColor={{ false: '#D1D5DB', true: `${getHeaderColor()}50` }}
                  thumbColor={profileVisible ? getHeaderColor() : '#F3F4F6'}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(150)}>
              <View className="bg-white rounded-xl p-4 flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${getHeaderColor()}15` }}
                >
                  <Shield size={20} color={getHeaderColor()} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold">Show Location</Text>
                  <Text className="text-gray-500 text-sm">
                    Display your general location
                  </Text>
                </View>
                <Switch
                  value={showLocation}
                  onValueChange={setShowLocation}
                  trackColor={{ false: '#D1D5DB', true: `${getHeaderColor()}50` }}
                  thumbColor={showLocation ? getHeaderColor() : '#F3F4F6'}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <View className="bg-white rounded-xl p-4 flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${getHeaderColor()}15` }}
                >
                  <Lock size={20} color={getHeaderColor()} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold">Show Phone Number</Text>
                  <Text className="text-gray-500 text-sm">
                    Display your phone on your profile
                  </Text>
                </View>
                <Switch
                  value={showPhone}
                  onValueChange={setShowPhone}
                  trackColor={{ false: '#D1D5DB', true: `${getHeaderColor()}50` }}
                  thumbColor={showPhone ? getHeaderColor() : '#F3F4F6'}
                />
              </View>
            </Animated.View>
          </View>

          {/* Account Actions */}
          <Animated.View entering={FadeInDown.duration(400).delay(250)}>
            <Text className="text-gray-900 text-lg font-bold mb-2">Account</Text>
            <Text className="text-gray-500 text-sm mb-4">
              Manage your account data
            </Text>
          </Animated.View>

          <View className="gap-3">
            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <Pressable
                onPress={handleDownloadData}
                className="bg-white rounded-xl p-4 flex-row items-center active:bg-gray-50"
              >
                <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-50">
                  <Download size={20} color="#3B82F6" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold">Download My Data</Text>
                  <Text className="text-gray-500 text-sm">
                    Get a copy of all your data
                  </Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(350)}>
              <Pressable
                onPress={handleDeleteAccount}
                className="bg-white rounded-xl p-4 flex-row items-center active:bg-gray-50"
              >
                <View className="w-10 h-10 rounded-full items-center justify-center bg-red-50">
                  <Trash2 size={20} color="#DC2626" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-red-600 font-semibold">Delete Account</Text>
                  <Text className="text-gray-500 text-sm">
                    Permanently delete your account
                  </Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
