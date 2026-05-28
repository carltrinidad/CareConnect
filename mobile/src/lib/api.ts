const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// ============ USER API ============

export interface ChatUserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
}

// Register any user type
export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: string;
  avatar?: string;
  bio?: string;
  location?: string;
}): Promise<ChatUserData | { error: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      return { error: result.error || 'Registration failed' };
    }
    return result.data;
  } catch (error) {
    console.error('Error registering user:', error);
    return { error: 'Failed to register user' };
  }
}

// Login any user type (email or phone)
export async function loginUser(
  identifier: string,
  password: string
): Promise<(ChatUserData & { userType: string; [key: string]: unknown }) | { error: string }> {
  try {
    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    const payload: Record<string, string> = { password };
    if (isEmail) {
      payload.email = identifier;
    } else {
      payload.phone = identifier;
    }

    const response = await fetch(`${BACKEND_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      return { error: result.error || 'Login failed' };
    }
    return result.data;
  } catch (error) {
    console.error('Error logging in:', error);
    return { error: 'Failed to login' };
  }
}

// Update user profile
export async function updateUser(
  id: string,
  data: Partial<ChatUserData> & { metadata?: string }
): Promise<ChatUserData | { error: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      return { error: result.error || 'Update failed' };
    }
    return result.data;
  } catch (error) {
    console.error('Error updating user:', error);
    return { error: 'Failed to update user' };
  }
}

// Lookup user by ID
export async function getUserById(id: string): Promise<ChatUserData | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${id}`);
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export interface FacilityData {
  id: string;
  name: string;
  email: string;
  phone: string;
  facilityName: string;
  address: string;
  location?: string;
  bio?: string;
  avatar?: string;
  capacity: number;
  currentResidents: number;
  amenities: string[];
  services: string[];
  priceRange?: string;
  rating: number;
  reviewCount: number;
  images: string[];
  licensed: boolean;
  isHiring: boolean;
  acceptingVolunteers: boolean;
  volunteerHours: VolunteerTimeSlotData[];
}

export interface VolunteerTimeSlotData {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  spotsAvailable: number;
}

// Get all facilities
export async function getFacilities(): Promise<FacilityData[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/facilities`);
    if (!response.ok) {
      throw new Error('Failed to fetch facilities');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return [];
  }
}

// Get single facility by ID
export async function getFacility(id: string): Promise<FacilityData | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/facilities/${id}`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching facility:', error);
    return null;
  }
}

// Create facility (signup)
export async function createFacility(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  facilityName: string;
  address: string;
  location?: string;
  bio?: string;
  capacity?: number;
  amenities?: string[];
  services?: string[];
  priceRange?: string;
  licensed?: boolean;
  isHiring?: boolean;
  images?: string[];
  volunteerHours?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    spotsAvailable?: number;
  }[];
}): Promise<FacilityData | { error: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/facilities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    console.error('Error creating facility:', error);
    return { error: 'Failed to create facility' };
  }
}

// Update facility
export async function updateFacility(
  id: string,
  data: Partial<FacilityData>
): Promise<FacilityData | { error: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/facilities/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    console.error('Error updating facility:', error);
    return { error: 'Failed to update facility' };
  }
}

// Add volunteer time slot
export async function addVolunteerTimeSlot(
  facilityId: string,
  data: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    spotsAvailable?: number;
  }
): Promise<VolunteerTimeSlotData | { error: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/facilities/${facilityId}/volunteer-hours`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    console.error('Error adding volunteer time slot:', error);
    return { error: 'Failed to add volunteer time slot' };
  }
}

// Delete volunteer time slot
export async function deleteVolunteerTimeSlot(
  slotId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/facilities/volunteer-hours/${slotId}`, {
      method: 'DELETE',
    });
    return response.json();
  } catch (error) {
    console.error('Error deleting volunteer time slot:', error);
    return { error: 'Failed to delete volunteer time slot' };
  }
}

// Login facility
export async function loginFacility(
  email: string,
  password: string
): Promise<FacilityData | { error: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/facilities/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  } catch (error) {
    console.error('Error logging in:', error);
    return { error: 'Failed to login' };
  }
}

// ============ ADMIN API ============

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: string;
  avatar: string | null;
  verified: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export async function getAdminUsers(adminEmail: string): Promise<AdminUserData[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
      headers: { 'x-admin-email': adminEmail },
    });
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || [];
  } catch {
    return [];
  }
}

export async function adminVerifyUser(adminEmail: string, userId: string): Promise<{ verified: boolean } | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/verify`, {
      method: 'PATCH',
      headers: { 'x-admin-email': adminEmail },
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data || null;
  } catch {
    return null;
  }
}

export async function adminDeleteUser(adminEmail: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'x-admin-email': adminEmail },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============ MESSAGING API ============

export interface ConversationData {
  id: string;
  contactId: string;
  contactType: string;
  contactName: string;
  contactAvatar: string | null;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export interface MessageData {
  id: string;
  senderId: string;
  senderType: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface ConversationDetailData {
  id: string;
  contactId: string;
  contactType: string;
  contactName: string;
  contactAvatar: string | null;
  messages: MessageData[];
}

// Get all conversations for a user
export async function getConversations(
  userType: string,
  userId: string
): Promise<ConversationData[]> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/messages/conversations?userType=${encodeURIComponent(userType)}&userId=${encodeURIComponent(userId)}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

// Get messages for a conversation
export async function getConversationMessages(
  conversationId: string,
  userType: string,
  userId: string
): Promise<ConversationDetailData | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/messages/conversations/${conversationId}?userType=${encodeURIComponent(userType)}&userId=${encodeURIComponent(userId)}`
    );
    if (!response.ok) {
      return null;
    }
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return null;
  }
}

// Find or create a conversation
export async function findOrCreateConversation(data: {
  userType: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  contactType: string;
  contactId: string;
  contactName: string;
  contactAvatar?: string;
}): Promise<{ conversationId: string } | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/messages/conversations/find-or-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to find or create conversation');
    }
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error finding/creating conversation:', error);
    return null;
  }
}

// Send a message
export async function sendMessageApi(data: {
  conversationId: string;
  senderType: string;
  senderId: string;
  content: string;
}): Promise<MessageData | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

// Get unread message count
export async function getUnreadCount(
  userType: string,
  userId: string
): Promise<number> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/messages/unread-count?userType=${encodeURIComponent(userType)}&userId=${encodeURIComponent(userId)}`
    );
    if (!response.ok) {
      return 0;
    }
    const result = await response.json();
    return result.data?.unreadCount || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}
