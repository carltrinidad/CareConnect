import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Briefcase,
  X,
  Check,
  ImagePlus,
  FileText,
  Users,
  DollarSign,
  Globe,
  Building2,
  BedDouble,
  Save,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Heart,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAppStore, FacilityProfile, VolunteerTimeSlot } from '@/lib/store';
import { DefaultAvatar } from '@/components/DefaultAvatar';
import { pickMultipleImages, takePhoto, pickImage } from '@/lib/file-picker';
import { uploadFile } from '@/lib/upload';
import { updateFacility, addVolunteerTimeSlot, deleteVolunteerTimeSlot, getFacility } from '@/lib/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_OPTIONS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM',
];

const COMMON_AMENITIES = [
  'Private Rooms',
  'Shared Rooms',
  'Garden',
  'Wheelchair Access',
  'TV/Cable',
  'WiFi',
  'Laundry',
  'Transportation',
  'Outdoor Space',
  'Dining Room',
];
const COMMON_SERVICES = [
  '24-Hour Care',
  'Medication Management',
  'Meals Provided',
  'Physical Therapy',
  'Memory Care',
  'Hospice Support',
  'Bathing Assistance',
  'Housekeeping',
  'Social Activities',
  'Medical Coordination',
];

export default function EditFacilityScreen() {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser) as FacilityProfile;
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const [facilityName, setFacilityName] = useState(currentUser?.facilityName || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [capacity, setCapacity] = useState(String(currentUser?.capacity || 6));
  const [currentResidents, setCurrentResidents] = useState(
    String(currentUser?.currentResidents || 0)
  );
  const [priceRange, setPriceRange] = useState(currentUser?.priceRange || '');
  const [isHiring, setIsHiring] = useState(currentUser?.isHiring ?? false);
  const [images, setImages] = useState<string[]>(currentUser?.images || []);
  const [avatar, setAvatar] = useState<string | undefined>(currentUser?.avatar);
  const [amenities, setAmenities] = useState<string[]>(currentUser?.amenities || []);
  const [services, setServices] = useState<string[]>(currentUser?.services || []);
  const [acceptingVolunteers, setAcceptingVolunteers] = useState(currentUser?.acceptingVolunteers ?? false);
  const [volunteerSlots, setVolunteerSlots] = useState<VolunteerTimeSlot[]>(currentUser?.volunteerHours || []);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDays, setNewSlotDays] = useState<string[]>(['Monday']);
  const [newSlotStart, setNewSlotStart] = useState('9:00 AM');
  const [newSlotEnd, setNewSlotEnd] = useState('12:00 PM');
  const [newSlotSpots, setNewSlotSpots] = useState('2');
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load volunteer slots from backend on mount
  useEffect(() => {
    const loadSlots = async () => {
      if (currentUser?.id && !currentUser.id.startsWith('user_')) {
        const data = await getFacility(currentUser.id);
        if (data && data.volunteerHours) {
          setVolunteerSlots(data.volunteerHours);
        }
      }
    };
    loadSlots();
  }, [currentUser?.id]);

  const handlePickAvatar = async () => {
    const file = await pickImage();
    if (!file) return;
    setLocalAvatarPreview(file.uri);
    setIsUploadingAvatar(true);
    try {
      const result = await uploadFile(file.uri, file.filename, file.mimeType);
      setAvatar(result.url);
      setLocalAvatarPreview('');
    } catch {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      setLocalAvatarPreview('');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePickImages = async () => {
    const files = await pickMultipleImages();
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const result = await uploadFile(file.uri, file.filename, file.mimeType);
        uploadedUrls.push(result.url);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    const file = await takePhoto();
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(file.uri, file.filename, file.mimeType);
      setImages((prev) => [...prev, result.url]);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleService = (item: string) => {
    setServices((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const handleAddTimeSlot = async () => {
    if (!currentUser?.id) return;

    if (newSlotDays.length === 0) {
      Alert.alert('Select Days', 'Please select at least one day.');
      return;
    }

    const startIdx = TIME_OPTIONS.indexOf(newSlotStart);
    const endIdx = TIME_OPTIONS.indexOf(newSlotEnd);
    if (endIdx <= startIdx) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    setIsAddingSlot(true);
    try {
      const newSlots: VolunteerTimeSlot[] = [];

      for (const day of newSlotDays) {
        if (!currentUser.id.startsWith('user_')) {
          const result = await addVolunteerTimeSlot(currentUser.id, {
            dayOfWeek: day,
            startTime: newSlotStart,
            endTime: newSlotEnd,
            spotsAvailable: parseInt(newSlotSpots, 10) || 2,
          });

          if ('error' in result) {
            Alert.alert('Error', `Could not add time slot for ${day}.`);
            continue;
          }
          newSlots.push(result);
        } else {
          newSlots.push({
            id: `slot-${Date.now()}-${day}`,
            dayOfWeek: day,
            startTime: newSlotStart,
            endTime: newSlotEnd,
            spotsAvailable: parseInt(newSlotSpots, 10) || 2,
          });
        }
      }

      setVolunteerSlots((prev) => [...prev, ...newSlots]);
      setShowAddSlot(false);
      setNewSlotDays(['Monday']);
      setNewSlotStart('9:00 AM');
      setNewSlotEnd('12:00 PM');
      setNewSlotSpots('2');
    } catch {
      Alert.alert('Error', 'Could not add time slots.');
    } finally {
      setIsAddingSlot(false);
    }
  };

  const handleRemoveSlot = async (slotId: string) => {
    try {
      if (currentUser?.id && !currentUser.id.startsWith('user_')) {
        await deleteVolunteerTimeSlot(slotId);
      }
      setVolunteerSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch {
      Alert.alert('Error', 'Could not remove time slot.');
    }
  };

  const handleSave = async () => {
    console.log('[EditFacility] Save pressed, currentUser id:', currentUser?.id);

    if (!facilityName.trim()) {
      Alert.alert('Required', 'Please enter your facility name.');
      return;
    }

    const parsedCapacity = parseInt(capacity, 10);
    const parsedResidents = parseInt(currentResidents, 10);

    if (!isNaN(parsedResidents) && !isNaN(parsedCapacity) && parsedResidents > parsedCapacity) {
      Alert.alert('Invalid', 'Current residents cannot exceed capacity.');
      return;
    }

    setIsSaving(true);

    const updates = {
      facilityName: facilityName.trim(),
      address: address.trim(),
      location: location.trim(),
      bio: bio.trim(),
      avatar,
      capacity: isNaN(parsedCapacity) ? (currentUser?.capacity ?? 6) : parsedCapacity,
      currentResidents: isNaN(parsedResidents) ? (currentUser?.currentResidents ?? 0) : parsedResidents,
      priceRange: priceRange.trim(),
      isHiring,
      acceptingVolunteers,
      images,
      amenities,
      services,
      volunteerHours: volunteerSlots,
    };

    try {
      // Persist to backend if we have a real DB id
      if (currentUser?.id && !currentUser.id.startsWith('user_')) {
        console.log('[EditFacility] Saving to backend, id:', currentUser.id);
        const result = await updateFacility(currentUser.id, updates);
        console.log('[EditFacility] Backend result:', JSON.stringify(result));
        if ('error' in result) {
          setIsSaving(false);
          Alert.alert('Save Failed', 'Could not save your changes. Please try again.');
          return;
        }
      }

      setCurrentUser({
        ...(currentUser as FacilityProfile),
        ...updates,
      });

      setIsSaving(false);
      Alert.alert('Saved!', 'Your facility details have been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('[EditFacility] Save error:', err);
      setIsSaving(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-[#1a365d]">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Edit Facility</Text>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Save size={20} color="white" />
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-5 py-6">

          {/* Profile Photo */}
          <Animated.View entering={FadeInDown.duration(400)} className="items-center mb-6">
            <View className="relative">
              <View style={{ borderWidth: 3, borderColor: '#1a365d', borderRadius: 48 }}>
                <DefaultAvatar uri={localAvatarPreview || avatar} size={96} />
              </View>
              {isUploadingAvatar && (
                <View
                  className="absolute inset-0 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.35)', width: 96, height: 96, borderRadius: 48 }}
                >
                  <ActivityIndicator color="white" size="small" />
                </View>
              )}
              <Pressable
                onPress={handlePickAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2 border-white"
                style={{ backgroundColor: '#1a365d' }}
              >
                <Camera size={14} color="white" />
              </Pressable>
            </View>
            <Text className="text-gray-500 text-sm mt-2">Tap camera to update profile photo</Text>
          </Animated.View>

          {/* Facility Name */}
          <Animated.View entering={FadeInDown.duration(400).delay(40)}>
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Facility Name *
            </Text>
            <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center">
              <Building2 size={18} color="#6B7280" />
              <TextInput
                placeholder="Enter facility name"
                placeholderTextColor="#9CA3AF"
                value={facilityName}
                onChangeText={setFacilityName}
                className="flex-1 text-gray-900 text-base ml-3"
              />
            </View>
          </Animated.View>

          {/* Address */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)} className="mt-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Facility Address
            </Text>
            <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-start">
              <MapPin size={18} color="#6B7280" style={{ marginTop: 2 }} />
              <TextInput
                placeholder="Street, City, State, ZIP"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
                className="flex-1 text-gray-900 text-base ml-3"
                multiline
              />
            </View>
          </Animated.View>

          {/* Location / City */}
          <Animated.View entering={FadeInDown.duration(400).delay(110)} className="mt-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              City / Region
            </Text>
            <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center">
              <Globe size={18} color="#6B7280" />
              <TextInput
                placeholder="e.g. Los Angeles, CA"
                placeholderTextColor="#9CA3AF"
                value={location}
                onChangeText={setLocation}
                className="flex-1 text-gray-900 text-base ml-3"
              />
            </View>
          </Animated.View>

          {/* Bio / About */}
          <Animated.View entering={FadeInDown.duration(400).delay(140)} className="mt-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              About Your Facility
            </Text>
            <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-start">
              <FileText size={18} color="#6B7280" style={{ marginTop: 2 }} />
              <TextInput
                placeholder="Describe your facility, its environment, and what makes it special..."
                placeholderTextColor="#9CA3AF"
                value={bio}
                onChangeText={setBio}
                className="flex-1 text-gray-900 text-base ml-3"
                multiline
                numberOfLines={4}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
          </Animated.View>

          {/* Capacity & Residents & Price */}
          <Animated.View entering={FadeInDown.duration(400).delay(170)} className="mt-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Occupancy & Pricing
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-xl border border-gray-200 px-3 py-3">
                <View className="flex-row items-center mb-1">
                  <Users size={15} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1">Capacity</Text>
                </View>
                <TextInput
                  placeholder="e.g. 6"
                  placeholderTextColor="#9CA3AF"
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="number-pad"
                  className="text-gray-900 text-base font-semibold"
                />
              </View>
              <View className="flex-1 bg-white rounded-xl border border-gray-200 px-3 py-3">
                <View className="flex-row items-center mb-1">
                  <BedDouble size={15} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1">Residents</Text>
                </View>
                <TextInput
                  placeholder="e.g. 4"
                  placeholderTextColor="#9CA3AF"
                  value={currentResidents}
                  onChangeText={setCurrentResidents}
                  keyboardType="number-pad"
                  className="text-gray-900 text-base font-semibold"
                />
              </View>
              <View className="flex-1 bg-white rounded-xl border border-gray-200 px-3 py-3">
                <View className="flex-row items-center mb-1">
                  <DollarSign size={15} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1">Price</Text>
                </View>
                <TextInput
                  placeholder="$3,500/mo"
                  placeholderTextColor="#9CA3AF"
                  value={priceRange}
                  onChangeText={setPriceRange}
                  className="text-gray-900 text-base font-semibold"
                />
              </View>
            </View>
          </Animated.View>

          {/* Hiring Status Toggle */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} className="mt-6">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
              Hiring Status
            </Text>
            <View
              className={`flex-row items-center justify-between p-4 rounded-xl ${
                isHiring ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    isHiring ? 'bg-green-500' : 'bg-gray-100'
                  }`}
                >
                  <Briefcase size={20} color={isHiring ? 'white' : '#6B7280'} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`font-semibold ${isHiring ? 'text-green-700' : 'text-gray-900'}`}>
                    {isHiring ? 'Currently Hiring' : 'Not Currently Hiring'}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {isHiring
                      ? 'Caregivers can see you are looking for staff'
                      : 'Turn on to attract caregivers'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isHiring}
                onValueChange={setIsHiring}
                trackColor={{ false: '#D1D5DB', true: '#22C55E' }}
                thumbColor="white"
              />
            </View>
          </Animated.View>

          {/* Volunteer Availability Toggle */}
          <Animated.View entering={FadeInDown.duration(400).delay(210)} className="mt-6">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
              Volunteer Program
            </Text>
            <View
              className={`flex-row items-center justify-between p-4 rounded-xl ${
                acceptingVolunteers ? 'bg-purple-50 border border-purple-200' : 'bg-white border border-gray-200'
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    acceptingVolunteers ? 'bg-purple-500' : 'bg-gray-100'
                  }`}
                >
                  <Heart size={20} color={acceptingVolunteers ? 'white' : '#6B7280'} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`font-semibold ${acceptingVolunteers ? 'text-purple-700' : 'text-gray-900'}`}>
                    {acceptingVolunteers ? 'Accepting Volunteers' : 'Not Accepting Volunteers'}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {acceptingVolunteers
                      ? 'Volunteers can see your available hours'
                      : 'Turn on to let volunteers sign up'}
                  </Text>
                </View>
              </View>
              <Switch
                value={acceptingVolunteers}
                onValueChange={setAcceptingVolunteers}
                trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                thumbColor="white"
              />
            </View>
          </Animated.View>

          {/* Volunteer Schedule - shown when accepting volunteers */}
          {acceptingVolunteers ? (
            <Animated.View entering={FadeInDown.duration(400)} className="mt-4">
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                Volunteer Schedule
              </Text>
              <Text className="text-gray-400 text-sm mb-3">
                Set the days and hours volunteers can sign up for
              </Text>

              {/* Existing time slots */}
              {volunteerSlots.length > 0 ? (
                <View className="gap-2 mb-4">
                  {volunteerSlots.map((slot) => (
                    <View
                      key={slot.id}
                      className="flex-row items-center bg-purple-50 border border-purple-200 rounded-xl p-3"
                    >
                      <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center">
                        <Clock size={18} color="white" />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-purple-700 font-semibold">{slot.dayOfWeek}</Text>
                        <Text className="text-purple-600 text-sm">
                          {slot.startTime} - {slot.endTime}
                        </Text>
                      </View>
                      <View className="items-end mr-3">
                        <View className="flex-row items-center">
                          <Users size={12} color="#8B5CF6" />
                          <Text className="text-purple-600 text-xs ml-1">{slot.spotsAvailable} spots</Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => handleRemoveSlot(slot.id)}
                        className="w-8 h-8 bg-red-100 rounded-full items-center justify-center"
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 items-center mb-4">
                  <Calendar size={28} color="#9CA3AF" />
                  <Text className="text-gray-400 text-sm mt-2">No volunteer hours set yet</Text>
                </View>
              )}

              {/* Add new slot form */}
              {showAddSlot ? (
                <View className="bg-white border border-purple-200 rounded-xl p-4 gap-3">
                  <Text className="text-gray-900 font-semibold">Add Time Slot</Text>

                  {/* Day picker - multi select */}
                  <View>
                    <Text className="text-gray-500 text-xs font-semibold mb-2">Days (tap multiple)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      <View className="flex-row gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = newSlotDays.includes(day);
                          return (
                          <Pressable
                            key={day}
                            onPress={() =>
                              setNewSlotDays((prev) =>
                                prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                              )
                            }
                            className={`px-3 py-2 rounded-full border ${
                              isSelected
                                ? 'bg-purple-500 border-purple-500'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <Text
                              className={`text-sm font-medium ${
                                isSelected ? 'text-white' : 'text-gray-600'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </Text>
                          </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Time pickers */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs font-semibold mb-2">Start Time</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0 }}
                      >
                        <View className="flex-row gap-1">
                          {TIME_OPTIONS.map((time) => (
                            <Pressable
                              key={`start-${time}`}
                              onPress={() => setNewSlotStart(time)}
                              className={`px-2 py-1.5 rounded-lg border ${
                                newSlotStart === time
                                  ? 'bg-purple-500 border-purple-500'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <Text
                                className={`text-xs font-medium ${
                                  newSlotStart === time ? 'text-white' : 'text-gray-600'
                                }`}
                              >
                                {time}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs font-semibold mb-2">End Time</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0 }}
                      >
                        <View className="flex-row gap-1">
                          {TIME_OPTIONS.map((time) => (
                            <Pressable
                              key={`end-${time}`}
                              onPress={() => setNewSlotEnd(time)}
                              className={`px-2 py-1.5 rounded-lg border ${
                                newSlotEnd === time
                                  ? 'bg-purple-500 border-purple-500'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <Text
                                className={`text-xs font-medium ${
                                  newSlotEnd === time ? 'text-white' : 'text-gray-600'
                                }`}
                              >
                                {time}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>

                  {/* Spots */}
                  <View>
                    <Text className="text-gray-500 text-xs font-semibold mb-2">Available Spots</Text>
                    <View className="flex-row gap-2">
                      {['1', '2', '3', '4', '5'].map((num) => (
                        <Pressable
                          key={num}
                          onPress={() => setNewSlotSpots(num)}
                          className={`w-10 h-10 rounded-full items-center justify-center border ${
                            newSlotSpots === num
                              ? 'bg-purple-500 border-purple-500'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <Text
                            className={`font-semibold ${
                              newSlotSpots === num ? 'text-white' : 'text-gray-600'
                            }`}
                          >
                            {num}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View className="flex-row gap-3 mt-1">
                    <Pressable
                      onPress={() => setShowAddSlot(false)}
                      className="flex-1 py-3 rounded-xl bg-gray-100 items-center"
                    >
                      <Text className="text-gray-700 font-semibold">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleAddTimeSlot}
                      disabled={isAddingSlot}
                      className="flex-1 py-3 rounded-xl bg-purple-500 items-center flex-row justify-center"
                    >
                      {isAddingSlot ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Plus size={16} color="white" />
                          <Text className="text-white font-semibold ml-1">Add Slot</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowAddSlot(true)}
                  className="flex-row items-center justify-center py-3 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50"
                >
                  <Plus size={18} color="#8B5CF6" />
                  <Text className="text-purple-600 font-semibold ml-2">Add Time Slot</Text>
                </Pressable>
              )}
            </Animated.View>
          ) : null}

          {/* Facility Photos */}
          <Animated.View entering={FadeInDown.duration(400).delay(230)} className="mt-6">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
              Facility Photos
            </Text>
            <Text className="text-gray-400 text-sm mb-3">
              Upload photos to attract residents and families
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {images.map((imageUrl, index) => (
                <Animated.View key={imageUrl + index} entering={FadeIn.duration(300)}>
                  <View className="relative">
                    <Image
                      source={{ uri: imageUrl }}
                      className="w-24 h-24 rounded-xl"
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                      style={{ elevation: 2 }}
                    >
                      <X size={14} color="white" />
                    </Pressable>
                  </View>
                </Animated.View>
              ))}

              {isUploading ? (
                <View className="w-24 h-24 rounded-xl bg-gray-100 items-center justify-center">
                  <ActivityIndicator color="#1a365d" />
                  <Text className="text-gray-500 text-xs mt-1">Uploading</Text>
                </View>
              ) : (
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={handlePickImages}
                    className="w-24 h-24 rounded-xl bg-blue-50 border-2 border-dashed border-blue-300 items-center justify-center"
                  >
                    <ImagePlus size={22} color="#1a365d" />
                    <Text className="text-blue-800 text-xs mt-1 font-medium">Gallery</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleTakePhoto}
                    className="w-24 h-24 rounded-xl bg-blue-50 border-2 border-dashed border-blue-300 items-center justify-center"
                  >
                    <Camera size={22} color="#1a365d" />
                    <Text className="text-blue-800 text-xs mt-1 font-medium">Camera</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Amenities */}
          <Animated.View entering={FadeInDown.duration(400).delay(260)} className="mt-6">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
              Amenities
            </Text>
            <Text className="text-gray-400 text-sm mb-3">Select all that apply</Text>
            <View className="flex-row flex-wrap gap-2">
              {COMMON_AMENITIES.map((item) => {
                const selected = amenities.includes(item);
                return (
                  <Pressable
                    key={item}
                    onPress={() => toggleAmenity(item)}
                    className={`flex-row items-center px-3 py-2 rounded-full border ${
                      selected
                        ? 'bg-[#1a365d] border-[#1a365d]'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {selected && <Check size={12} color="white" style={{ marginRight: 4 }} />}
                    <Text
                      className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-600'}`}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Services */}
          <Animated.View entering={FadeInDown.duration(400).delay(290)} className="mt-6">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
              Services Offered
            </Text>
            <Text className="text-gray-400 text-sm mb-3">Select all that apply</Text>
            <View className="flex-row flex-wrap gap-2">
              {COMMON_SERVICES.map((item) => {
                const selected = services.includes(item);
                return (
                  <Pressable
                    key={item}
                    onPress={() => toggleService(item)}
                    className={`flex-row items-center px-3 py-2 rounded-full border ${
                      selected
                        ? 'bg-[#1a365d] border-[#1a365d]'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {selected && <Check size={12} color="white" style={{ marginRight: 4 }} />}
                    <Text
                      className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-600'}`}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Save Button */}
          <Animated.View entering={FadeInDown.duration(400).delay(320)} className="mt-8 mb-10">
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={{ backgroundColor: isSaving ? '#94A3B8' : '#1a365d' }}
              className="py-4 rounded-xl items-center flex-row justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-bold text-base ml-2">Saving...</Text>
                </>
              ) : (
                <>
                  <Save size={18} color="white" />
                  <Text className="text-white font-bold text-base ml-2">Save Changes</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
