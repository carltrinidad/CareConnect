import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  MapPin,
  Award,
  Building2,
  Heart,
  Calendar,
  Edit3,
  Clock,
  CheckCircle,
  Briefcase,
  ImageIcon,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAppStore, ElderlyProfile, CaregiverProfile, FacilityProfile, VolunteerProfile } from '@/lib/store';
import { DefaultAvatar } from '@/components/DefaultAvatar';

const PURPLE_ACCENT = '#8B5CF6';
const PURPLE_LIGHT = '#EDE9FE';
const PURPLE_DARK = '#7C3AED';

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const userType = useAppStore((s) => s.userType);
  const logout = useAppStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace('/onboarding');
  };

  const menuItems = [
    { icon: User, label: 'Edit Profile', route: userType === 'facility' ? '/edit-facility' : '/edit-profile' },
    { icon: Bell, label: 'Notifications', route: '/notifications' },
    { icon: Shield, label: 'Privacy & Security', route: '/privacy' },
    { icon: HelpCircle, label: 'Help & Support', route: '/support' },
  ];

  const renderElderlyProfile = () => {
    const user = currentUser as ElderlyProfile;
    return (
      <View className="mt-4 gap-3">
        {user.preferredCareType ? (
          <View className="flex-row items-center bg-rose-50 rounded-xl p-4">
            <Heart size={20} color="#E8847C" />
            <View className="ml-3">
              <Text className="text-rose-600 text-sm">Preferred Care</Text>
              <Text className="text-rose-800 font-semibold capitalize">
                {user.preferredCareType === 'both'
                  ? 'Board & Care + Private Caregiver'
                  : user.preferredCareType.replace('_', ' ')}
              </Text>
            </View>
          </View>
        ) : null}
        {user.careNeeds && user.careNeeds.length > 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-2">Care Needs</Text>
            <View className="flex-row flex-wrap gap-2">
              {user.careNeeds.map((need) => (
                <View key={need} className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                  <Text className="text-gray-700 dark:text-gray-300 text-sm">{need}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderCaregiverProfile = () => {
    const user = currentUser as CaregiverProfile;
    return (
      <View className="mt-4 gap-3">
        {/* Stats Row */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-amber-50 rounded-xl p-4 items-center">
            <View className="flex-row items-center">
              <Star size={18} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-amber-700 text-xl font-bold ml-1">
                {user.rating > 0 ? user.rating : 'New'}
              </Text>
            </View>
            <Text className="text-amber-600 text-sm mt-1">Rating</Text>
          </View>
          <View className="flex-1 bg-blue-50 rounded-xl p-4 items-center">
            <Text className="text-blue-700 text-xl font-bold">{user.experience}</Text>
            <Text className="text-blue-600 text-sm mt-1">Years Exp.</Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-xl p-4 items-center">
            <Text className="text-green-700 text-xl font-bold">
              ${user.hourlyRate ?? '0'}
            </Text>
            <Text className="text-green-600 text-sm mt-1">Per Hour</Text>
          </View>
        </View>

        {/* Certifications */}
        {user.certifications && user.certifications.length > 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <Award size={18} color="#1a365d" />
              <Text className="text-gray-900 dark:text-white font-semibold ml-2">Certifications</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {user.certifications.map((cert) => (
                <View key={cert} className="bg-green-50 px-3 py-1.5 rounded-full">
                  <Text className="text-green-700 text-sm">{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Specializations */}
        {user.specializations && user.specializations.length > 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-2">Specializations</Text>
            <View className="flex-row flex-wrap gap-2">
              {user.specializations.map((spec) => (
                <View key={spec} className="bg-blue-50 px-3 py-1.5 rounded-full">
                  <Text className="text-blue-700 text-sm">{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderFacilityProfile = () => {
    const user = currentUser as FacilityProfile;
    return (
      <View className="mt-4 gap-3">
        {/* Hiring Status Banner */}
        {user.isHiring ? (
          <View className="flex-row items-center bg-green-500 rounded-xl p-4">
            <Briefcase size={20} color="white" />
            <Text className="text-white font-semibold ml-3">Currently Hiring Caregivers</Text>
          </View>
        ) : null}

        {/* Volunteer Status Banner */}
        {user.acceptingVolunteers ? (
          <View className="flex-row items-center bg-purple-500 rounded-xl p-4">
            <Heart size={20} color="white" />
            <View className="ml-3 flex-1">
              <Text className="text-white font-semibold">Accepting Volunteers</Text>
              {user.volunteerHours && user.volunteerHours.length > 0 ? (
                <Text className="text-white/80 text-sm">
                  {user.volunteerHours.length} time slot{user.volunteerHours.length !== 1 ? 's' : ''} available
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Edit Facility Button */}
        <Pressable
          onPress={() => router.push('/edit-facility')}
          className="flex-row items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4"
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
              <Edit3 size={18} color="#22C55E" />
            </View>
            <View className="ml-3">
              <Text className="text-gray-900 dark:text-white font-semibold">Edit Facility Details</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Photos, address, hiring status</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </Pressable>

        {/* Facility Photos */}
        {user.images && user.images.length > 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <ImageIcon size={18} color="#22C55E" />
              <Text className="text-gray-900 dark:text-white font-semibold ml-2">Facility Photos</Text>
              <Text className="text-gray-400 dark:text-gray-500 text-sm ml-2">({user.images.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {user.images.slice(0, 5).map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img }}
                    className="w-20 h-20 rounded-lg"
                    resizeMode="cover"
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {/* Stats Row */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-blue-50 rounded-xl p-4 items-center">
            <Text className="text-blue-700 text-xl font-bold">{user.capacity}</Text>
            <Text className="text-blue-600 text-sm mt-1">Capacity</Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-xl p-4 items-center">
            <Text className="text-green-700 text-xl font-bold">
              {user.capacity - user.currentResidents}
            </Text>
            <Text className="text-green-600 text-sm mt-1">Available</Text>
          </View>
          <View className="flex-1 bg-amber-50 rounded-xl p-4 items-center">
            <View className="flex-row items-center">
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-amber-700 text-xl font-bold ml-1">
                {user.rating > 0 ? user.rating : 'New'}
              </Text>
            </View>
            <Text className="text-amber-600 text-sm mt-1">Rating</Text>
          </View>
        </View>

        {/* Address */}
        {user.address ? (
          <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4">
            <Building2 size={20} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Facility Address</Text>
              <Text className="text-gray-900 dark:text-white font-medium">{user.address}</Text>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/edit-facility')}
            className="flex-row items-center bg-amber-50 rounded-xl p-4"
          >
            <MapPin size={20} color="#F59E0B" />
            <View className="ml-3 flex-1">
              <Text className="text-amber-700 font-medium">Add Facility Address</Text>
              <Text className="text-amber-600 text-sm">Tap to add your address</Text>
            </View>
            <ChevronRight size={20} color="#F59E0B" />
          </Pressable>
        )}

        {/* Services */}
        {user.services && user.services.length > 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-2">Services Offered</Text>
            <View className="flex-row flex-wrap gap-2">
              {user.services.map((service) => (
                <View key={service} className="bg-green-50 px-3 py-1.5 rounded-full">
                  <Text className="text-green-700 text-sm">{service}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderVolunteerProfile = () => {
    const user = currentUser as VolunteerProfile;
    return (
      <View className="mt-4 gap-3">
        {/* Stats Row */}
        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-xl p-4 items-center"
            style={{ backgroundColor: PURPLE_LIGHT }}
          >
            <View className="flex-row items-center">
              <Clock size={18} color={PURPLE_ACCENT} />
              <Text style={{ color: PURPLE_DARK }} className="text-xl font-bold ml-1">
                {user.totalHours ?? 0}
              </Text>
            </View>
            <Text style={{ color: PURPLE_ACCENT }} className="text-sm mt-1">
              Hours
            </Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-xl p-4 items-center">
            <View className="flex-row items-center">
              <CheckCircle size={18} color="#10B981" />
              <Text className="text-green-700 text-xl font-bold ml-1">
                {user.completedSignups ?? 0}
              </Text>
            </View>
            <Text className="text-green-600 text-sm mt-1">Completed</Text>
          </View>
          <View className="flex-1 bg-amber-50 rounded-xl p-4 items-center">
            <Text className="text-amber-700 text-xl font-bold capitalize">
              {user.status}
            </Text>
            <Text className="text-amber-600 text-sm mt-1">Status</Text>
          </View>
        </View>

        {/* Skills */}
        {user.skills && user.skills.length > 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <Heart size={18} color={PURPLE_ACCENT} />
              <Text className="text-gray-900 dark:text-white font-semibold ml-2">Skills & Interests</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {user.skills.map((skill) => (
                <View
                  key={skill}
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: PURPLE_LIGHT }}
                >
                  <Text style={{ color: PURPLE_DARK }} className="text-sm">
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Availability */}
        {user.availability && user.availability.length > 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <Calendar size={18} color={PURPLE_ACCENT} />
              <Text className="text-gray-900 dark:text-white font-semibold ml-2">Availability</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {user.availability.map((day) => (
                <View key={day} className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                  <Text className="text-gray-700 dark:text-gray-300 text-sm">{day}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* School */}
        {user.school ? (
          <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4">
            <Award size={20} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">School / Organization</Text>
              <Text className="text-gray-900 dark:text-white font-medium">{user.school}</Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-5 pt-4 pb-20"
          style={{ backgroundColor: userType === 'volunteer' ? PURPLE_ACCENT : '#1a365d' }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl font-bold">Profile</Text>
            <Pressable
              onPress={() => router.push('/settings')}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Settings size={20} color="white" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(100)}
          className="mx-5 -mt-14 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg"
          style={{ elevation: 4 }}
        >
          <View className="flex-row items-center">
            <View className="relative">
              <DefaultAvatar uri={currentUser?.avatar} size={80} />
              <Pressable
                onPress={() => router.push(userType === 'facility' ? '/edit-facility' : '/edit-profile')}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center border-2 border-white"
                style={{ backgroundColor: userType === 'volunteer' ? PURPLE_ACCENT : '#1a365d' }}
              >
                <Edit3 size={12} color="white" />
              </Pressable>
            </View>
            <View className="flex-1 ml-4">
              <View className="flex-row items-center flex-wrap gap-x-2">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  {userType === 'facility'
                    ? (currentUser as FacilityProfile)?.facilityName
                    : currentUser?.name}
                </Text>
                {currentUser?.verified && (
                  <View className="bg-blue-500 rounded-full p-0.5">
                    <CheckCircle size={16} color="white" fill="white" />
                  </View>
                )}
              </View>
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#9CA3AF" />
                <Text className="text-gray-500 dark:text-gray-400 ml-1">
                  {currentUser?.location ?? 'Add location'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                <View
                  className="self-start px-3 py-1 rounded-full"
                  style={{ backgroundColor: userType === 'volunteer' ? PURPLE_LIGHT : '#F3F4F6' }}
                >
                  <Text
                    className="text-sm capitalize"
                    style={{ color: userType === 'volunteer' ? PURPLE_DARK : '#4B5563' }}
                  >
                    {userType === 'elderly'
                      ? 'Senior/Family'
                      : userType === 'facility'
                      ? 'Board & Care'
                      : userType}
                  </Text>
                </View>
                {currentUser?.verified && (
                  <View className="bg-blue-50 px-2 py-1 rounded-full flex-row items-center gap-1 self-start">
                    <CheckCircle size={11} color="#3B82F6" fill="#3B82F6" />
                    <Text className="text-blue-600 text-xs font-medium">Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* User Type Specific Info */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(150)}
          className="px-5"
        >
          {userType === 'elderly' && renderElderlyProfile()}
          {userType === 'caregiver' && renderCaregiverProfile()}
          {userType === 'facility' && renderFacilityProfile()}
          {userType === 'volunteer' && renderVolunteerProfile()}
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          className="mx-5 mt-6 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden"
          style={{ elevation: 2 }}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as any)}
                className={`flex-row items-center px-5 py-4 active:bg-gray-50 dark:active:bg-gray-700 ${
                  index < menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <View className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center">
                  <Icon size={20} color="#6B7280" />
                </View>
                <Text className="flex-1 text-gray-900 dark:text-white font-medium ml-4">{item.label}</Text>
                <ChevronRight size={20} color="#9CA3AF" />
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Logout */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(250)}
          className="mx-5 mt-4 mb-8"
        >
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center bg-red-50 rounded-2xl py-4 active:bg-red-100"
          >
            <LogOut size={20} color="#DC2626" />
            <Text className="text-red-600 font-semibold ml-2">Log Out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
