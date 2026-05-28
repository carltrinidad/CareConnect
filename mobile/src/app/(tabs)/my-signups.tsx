import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  Hourglass,
  Award,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAppStore, VolunteerSignup } from '@/lib/store';
import { cn } from '@/lib/cn';

const PURPLE_ACCENT = '#8B5CF6';
const PURPLE_LIGHT = '#EDE9FE';
const PURPLE_DARK = '#7C3AED';

type FilterStatus = 'all' | 'upcoming' | 'completed' | 'cancelled';

const statusConfig = {
  pending: {
    icon: Hourglass,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    label: 'Pending',
  },
  confirmed: {
    icon: CheckCircle,
    color: '#10B981',
    bgColor: '#D1FAE5',
    label: 'Confirmed',
  },
  completed: {
    icon: Award,
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    label: 'Completed',
  },
  cancelled: {
    icon: XCircle,
    color: '#EF4444',
    bgColor: '#FEE2E2',
    label: 'Cancelled',
  },
};

export default function MySignupsScreen() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSignup, setSelectedSignup] = useState<VolunteerSignup | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Use store data for signups
  const signups = useAppStore((s) => s.volunteerSignups);
  const cancelVolunteerSignup = useAppStore((s) => s.cancelVolunteerSignup);

  // Calculate total hours
  const totalHours = signups
    .filter((s: VolunteerSignup) => s.status === 'completed')
    .reduce((acc: number, s: VolunteerSignup) => acc + (s.hoursLogged ?? 0), 0);

  const completedCount = signups.filter((s: VolunteerSignup) => s.status === 'completed').length;

  // Filter signups
  const filteredSignups = signups.filter((signup: VolunteerSignup) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'upcoming') return signup.status === 'pending' || signup.status === 'confirmed';
    return signup.status === filterStatus;
  });

  const handleCancelPress = (signup: VolunteerSignup) => {
    setSelectedSignup(signup);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedSignup) return;
    setIsCancelling(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    cancelVolunteerSignup(selectedSignup.id);
    setIsCancelling(false);
    setShowCancelModal(false);
    setSelectedSignup(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-5 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: PURPLE_LIGHT }}
            >
              <Calendar size={20} color={PURPLE_ACCENT} />
            </View>
            <View>
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">My Signups</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Track your volunteer activities</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="flex-row gap-3 mt-4"
        >
          <View
            className="flex-1 rounded-xl p-4 items-center"
            style={{ backgroundColor: PURPLE_LIGHT }}
          >
            <Text style={{ color: PURPLE_DARK }} className="text-2xl font-bold">
              {totalHours}
            </Text>
            <Text style={{ color: PURPLE_ACCENT }} className="text-sm mt-1">
              Hours Volunteered
            </Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-xl p-4 items-center">
            <Text className="text-green-700 text-2xl font-bold">{completedCount}</Text>
            <Text className="text-green-600 text-sm mt-1">Completed</Text>
          </View>
          <View className="flex-1 bg-amber-50 rounded-xl p-4 items-center">
            <Text className="text-amber-700 text-2xl font-bold">
              {signups.filter((s: VolunteerSignup) => s.status === 'pending' || s.status === 'confirmed').length}
            </Text>
            <Text className="text-amber-600 text-sm mt-1">Upcoming</Text>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            className="mt-4"
          >
            <View className="flex-row gap-2">
              {(['all', 'upcoming', 'completed', 'cancelled'] as FilterStatus[]).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setFilterStatus(status)}
                  className={cn(
                    'px-4 py-2 rounded-full',
                    filterStatus === status ? '' : 'bg-gray-100 dark:bg-gray-700'
                  )}
                  style={filterStatus === status ? { backgroundColor: PURPLE_ACCENT } : undefined}
                >
                  <Text
                    className={cn(
                      'font-medium capitalize',
                      filterStatus === status ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Signups List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-4">
          {filteredSignups.length > 0 ? (
            <View className="gap-4">
              {filteredSignups.map((signup: VolunteerSignup, index: number) => (
                <SignupCard
                  key={signup.id}
                  signup={signup}
                  index={index}
                  onCancelPress={() => handleCancelPress(signup)}
                />
              ))}
            </View>
          ) : (
            <View className="items-center py-12">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: PURPLE_LIGHT }}
              >
                <Calendar size={32} color={PURPLE_ACCENT} />
              </View>
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">No signups yet</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 px-8">
                Browse facilities and sign up to start volunteering
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/volunteer')}
                className="mt-4 px-6 py-3 rounded-full"
                style={{ backgroundColor: PURPLE_ACCENT }}
              >
                <Text className="text-white font-semibold">Find Places to Volunteer</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View className="h-6" />
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-5">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center">
                <AlertCircle size={32} color="#EF4444" />
              </View>
            </View>

            <Text className="text-gray-900 dark:text-white text-xl font-bold text-center">
              Cancel Signup?
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
              Are you sure you want to cancel your signup at {selectedSignup?.facilityName}?
            </Text>

            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 dark:text-gray-300 font-semibold">Keep Signup</Text>
              </Pressable>
              <Pressable
                onPress={handleCancelConfirm}
                disabled={isCancelling}
                className="flex-1 bg-red-500 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">
                  {isCancelling ? 'Cancelling...' : 'Cancel Signup'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SignupCard({
  signup,
  index,
  onCancelPress,
}: {
  signup: VolunteerSignup;
  index: number;
  onCancelPress: () => void;
}) {
  const config = statusConfig[signup.status];
  const StatusIcon = config.icon;
  const canCancel = signup.status === 'pending' || signup.status === 'confirmed';

  return (
    <Animated.View entering={FadeInRight.duration(400).delay(index * 80)}>
      <View
        className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden"
        style={{ elevation: 2 }}
      >
        {/* Status Header */}
        <View
          className="flex-row items-center justify-between px-4 py-2"
          style={{ backgroundColor: config.bgColor }}
        >
          <View className="flex-row items-center">
            <StatusIcon size={16} color={config.color} />
            <Text className="font-semibold ml-2" style={{ color: config.color }}>
              {config.label}
            </Text>
          </View>
          {signup.hoursLogged ? (
            <Text className="text-sm" style={{ color: config.color }}>
              {signup.hoursLogged} hours logged
            </Text>
          ) : null}
        </View>

        <View className="p-4">
          {/* Facility Info */}
          <View className="flex-row">
            <Image
              source={{ uri: signup.facilityImage }}
              className="w-16 h-16 rounded-xl"
            />
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 dark:text-white font-bold" numberOfLines={1}>
                {signup.facilityName}
              </Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={12} color="#9CA3AF" />
                <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1" numberOfLines={1}>
                  {signup.facilityAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Day & Time */}
          <View className="flex-row mt-3 gap-4">
            <View className="flex-row items-center">
              <Calendar size={14} color={PURPLE_ACCENT} />
              <Text className="text-gray-700 dark:text-gray-300 text-sm ml-1">
                {signup.dayOfWeek}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={14} color={PURPLE_ACCENT} />
              <Text className="text-gray-700 dark:text-gray-300 text-sm ml-1">
                {signup.startTime} - {signup.endTime}
              </Text>
            </View>
          </View>

          {/* Cancel Button */}
          {canCancel ? (
            <Pressable
              onPress={onCancelPress}
              className="mt-3 flex-row items-center justify-center py-2 border border-red-200 rounded-xl bg-red-50"
            >
              <XCircle size={16} color="#EF4444" />
              <Text className="text-red-500 font-medium ml-2">Cancel Signup</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}
