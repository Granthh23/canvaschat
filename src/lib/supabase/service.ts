import { supabase, isSupabaseConfigured } from './client';
import { Conversation, Message, MessageReaction } from '@/types/chat';

// 1. Fetch Conversations
export async function fetchConversationsDb(): Promise<Conversation[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetch conversations error:', error.message);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      avatar: row.avatar,
      roleOrType: row.role_or_type,
      isGroup: row.is_group,
      isAi: row.is_ai,
      status: row.status,
    }));
  } catch (err) {
    console.warn('Supabase fetch conversations caught exception:', err);
    return null;
  }
}

export async function saveConversationDb(conv: Conversation): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('conversations').upsert(
      {
        id: conv.id,
        title: conv.title,
        subtitle: conv.subtitle || 'Direct Message',
        avatar: conv.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(conv.title)}`,
        role_or_type: conv.roleOrType || 'Direct Message',
        is_group: Boolean(conv.isGroup),
        is_ai: Boolean(conv.isAi),
        status: conv.status || 'online',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (error) {
      console.warn('Supabase save conversation error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save conversation exception:', err);
    return false;
  }
}

// 2. Fetch Messages with Reactions
export async function fetchMessagesDb(): Promise<Message[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data: messagesData, error: msgErr } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (msgErr) {
      console.warn('Supabase fetch messages error:', msgErr.message);
      return null;
    }

    const { data: reactionsData } = await supabase
      .from('message_reactions')
      .select('*');

    const reactionsMap: Record<string, MessageReaction[]> = {};
    if (reactionsData) {
      reactionsData.forEach((row) => {
        if (!reactionsMap[row.message_id]) {
          reactionsMap[row.message_id] = [];
        }
        const existing = reactionsMap[row.message_id].find((r) => r.emoji === row.emoji);
        if (existing) {
          existing.count += 1;
          existing.users.push(row.user_id);
        } else {
          reactionsMap[row.message_id].push({
            emoji: row.emoji,
            count: 1,
            users: [row.user_id],
          });
        }
      });
    }

    return (messagesData || []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderAvatar: m.sender_avatar,
      text: m.text,
      createdAt: m.created_at,
      reactions: reactionsMap[m.id] || [],
    }));
  } catch (err) {
    console.warn('Supabase fetch messages error:', err);
    return null;
  }
}

// 3. Send Message to Supabase & Live Channels
export async function sendMessageDb(message: Message): Promise<boolean> {
  // Broadcast locally across browser tabs / devices on same network
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('canvaschat_live_messages');
      bc.postMessage(message);
      bc.close();
    }
  } catch {
    // ignore
  }

  if (!supabase || !isSupabaseConfigured) return false;

  try {
    // Ensure parent conversation entry exists to prevent Foreign Key constraint error
    await supabase.from('conversations').upsert(
      {
        id: message.conversationId,
        title: message.senderName || 'Direct Chat',
        subtitle: 'Direct Message',
        avatar: message.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(message.senderId)}`,
        role_or_type: 'Direct Message',
        is_group: false,
        is_ai: false,
        status: 'online',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    const { error } = await supabase.from('messages').insert({
      id: message.id,
      conversation_id: message.conversationId,
      sender_id: message.senderId,
      sender_name: message.senderName,
      sender_avatar: message.senderAvatar,
      text: message.text,
      created_at: message.createdAt,
    });

    if (error) {
      console.warn('Supabase send message error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase send message exception:', err);
    return false;
  }
}

// 4. Toggle Reaction in Supabase
export async function toggleReactionDb(
  messageId: string,
  emoji: string,
  userId: string
): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  try {
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: userId,
        emoji,
      });
    }
    return true;
  } catch (err) {
    console.warn('Supabase toggle reaction error:', err);
    return false;
  }
}

// 5. Subscribe to Realtime Messages (Postgres + Broadcast + Cross-Tab)
export function subscribeToRealtimeMessages(onNewMessage: (msg: Message) => void) {
  let bc: BroadcastChannel | null = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    bc = new BroadcastChannel('canvaschat_live_messages');
    bc.onmessage = (event) => {
      if (event.data) {
        onNewMessage(event.data as Message);
      }
    };
  }

  if (!supabase || !isSupabaseConfigured) {
    return () => {
      if (bc) bc.close();
    };
  }

  try {
    const topicId = `sub_msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(topicId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new;
          if (row) {
            onNewMessage({
              id: row.id,
              conversationId: row.conversation_id,
              senderId: row.sender_id,
              senderName: row.sender_name,
              senderAvatar: row.sender_avatar,
              text: row.text,
              createdAt: row.created_at,
              reactions: [],
            });
          }
        }
      )
      .on('broadcast', { event: 'new_message' }, (payload) => {
        if (payload?.payload) {
          onNewMessage(payload.payload as Message);
        }
      })
      .subscribe();

    return () => {
      if (bc) bc.close();
      try {
        supabase?.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  } catch (err) {
    console.warn('Realtime messages subscription exception:', err);
    return () => {
      if (bc) bc.close();
    };
  }
}

// 6. Profiles Management
export async function fetchProfilesDb(): Promise<{ id: string; name: string; avatar: string; email?: string }[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch profiles error:', error.message);
      return null;
    }

    return (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
    }));
  } catch {
    return null;
  }
}

// Save profile locally + DB
export async function saveProfileDb(profile: { id: string; name: string; avatar: string; email?: string }): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('canvaschat_profiles_sync');
      bc.postMessage(profile);
      bc.close();
    }
  } catch {
    // ignore
  }

  if (!supabase || !isSupabaseConfigured) return false;

  try {
    await supabase.from('profiles').upsert({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
    });
    return true;
  } catch {
    return false;
  }
}

export function subscribeToProfiles(onNewProfile: (profile: { id: string; name: string; avatar: string; email?: string }) => void) {
  let bc: BroadcastChannel | null = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    bc = new BroadcastChannel('canvaschat_profiles_sync');
    bc.onmessage = (event) => {
      if (event.data) {
        onNewProfile(event.data);
      }
    };
  }

  if (!supabase || !isSupabaseConfigured) {
    return () => {
      if (bc) bc.close();
    };
  }

  try {
    const topicId = `sub_prof_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(topicId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          const row = payload.new as any;
          if (row && row.name) {
            onNewProfile({
              id: row.id,
              name: row.name,
              avatar: row.avatar,
            });
          }
        }
      )
      .on('broadcast', { event: 'new_profile' }, (payload) => {
        if (payload?.payload) {
          onNewProfile(payload.payload);
        }
      })
      .subscribe();

    return () => {
      if (bc) bc.close();
      try {
        supabase?.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  } catch (err) {
    console.warn('Realtime profiles subscription exception:', err);
    return () => {
      if (bc) bc.close();
    };
  }
}
