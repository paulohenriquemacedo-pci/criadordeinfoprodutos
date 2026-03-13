
-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  context_modules INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,7,8,9,10,11}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS for chat_conversations
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_conversations.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create own conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_conversations.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_conversations.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations
  FOR DELETE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_conversations.project_id AND projects.user_id = auth.uid()));

-- RLS for chat_messages
CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations cc JOIN projects p ON p.id = cc.project_id WHERE cc.id = chat_messages.conversation_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can create own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations cc JOIN projects p ON p.id = cc.project_id WHERE cc.id = chat_messages.conversation_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete own messages" ON public.chat_messages
  FOR DELETE USING (EXISTS (SELECT 1 FROM chat_conversations cc JOIN projects p ON p.id = cc.project_id WHERE cc.id = chat_messages.conversation_id AND p.user_id = auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update initialize_project_modules to include M12
CREATE OR REPLACE FUNCTION public.initialize_project_modules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.modules (project_id, module_number)
  SELECT NEW.id, gs
  FROM generate_series(1, 12) AS gs
  ON CONFLICT (project_id, module_number) DO NOTHING;
  RETURN NEW;
END;
$$;
