-- 基督徒灵修助手 MVP 初始表结构
-- 在 Supabase SQL Editor 中执行，或使用 supabase db push

-- 用户画像表（与 auth.users 关联）
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    nickname TEXT,
    questionnaire_answers JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 经文卡片表
CREATE TABLE IF NOT EXISTS public.scripture_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_input TEXT,
    scripture_content TEXT NOT NULL,
    ai_generated_text TEXT,
    template_id TEXT,
    image_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 鼓励话语记录表
CREATE TABLE IF NOT EXISTS public.encouragement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_scripture_cards_user_id ON public.scripture_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_scripture_cards_created_at ON public.scripture_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encouragement_logs_user_id ON public.encouragement_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_encouragement_logs_generated_at ON public.encouragement_logs(generated_at DESC);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
