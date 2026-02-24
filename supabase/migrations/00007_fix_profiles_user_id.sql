-- 修复 profiles 表：确保存在 user_id 列
-- 若表由 Supabase 自动创建可能只有 id，需补充 user_id

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
      ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      -- 若存在 id 且为 auth 用户引用，复制到 user_id
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
        UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
      END IF;
      ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'nickname') THEN
      ALTER TABLE public.profiles ADD COLUMN nickname TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'traits') THEN
      ALTER TABLE public.profiles ADD COLUMN traits JSONB DEFAULT '{}';
    END IF;
  ELSE
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      nickname TEXT,
      traits JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
