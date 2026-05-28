import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/cn';
import { loginUser } from '@/lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usePhone, setUsePhone] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!identifier.trim()) {
      newErrors.identifier = usePhone ? 'Phone number is required' : 'Email is required';
    } else if (!usePhone && !/\S+@\S+\.\S+/.test(identifier)) {
      newErrors.identifier = 'Please enter a valid email';
    } else if (usePhone && identifier.replace(/\D/g, '').length < 10) {
      newErrors.identifier = 'Please enter a valid phone number';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const result = await loginUser(identifier.trim(), password);

    if ('error' in result) {
      setIsSubmitting(false);
      Alert.alert(
        'Login Failed',
        result.error === 'Invalid credentials'
          ? 'No account found with those credentials. Please check your email/phone and password.'
          : 'Could not log in. Please try again.'
      );
      return;
    }

    const userType = result.userType as string;
    const isAdmin = (result as Record<string, unknown>).isAdmin as boolean || false;
    const verified = (result as Record<string, unknown>).verified as boolean || false;

    // Set the appropriate user profile based on userType
    if (userType === 'admin') {
      setCurrentUser({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        userType: null,
        isAdmin: true,
        verified: true,
      });
    } else if (userType === 'facility') {
      setCurrentUser({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        userType: 'facility',
        facilityName: (result as Record<string, unknown>).facilityName as string || result.name,
        address: (result as Record<string, unknown>).address as string || '',
        capacity: (result as Record<string, unknown>).capacity as number || 6,
        currentResidents: (result as Record<string, unknown>).currentResidents as number || 0,
        amenities: (result as Record<string, unknown>).amenities as string[] || [],
        services: (result as Record<string, unknown>).services as string[] || [],
        priceRange: (result as Record<string, unknown>).priceRange as string || 'Contact for pricing',
        rating: (result as Record<string, unknown>).rating as number || 0,
        reviewCount: (result as Record<string, unknown>).reviewCount as number || 0,
        images: (result as Record<string, unknown>).images as string[] || [],
        licensed: (result as Record<string, unknown>).licensed as boolean || false,
        isHiring: (result as Record<string, unknown>).isHiring as boolean || false,
        bio: result.bio || undefined,
        location: result.location || undefined,
        avatar: result.avatar || undefined,
        volunteerHours: (result as Record<string, unknown>).volunteerHours as [] || [],
        isAdmin,
        verified,
      });
    } else if (userType === 'elderly') {
      const meta = JSON.parse((result as Record<string, unknown>).metadata as string || '{}');
      setCurrentUser({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        userType: 'elderly',
        location: result.location || 'Los Angeles, CA',
        bio: result.bio || undefined,
        avatar: result.avatar || undefined,
        careNeeds: meta.careNeeds || [],
        preferredCareType: 'both',
        isAdmin,
        verified,
      });
    } else if (userType === 'caregiver') {
      const meta = JSON.parse((result as Record<string, unknown>).metadata as string || '{}');
      setCurrentUser({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        userType: 'caregiver',
        location: result.location || 'Los Angeles, CA',
        bio: result.bio || undefined,
        avatar: result.avatar || undefined,
        experience: meta.experience ?? 0,
        certifications: meta.certifications || [],
        specializations: meta.specializations || [],
        hourlyRate: meta.hourlyRate ?? 25,
        availability: 'flexible',
        rating: 0,
        reviewCount: 0,
        verified,
        isAdmin,
      });
    } else if (userType === 'volunteer') {
      const meta = JSON.parse((result as Record<string, unknown>).metadata as string || '{}');
      setCurrentUser({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        userType: 'volunteer',
        location: result.location || 'Los Angeles, CA',
        bio: result.bio || undefined,
        avatar: result.avatar || undefined,
        school: meta.school || '',
        skills: meta.skills || [],
        availability: meta.availability || [],
        status: 'pending',
        totalHours: 0,
        completedSignups: 0,
        isAdmin,
        verified,
      });
    }

    setOnboarded(true);
    setIsSubmitting(false);
    router.replace('/(tabs)');
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length >= 7) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 4) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }
    return formatted;
  };

  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#1a365d', '#234876', '#2d5a8c']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(500)} className="pt-6">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mb-6"
              >
                <ArrowLeft size={20} color="white" />
              </Pressable>

              <View className="items-center mb-8">
                <View className="w-20 h-20 bg-white/10 rounded-3xl items-center justify-center mb-4">
                  <Heart size={40} color="white" />
                </View>
                <Text className="text-white text-3xl font-bold">Welcome Back</Text>
                <Text className="text-white/70 text-base mt-2">
                  Log in to your CareConnect account
                </Text>
              </View>
            </Animated.View>

            {/* Toggle between email and phone */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} className="mb-6">
              <View className="flex-row bg-white/10 rounded-xl p-1">
                <Pressable
                  onPress={() => {
                    setUsePhone(false);
                    setIdentifier('');
                    setErrors({});
                  }}
                  className={cn(
                    'flex-1 py-3 rounded-lg items-center',
                    !usePhone ? 'bg-white/20' : ''
                  )}
                >
                  <Text className={cn('font-semibold', !usePhone ? 'text-white' : 'text-white/50')}>
                    Email
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setUsePhone(true);
                    setIdentifier('');
                    setErrors({});
                  }}
                  className={cn(
                    'flex-1 py-3 rounded-lg items-center',
                    usePhone ? 'bg-white/20' : ''
                  )}
                >
                  <Text className={cn('font-semibold', usePhone ? 'text-white' : 'text-white/50')}>
                    Phone
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(200)} className="gap-4">
              {/* Email or Phone */}
              <View>
                <Text className="text-white/90 font-medium mb-2">
                  {usePhone ? 'Phone Number' : 'Email Address'}
                </Text>
                <View
                  className={cn(
                    'flex-row items-center rounded-xl px-4 py-3 border',
                    errors.identifier ? 'border-red-400 bg-red-500/10' : 'border-white/30 bg-white/10'
                  )}
                >
                  {usePhone ? (
                    <Phone size={20} color={errors.identifier ? '#F87171' : 'rgba(255,255,255,0.6)'} />
                  ) : (
                    <Mail size={20} color={errors.identifier ? '#F87171' : 'rgba(255,255,255,0.6)'} />
                  )}
                  <TextInput
                    placeholder={usePhone ? '(555) 000-0000' : 'Enter your email'}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={identifier}
                    onChangeText={(text) => {
                      setIdentifier(usePhone ? formatPhone(text) : text);
                      if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }));
                    }}
                    keyboardType={usePhone ? 'phone-pad' : 'email-address'}
                    autoCapitalize="none"
                    maxLength={usePhone ? 14 : undefined}
                    className="flex-1 ml-3 text-white text-base"
                  />
                </View>
                {errors.identifier ? <Text className="text-red-400 text-sm mt-1">{errors.identifier}</Text> : null}
              </View>

              {/* Password */}
              <View>
                <Text className="text-white/90 font-medium mb-2">Password</Text>
                <View
                  className={cn(
                    'flex-row items-center rounded-xl px-4 py-3 border',
                    errors.password ? 'border-red-400 bg-red-500/10' : 'border-white/30 bg-white/10'
                  )}
                >
                  <Lock size={20} color={errors.password ? '#F87171' : 'rgba(255,255,255,0.6)'} />
                  <TextInput
                    placeholder="Enter your password"
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
                {errors.password ? <Text className="text-red-400 text-sm mt-1">{errors.password}</Text> : null}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(300)} className="py-8">
              <Pressable
                onPress={handleLogin}
                disabled={isSubmitting}
                className={cn(
                  'rounded-2xl py-4 items-center justify-center',
                  isSubmitting ? 'bg-white/50' : 'bg-white'
                )}
              >
                <Text className="text-[#1a365d] font-bold text-lg">
                  {isSubmitting ? 'Logging in...' : 'Log In'}
                </Text>
              </Pressable>

              <Pressable onPress={() => router.replace('/onboarding')} className="mt-6">
                <Text className="text-white/70 text-center text-base">
                  Don't have an account?{' '}
                  <Text className="text-white font-bold">Sign Up</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
