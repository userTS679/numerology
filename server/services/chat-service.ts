import { db } from '../config/database';
import { chatSessions, users } from '@shared/production-schema';
import { eq, desc } from 'drizzle-orm';
import { chatWithNumenCoach } from './groq';
import { logAuditEvent } from './auth-service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: any;
}

export interface ChatContext {
  userId: string;
  userProfile?: any;
  kundliData?: any;
  recentReadings?: any[];
}

/**
 * Send message and get AI response
 */
export async function sendChatMessage(
  userId: string,
  message: string,
  sessionId?: string
): Promise<{ response: string; sessionId: string; messages: ChatMessage[] }> {
  try {
    // Get or create chat session
    let session;
    let messages: ChatMessage[] = [];

    if (sessionId) {
      const [existingSession] = await db.select()
        .from(chatSessions)
        .where(eq(chatSessions.id, sessionId))
        .limit(1);
      
      if (existingSession && existingSession.userId === userId) {
        session = existingSession;
        messages = Array.isArray(session.messages) ? session.messages as ChatMessage[] : [];
      }
    }

    if (!session) {
      // Create new session
      const [newSession] = await db.insert(chatSessions).values({
        userId,
        sessionName: `Chat ${new Date().toLocaleDateString()}`,
        messages: [],
        isActive: true,
        messageCount: 0,
      }).returning();
      session = newSession;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    messages.push(userMessage);

    // Get AI response with context
    const context = await buildChatContext(userId);
    const aiResponse = await chatWithNumenCoach(message, context);

    // Add AI response
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    };
    messages.push(assistantMessage);

    // Update session
    await db.update(chatSessions)
      .set({
        messages,
        messageCount: messages.length,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, session.id));

    // Log chat interaction
    await logAuditEvent(
      userId,
      'chat_message_sent',
      'chat_session',
      session.id,
      true,
      { messageLength: message.length, responseLength: aiResponse.length }
    );

    return {
      response: aiResponse,
      sessionId: session.id,
      messages
    };

  } catch (error) {
    console.error('Chat service error:', error);
    
    // Log chat error
    await logAuditEvent(
      userId,
      'chat_message_failed',
      'chat_session',
      sessionId || '',
      false,
      { error: error.message }
    );
    
    throw error;
  }
}

/**
 * Get chat history for user
 */
export async function getChatHistory(userId: string, limit: number = 10): Promise<any[]> {
  try {
    const sessions = await db.select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.lastMessageAt))
      .limit(limit);

    return sessions.map(session => ({
      id: session.id,
      name: session.sessionName,
      messageCount: session.messageCount,
      lastMessageAt: session.lastMessageAt,
      isActive: session.isActive,
      preview: getSessionPreview(session.messages as ChatMessage[])
    }));

  } catch (error) {
    console.error('Get chat history error:', error);
    throw error;
  }
}

/**
 * Get specific chat session
 */
export async function getChatSession(userId: string, sessionId: string): Promise<ChatMessage[]> {
  try {
    const [session] = await db.select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (!session || session.userId !== userId) {
      throw new Error('Chat session not found or access denied');
    }

    return Array.isArray(session.messages) ? session.messages as ChatMessage[] : [];

  } catch (error) {
    console.error('Get chat session error:', error);
    throw error;
  }
}

/**
 * Build context for AI chat
 */
async function buildChatContext(userId: string): Promise<ChatContext> {
  try {
    // Get user profile
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    // Get user's Kundli data for context
    // This would fetch from kundliCharts and astroReadings tables
    
    return {
      userId,
      userProfile: user ? {
        name: user.fullName,
        // Add other relevant profile data
      } : undefined,
      kundliData: undefined, // Would include chart data
      recentReadings: [] // Would include recent readings
    };

  } catch (error) {
    console.warn('Failed to build chat context:', error);
    return { userId };
  }
}

/**
 * Get session preview for chat history
 */
function getSessionPreview(messages: ChatMessage[]): string {
  if (!messages || messages.length === 0) {
    return 'No messages';
  }

  const lastUserMessage = messages
    .filter(m => m.role === 'user')
    .pop();

  if (lastUserMessage) {
    return lastUserMessage.content.length > 50 
      ? lastUserMessage.content.substring(0, 50) + '...'
      : lastUserMessage.content;
  }

  return 'Chat session';
}

/**
 * Delete chat session
 */
export async function deleteChatSession(userId: string, sessionId: string): Promise<void> {
  try {
    const result = await db.delete(chatSessions)
      .where(eq(chatSessions.id, sessionId));

    // Log session deletion
    await logAuditEvent(userId, 'chat_session_deleted', 'chat_session', sessionId, true);

  } catch (error) {
    console.error('Delete chat session error:', error);
    throw error;
  }
}