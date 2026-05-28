import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Users, Building2, ChevronRight, Check, ArrowLeft, GraduationCap, Mail, Phone, User, Lock, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppStore, UserType } from '@/lib/store';
import { cn } from '@/lib/cn';
import { createFacility, registerUser } from '@/lib/api';

const userTypes = [
  {
    type: 'elderly' as UserType,
    title: 'Senior / Family',
    subtitle: 'Looking for Care',
    description: 'Find board & care homes or hire private caregivers',
    icon: Heart,
    color: '#E8847C',
    bgColor: '#FEF2F2',
  },
  {
    type: 'caregiver' as UserType,
    title: 'Caregiver',
    subtitle: 'Offering Care Services',
    description: 'Get hired by families or facilities',
    icon: Users,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    type: 'facility' as UserType,
    title: 'Board & Care',
    subtitle: 'Care Facility',
    description: 'List your facility and find caregivers',
    icon: Building2,
    color: '#22C55E',
    bgColor: '#F0FDF4',
  },
  {
    type: 'volunteer' as UserType,
    title: 'Volunteer',
    subtitle: 'Student / Community',
    description: 'Sign up to volunteer at care facilities',
    icon: GraduationCap,
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setUserType = useAppStore((s) => s.setUserType);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const [step, setStep] = useState<'welcome' | 'select' | 'signup'>('welcome');
  const [selectedType, setSelectedType] = useState<UserType>(null);

  // Signup form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = () => {
    if (step === 'welcome') {
      setStep('select');
    } else if (step === 'select' && selectedType) {
      setStep('signup');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-().]{7,}$/.test(phone.trim()) || phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm() || !selectedType) return;

    setIsSubmitting(true);

    if (selectedType === 'facility') {
      // Persist facility to backend DB
      const result = await createFacility({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        facilityName: name.trim(),
        address: '',
        capacity: 10,
        amenities: [],
        services: [],
        priceRange: 'Contact for pricing',
        licensed: true,
        isHiring: false,
        images: [],
      });

      if ('error' in result) {
        setIsSubmitting(false);
        Alert.alert('Sign Up Failed', result.error === 'Email already registered'
          ? 'An account with this email already exists.'
          : 'Could not create your facility. Please try again.');
        return;
      }

      // Also register in ChatUser table for messaging lookup
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        userType: 'facility',
      }).catch(() => {}); // Ignore if duplicate

      setCurrentUser({
        id: result.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        userType: 'facility',
        facilityName: result.facilityName,
        address: result.address,
        capacity: result.capacity,
        currentResidents: result.currentResidents,
        amenities: result.amenities,
        services: result.services,
        priceRange: result.priceRange || 'Contact for pricing',
        rating: result.rating,
        reviewCount: result.reviewCount,
        images: result.images,
        licensed: result.licensed,
        volunteerHours: result.volunteerHours,
        isHiring: result.isHiring,
        bio: result.bio,
        location: result.location,
      });

      setOnboarded(true);
      setIsSubmitting(false);
      router.replace('/(tabs)');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Register all non-facility users to the backend
    const registerResult = await registerUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      userType: selectedType,
    });

    if ('error' in registerResult) {
      setIsSubmitting(false);
      Alert.alert('Sign Up Failed', registerResult.error === 'Email already registered'
        ? 'An account with this email already exists.'
        : 'Could not create your account. Please try again.');
      return;
    }

    const baseUser = {
      id: registerResult.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      userType: selectedType,
      location: 'Los Angeles, CA',
    };

    if (selectedType === 'elderly') {
      setCurrentUser({
        ...baseUser,
        userType: 'elderly',
        careNeeds: [],
        preferredCareType: 'both',
      });
    } else if (selectedType === 'caregiver') {
      setCurrentUser({
        ...baseUser,
        userType: 'caregiver',
        experience: 0,
        certifications: [],
        specializations: [],
        hourlyRate: 25,
        availability: 'flexible',
        rating: 0,
        reviewCount: 0,
        verified: false,
      });
    } else if (selectedType === 'volunteer') {
      setCurrentUser({
        ...baseUser,
        userType: 'volunteer',
        school: '',
        skills: [],
        availability: [],
        status: 'pending',
        totalHours: 0,
        completedSignups: 0,
      });
    }

    setOnboarded(true);
    setIsSubmitting(false);
    router.replace('/(tabs)');
  };

  const selectedTypeInfo = userTypes.find((u) => u.type === selectedType);

  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#1a365d', '#234876', '#2d5a8c']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        {step === 'welcome' ? (
          // Welcome Screen
          <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
            className="flex-1 px-6"
          >
            <View className="flex-1 justify-center items-center">
              <Animated.View entering={FadeInDown.duration(600).delay(100)}>
                <View className="w-24 h-24 bg-white/10 rounded-3xl items-center justify-center mb-6">
                  <Heart size={48} color="white" />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(600).delay(200)}>
                <Text className="text-white text-4xl font-bold text-center">
                  CareConnect
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(600).delay(300)}>
                <Text className="text-white/70 text-lg text-center mt-3 px-4">
                  Connecting seniors, caregivers, and care facilities
                </Text>
              </Animated.View>
            </View>

            <Animated.View entering={FadeInUp.duration(600).delay(500)} className="mb-8 gap-4">
              <Pressable
                onPress={handleContinue}
                className="bg-white rounded-2xl py-5 px-6 flex-row items-center justify-between active:opacity-90"
                style={{ elevation: 4 }}
              >
                <View>
                  <Text className="text-[#1a365d] font-bold text-xl">Create Account</Text>
                  <Text className="text-gray-500 text-sm mt-1">New to CareConnect? Sign up here</Text>
                </View>
                <View className="w-12 h-12 bg-[#1a365d] rounded-full items-center justify-center">
                  <ChevronRight size={22} color="white" />
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push('/login')}
                className="bg-white/15 border-2 border-white/40 rounded-2xl py-5 px-6 flex-row items-center justify-between active:opacity-90"
              >
                <View>
                  <Text className="text-white font-bold text-xl">Log In</Text>
                  <Text className="text-white/60 text-sm mt-1">Already have an account</Text>
                </View>
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <ChevronRight size={22} color="white" />
                </View>
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : step === 'select' ? (
          // Account Type Selection
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-1 px-6"
          >
            <Animated.View entering={FadeInDown.duration(500)} className="pt-6">
              <Pressable
                onPress={() => setStep('welcome')}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mb-4"
              >
                <ArrowLeft size={20} color="white" />
              </Pressable>
              <Text className="text-white text-2xl font-bold">
                Choose Your Account
              </Text>
              <Text className="text-white/70 text-base mt-2">
                How will you use CareConnect?
              </Text>
            </Animated.View>

            <ScrollView className="flex-1 py-6" showsVerticalScrollIndicator={false}>
              <View className="gap-3">
                {userTypes.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = selectedType === item.type;

                  return (
                    <Animated.View
                      key={item.type}
                      entering={FadeInDown.duration(400).delay(100 + index * 80)}
                    >
                      <Pressable
                        onPress={() => setSelectedType(item.type)}
                        className={cn(
                          'rounded-2xl p-4 border-2 flex-row items-center',
                          isSelected
                            ? 'bg-white border-white'
                            : 'bg-white/10 border-white/20'
                        )}
                      >
                        <View
                          className={cn(
                            'w-12 h-12 rounded-xl items-center justify-center',
                            isSelected ? '' : 'bg-white/10'
                          )}
                          style={isSelected ? { backgroundColor: item.bgColor } : undefined}
                        >
                          <Icon size={24} color={isSelected ? item.color : 'white'} />
                        </View>
                        <View className="flex-1 ml-4">
                          <Text className={cn(
                            'text-lg font-bold',
                            isSelected ? 'text-gray-900' : 'text-white'
                          )}>
                            {item.title}
                          </Text>
                          <Text className={cn(
                            'text-sm',
                            isSelected ? 'text-gray-500' : 'text-white/60'
                          )}>
                            {item.description}
                          </Text>
                        </View>
                        <View className={cn(
                          'w-6 h-6 rounded-full items-center justify-center border-2',
                          isSelected
                            ? 'bg-[#1a365d] border-[#1a365d]'
                            : 'border-white/40'
                        )}>
                          {isSelected ? <Check size={14} color="white" /> : null}
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </ScrollView>

            <Animated.View entering={FadeInUp.duration(500).delay(400)} className="mb-8">
              <Pressable
                onPress={handleContinue}
                disabled={!selectedType}
                className={cn(
                  'rounded-2xl py-4 flex-row items-center justify-center',
                  selectedType ? 'bg-white' : 'bg-white/30'
                )}
              >
                <Text className={cn(
                  'font-bold text-lg',
                  selectedType ? 'text-[#1a365d]' : 'text-white/50'
                )}>
                  Continue
                </Text>
                <ChevronRight size={20} color={selectedType ? '#1a365d' : 'rgba(255,255,255,0.5)'} />
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : (
          // Signup Form
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.duration(500)} className="pt-6">
                <Pressable
                  onPress={() => setStep('select')}
                  className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mb-4"
                >
                  <ArrowLeft size={20} color="white" />
                </Pressable>

                {selectedTypeInfo ? (
                  <View className="flex-row items-center mb-6">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: selectedTypeInfo.bgColor }}
                    >
                      <selectedTypeInfo.icon size={24} color={selectedTypeInfo.color} />
                    </View>
                    <View className="ml-3">
                      <Text className="text-white text-2xl font-bold">
                        Create Account
                      </Text>
                      <Text className="text-white/70">
                        Sign up as {selectedTypeInfo.title}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(500).delay(100)} className="gap-4 py-4">
                {/* Name */}
                <View>
                  <Text className="text-white/90 font-medium mb-2">Full Name *</Text>
                  <View
                    className={cn(
                      'flex-row items-center rounded-xl px-4 py-3 border',
                      errors.name ? 'border-red-400 bg-red-500/10' : 'border-white/30 bg-white/10'
                    )}
                  >
                    <User size={20} color={errors.name ? '#F87171' : 'rgba(255,255,255,0.6)'} />
                    <TextInput
                      placeholder="Enter your name"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      className="flex-1 ml-3 text-white text-base"
                    />
                  </View>
                  {errors.name && <Text className="text-red-400 text-sm mt-1">{errors.name}</Text>}
                </View>

                {/* Email */}
                <View>
                  <Text className="text-white/90 font-medium mb-2">Email Address *</Text>
                  <View
                    className={cn(
                      'flex-row items-center rounded-xl px-4 py-3 border',
                      errors.email ? 'border-red-400 bg-red-500/10' : 'border-white/30 bg-white/10'
                    )}
                  >
                    <Mail size={20} color={errors.email ? '#F87171' : 'rgba(255,255,255,0.6)'} />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-white text-base"
                    />
                  </View>
                  {errors.email && <Text className="text-red-400 text-sm mt-1">{errors.email}</Text>}
                </View>

                {/* Phone */}
                <View>
                  <Text className="text-white/90 font-medium mb-2">Phone Number *</Text>
                  <View
                    className={cn(
                      'flex-row items-center rounded-xl px-4 py-3 border',
                      errors.phone ? 'border-red-400 bg-red-500/10' : 'border-white/30 bg-white/10'
                    )}
                  >
                    <Phone size={20} color={errors.phone ? '#F87171' : 'rgba(255,255,255,0.6)'} />
                    <TextInput
                      placeholder="(555) 000-0000"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={phone}
                      onChangeText={(text) => {
                        // Auto-format US phone number
                        const digits = text.replace(/\D/g, '');
                        let formatted = digits;
                        if (digits.length >= 7) {
                          formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
                        } else if (digits.length >= 4) {
                          formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                        } else if (digits.length > 0) {
                          formatted = `(${digits}`;
                        }
                        setPhone(formatted);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      keyboardType="phone-pad"
                      maxLength={14}
                      className="flex-1 ml-3 text-white text-base"
                    />
                  </View>
                  {errors.phone && <Text className="text-red-400 text-sm mt-1">{errors.phone}</Text>}
                </View>

                {/* Password */}
                <View>
                  <Text className="text-white/90 font-medium mb-2">Password *</Text>
                  <View
                    className={cn(
                      'flex-row items-center rounded-xl px-4 py-3 border',
                      errors.password ? 'border-red-400 bg-red-500/10' : 'border-white/30 bg-white/10'
                    )}
                  >
                    <Lock size={20} color={errors.password ? '#F87171' : 'rgba(255,255,255,0.6)'} />
                    <TextInput
                      placeholder="Create a password"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-white text-base"
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
                      {showPassword ? (
                        <EyeOff size={20} color="rgba(255,255,255,0.6)" />
                      ) : (
                        <Eye size={20} color="rgba(255,255,255,0.6)" />
                      )}
                    </Pressable>
                  </View>
                  {errors.password && <Text className="text-red-400 text-sm mt-1">{errors.password}</Text>}
                  {!errors.password ? (
                    <Text className="text-white/40 text-xs mt-1">Must be at least 6 characters</Text>
                  ) : null}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.duration(500).delay(200)} className="py-8">
                <Pressable
                  onPress={handleSignup}
                  disabled={isSubmitting}
                  className={cn(
                    'rounded-2xl py-4 items-center justify-center',
                    isSubmitting ? 'bg-white/50' : 'bg-white'
                  )}
                >
                  <Text className="text-[#1a365d] font-bold text-lg">
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </Pressable>

                <Text className="text-white/50 text-center text-sm mt-4">
                  By signing up, you agree to our Terms of Service
                </Text>

                <Pressable onPress={() => router.push('/login')} className="mt-4">
                  <Text className="text-white/70 text-center text-base">
                    Already have an account?{' '}
                    <Text className="text-white font-bold">Log In</Text>
                  </Text>
                </Pressable>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}
