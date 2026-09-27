-- ==========================================
-- CANVASCHAT SUPABASE DATABASE SCHEMA & SEED
-- ==========================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'away')),
  is_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  avatar TEXT NOT NULL,
  role_or_type TEXT NOT NULL,
  is_group BOOLEAN DEFAULT FALSE,
  is_ai BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MESSAGE REACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- 5. CANVAS WINDOWS TABLE (Persists Spatial Window Layout on Canvas)
CREATE TABLE IF NOT EXISTS public.canvas_windows (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  width DOUBLE PRECISION NOT NULL,
  height DOUBLE PRECISION NOT NULL,
  minimized BOOLEAN DEFAULT FALSE,
  is_maximized BOOLEAN DEFAULT FALSE,
  z_index INT NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ENABLE REALTIME SUBSCRIPTIONS (SAFE IF ALREADY ADDED)
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'canvas_windows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_windows;
  END IF;
END $$;

-- ==========================================
-- ENABLE ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Profiles Access" ON public.profiles;
CREATE POLICY "Public Profiles Access" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Conversations Access" ON public.conversations;
CREATE POLICY "Public Conversations Access" ON public.conversations FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Messages Access" ON public.messages;
CREATE POLICY "Public Messages Access" ON public.messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Message Reactions Access" ON public.message_reactions;
CREATE POLICY "Public Message Reactions Access" ON public.message_reactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Canvas Windows Access" ON public.canvas_windows;
CREATE POLICY "Public Canvas Windows Access" ON public.canvas_windows FOR ALL USING (true);

-- ==========================================
-- SEED INITIAL DATA
-- ==========================================
INSERT INTO public.conversations (id, title, subtitle, avatar, role_or_type, is_group, is_ai, status)
VALUES
  ('conv-copilot', 'Canvas Copilot', 'AI Assistant • Spatial Layout & Code', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80', 'AI Assistant', false, true, 'online'),
  ('conv-alex', 'Alex Morgan', 'Senior Frontend Engineer • Online', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Developer', false, false, 'online'),
  ('conv-sarah', 'Sarah Chen', 'Product Designer • Away', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Designer', false, false, 'away'),
  ('conv-design-squad', 'Design Squad', '4 members • Active design review', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80', 'Group', true, false, 'online')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (id, conversation_id, sender_id, sender_name, sender_avatar, text, created_at)
VALUES
  ('msg-1', 'conv-copilot', 'conv-copilot', 'Canvas Copilot', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80', 'Welcome to CanvasChat! Every chat window here exists as a node on an infinite canvas. Try dragging, resizing, or minimizing chat windows into floating round chat heads!', NOW() - INTERVAL '15 MINUTES'),
  ('msg-2', 'conv-alex', 'conv-alex', 'Alex Morgan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Hey! The floating window interactions feel super smooth. Are we using Framer Motion spring physics?', NOW() - INTERVAL '10 MINUTES'),
  ('msg-3', 'conv-alex', 'user', 'You', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'Yes! We have real-time window state persistence, spring animations, and round chat head bubbles.', NOW() - INTERVAL '5 MINUTES'),
  ('msg-4', 'conv-sarah', 'conv-sarah', 'Sarah Chen', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Love the dark mode aesthetic and blue glow borders!', NOW() - INTERVAL '8 MINUTES')
ON CONFLICT (id) DO NOTHING;
