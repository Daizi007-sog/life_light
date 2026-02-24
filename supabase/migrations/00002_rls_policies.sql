-- RLS 策略：按 user_id 隔离数据

-- 启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripture_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encouragement_logs ENABLE ROW LEVEL SECURITY;

-- user_profiles: 用户只能读写自己的画像
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- scripture_cards: 用户只能读写自己的卡片
CREATE POLICY "Users can view own scripture cards"
    ON public.scripture_cards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scripture cards"
    ON public.scripture_cards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripture cards"
    ON public.scripture_cards FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripture cards"
    ON public.scripture_cards FOR DELETE
    USING (auth.uid() = user_id);

-- encouragement_logs: 用户只能读取自己的鼓励话语
CREATE POLICY "Users can view own encouragement logs"
    ON public.encouragement_logs FOR SELECT
    USING (auth.uid() = user_id);

-- 插入由 Edge Function 执行，使用 service_role 绕过 RLS
-- 或创建允许 service_role 插入的策略（Edge Function 调用时带 JWT）
