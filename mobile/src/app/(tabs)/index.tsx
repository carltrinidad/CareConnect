import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Star, Filter, Heart, Users, Building2 } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { getFacilities, FacilityData } from '@/lib/api';
import { cn } from '@/lib/cn';

type ViewMode = 'facilities' | 'caregivers';

export default function HomeScreen() {
  const router = useRouter();
  const userType = useAppStore((s) => s.userType);
  const currentUser = useAppStore((s) => s.currentUser);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('facilities');
  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    const data = await getFacilities();
    setFacilities(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  // Refetch facilities when tab comes back into focus
  useFocusEffect(
    useCallback(() => {
      loadFacilities();
    }, [loadFacilities])
  );

  const filteredFacilities = facilities.filter(
    (f) =>
      f.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text className="text-gray-500 dark:text-gray-400 text-base">{greeting()}</Text>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold mt-1">
              {currentUser?.name?.split(' ')[0] ?? 'Welcome'}
            </Text>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            className="mt-5 flex-row items-center bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700"
            style={{ elevation: 2 }}
          >
            <Search size={20} color="#9CA3AF" />
            <TextInput
              placeholder={viewMode === 'facilities' ? 'Search facilities...' : 'Search caregivers...'}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
            />
            <Pressable className="ml-2 p-1">
              <Filter size={20} color="#6B7280" />
            </Pressable>
          </Animated.View>
        </View>

        {/* View Mode Toggle */}
        {(userType === 'elderly' || userType === 'facility') ? (
          <Animated.View
            entering={FadeInDown.duration(500).delay(150)}
            className="px-5 mb-4"
          >
            <View className="flex-row bg-gray-200 dark:bg-gray-800 rounded-xl p-1">
              <Pressable
                onPress={() => setViewMode('facilities')}
                className={cn(
                  'flex-1 flex-row items-center justify-center py-3 rounded-lg',
                  viewMode === 'facilities' && 'bg-white'
                )}
              >
                <Building2 size={18} color={viewMode === 'facilities' ? '#1a365d' : '#6B7280'} />
                <Text
                  className={cn(
                    'ml-2 font-semibold',
                    viewMode === 'facilities' ? 'text-[#1a365d]' : 'text-gray-500'
                  )}
                >
                  Facilities
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setViewMode('caregivers')}
                className={cn(
                  'flex-1 flex-row items-center justify-center py-3 rounded-lg',
                  viewMode === 'caregivers' && 'bg-white'
                )}
              >
                <Users size={18} color={viewMode === 'caregivers' ? '#1a365d' : '#6B7280'} />
                <Text
                  className={cn(
                    'ml-2 font-semibold',
                    viewMode === 'caregivers' ? 'text-[#1a365d]' : 'text-gray-500'
                  )}
                >
                  Caregivers
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* Quick Stats for Facilities */}
        {userType === 'facility' ? (
          <Animated.View
            entering={FadeInDown.duration(500).delay(200)}
            className="px-5 mb-6"
          >
            <View className="flex-row gap-3">
              <View className="flex-1 bg-[#1a365d] rounded-2xl p-4">
                <Text className="text-white/70 text-sm">Available Spots</Text>
                <Text className="text-white text-3xl font-bold mt-1">4</Text>
              </View>
              <View className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">Applications</Text>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-1">12</Text>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* Facilities List */}
        {viewMode === 'facilities' ? (
          <View className="px-5 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold">
                {userType === 'elderly' ? 'Recommended for You' : 'Board & Care Facilities'}
              </Text>
              <Pressable>
                <Text className="text-[#1a365d] font-semibold">See All</Text>
              </Pressable>
            </View>

            <View className="gap-4">
              {filteredFacilities.map((facility, index) => (
                <Animated.View
                  key={facility.id}
                  entering={FadeInRight.duration(400).delay(200 + index * 100)}
                >
                  <Pressable
                    onPress={() => router.push(`/facility/${facility.id}`)}
                    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden active:opacity-90"
                    style={{ elevation: 2 }}
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: facility.images[0] }}
                        className="w-full h-40"
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          toggleFavorite(facility.id);
                        }}
                        className="absolute top-3 right-3 bg-white/90 p-2 rounded-full active:scale-95"
                      >
                        <Heart
                          size={18}
                          color="#E8847C"
                          fill={favorites.includes(facility.id) ? '#E8847C' : 'transparent'}
                        />
                      </Pressable>
                      {facility.licensed ? (
                        <View className="absolute bottom-3 left-3 bg-green-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-semibold">Licensed</Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="p-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-900 dark:text-white text-lg font-bold flex-1" numberOfLines={1}>
                          {facility.facilityName}
                        </Text>
                        <View className="flex-row items-center ml-2">
                          <Star size={14} color="#F59E0B" fill="#F59E0B" />
                          <Text className="text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1">
                            {facility.rating}
                          </Text>
                          <Text className="text-gray-400 text-sm ml-1">
                            ({facility.reviewCount})
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center mt-2">
                        <MapPin size={14} color="#9CA3AF" />
                        <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1" numberOfLines={1}>
                          {facility.location}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between mt-3">
                        <Text className="text-[#1a365d] dark:text-blue-400 font-bold">{facility.priceRange}</Text>
                        <Text className="text-gray-400 text-sm">
                          {facility.capacity - facility.currentResidents} spots available
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap gap-2 mt-3">
                        {facility.services.slice(0, 3).map((service) => (
                          <View key={service} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            <Text className="text-gray-600 dark:text-gray-300 text-xs">{service}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Caregivers List */}
        {viewMode === 'caregivers' ? (
          <View className="px-5 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold">
                {userType === 'facility' ? 'Available Caregivers' : 'Private Caregivers'}
              </Text>
              <Pressable>
                <Text className="text-[#1a365d] font-semibold">See All</Text>
              </Pressable>
            </View>

            <View className="items-center py-12">
              <Users size={48} color="#D1D5DB" />
              <Text className="text-gray-400 text-base font-medium mt-4">No caregivers yet</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center px-8">Caregivers who sign up will appear here</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
