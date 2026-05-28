import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';
import { getConversations, ConversationData } from '@/lib/api';
import { DefaultAvatar } from '@/components/DefaultAvatar';

export default function MessagesScreen() {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const userType = useAppStore((s) => s.userType);

  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch conversations from backend
  const fetchConversations = useCallback(async (showLoading = true) => {
    if (!currentUser || !userType) {
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);

    try {
      const data = await getConversations(userType, currentUser.id);
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, userType]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations(false);
    }, [fetchConversations])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations(false);
  }, [fetchConversations]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const totalUnread = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);

  if (!currentUser) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
        <View className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Messages</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
            <MessageCircle size={40} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 dark:text-white text-lg font-semibold text-center">Please log in</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
            You need to be logged in to view your messages
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
        <View className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Messages</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1a365d" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Messages</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {totalUnread > 0 ? `${totalUnread} unread messages` : 'No unread messages'}
          </Text>
        </Animated.View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a365d" />
        }
      >
        {conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
              <MessageCircle size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 dark:text-white text-lg font-semibold">No messages yet</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 px-10">
              Start a conversation by contacting a facility or caregiver
            </Text>
          </View>
        ) : (
          <View className="py-2">
            {conversations.map((conversation, index) => (
              <Animated.View
                key={conversation.id}
                entering={FadeInRight.duration(400).delay(index * 80)}
              >
                <Pressable
                  onPress={() => router.push({
                    pathname: `/chat/${conversation.contactId}`,
                    params: { contactType: conversation.contactType }
                  })}
                  className="flex-row items-center px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
                >
                  <View className="relative">
                    <DefaultAvatar uri={conversation.contactAvatar} size={56} />
                    {conversation.unreadCount > 0 ? (
                      <View className="absolute -top-1 -right-1 bg-[#1a365d] w-5 h-5 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">
                          {conversation.unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View className="flex-1 ml-4">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`text-base dark:text-white ${
                          conversation.unreadCount > 0
                            ? 'text-gray-900 font-bold'
                            : 'text-gray-900 font-semibold'
                        }`}
                      >
                        {conversation.contactName}
                      </Text>
                      <Text className="text-gray-400 dark:text-gray-500 text-sm">
                        {formatTime(conversation.lastMessageTime)}
                      </Text>
                    </View>
                    <Text
                      className={`mt-1 ${
                        conversation.unreadCount > 0
                          ? 'text-gray-700 dark:text-gray-300 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                      numberOfLines={1}
                    >
                      {conversation.lastMessage || 'Start a conversation'}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
