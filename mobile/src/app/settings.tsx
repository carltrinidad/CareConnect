import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Palette,
  Globe,
  Sun,
  Moon,
  Smartphone,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';

const PURPLE_ACCENT = '#8B5CF6';

interface SettingsItem {
  id: string;
  title: string;
  description?: string;
  icon: typeof User;
  route?: string;
  action?: () => void;
  iconColor: string;
  iconBg: string;
}

const THEME_OPTIONS: { value: 'system' | 'light' | 'dark'; label: string; description: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System Default', description: 'Follows your device settings', icon: Smartphone },
  { value: 'light', label: 'Light Mode', description: 'Always use light theme', icon: Sun },
  { value: 'dark', label: 'Dark Mode', description: 'Always use dark theme', icon: Moon },
];

export default function SettingsScreen() {
  const router = useRouter();
  const userType = useAppStore((s) => s.userType);
  const logout = useAppStore((s) => s.logout);
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const themeLabel = THEME_OPTIONS.find((t) => t.value === themePreference)?.label ?? 'System Default';

  const getHeaderColor = () => {
    if (userType === 'volunteer') return PURPLE_ACCENT;
    if (userType === 'facility') return '#22C55E';
    if (userType === 'caregiver') return '#3B82F6';
    return '#1a365d';
  };

  const handleLogout = () => {
    logout();
    router.replace('/onboarding');
  };

  const settingsItems: SettingsItem[] = [
    {
      id: 'profile',
      title: 'Edit Profile',
      description: 'Update your personal information',
      icon: User,
      route: '/edit-profile',
      iconColor: getHeaderColor(),
      iconBg: `${getHeaderColor()}15`,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage notification preferences',
      icon: Bell,
      route: '/notifications',
      iconColor: '#F59E0B',
      iconBg: '#FEF3C7',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Control your privacy settings',
      icon: Shield,
      route: '/privacy',
      iconColor: '#10B981',
      iconBg: '#D1FAE5',
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact us',
      icon: HelpCircle,
      route: '/support',
      iconColor: '#3B82F6',
      iconBg: '#DBEAFE',
    },
  ];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: getHeaderColor() }}>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <Text className="text-white font-semibold text-lg">Settings</Text>
          <View className="w-10" />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">Account Settings</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Manage your account and preferences
            </Text>
          </Animated.View>

          <View className="gap-3 mb-6">
            {settingsItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.duration(400).delay(100 + index * 50)}
                >
                  <Pressable
                    onPress={() => {
                      if (item.route) {
                        router.push(item.route as any);
                      } else if (item.action) {
                        item.action();
                      }
                    }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-row items-center active:bg-gray-50"
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: item.iconBg }}
                    >
                      <Icon size={20} color={item.iconColor} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-900 dark:text-white font-semibold">{item.title}</Text>
                      {item.description ? (
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.description}</Text>
                      ) : null}
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* App Section */}
          <Animated.View entering={FadeInDown.duration(400).delay(350)}>
            <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">App</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4">Application preferences</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Pressable
              onPress={() => setShowThemeModal(true)}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-row items-center active:bg-gray-50"
            >
              <View className="w-10 h-10 rounded-full items-center justify-center bg-purple-50">
                <Palette size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 dark:text-white font-semibold">Appearance</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">{themeLabel}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(450)} className="mt-3">
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-cyan-50">
                <Globe size={20} color="#06B6D4" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 dark:text-white font-semibold">Language</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">English</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.duration(400).delay(500)} className="mt-6 mb-8">
            <Pressable
              onPress={handleLogout}
              className="flex-row items-center justify-center bg-red-50 rounded-xl py-4 active:bg-red-100"
            >
              <LogOut size={20} color="#DC2626" />
              <Text className="text-red-600 font-semibold ml-2">Log Out</Text>
            </Pressable>
          </Animated.View>

          {/* App Version */}
          <Animated.View entering={FadeInDown.duration(400).delay(550)}>
            <Text className="text-gray-400 dark:text-gray-500 text-sm text-center">
              Board & Care App v1.0.0
            </Text>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable
          onPress={() => setShowThemeModal(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable onPress={() => {}} className="bg-white dark:bg-gray-800 rounded-t-3xl">
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </View>
            <View className="px-6 pb-2">
              <Text className="text-gray-900 dark:text-white text-xl font-bold">Appearance</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Choose how the app looks</Text>
            </View>
            <View className="px-6 py-4 gap-3">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = themePreference === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setThemePreference(option.value);
                      setShowThemeModal(false);
                    }}
                    className={`flex-row items-center p-4 rounded-xl border-2 ${
                      isSelected
                        ? 'bg-purple-50 border-purple-400'
                        : 'bg-gray-50 dark:bg-gray-700 border-transparent'
                    }`}
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isSelected ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <Icon size={20} color={isSelected ? 'white' : '#6B7280'} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className={`font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-900 dark:text-white'}`}>
                        {option.label}
                      </Text>
                      <Text className="text-gray-500 dark:text-gray-400 text-sm">{option.description}</Text>
                    </View>
                    {isSelected ? (
                      <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center">
                        <Check size={14} color="white" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <SafeAreaView edges={['bottom']}>
              <View className="px-6 pb-4">
                <Pressable
                  onPress={() => setShowThemeModal(false)}
                  className="bg-gray-100 dark:bg-gray-700 rounded-xl py-3 items-center active:bg-gray-200"
                >
                  <Text className="text-gray-700 dark:text-gray-300 font-semibold">Close</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
