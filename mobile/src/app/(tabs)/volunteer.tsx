import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  MapPin,
  Clock,
  Users,
  Filter,
  X,
  Heart,
  ChevronRight,
  Star,
  Calendar,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import { getFacilities, FacilityData, VolunteerTimeSlotData } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/lib/store';

const PURPLE_ACCENT = '#8B5CF6';
const PURPLE_LIGHT = '#EDE9FE';
const PURPLE_DARK = '#7C3AED';

export default function VolunteerScreen() {
  const router = useRouter();
  const userType = useAppStore((s) => s.userType);
  const currentUser = useAppStore((s) => s.currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const loadFacilities = async () => {
      setLoading(true);
      const data = await getFacilities();
      setFacilities(data);
      setLoading(false);
    };
    loadFacilities();
  }, []);

  // Filter facilities that have volunteer hours
  const facilitiesWithVolunteerHours = useMemo(() => {
    return facilities.filter((f) => {
      const hasVolunteerHours = f.volunteerHours && f.volunteerHours.length > 0 && f.acceptingVolunteers !== false;
      const matchesSearch =
        searchQuery === '' ||
        f.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDay =
        !selectedDay ||
        f.volunteerHours?.some((vh) => vh.dayOfWeek === selectedDay);

      return hasVolunteerHours && matchesSearch && matchesDay;
    });
  }, [facilities, searchQuery, selectedDay]);

  const clearFilters = () => {
    setSelectedDay(null);
    setSearchQuery('');
  };

  // Check if user needs to complete volunteer registration
  const needsRegistration = userType !== 'volunteer' || !currentUser;

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
              <Heart size={20} color={PURPLE_ACCENT} fill={PURPLE_ACCENT} />
            </View>
            <View>
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">Volunteer</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Find places to volunteer</Text>
            </View>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="mt-4 flex-row items-center rounded-xl px-4 py-3"
          style={{ backgroundColor: PURPLE_LIGHT }}
        >
          <Search size={20} color={PURPLE_ACCENT} />
          <TextInput
            placeholder="Search board & care facilities..."
            placeholderTextColor="#A78BFA"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} className="p-1">
              <X size={18} color={PURPLE_ACCENT} />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* Day Filter */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {daysOfWeek.map((day) => (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(selectedDay === day ? null : day)}
                className={cn(
                  'px-4 py-2 rounded-full',
                  selectedDay === day ? '' : 'bg-gray-100 dark:bg-gray-700'
                )}
                style={selectedDay === day ? { backgroundColor: PURPLE_ACCENT } : undefined}
              >
                <Text
                  className={cn(
                    'font-medium',
                    selectedDay === day ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {day.slice(0, 3)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Info Banner (if not a volunteer) */}
      {needsRegistration ? (
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <View
            className="mx-5 mt-4 rounded-2xl p-4 flex-row items-center"
            style={{ backgroundColor: PURPLE_ACCENT }}
          >
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
              <Heart size={24} color="white" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white font-bold text-lg">Want to Volunteer?</Text>
              <Text className="text-white/80 text-sm">
                Create a volunteer account to sign up for time slots
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : null}

      {/* Facilities List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-4">
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">
            Board & Care Facilities Accepting Volunteers
          </Text>

          <View className="gap-4">
            {facilitiesWithVolunteerHours.map((facility, index) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                index={index}
                router={router}
                selectedDay={selectedDay}
              />
            ))}
          </View>

          {facilitiesWithVolunteerHours.length === 0 ? (
            <View className="items-center py-12">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: PURPLE_LIGHT }}
              >
                <Search size={32} color={PURPLE_ACCENT} />
              </View>
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">No facilities found</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 px-8">
                Try adjusting your search or day filter
              </Text>
              {selectedDay ? (
                <Pressable
                  onPress={clearFilters}
                  className="mt-4 px-6 py-3 rounded-full"
                  style={{ backgroundColor: PURPLE_ACCENT }}
                >
                  <Text className="text-white font-semibold">Clear Filters</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function FacilityCard({
  facility,
  index,
  router,
  selectedDay,
}: {
  facility: FacilityData;
  index: number;
  router: ReturnType<typeof useRouter>;
  selectedDay: string | null;
}) {
  const volunteerHours = selectedDay
    ? facility.volunteerHours?.filter((vh: { dayOfWeek: string }) => vh.dayOfWeek === selectedDay)
    : facility.volunteerHours;

  return (
    <Animated.View entering={FadeInRight.duration(400).delay(index * 80)}>
      <Link href={`/facility/${facility.id}?volunteer=true`} asChild>
        <Pressable
          className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden active:opacity-90"
          style={{ elevation: 2 }}
        >
          {/* Facility Image */}
          <View className="relative">
            <Image
              source={{ uri: facility.images[0] }}
              className="w-full h-32"
              resizeMode="cover"
            />
            <View
              className="absolute top-3 left-3 px-3 py-1.5 rounded-full flex-row items-center"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.9)' }}
            >
              <Heart size={12} color="white" fill="white" />
              <Text className="text-white text-xs font-semibold ml-1">
                Volunteers Welcome
              </Text>
            </View>
          </View>

          <View className="p-4">
            {/* Title & Location */}
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">{facility.facilityName}</Text>
                <View className="flex-row items-center mt-1">
                  <MapPin size={14} color="#9CA3AF" />
                  <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">{facility.location}</Text>
                </View>
              </View>
              <View className="flex-row items-center ml-2">
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1">{facility.rating}</Text>
              </View>
            </View>

            {/* Volunteer Hours */}
            <View className="mt-4">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold text-sm mb-2">Volunteer Hours:</Text>
              <View className="gap-2">
                {volunteerHours?.slice(0, 3).map((vh: VolunteerTimeSlotData) => (
                  <View
                    key={vh.id}
                    className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                  >
                    <View className="flex-row items-center">
                      <Calendar size={14} color={PURPLE_ACCENT} />
                      <Text className="text-gray-700 dark:text-gray-300 text-sm ml-2 font-medium">{vh.dayOfWeek}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={14} color={PURPLE_ACCENT} />
                      <Text className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                        {vh.startTime} - {vh.endTime}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Users size={14} color="#10B981" />
                      <Text className="text-green-600 text-sm ml-1 font-medium">
                        {vh.spotsAvailable} spots
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Contact */}
            <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex-row items-center justify-between">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">{facility.phone}</Text>
              <View
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: PURPLE_LIGHT }}
              >
                <Text style={{ color: PURPLE_DARK }} className="font-semibold text-sm">
                  View Details
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  );
}
