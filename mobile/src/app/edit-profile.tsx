import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Award,
  Clock,
  GraduationCap,
  Heart,
  Calendar,
  X,
  Plus,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  useAppStore,
  ElderlyProfile,
  CaregiverProfile,
  FacilityProfile,
  VolunteerProfile,
} from '@/lib/store';
import { pickImage, takePhoto } from '@/lib/file-picker';
import { uploadFile } from '@/lib/upload';
import { updateUser } from '@/lib/api';
import { DefaultAvatar } from '@/components/DefaultAvatar';

const PURPLE_ACCENT = '#8B5CF6';

const CARE_NEEDS_OPTIONS = [
  'Medication Management',
  'Mobility Assistance',
  'Personal Care',
  'Meal Preparation',
  'Companionship',
  'Transportation',
  'Memory Care',
  'Physical Therapy',
];

const CERTIFICATIONS_OPTIONS = [
  'CNA',
  'HHA',
  'CPR Certified',
  'First Aid',
  'LVN',
  'RN',
  "Alzheimer's Care",
  'Hospice Care',
];

const SPECIALIZATIONS_OPTIONS = [
  'Elderly Care',
  "Alzheimer's/Dementia",
  'Post-Surgery Care',
  'Diabetes Care',
  'Stroke Recovery',
  'Parkinson\'s Care',
  'Hospice Care',
  'Physical Therapy',
];

