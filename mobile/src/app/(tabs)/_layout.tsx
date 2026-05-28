import React from 'react';
import { Tabs } from 'expo-router';
import { Home, MessageCircle, User, UserSearch, Heart, Calendar, ShieldCheck } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAppStore } from '@/lib/store';

const PURPLE_ACCENT = '#8B5CF6';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const userType = useAppStore((s) => s.userType);
  const currentUser = useAppStore((s) => s.currentUser);

  const isVolunteer = userType === 'volunteer';
  const isAdmin = currentUser?.isAdmin === true;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isVolunteer ? PURPLE_ACCENT : '#1a365d',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderTopColor: isDark ? '#1F2937' : '#F3F4F6',
          paddingTop: 8,
          paddingBottom: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      {/* Volunteer Tab - shown only for volunteer accounts */}
      <Tabs.Screen
        name="volunteer"
        options={{
          title: 'Volunteer',
          href: isVolunteer ? '/(tabs)/volunteer' : null,
          tabBarIcon: ({ color, focused }) => (
            <Heart size={24} color={color} strokeWidth={focused ? 2.5 : 2} fill={focused ? color : 'transparent'} />
          ),
        }}
      />

      {/* My Signups Tab - shown only for volunteers */}
      <Tabs.Screen
        name="my-signups"
        options={{
          title: 'My Signups',
          href: isVolunteer ? '/(tabs)/my-signups' : null,
          tabBarIcon: ({ color, focused }) => (
            <Calendar size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      {/* Find Care Tab - shown for non-volunteers */}
      <Tabs.Screen
        name="find-care"
        options={{
          title: 'Find Care',
          href: !isVolunteer ? '/(tabs)/find-care' : null,
          tabBarIcon: ({ color, focused }) => (
            <UserSearch size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      {/* Admin Tab - only for admin accounts */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? '/(tabs)/admin' : null,
          tabBarIcon: ({ color, focused }) => (
            <ShieldCheck size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      {/* Hide the old two.tsx from tabs */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
