import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Shield, Trash2, CheckCircle, Circle, Users, X, AlertTriangle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { getAdminUsers, adminVerifyUser, adminDeleteUser, AdminUserData } from '@/lib/api';
import { DefaultAvatar } from '@/components/DefaultAvatar';

const USER_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  elderly: { bg: '#FEF3C7', text: '#92400E', label: 'Elderly' },
  caregiver: { bg: '#DBEAFE', text: '#1E40AF', label: 'Caregiver' },
  facility: { bg: '#D1FAE5', text: '#065F46', label: 'Facility' },
  volunteer: { bg: '#EDE9FE', text: '#5B21B6', label: 'Volunteer' },
  admin: { bg: '#FEE2E2', text: '#991B1B', label: 'Admin' },
};

export default function AdminScreen() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserData | null>(null);

  const adminEmail = currentUser?.email ?? '';

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const data = await getAdminUsers(adminEmail);
    setUsers(data);
    setLoading(false);
  }, [adminEmail]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleVerify = async (user: AdminUserData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActionLoading(user.id + '-verify');
    const result = await adminVerifyUser(adminEmail, user.id);
    if (result) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, verified: result.verified } : u))
      );
    }
    setActionLoading(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(deleteTarget.id + '-delete');
    const success = await adminDeleteUser(adminEmail, deleteTarget.id);
    if (success) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    }
    setActionLoading(null);
    setDeleteTarget(null);
  };

  const nonAdminUsers = users.filter((u) => !u.isAdmin);
  const verifiedCount = nonAdminUsers.filter((u) => u.verified).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-[#1a365d] px-5 pt-4 pb-5">
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="flex-row items-center mb-1">
            <Shield size={22} color="white" />
            <Text className="text-white text-2xl font-bold ml-2">Admin Panel</Text>
          </View>
          <Text className="text-white/60 text-sm">Manage and verify user accounts</Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} className="flex-row mt-4 gap-3">
          <View className="flex-1 bg-white/10 rounded-2xl p-3">
            <Text className="text-white/60 text-xs">Total Users</Text>
            <Text className="text-white text-2xl font-bold">{nonAdminUsers.length}</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-2xl p-3">
            <Text className="text-white/60 text-xs">Verified</Text>
            <Text className="text-white text-2xl font-bold">{verifiedCount}</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-2xl p-3">
            <Text className="text-white/60 text-xs">Pending</Text>
            <Text className="text-white text-2xl font-bold">{nonAdminUsers.length - verifiedCount}</Text>
          </View>
        </Animated.View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1a365d" />
        </View>
      ) : nonAdminUsers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Users size={56} color="#D1D5DB" />
          <Text className="text-gray-500 text-lg font-semibold mt-4">No users yet</Text>
          <Text className="text-gray-400 text-sm text-center mt-1">
            Accounts will appear here once people sign up
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {nonAdminUsers.map((user, index) => {
            const typeInfo = USER_TYPE_COLORS[user.userType] ?? { bg: '#F3F4F6', text: '#374151', label: user.userType };
            const isVerifyLoading = actionLoading === user.id + '-verify';
            const isDeleteLoading = actionLoading === user.id + '-delete';

            return (
              <Animated.View key={user.id} entering={FadeInDown.duration(350).delay(index * 60)}>
                <View className="bg-white rounded-2xl p-4" style={{ elevation: 2 }}>
                  {/* Top row */}
                  <View className="flex-row items-center">
                    <View className="relative">
                      <DefaultAvatar uri={user.avatar} size={48} />
                      {user.verified && (
                        <View className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                          <CheckCircle size={10} color="white" fill="white" />
                        </View>
                      )}
                    </View>

                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="text-gray-900 font-semibold text-base">{user.name}</Text>
                        {user.verified && (
                          <View className="bg-blue-50 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                            <CheckCircle size={10} color="#3B82F6" fill="#3B82F6" />
                            <Text className="text-blue-600 text-xs font-medium">Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-400 text-sm" numberOfLines={1}>{user.email}</Text>
                    </View>

                    {/* Type badge */}
                    <View className="px-2 py-1 rounded-full ml-2" style={{ backgroundColor: typeInfo.bg }}>
                      <Text className="text-xs font-semibold" style={{ color: typeInfo.text }}>{typeInfo.label}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row mt-3 gap-2">
                    <Pressable
                      onPress={() => handleVerify(user)}
                      disabled={!!actionLoading}
                      className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                      style={{ backgroundColor: user.verified ? '#EFF6FF' : '#1a365d' }}
                    >
                      {isVerifyLoading ? (
                        <ActivityIndicator size="small" color={user.verified ? '#3B82F6' : 'white'} />
                      ) : user.verified ? (
                        <>
                          <CheckCircle size={15} color="#3B82F6" fill="#3B82F6" />
                          <Text className="text-blue-600 font-semibold text-sm ml-1.5">Verified</Text>
                        </>
                      ) : (
                        <>
                          <Circle size={15} color="white" />
                          <Text className="text-white font-semibold text-sm ml-1.5">Verify</Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={() => setDeleteTarget(user)}
                      disabled={!!actionLoading}
                      className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center"
                    >
                      {isDeleteLoading ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Trash2 size={16} color="#EF4444" />
                      )}
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            );
          })}
          <View className="h-6" />
        </ScrollView>
      )}

      {/* Delete confirmation modal */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <Animated.View entering={FadeInDown.duration(300)} className="bg-white rounded-3xl p-6 w-full">
            <View className="items-center mb-4">
              <View className="w-14 h-14 bg-red-100 rounded-full items-center justify-center mb-3">
                <AlertTriangle size={28} color="#EF4444" />
              </View>
              <Text className="text-gray-900 text-xl font-bold">Delete Account?</Text>
              <Text className="text-gray-500 text-center mt-2">
                This will permanently delete{' '}
                <Text className="font-semibold text-gray-800">{deleteTarget?.name}</Text>'s account.
                This cannot be undone.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setDeleteTarget(null)}
                className="flex-1 py-3.5 rounded-2xl bg-gray-100 items-center"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteConfirm}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 items-center"
              >
                <Text className="text-white font-semibold">Delete</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
