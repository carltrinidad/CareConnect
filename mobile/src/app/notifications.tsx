import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  Calendar,
  Heart,
  AlertCircle,
  Megaphone,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';

const PURPLE_ACCENT = '#8B5CF6';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: typeof Bell;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const userType = useAppStore((s) => s.userType);

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'messages',
      title: 'Messages',
      description: 'Get notified when you receive new messages',
      icon: MessageSquare,
      enabled: true,
    },
    {
      id: 'appointments',
      title: 'Appointments',
      description: 'Reminders for upcoming appointments',
      icon: Calendar,
      enabled: true,
    },
    {
      id: 'care_updates',
      title: 'Care Updates',
      description: 'Updates about care requests and matches',
      icon: Heart,
      enabled: true,
    },
    {
      id: 'alerts',
      title: 'Important Alerts',
      description: 'Critical notifications you should not miss',
      icon: AlertCircle,
      enabled: true,
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'News and updates from the app',
      icon: Megaphone,
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const getHeaderColor = () => {
    if (userType === 'volunteer') return PURPLE_ACCENT;
    if (userType === 'facility') return '#22C55E';
    if (userType === 'caregiver') return '#3B82F6';
    return '#1a365d';
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
          <Text className="text-white font-semibold text-lg">Notifications</Text>
          <View className="w-10" />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-gray-900 text-lg font-bold mb-2">
              Notification Preferences
            </Text>
            <Text className="text-gray-500 text-sm mb-6">
              Choose which notifications you want to receive
            </Text>
          </Animated.View>

          <View className="gap-3">
            {settings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <Animated.View
                  key={setting.id}
                  entering={FadeInDown.duration(400).delay(100 + index * 50)}
                >
                  <View className="bg-white rounded-xl p-4 flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${getHeaderColor()}15` }}
                    >
                      <Icon size={20} color={getHeaderColor()} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-900 font-semibold">{setting.title}</Text>
                      <Text className="text-gray-500 text-sm">{setting.description}</Text>
                    </View>
                    <Switch
                      value={setting.enabled}
                      onValueChange={() => toggleSetting(setting.id)}
                      trackColor={{ false: '#D1D5DB', true: `${getHeaderColor()}50` }}
                      thumbColor={setting.enabled ? getHeaderColor() : '#F3F4F6'}
                    />
                  </View>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View entering={FadeInDown.duration(400).delay(400)} className="mt-6">
            <View className="bg-amber-50 rounded-xl p-4">
              <View className="flex-row items-start">
                <AlertCircle size={20} color="#F59E0B" />
                <View className="flex-1 ml-3">
                  <Text className="text-amber-800 font-medium">Push Notifications</Text>
                  <Text className="text-amber-700 text-sm mt-1">
                    Make sure push notifications are enabled in your device settings to
                    receive alerts.
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
