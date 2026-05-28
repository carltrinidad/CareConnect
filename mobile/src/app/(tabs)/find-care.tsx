import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  MapPin,
  Star,
  Filter,
  Clock,
  DollarSign,
  Award,
  SlidersHorizontal,
  X,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import { CaregiverProfile } from '@/lib/store';
import { cn } from '@/lib/cn';

type AvailabilityFilter = 'all' | 'full_time' | 'part_time' | 'live_in' | 'flexible';
type SortOption = 'rating' | 'experience' | 'price_low' | 'price_high';

const availabilityOptions: { value: AvailabilityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'live_in', label: 'Live-In' },
  { value: 'flexible', label: 'Flexible' },
];

const specializationFilters = [
  'Dementia Care',
  'Mobility Assistance',
  'Medication Management',
  'Companionship',
  'Meal Preparation',
  'Post-Surgery Care',
  'Diabetic Care',
  'Memory Care',
];

export default function FindCareScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [showFilters, setShowFilters] = useState(false);

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const filteredCaregivers: CaregiverProfile[] = [];

  const clearFilters = () => {
    setAvailabilityFilter('all');
    setSelectedSpecializations([]);
    setSortBy('rating');
  };

  const hasActiveFilters =
    availabilityFilter !== 'all' || selectedSpecializations.length > 0 || sortBy !== 'rating';

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-5 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Find Care</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Hire caregivers for your home or facility
          </Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="mt-4 flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3"
        >
          <Search size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search by name, location, or skill..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} className="p-1">
              <X size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* Filter Toggle */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          className="flex-row items-center justify-between mt-4"
        >
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            className={cn(
              'flex-row items-center px-4 py-2 rounded-full',
              showFilters || hasActiveFilters ? 'bg-[#1a365d]' : 'bg-gray-100 dark:bg-gray-700'
            )}
          >
            <SlidersHorizontal
              size={16}
              color={showFilters || hasActiveFilters ? 'white' : '#6B7280'}
            />
            <Text
              className={cn(
                'ml-2 font-medium',
                showFilters || hasActiveFilters ? 'text-white' : 'text-gray-600 dark:text-gray-400'
              )}
            >
              Filters
              {hasActiveFilters && ` (${selectedSpecializations.length + (availabilityFilter !== 'all' ? 1 : 0)})`}
            </Text>
          </Pressable>

          <View className="flex-row items-center">
            <Text className="text-gray-500 dark:text-gray-400 text-sm mr-2">Sort:</Text>
            <Pressable
              onPress={() => {
                const options: SortOption[] = ['rating', 'experience', 'price_low', 'price_high'];
                const currentIndex = options.indexOf(sortBy);
                setSortBy(options[(currentIndex + 1) % options.length]);
              }}
              className="flex-row items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full"
            >
              <Text className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                {sortBy === 'rating'
                  ? 'Top Rated'
                  : sortBy === 'experience'
                  ? 'Experience'
                  : sortBy === 'price_low'
                  ? 'Price: Low'
                  : 'Price: High'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {/* Filters Panel */}
      {showFilters ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="bg-white dark:bg-gray-900 px-5 py-4 border-b border-gray-100 dark:border-gray-800"
        >
          {/* Availability */}
          <Text className="text-gray-900 dark:text-white font-semibold mb-3">Availability</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            className="mb-4"
          >
            <View className="flex-row gap-2">
              {availabilityOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setAvailabilityFilter(option.value)}
                  className={cn(
                    'px-4 py-2 rounded-full',
                    availabilityFilter === option.value ? 'bg-[#1a365d]' : 'bg-gray-100 dark:bg-gray-700'
                  )}
                >
                  <Text
                    className={cn(
                      'font-medium',
                      availabilityFilter === option.value ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Specializations */}
          <Text className="text-gray-900 dark:text-white font-semibold mb-3">Specializations</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {specializationFilters.map((spec) => (
              <Pressable
                key={spec}
                onPress={() => toggleSpecialization(spec)}
                className={cn(
                  'flex-row items-center px-3 py-2 rounded-full border',
                  selectedSpecializations.includes(spec)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                )}
              >
                {selectedSpecializations.includes(spec) ? (
                  <Check size={14} color="#3B82F6" className="mr-1" />
                ) : null}
                <Text
                  className={cn(
                    'text-sm',
                    selectedSpecializations.includes(spec) ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {spec}
                </Text>
              </Pressable>
            ))}
          </View>

          {hasActiveFilters ? (
            <Pressable
              onPress={clearFilters}
              className="self-start px-4 py-2 rounded-full bg-red-50"
            >
              <Text className="text-red-600 font-medium">Clear All Filters</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}

      {/* Results */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-4">
          <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            {filteredCaregivers.length} caregiver{filteredCaregivers.length !== 1 ? 's' : ''} found
          </Text>

          <View className="gap-4">
            {filteredCaregivers.map((caregiver, index) => (
              <CaregiverCard key={caregiver.id} caregiver={caregiver} index={index} router={router} />
            ))}
          </View>

          {filteredCaregivers.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
                <Search size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">No caregivers found</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 px-8">
                Try adjusting your filters or search terms
              </Text>
              {hasActiveFilters ? (
                <Pressable
                  onPress={clearFilters}
                  className="mt-4 px-6 py-3 bg-[#1a365d] rounded-full"
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

function CaregiverCard({
  caregiver,
  index,
  router,
}: {
  caregiver: CaregiverProfile;
  index: number;
  router: ReturnType<typeof useRouter>;
}) {
  const availabilityColors = {
    full_time: { bg: 'bg-green-50', text: 'text-green-700' },
    part_time: { bg: 'bg-blue-50', text: 'text-blue-700' },
    live_in: { bg: 'bg-purple-50', text: 'text-purple-700' },
    flexible: { bg: 'bg-amber-50', text: 'text-amber-700' },
  };

  const colors = availabilityColors[caregiver.availability];

  return (
    <Animated.View entering={FadeInRight.duration(400).delay(index * 80)}>
      <Pressable
        onPress={() => router.push(`/caregiver/${caregiver.id}`)}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 active:scale-[0.98]"
        style={{ elevation: 2 }}
      >
        <View className="flex-row">
          <View className="relative">
            <Image source={{ uri: caregiver.avatar }} className="w-20 h-20 rounded-xl" />
            {caregiver.verified ? (
              <View className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-full border-2 border-white dark:border-gray-800">
                <Check size={10} color="white" />
              </View>
            ) : null}
          </View>
          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 dark:text-white text-lg font-bold">{caregiver.name}</Text>
              <View className={cn('px-2 py-1 rounded-full', colors.bg)}>
                <Text className={cn('text-xs font-medium', colors.text)}>
                  {caregiver.availability.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center mt-1 gap-3">
              <View className="flex-row items-center">
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1">{caregiver.rating}</Text>
              </View>
              <View className="flex-row items-center">
                <Clock size={14} color="#9CA3AF" />
                <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">{caregiver.experience} yrs</Text>
              </View>
              <View className="flex-row items-center">
                <MapPin size={14} color="#9CA3AF" />
                <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1" numberOfLines={1}>
                  {caregiver.location?.split(',')[0]}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center mt-2">
              <DollarSign size={16} color="#1a365d" />
              <Text className="text-[#1a365d] font-bold">{caregiver.hourlyRate}/hr</Text>
            </View>
          </View>
        </View>

        <Text className="text-gray-600 dark:text-gray-400 text-sm mt-3" numberOfLines={2}>
          {caregiver.bio}
        </Text>

        {/* Certifications */}
        <View className="flex-row items-center mt-3 gap-2">
          <Award size={14} color="#15803D" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-1">
              {caregiver.certifications.map((cert) => (
                <View key={cert} className="bg-green-50 px-2 py-1 rounded">
                  <Text className="text-green-700 text-xs font-medium">{cert}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Specializations */}
        <View className="flex-row flex-wrap gap-2 mt-3">
          {caregiver.specializations.slice(0, 3).map((spec) => (
            <View key={spec} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              <Text className="text-gray-600 dark:text-gray-400 text-xs">{spec}</Text>
            </View>
          ))}
          {caregiver.specializations.length > 3 ? (
            <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              <Text className="text-gray-500 dark:text-gray-400 text-xs">+{caregiver.specializations.length - 3}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Button */}
        <Pressable
          onPress={() => router.push(`/chat/${caregiver.id}`)}
          className="mt-4 bg-[#1a365d] rounded-xl py-3 items-center active:opacity-90"
        >
          <Text className="text-white font-semibold">Contact for Hiring</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
