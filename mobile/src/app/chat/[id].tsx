import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  ActionSheetIOS,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Phone, MoreVertical } from 'lucide-react-native';
import { DefaultAvatar } from '@/components/DefaultAvatar';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';
import {
  getFacility,
  getUserById,
  findOrCreateConversation,
  getConversationMessages,
  sendMessageApi,
  MessageData
} from '@/lib/api';

interface ContactInfo {
  id: string;
  name: string;
  displayName: string;
  phone: string;
  avatar?: string;
  type: 'facility' | 'caregiver' | 'volunteer';
}

export default function ChatScreen() {
  const { id, contactType: paramContactType } = useLocalSearchParams<{ id: string; contactType?: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messageText, setMessageText] = useState('');
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Store state
  const currentUser = useAppStore((s) => s.currentUser);
  const userType = useAppStore((s) => s.userType);

  // Messages state
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Require a logged-in user
  const effectiveUser = currentUser!;
  const effectiveUserType = userType || 'volunteer';

  // Determine contact type
  const contactType = paramContactType || 'facility';

  // Load contact info
  useEffect(() => {
    const loadContact = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Try to look up user from the ChatUser table first (works for all types)
      const chatUser = await getUserById(id);
      if (chatUser) {
        setContact({
          id: chatUser.id,
          name: chatUser.name,
          displayName: chatUser.name,
          phone: chatUser.phone,
          avatar: chatUser.avatar || undefined,
          type: chatUser.userType as 'facility' | 'caregiver' | 'volunteer',
        });
        setLoading(false);
        return;
      }

      // Fallback: try facility API (for facilities created before ChatUser existed)
      const apiData = await getFacility(id);
      if (apiData) {
        setContact({
          id: apiData.id,
          name: apiData.name,
          displayName: apiData.facilityName,
          phone: apiData.phone,
          avatar: apiData.avatar || apiData.images?.[0],
          type: 'facility',
        });
        setLoading(false);
        return;
      }

      // If we can't find contact info, create a basic one
      setContact({
        id,
        name: 'Contact',
        displayName: 'Contact',
        phone: '',
        type: contactType as 'facility' | 'caregiver' | 'volunteer',
      });

      setLoading(false);
    };

    loadContact();
  }, [id, contactType]);

  // Initialize conversation and load messages
  useEffect(() => {
    const initConversation = async () => {
      if (!contact || !id || !currentUser) return;

      try {
        // Find or create conversation in backend
        const result = await findOrCreateConversation({
          userType: effectiveUserType,
          userId: effectiveUser.id,
          userName: effectiveUser.name,
          userAvatar: effectiveUser.avatar,
          contactType: contact.type,
          contactId: contact.id,
          contactName: contact.displayName,
          contactAvatar: contact.avatar,
        });

        if (result?.conversationId) {
          setConversationId(result.conversationId);
          // Load messages
          await loadMessages(result.conversationId);
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
      }
    };

    initConversation();
  }, [contact, id, currentUser?.id, effectiveUserType]);

  // Load messages from backend
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const data = await getConversationMessages(convId, effectiveUserType, effectiveUser.id);
      if (data?.messages) {
        setMessages(data.messages);
        // Update contact info if we got it from the conversation
        if (data.contactName && contact && data.contactName !== contact.displayName) {
          setContact(prev => prev ? { ...prev, displayName: data.contactName } : prev);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [currentUser?.id, effectiveUserType, contact]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      loadMessages(conversationId);
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId, loadMessages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async () => {
    if (!messageText.trim() || !conversationId) return;

    const content = messageText.trim();
    setMessageText('');
    setSending(true);

    // Optimistic update - add message immediately
    const tempMessage: MessageData = {
      id: `temp-${Date.now()}`,
      senderId: effectiveUser.id,
      senderType: effectiveUserType,
      content,
      timestamp: Date.now(),
      read: false,
    };
    setMessages(prev => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send to backend
      const result = await sendMessageApi({
        conversationId,
        senderType: effectiveUserType,
        senderId: effectiveUser.id,
        content,
      });

      if (result) {
        // Replace temp message with real one
        setMessages(prev => prev.map(m =>
          m.id === tempMessage.id ? result : m
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessageText(content); // Restore message text
    } finally {
      setSending(false);
    }
  };

  const handleCall = () => {
    if (!contact?.phone) {
      Alert.alert('No Phone', 'No phone number available for this contact');
      return;
    }
    const phoneNumber = contact.phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Could not open phone app');
    });
  };

  const handleMoreOptions = () => {
    const options = ['View Profile', 'Clear Chat', 'Block Contact', 'Cancel'];
    const cancelButtonIndex = 3;
    const destructiveButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // View Profile
            if (contact?.type === 'facility') {
              router.push(`/facility/${id}`);
            } else {
              router.push(`/caregiver/${id}`);
            }
          } else if (buttonIndex === 1) {
            // Clear Chat
            Alert.alert('Clear Chat', 'Are you sure you want to clear this conversation?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: () => setMessages([]),
              },
            ]);
          } else if (buttonIndex === 2) {
            // Block Contact
            Alert.alert('Block Contact', 'Are you sure you want to block this contact?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: () => {
                  Alert.alert('Blocked', 'This contact has been blocked.');
                  router.back();
                },
              },
            ]);
          }
        }
      );
    } else {
      // Android fallback
      Alert.alert('Options', 'Choose an action', [
        {
          text: 'View Profile',
          onPress: () => {
            if (contact?.type === 'facility') {
              router.push(`/facility/${id}`);
            } else {
              router.push(`/caregiver/${id}`);
            }
          },
        },
        {
          text: 'Clear Chat',
          onPress: () => {
            Alert.alert('Clear Chat', 'Are you sure you want to clear this conversation?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: () => setMessages([]),
              },
            ]);
          },
        },
        {
          text: 'Block Contact',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Block Contact', 'Are you sure you want to block this contact?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: () => {
                  Alert.alert('Blocked', 'This contact has been blocked.');
                  router.back();
                },
              },
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-gray-500">Please log in to send messages</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 bg-[#1a365d] rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1a365d" />
      </View>
    );
  }

  if (!contact) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Contact not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 bg-[#1a365d] rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white border-b border-gray-100">
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center -ml-2"
          >
            <ArrowLeft size={24} color="#1a365d" />
          </Pressable>
          <Pressable
            onPress={() =>
              contact.type === 'facility'
                ? router.push(`/facility/${id}`)
                : router.push(`/caregiver/${id}`)
            }
            className="flex-1 flex-row items-center ml-2"
          >
            <DefaultAvatar uri={contact.avatar} size={40} />
            <View className="ml-3">
              <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                {contact.displayName}
              </Text>
              <Text className="text-green-500 text-sm">Online</Text>
            </View>
          </Pressable>
          <View className="flex-row gap-2">
            {contact.phone ? (
              <Pressable
                onPress={handleCall}
                className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100"
              >
                <Phone size={20} color="#1a365d" />
              </Pressable>
            ) : null}
            <Pressable
              onPress={handleMoreOptions}
              className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100"
            >
              <MoreVertical size={20} color="#1a365d" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View className="items-center py-10">
              <DefaultAvatar uri={contact.avatar} size={80} />
              <Text className="text-gray-900 font-semibold mt-4">{contact.displayName}</Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                Send a message to start the conversation
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {messages.map((message, index) => {
                const isUser = message.senderId === effectiveUser.id;
                return (
                  <Animated.View
                    key={message.id}
                    entering={FadeInUp.duration(300).delay(Math.min(index * 30, 300))}
                    className={`flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser ? (
                      <View className="mr-2">
                        <DefaultAvatar uri={contact.avatar} size={32} />
                      </View>
                    ) : null}
                    <View
                      className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                        isUser
                          ? 'bg-[#1a365d] rounded-br-sm'
                          : 'bg-white rounded-bl-sm'
                      }`}
                      style={!isUser ? { elevation: 1 } : undefined}
                    >
                      <Text className={isUser ? 'text-white' : 'text-gray-800'}>
                        {message.content}
                      </Text>
                      <Text
                        className={`text-xs mt-1 ${
                          isUser ? 'text-white/60' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <SafeAreaView edges={['bottom']} className="bg-white border-t border-gray-100">
          <View className="flex-row items-end px-4 py-3 gap-3">
            <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 max-h-32">
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                className="text-gray-900 text-base"
                style={{ maxHeight: 100 }}
              />
            </View>
            <Pressable
              onPress={handleSend}
              disabled={!messageText.trim() || sending}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                messageText.trim() && !sending ? 'bg-[#1a365d]' : 'bg-gray-200'
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Send size={20} color={messageText.trim() ? 'white' : '#9CA3AF'} />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