const SKILLS_OPTIONS = [
  'Companionship',
  'Reading',
  'Games & Activities',
  'Music',
  'Arts & Crafts',
  'Cooking',
  'Gardening',
  'Technology Help',
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EditProfileScreen() {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const userType = useAppStore((s) => s.userType);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  // Common fields
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [localPreview, setLocalPreview] = useState('');

  // Elderly-specific
  const [careNeeds, setCareNeeds] = useState<string[]>(
    (currentUser as ElderlyProfile)?.careNeeds || []
  );

  // Caregiver-specific
  const [experience, setExperience] = useState(
    String((currentUser as CaregiverProfile)?.experience || 0)
  );
  const [hourlyRate, setHourlyRate] = useState(
    String((currentUser as CaregiverProfile)?.hourlyRate || 25)
  );
  const [certifications, setCertifications] = useState<string[]>(
    (currentUser as CaregiverProfile)?.certifications || []
  );
  const [specializations, setSpecializations] = useState<string[]>(
    (currentUser as CaregiverProfile)?.specializations || []
  );

  // Volunteer-specific
  const [school, setSchool] = useState((currentUser as VolunteerProfile)?.school || '');
  const [skills, setSkills] = useState<string[]>((currentUser as VolunteerProfile)?.skills || []);
  const [availability, setAvailability] = useState<string[]>(
    (currentUser as VolunteerProfile)?.availability || []
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickAvatar = async () => {
    const file = await pickImage();
    if (!file) return;
    setLocalPreview(file.uri);
    setIsUploading(true);
    try {
      const result = await uploadFile(file.uri, file.filename, file.mimeType);
      setAvatar(result.url);
      setLocalPreview('');
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      setLocalPreview('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakeAvatar = async () => {
    const file = await takePhoto();
    if (!file) return;
    setLocalPreview(file.uri);
    setIsUploading(true);
    try {
      const result = await uploadFile(file.uri, file.filename, file.mimeType);
      setAvatar(result.url);
      setLocalPreview('');
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      setLocalPreview('');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleArrayItem = (
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (array.includes(item)) {
      setArray(array.filter((i) => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email.');
      return;
    }

    setIsSaving(true);

    const baseUpdates = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      bio: bio.trim(),
      avatar: avatar || currentUser?.avatar,
    };

    const saveToBackend = async (metadata: string) => {
      if (!currentUser?.id) return baseUpdates.avatar;
      const result = await updateUser(currentUser.id, { ...baseUpdates, metadata });
      if ('error' in result) {
        Alert.alert('Save Failed', 'Could not save your changes. Please try again.');
        return null;
      }
      return result.avatar ?? baseUpdates.avatar;
    };

    if (userType === 'elderly') {
      const savedAvatar = await saveToBackend(JSON.stringify({ careNeeds }));
      if (savedAvatar === null) { setIsSaving(false); return; }
      setCurrentUser({ ...(currentUser as ElderlyProfile), ...baseUpdates, avatar: savedAvatar, careNeeds });
    } else if (userType === 'caregiver') {
      const exp = parseInt(experience) || 0;
      const rate = parseInt(hourlyRate) || 25;
      const savedAvatar = await saveToBackend(JSON.stringify({ experience: exp, hourlyRate: rate, certifications, specializations }));
      if (savedAvatar === null) { setIsSaving(false); return; }
      setCurrentUser({
        ...(currentUser as CaregiverProfile),
        ...baseUpdates,
        avatar: savedAvatar,
        experience: exp,
        hourlyRate: rate,
        certifications,
        specializations,
      });
    } else if (userType === 'facility') {
      setCurrentUser({ ...(currentUser as FacilityProfile), ...baseUpdates });
    } else if (userType === 'volunteer') {
      const savedAvatar = await saveToBackend(JSON.stringify({ school: school.trim(), skills, availability }));
      if (savedAvatar === null) { setIsSaving(false); return; }
      setCurrentUser({
        ...(currentUser as VolunteerProfile),
        ...baseUpdates,
        avatar: savedAvatar,
        school: school.trim(),
        skills,
        availability,
      });
    } else {
      // Fallback for admin and any other user types
      if (currentUser?.id) {
        const result = await updateUser(currentUser.id, { ...baseUpdates, metadata: '{}' });
        if ('error' in result) {
          Alert.alert('Save Failed', 'Could not save your changes. Please try again.');
          setIsSaving(false);
          return;
        }
        setCurrentUser({ ...currentUser, ...baseUpdates, avatar: result.avatar ?? baseUpdates.avatar });
      }
    }

    setIsSaving(false);
    router.back();
  };

  const getHeaderColor = () => {
    if (userType === 'volunteer') return PURPLE_ACCENT;
    if (userType === 'facility') return '#22C55E';
    if (userType === 'caregiver') return '#3B82F6';
    return '#E8847C';
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
          <Text className="text-white font-semibold text-lg">Edit Profile</Text>
          <View className="w-10" />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          {/* Profile Photo */}
          <Animated.View entering={FadeInDown.duration(400)} className="items-center mb-6">
            <View className="relative">
              <DefaultAvatar uri={localPreview || avatar || currentUser?.avatar} size={112} />
              {isUploading && (
                <View
                  className="absolute inset-0 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.35)', width: 112, height: 112, borderRadius: 56 }}
                >
                  <ActivityIndicator color="white" />
                </View>
              )}
              <Pressable
                onPress={handlePickAvatar}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full items-center justify-center border-2 border-white"
                style={{ backgroundColor: getHeaderColor() }}
              >
                <Camera size={16} color="white" />
              </Pressable>
            </View>
            <Text className="text-gray-500 text-sm mt-2">Tap to change photo</Text>
          </Animated.View>

          {/* Basic Info */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text className="text-gray-900 text-lg font-bold mb-4">Basic Information</Text>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Full Name *</Text>
              <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center">
                <User size={20} color="#6B7280" />
                <TextInput
                  placeholder="Enter your name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  className="flex-1 text-gray-900 text-base ml-3"
                />
              </View>
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Email *</Text>
              <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center">
                <Mail size={20} color="#6B7280" />
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 text-gray-900 text-base ml-3"
                />
              </View>
            </View>

            {/* Phone */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Phone</Text>
              <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center">
                <Phone size={20} color="#6B7280" />
                <TextInput
                  placeholder="(555) 000-0000"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="flex-1 text-gray-900 text-base ml-3"
                />
              </View>
            </View>

            {/* Location */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Location</Text>
              <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center">
                <MapPin size={20} color="#6B7280" />
                <TextInput
                  placeholder="City, State"
                  placeholderTextColor="#9CA3AF"
                  value={location}
                  onChangeText={setLocation}
                  className="flex-1 text-gray-900 text-base ml-3"
                />
              </View>
            </View>

            {/* Bio */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Bio</Text>
              <View className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <TextInput
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#9CA3AF"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  className="text-gray-900 text-base min-h-[100px]"
                  textAlignVertical="top"
                />
              </View>
            </View>
          </Animated.View>

          {/* Elderly-specific fields */}
          {userType === 'elderly' ? (
            <Animated.View entering={FadeInDown.duration(400).delay(150)} className="mt-4">
              <Text className="text-gray-900 text-lg font-bold mb-4">Care Needs</Text>
              <Text className="text-gray-500 text-sm mb-3">
                Select the types of care you need
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CARE_NEEDS_OPTIONS.map((need) => (
                  <Pressable
                    key={need}
                    onPress={() => toggleArrayItem(careNeeds, setCareNeeds, need)}
                    className={`px-4 py-2 rounded-full flex-row items-center ${
                      careNeeds.includes(need)
                        ? 'bg-rose-500'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {careNeeds.includes(need) ? (
                      <Check size={14} color="white" className="mr-1" />
                    ) : null}
                    <Text
                      className={careNeeds.includes(need) ? 'text-white' : 'text-gray-700'}
                    >
                      {need}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {/* Caregiver-specific fields */}
          {userType === 'caregiver' ? (
            <Animated.View entering={FadeInDown.duration(400).delay(150)} className="mt-4">
              <Text className="text-gray-900 text-lg font-bold mb-4">Professional Info</Text>

              <View className="flex-row gap-4 mb-4">
                {/* Experience */}
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-2">Years Experience</Text>
                  <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center">
                    <Briefcase size={20} color="#6B7280" />
                    <TextInput
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      value={experience}
                      onChangeText={setExperience}
                      keyboardType="number-pad"
                      className="flex-1 text-gray-900 text-base ml-3"
                    />
                  </View>
                </View>

                {/* Hourly Rate */}
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-2">Hourly Rate ($)</Text>
                  <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center">
                    <DollarSign size={20} color="#6B7280" />
                    <TextInput
                      placeholder="25"
                      placeholderTextColor="#9CA3AF"
                      value={hourlyRate}
                      onChangeText={setHourlyRate}
                      keyboardType="number-pad"
                      className="flex-1 text-gray-900 text-base ml-3"
                    />
                  </View>
                </View>
              </View>

              {/* Certifications */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Certifications</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CERTIFICATIONS_OPTIONS.map((cert) => (
                    <Pressable
                      key={cert}
                      onPress={() => toggleArrayItem(certifications, setCertifications, cert)}
                      className={`px-4 py-2 rounded-full flex-row items-center ${
                        certifications.includes(cert)
                          ? 'bg-blue-500'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {certifications.includes(cert) ? (
                        <Check size={14} color="white" className="mr-1" />
                      ) : null}
                      <Text
                        className={certifications.includes(cert) ? 'text-white' : 'text-gray-700'}
                      >
                        {cert}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Specializations */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Specializations</Text>
                <View className="flex-row flex-wrap gap-2">
                  {SPECIALIZATIONS_OPTIONS.map((spec) => (
                    <Pressable
                      key={spec}
                      onPress={() => toggleArrayItem(specializations, setSpecializations, spec)}
                      className={`px-4 py-2 rounded-full flex-row items-center ${
                        specializations.includes(spec)
                          ? 'bg-green-500'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {specializations.includes(spec) ? (
                        <Check size={14} color="white" className="mr-1" />
                      ) : null}
                      <Text
                        className={specializations.includes(spec) ? 'text-white' : 'text-gray-700'}
                      >
                        {spec}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* Volunteer-specific fields */}
          {userType === 'volunteer' ? (
            <Animated.View entering={FadeInDown.duration(400).delay(150)} className="mt-4">
              <Text className="text-gray-900 text-lg font-bold mb-4">Volunteer Info</Text>

              {/* School */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">School / Organization</Text>
                <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center">
                  <GraduationCap size={20} color="#6B7280" />
                  <TextInput
                    placeholder="Your school or organization"
                    placeholderTextColor="#9CA3AF"
                    value={school}
                    onChangeText={setSchool}
                    className="flex-1 text-gray-900 text-base ml-3"
                  />
                </View>
              </View>

              {/* Skills */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Skills & Interests</Text>
                <View className="flex-row flex-wrap gap-2">
                  {SKILLS_OPTIONS.map((skill) => (
                    <Pressable
                      key={skill}
                      onPress={() => toggleArrayItem(skills, setSkills, skill)}
                      className={`px-4 py-2 rounded-full flex-row items-center ${
                        skills.includes(skill)
                          ? 'bg-purple-500'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {skills.includes(skill) ? (
                        <Check size={14} color="white" className="mr-1" />
                      ) : null}
                      <Text
                        className={skills.includes(skill) ? 'text-white' : 'text-gray-700'}
                      >
                        {skill}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Availability */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Availability</Text>
                <View className="flex-row flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => toggleArrayItem(availability, setAvailability, day)}
                      className={`px-4 py-2 rounded-full flex-row items-center ${
                        availability.includes(day)
                          ? 'bg-purple-500'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {availability.includes(day) ? (
                        <Check size={14} color="white" className="mr-1" />
                      ) : null}
                      <Text
                        className={availability.includes(day) ? 'text-white' : 'text-gray-700'}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* Save Button */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} className="mt-6 mb-8">
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="py-4 rounded-xl items-center"
              style={{ backgroundColor: isSaving ? '#9CA3AF' : getHeaderColor() }}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Save Changes</Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
