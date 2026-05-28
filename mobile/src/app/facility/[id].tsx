import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Alert,
  Linking,
  Share,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Mail,
  Check,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Calendar,
  Users,
  X,
  Building2,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore, VolunteerSignup, VolunteerTimeSlot } from '@/lib/store';
import { getFacility, FacilityData, VolunteerTimeSlotData } from '@/lib/api';

const { width } = Dimensions.get('window');

export default function FacilityDetailScreen() {
  const { id, volunteer } = useLocalSearchParams<{ id: string; volunteer?: string }>();
  const router = useRouter();
  const userType = useAppStore((s) => s.userType);
  const currentUser = useAppStore((s) => s.currentUser);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const addVolunteerSignup = useAppStore((s) => s.addVolunteerSignup);
  const volunteerSignups = useAppStore((s) => s.volunteerSignups);

  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<VolunteerTimeSlot | null>(null);
  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFacility = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      // First try to fetch from API (for real facilities)
      const apiData = await getFacility(id);

      if (apiData) {
        setFacility(apiData);
      }
      setLoading(false);
    };

    loadFacility();
  }, [id]);

  const isFavorite = favorites.includes(id || '');
  const isVolunteer = userType === 'volunteer' || volunteer === 'true';

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1a365d" />
      </View>
    );
  }

  if (!facility) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Facility not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 bg-[#1a365d] rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleContact = () => {
    router.push({ pathname: `/chat/${facility.id}`, params: { contactType: 'facility' } });
  };

  const handleCall = () => {
    const phoneNumber = facility.phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Could not open phone app');
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${facility.facilityName} - ${facility.address}`,
        title: facility.facilityName,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share');
    }
  };

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(facility.id);
  };

  const handleSelectSlot = (slot: VolunteerTimeSlot | VolunteerTimeSlotData) => {
    setSelectedSlot(slot as VolunteerTimeSlot);
    setShowSignupModal(true);
  };

  const handleConfirmSignup = () => {
    if (!selectedSlot || !currentUser) return;

    // Check if already signed up for this slot
    const alreadySignedUp = volunteerSignups.some(
      (s) => s.facilityId === facility.id && s.timeSlotId === selectedSlot.id && s.status !== 'cancelled'
    );

    if (alreadySignedUp) {
      Alert.alert('Already Signed Up', 'You have already signed up for this time slot.');
      setShowSignupModal(false);
      return;
    }

    const newSignup: VolunteerSignup = {
      id: `signup-${Date.now()}`,
      visitorId: currentUser.id,
      visitorName: currentUser.name,
      visitorEmail: currentUser.email,
      visitorPhone: currentUser.phone,
      facilityId: facility.id,
      facilityName: facility.facilityName,
      facilityImage: facility.images[0] || '',
      facilityAddress: facility.address,
      timeSlotId: selectedSlot.id,
      dayOfWeek: selectedSlot.dayOfWeek,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      status: 'pending',
      signupDate: new Date().toISOString().split('T')[0],
    };

    addVolunteerSignup(newSignup);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSignupModal(false);
    Alert.alert(
      'Signed Up!',
      `You have signed up to volunteer at ${facility.facilityName} on ${selectedSlot.dayOfWeek} from ${selectedSlot.startTime} to ${selectedSlot.endTime}.`,
      [{ text: 'View My Signups', onPress: () => router.push('/(tabs)/my-signups') }, { text: 'OK' }]
    );
  };

  const isSlotSignedUp = (slotId: string) => {
    return volunteerSignups.some(
      (s) => s.facilityId === facility.id && s.timeSlotId === slotId && s.status !== 'cancelled'
    );
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Image */}
      <View style={{ height: 280 }} className="relative bg-gray-200">
        {facility.images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ width }}
          >
            {facility.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{ width, height: 280 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Building2 size={48} color="#9CA3AF" />
            <Text className="text-gray-400 mt-2">No photos yet</Text>
          </View>
        )}

        {/* Navigation Header */}
        <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0 z-10">
          <View className="flex-row items-center justify-between px-4 py-2">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/90 rounded-full items-center justify-center"
            >
              <ArrowLeft size={22} color="#1a365d" />
            </Pressable>
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleShare}
                className="w-10 h-10 bg-white/90 rounded-full items-center justify-center active:bg-white/70"
              >
                <Share2 size={20} color="#1a365d" />
              </Pressable>
              <Pressable
                onPress={handleToggleFavorite}
                className="w-10 h-10 bg-white/90 rounded-full items-center justify-center active:bg-white/70"
              >
                <Heart
                  size={20}
                  color="#E8847C"
                  fill={isFavorite ? '#E8847C' : 'transparent'}
                />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* Image indicators */}
        {facility.images.length > 1 ? (
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {facility.images.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </View>
        ) : null}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400)} className="p-5">
          {/* Title & Rating */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-gray-900 text-2xl font-bold">{facility.facilityName}</Text>
              <View className="flex-row items-center mt-2">
                <MapPin size={16} color="#6B7280" />
                <Text className="text-gray-500 ml-1 flex-1">{facility.address}</Text>
              </View>
            </View>
            {facility.licensed ? (
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-700 text-sm font-semibold">Licensed</Text>
              </View>
            ) : null}
          </View>

          {/* Rating & Reviews */}
          <View className="flex-row items-center mt-4 pb-4 border-b border-gray-100">
            <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-lg">
              <Star size={18} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-amber-700 font-bold ml-1">{facility.rating}</Text>
            </View>
            <Text className="text-gray-500 ml-2">{facility.reviewCount} reviews</Text>
            <View className="flex-1" />
            <Text className="text-[#1a365d] font-bold text-lg">{facility.priceRange}</Text>
          </View>

          {/* Quick Info */}
          <View className="flex-row mt-4 gap-4">
            <View className="flex-1 bg-gray-50 rounded-xl p-4 items-center">
              <Text className="text-gray-500 text-sm">Capacity</Text>
              <Text className="text-gray-900 text-xl font-bold mt-1">{facility.capacity}</Text>
            </View>
            <View className="flex-1 bg-blue-50 rounded-xl p-4 items-center">
              <Text className="text-blue-600 text-sm">Available</Text>
              <Text className="text-blue-700 text-xl font-bold mt-1">
                {facility.capacity - facility.currentResidents}
              </Text>
            </View>
          </View>

          {/* Volunteer Hours Section - Show for volunteers */}
          {isVolunteer && facility.volunteerHours && facility.volunteerHours.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(400).delay(100)} className="mt-6">
              <View className="flex-row items-center mb-3">
                <Calendar size={20} color="#8B5CF6" />
                <Text className="text-gray-900 text-lg font-bold ml-2">Volunteer Hours</Text>
              </View>
              <Text className="text-gray-500 text-sm mb-4">
                Sign up for available volunteer shifts
              </Text>
              <View className="gap-3">
                {facility.volunteerHours.map((slot) => {
                  const signedUp = isSlotSignedUp(slot.id);
                  return (
                    <Pressable
                      key={slot.id}
                      onPress={() => !signedUp && handleSelectSlot(slot)}
                      disabled={signedUp}
                      className={`flex-row items-center p-4 rounded-xl border-2 ${
                        signedUp
                          ? 'bg-green-50 border-green-300'
                          : 'bg-purple-50 border-purple-200 active:border-purple-400'
                      }`}
                    >
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          signedUp ? 'bg-green-500' : 'bg-purple-500'
                        }`}
                      >
                        {signedUp ? (
                          <Check size={24} color="white" />
                        ) : (
                          <Clock size={24} color="white" />
                        )}
                      </View>
                      <View className="flex-1 ml-3">
                        <Text
                          className={`font-bold text-base ${
                            signedUp ? 'text-green-700' : 'text-purple-700'
                          }`}
                        >
                          {slot.dayOfWeek}
                        </Text>
                        <Text className={signedUp ? 'text-green-600' : 'text-purple-600'}>
                          {slot.startTime} - {slot.endTime}
                        </Text>
                      </View>
                      <View className="items-end">
                        {signedUp ? (
                          <Text className="text-green-600 font-semibold">Signed Up</Text>
                        ) : (
                          <>
                            <View className="flex-row items-center">
                              <Users size={14} color="#8B5CF6" />
                              <Text className="text-purple-600 ml-1">
                                {slot.spotsAvailable} spots
                              </Text>
                            </View>
                            <Text className="text-purple-500 text-sm mt-1">Tap to sign up</Text>
                          </>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ) : null}

          {/* Description */}
          <View className="mt-6">
            <Text className="text-gray-900 text-lg font-bold">About</Text>
            <Text className="text-gray-600 mt-2 leading-6">{facility.bio}</Text>
          </View>

          {/* Services */}
          <View className="mt-6">
            <Text className="text-gray-900 text-lg font-bold">Services</Text>
            <View className="flex-row flex-wrap gap-2 mt-3">
              {facility.services.map((service) => (
                <View key={service} className="flex-row items-center bg-green-50 px-3 py-2 rounded-lg">
                  <Check size={14} color="#15803D" />
                  <Text className="text-green-700 ml-2">{service}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Amenities */}
          <View className="mt-6">
            <Text className="text-gray-900 text-lg font-bold">Amenities</Text>
            <View className="flex-row flex-wrap gap-2 mt-3">
              {facility.amenities.map((amenity) => (
                <View key={amenity} className="bg-gray-100 px-3 py-2 rounded-lg">
                  <Text className="text-gray-700">{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contact Info */}
          <View className="mt-6">
            <Text className="text-gray-900 text-lg font-bold">Contact</Text>
            <View className="mt-3 gap-3">
              <Pressable
                onPress={handleCall}
                className="flex-row items-center active:opacity-70"
              >
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                  <Phone size={18} color="#3B82F6" />
                </View>
                <Text className="text-blue-600 ml-3 underline">{facility.phone}</Text>
              </Pressable>
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                  <Mail size={18} color="#3B82F6" />
                </View>
                <Text className="text-gray-700 ml-3">{facility.email}</Text>
              </View>
            </View>
          </View>

          {/* Spacer for bottom button */}
          <View className="h-24" />
        </Animated.View>
      </ScrollView>

      {/* Bottom Action */}
      <Animated.View
        entering={FadeIn.duration(400).delay(200)}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4"
      >
        <SafeAreaView edges={['bottom']}>
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleCall}
              className="w-14 h-14 bg-gray-100 rounded-2xl items-center justify-center active:bg-gray-200"
            >
              <Phone size={24} color="#1a365d" />
            </Pressable>
            <Pressable
              onPress={handleContact}
              className="flex-1 bg-[#1a365d] rounded-2xl h-14 flex-row items-center justify-center active:opacity-90"
            >
              <MessageCircle size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                {userType === 'elderly' ? 'Inquire Now' : 'Message'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Volunteer Signup Modal */}
      <Modal
        visible={showSignupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignupModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <View className="bg-purple-500 px-6 py-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-xl font-bold">Confirm Signup</Text>
                <Pressable
                  onPress={() => setShowSignupModal(false)}
                  className="w-8 h-8 bg-white/20 rounded-full items-center justify-center"
                >
                  <X size={18} color="white" />
                </Pressable>
              </View>
            </View>

            {/* Modal Content */}
            <View className="p-6">
              <Text className="text-gray-900 font-semibold text-lg">{facility.facilityName}</Text>
              <Text className="text-gray-500 mt-1">{facility.address}</Text>

              {selectedSlot ? (
                <View className="mt-4 bg-purple-50 rounded-xl p-4">
                  <View className="flex-row items-center">
                    <Calendar size={20} color="#8B5CF6" />
                    <Text className="text-purple-700 font-semibold ml-2">
                      {selectedSlot.dayOfWeek}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Clock size={20} color="#8B5CF6" />
                    <Text className="text-purple-600 ml-2">
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </Text>
                  </View>
                </View>
              ) : null}

              <Text className="text-gray-600 mt-4 text-sm leading-5">
                By signing up, you agree to arrive on time and notify the facility if you need to
                cancel.
              </Text>

              {/* Modal Buttons */}
              <View className="flex-row gap-3 mt-6">
                <Pressable
                  onPress={() => setShowSignupModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 items-center active:bg-gray-200"
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmSignup}
                  className="flex-1 py-3 rounded-xl bg-purple-500 items-center active:bg-purple-600"
                >
                  <Text className="text-white font-semibold">Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
