import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';

const PURPLE_ACCENT = '#8B5CF6';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do I find a caregiver?',
    answer:
      'Browse caregivers in the Search tab, filter by your needs, and message them directly to discuss care arrangements.',
  },
  {
    question: 'How do I update my availability?',
    answer:
      'Go to your Profile, tap Edit Profile, and update your availability settings there.',
  },
  {
    question: 'How do I report a problem?',
    answer:
      'Use the Contact Support option below to send us an email describing the issue you encountered.',
  },
  {
    question: 'Is my information secure?',
    answer:
      'Yes, we use industry-standard encryption to protect your data. You can also adjust your privacy settings in the Privacy & Security section.',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const userType = useAppStore((s) => s.userType);

  const [expandedFAQ, setExpandedFAQ] = React.useState<number | null>(null);

  const getHeaderColor = () => {
    if (userType === 'volunteer') return PURPLE_ACCENT;
    if (userType === 'facility') return '#22C55E';
    if (userType === 'caregiver') return '#3B82F6';
    return '#1a365d';
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@boardandcare.app?subject=Support Request').catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+18005551234').catch(() => {
      Alert.alert('Error', 'Could not open phone app');
    });
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
          <Text className="text-white font-semibold text-lg">Help & Support</Text>
          <View className="w-10" />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          {/* Contact Options */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-gray-900 text-lg font-bold mb-2">Contact Us</Text>
            <Text className="text-gray-500 text-sm mb-4">
              Get in touch with our support team
            </Text>
          </Animated.View>

          <View className="gap-3 mb-6">
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <Pressable
                onPress={handleEmailSupport}
                className="bg-white rounded-xl p-4 flex-row items-center active:bg-gray-50"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${getHeaderColor()}15` }}
                >
                  <Mail size={20} color={getHeaderColor()} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold">Email Support</Text>
                  <Text className="text-gray-500 text-sm">support@boardandcare.app</Text>
                </View>
                <ExternalLink size={18} color="#9CA3AF" />
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(150)}>
              <Pressable
                onPress={handleCallSupport}
                className="bg-white rounded-xl p-4 flex-row items-center active:bg-gray-50"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${getHeaderColor()}15` }}
                >
                  <Phone size={20} color={getHeaderColor()} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold">Call Support</Text>
                  <Text className="text-gray-500 text-sm">1-800-555-1234</Text>
                </View>
                <ExternalLink size={18} color="#9CA3AF" />
              </Pressable>
            </Animated.View>
          </View>

          {/* FAQ Section */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text className="text-gray-900 text-lg font-bold mb-2">
              Frequently Asked Questions
            </Text>
            <Text className="text-gray-500 text-sm mb-4">
              Find answers to common questions
            </Text>
          </Animated.View>

          <View className="gap-3 mb-6">
            {FAQ_ITEMS.map((item, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.duration(400).delay(250 + index * 50)}
              >
                <Pressable
                  onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="bg-white rounded-xl overflow-hidden"
                >
                  <View className="p-4 flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${getHeaderColor()}15` }}
                    >
                      <HelpCircle size={20} color={getHeaderColor()} />
                    </View>
                    <Text className="flex-1 text-gray-900 font-semibold ml-3">
                      {item.question}
                    </Text>
                    <ChevronRight
                      size={20}
                      color="#9CA3AF"
                      style={{
                        transform: [{ rotate: expandedFAQ === index ? '90deg' : '0deg' }],
                      }}
                    />
                  </View>
                  {expandedFAQ === index ? (
                    <View className="px-4 pb-4">
                      <View className="bg-gray-50 rounded-lg p-3">
                        <Text className="text-gray-600 text-sm leading-5">
                          {item.answer}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Resources */}
          <Animated.View entering={FadeInDown.duration(400).delay(450)}>
            <Text className="text-gray-900 text-lg font-bold mb-2">Resources</Text>
            <Text className="text-gray-500 text-sm mb-4">
              Helpful guides and documentation
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
            <Pressable className="bg-white rounded-xl p-4 flex-row items-center active:bg-gray-50">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-50">
                <FileText size={20} color="#3B82F6" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold">Terms of Service</Text>
                <Text className="text-gray-500 text-sm">Read our terms</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(550)} className="mt-3 mb-8">
            <Pressable className="bg-white rounded-xl p-4 flex-row items-center active:bg-gray-50">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-green-50">
                <FileText size={20} color="#22C55E" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold">Privacy Policy</Text>
                <Text className="text-gray-500 text-sm">Read our privacy policy</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
