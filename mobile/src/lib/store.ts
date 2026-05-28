import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserType = 'elderly' | 'caregiver' | 'facility' | 'volunteer' | null;

export interface VolunteerSignup {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  facilityId: string;
  facilityName: string;
  facilityImage: string;
  facilityAddress: string;
  timeSlotId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  signupDate: string;
  hoursLogged?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  userType: UserType;
  location?: string;
  bio?: string;
  isAdmin?: boolean;
  verified?: boolean;
}

export interface ElderlyProfile extends User {
  userType: 'elderly';
  age?: number;
  careNeeds?: string[];
  emergencyContact?: string;
  medicalConditions?: string[];
  preferredCareType?: 'board_and_care' | 'private_caregiver' | 'both';
}

export interface CaregiverProfile extends User {
  userType: 'caregiver';
  experience: number;
  certifications: string[];
  specializations: string[];
  hourlyRate?: number;
  availability: 'full_time' | 'part_time' | 'live_in' | 'flexible';
  rating: number;
  reviewCount: number;
  verified: boolean;
}

export interface FacilityProfile extends User {
  userType: 'facility';
  facilityName: string;
  address: string;
  capacity: number;
  currentResidents: number;
  amenities: string[];
  services: string[];
  priceRange: string;
  rating: number;
  reviewCount: number;
  images: string[];
  licensed: boolean;
  volunteerHours?: VolunteerTimeSlot[];
  isHiring?: boolean;
  acceptingVolunteers?: boolean;
}

export interface VolunteerTimeSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  spotsAvailable: number;
}

export interface VolunteerProfile extends User {
  userType: 'volunteer';
  school?: string;
  age?: number;
  skills: string[];
  availability: string[];
  status: 'pending' | 'approved';
  totalHours?: number;
  completedSignups?: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

interface AppStore {
  // Auth state
  isOnboarded: boolean;
  currentUser: User | ElderlyProfile | CaregiverProfile | FacilityProfile | VolunteerProfile | null;
  userType: UserType;

  // Volunteer signups
  volunteerSignups: VolunteerSignup[];

  // Favorites
  favorites: string[];

  // Appearance
  themePreference: 'system' | 'light' | 'dark';

  // Conversations and messages
  conversations: Conversation[];
  messages: Record<string, Message[]>;

  // Actions
  setThemePreference: (pref: 'system' | 'light' | 'dark') => void;
  setUserType: (type: UserType) => void;
  setCurrentUser: (user: User | ElderlyProfile | CaregiverProfile | FacilityProfile | VolunteerProfile) => void;
  setOnboarded: (value: boolean) => void;
  logout: () => void;

  // Volunteer actions
  addVolunteerSignup: (signup: VolunteerSignup) => void;
  cancelVolunteerSignup: (signupId: string) => void;

  // Favorites actions
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  // Conversation actions
  getOrCreateConversation: (contactId: string, contactName: string, contactAvatar: string) => Conversation;
  sendMessage: (conversationId: string, content: string, contactId: string) => void;
  markConversationRead: (conversationId: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      isOnboarded: false,
      currentUser: null,
      userType: null,
      themePreference: 'system',
      volunteerSignups: [],
      favorites: [],
      conversations: [],
      messages: {},

      setThemePreference: (pref) => set({ themePreference: pref }),
      setUserType: (type) => set({ userType: type }),
      setCurrentUser: (user) => set({ currentUser: user, userType: user.userType }),
      setOnboarded: (value) => set({ isOnboarded: value }),
      logout: () => set({ currentUser: null, userType: null, isOnboarded: false }),

      // Volunteer actions
      addVolunteerSignup: (signup) =>
        set((state) => ({
          volunteerSignups: [...state.volunteerSignups, signup],
        })),
      cancelVolunteerSignup: (signupId) =>
        set((state) => ({
          volunteerSignups: state.volunteerSignups.map((s) =>
            s.id === signupId ? { ...s, status: 'cancelled' as const } : s
          ),
        })),

      // Favorites actions
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((f) => f !== id)
            : [...state.favorites, id],
        })),
      isFavorite: (id) => get().favorites.includes(id),

      // Conversation actions
      getOrCreateConversation: (contactId, contactName, contactAvatar) => {
        const state = get();
        const currentUser = state.currentUser;
        const userId = currentUser?.id || 'user';
        const userName = currentUser?.name || 'You';
        const userAvatar = currentUser?.avatar || '';

        // Check if conversation already exists
        const existing = state.conversations.find((c) => c.participantIds.includes(contactId));
        if (existing) {
          return existing;
        }

        // Create new conversation
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          participantIds: [userId, contactId],
          participantNames: [userName, contactName],
          participantAvatars: [userAvatar, contactAvatar],
          lastMessage: '',
          lastMessageTime: Date.now(),
          unreadCount: 0,
        };

        set((s) => ({
          conversations: [newConversation, ...s.conversations],
          messages: { ...s.messages, [newConversation.id]: [] },
        }));

        return newConversation;
      },

      sendMessage: (conversationId, content, contactId) => {
        const state = get();
        const currentUser = state.currentUser;
        const userId = currentUser?.id || 'user';

        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: userId,
          receiverId: contactId,
          content,
          timestamp: Date.now(),
          read: true,
        };

        set((s) => ({
          messages: {
            ...s.messages,
            [conversationId]: [...(s.messages[conversationId] || []), newMessage],
          },
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: content, lastMessageTime: Date.now() }
              : c
          ),
        }));
      },

      markConversationRead: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ),
        })),
    }),
    {
      name: 'board-care-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
