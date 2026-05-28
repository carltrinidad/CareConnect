import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import type { Conversation, ConversationParticipant, Message } from "@prisma/client";

export const messagesRouter = new Hono();

type ConversationWithRelations = Conversation & {
  participants: ConversationParticipant[];
  messages: Message[];
};

type ParticipantWithConversation = ConversationParticipant & {
  conversation: ConversationWithRelations;
};

// Get all conversations for a user
messagesRouter.get("/conversations", async (c) => {
  const userType = c.req.query("userType"); // "volunteer" or "facility"
  const userId = c.req.query("userId");

  if (!userType || !userId) {
    return c.json({ error: "userType and userId are required" }, 400);
  }

  try {
    // Get all conversations where this user is a participant
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        userType,
        userId,
      },
      include: {
        conversation: {
          include: {
            participants: true,
            messages: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    }) as ParticipantWithConversation[];

    // Transform to a more useful format
    const conversations = participants.map((p: ParticipantWithConversation) => {
      const otherParticipant = p.conversation.participants.find(
        (participant: ConversationParticipant) => !(participant.userType === userType && participant.userId === userId)
      );
      const lastMessage = p.conversation.messages[0];

      // Count unread messages
      const unreadCount = p.conversation.messages.filter(
        (m: Message) => !m.read && !(m.senderType === userType && m.senderId === userId)
      ).length;

      return {
        id: p.conversation.id,
        contactId: otherParticipant?.userId || "",
        contactType: otherParticipant?.userType || "",
        contactName: otherParticipant?.userName || "Unknown",
        contactAvatar: otherParticipant?.userAvatar || null,
        lastMessage: lastMessage?.content || "",
        lastMessageTime: lastMessage?.createdAt?.getTime() || p.conversation.createdAt.getTime(),
        unreadCount,
      };
    });

    // Sort by last message time
    conversations.sort((a: { lastMessageTime: number }, b: { lastMessageTime: number }) => b.lastMessageTime - a.lastMessageTime);

    return c.json({ data: conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return c.json({ error: "Failed to fetch conversations" }, 500);
  }
});

// Get messages for a conversation
messagesRouter.get("/conversations/:conversationId", async (c) => {
  const conversationId = c.req.param("conversationId");
  const userType = c.req.query("userType");
  const userId = c.req.query("userId");

  if (!userType || !userId) {
    return c.json({ error: "userType and userId are required" }, 400);
  }

  try {
    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userType,
        userId,
      },
    });

    if (!participant) {
      return c.json({ error: "Not a participant of this conversation" }, 403);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        read: false,
        NOT: {
          senderType: userType,
          senderId: userId,
        },
      },
      data: { read: true },
    });

    const otherParticipant = conversation.participants.find(
      (p: ConversationParticipant) => !(p.userType === userType && p.userId === userId)
    );

    return c.json({
      data: {
        id: conversation.id,
        contactId: otherParticipant?.userId || "",
        contactType: otherParticipant?.userType || "",
        contactName: otherParticipant?.userName || "Unknown",
        contactAvatar: otherParticipant?.userAvatar || null,
        messages: conversation.messages.map((m: Message) => ({
          id: m.id,
          senderId: m.senderId,
          senderType: m.senderType,
          content: m.content,
          timestamp: m.createdAt.getTime(),
          read: m.read,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return c.json({ error: "Failed to fetch conversation" }, 500);
  }
});

// Get or create a conversation with a specific user
messagesRouter.post("/conversations/find-or-create", async (c) => {
  const body = await c.req.json();
  const { userType, userId, userName, userAvatar, contactType, contactId, contactName, contactAvatar } = body;

  if (!userType || !userId || !contactType || !contactId) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    // Find existing conversation between these two users
    const existingParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        userType,
        userId,
        conversation: {
          participants: {
            some: {
              userType: contactType,
              userId: contactId,
            },
          },
        },
      },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (existingParticipant) {
      return c.json({ data: { conversationId: existingParticipant.conversationId } });
    }

    // Create new conversation with both participants
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            {
              userType,
              userId,
              userName: userName || "User",
              userAvatar: userAvatar || null,
            },
            {
              userType: contactType,
              userId: contactId,
              userName: contactName || "Contact",
              userAvatar: contactAvatar || null,
            },
          ],
        },
      },
    });

    return c.json({ data: { conversationId: conversation.id } });
  } catch (error) {
    console.error("Error finding/creating conversation:", error);
    return c.json({ error: "Failed to find or create conversation" }, 500);
  }
});

// Send a message
messagesRouter.post("/send", async (c) => {
  const body = await c.req.json();
  const { conversationId, senderType, senderId, content } = body;

  if (!conversationId || !senderType || !senderId || !content) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    // Verify sender is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userType: senderType,
        userId: senderId,
      },
    });

    if (!participant) {
      return c.json({ error: "Not a participant of this conversation" }, 403);
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderType,
        senderId,
        content,
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return c.json({
      data: {
        id: message.id,
        senderId: message.senderId,
        senderType: message.senderType,
        content: message.content,
        timestamp: message.createdAt.getTime(),
        read: message.read,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

// Get unread message count for a user
messagesRouter.get("/unread-count", async (c) => {
  const userType = c.req.query("userType");
  const userId = c.req.query("userId");

  if (!userType || !userId) {
    return c.json({ error: "userType and userId are required" }, 400);
  }

  try {
    // Get all conversations for this user
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        userType,
        userId,
      },
      select: {
        conversationId: true,
      },
    });

    const conversationIds = participants.map((p: { conversationId: string }) => p.conversationId);

    // Count unread messages in those conversations not sent by this user
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        read: false,
        NOT: {
          senderType: userType,
          senderId: userId,
        },
      },
    });

    return c.json({ data: { unreadCount } });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return c.json({ error: "Failed to fetch unread count" }, 500);
  }
});
