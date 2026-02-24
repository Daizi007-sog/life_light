-- onboarding_configs: 七步入职问卷配置
-- profiles: 用户画像（nickname + traits）

-- 1. onboarding_configs 表
CREATE TABLE IF NOT EXISTS public.onboarding_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_order INT NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    input_type TEXT NOT NULL CHECK (input_type IN ('text', 'single_select', 'multi_select')),
    options JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. profiles 表（与 auth.users 关联）
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    nickname TEXT,
    traits JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_configs_step_order ON public.onboarding_configs(step_order);

-- profiles 触发器
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. 插入七步入职配置（光盐旅记）
INSERT INTO public.onboarding_configs (step_order, question_text, input_type, options) VALUES
(1, '怎么称呼你?', 'text', '[]'),
(2, '有什么日常问题会影响你? (多选)', 'multi_select', '[
  {"value": "work_stress", "label": "工作压力", "emoji": "👷"},
  {"value": "financial", "label": "经济压力", "emoji": "💰"},
  {"value": "future", "label": "未来规划", "emoji": "💡"},
  {"value": "social", "label": "社交关系", "emoji": "👯"},
  {"value": "self_worth", "label": "自我价值", "emoji": "💪"},
  {"value": "intimate", "label": "亲密关系", "emoji": "❤️"},
  {"value": "family", "label": "家庭关系", "emoji": "🏠"},
  {"value": "health", "label": "身体健康", "emoji": "🏃"},
  {"value": "exam", "label": "考学考公", "emoji": "📚"},
  {"value": "sleep", "label": "睡眠安歇", "emoji": "😴"}
]'),
(3, '你的信仰历程处于哪个阶段?', 'single_select', '[
  {"value": "new_believer", "label": "初信萌芽"},
  {"value": "rooted", "label": "生命扎根"},
  {"value": "growing", "label": "持续成长"},
  {"value": "lifelong", "label": "一生跟随"}
]'),
(4, '你平时的灵修生活频率是?', 'single_select', '[
  {"value": "many_daily", "label": "每日多次,恒切寻求"},
  {"value": "daily", "label": "每日定时,静心灵修"},
  {"value": "weekly", "label": "每周数次,稳定亲近"},
  {"value": "seeking", "label": "正在寻求,渴望开始"}
]'),
(5, '你的属灵生命中面临哪些挑战?', 'single_select', '[
  {"value": "peace_calling", "label": "寻求内心的平安与召命"},
  {"value": "god_will", "label": "辨明上帝对我生活的旨意"},
  {"value": "faith", "label": "渴望建立更坚固的信心"},
  {"value": "struggles", "label": "诚实面对内心的挣扎与疑惑"},
  {"value": "prayer", "label": "建立规律且持续的祷告习惯"}
]'),
(6, '你对哪些章节主题更感兴趣? (多选)', 'multi_select', '[
  {"value": "comfort", "label": "安慰鼓励", "emoji": "😊"},
  {"value": "wisdom", "label": "智慧指引", "emoji": "💡"},
  {"value": "pride", "label": "戒骄戒躁", "emoji": "🌈"},
  {"value": "workplace", "label": "工作职场", "emoji": "💼"},
  {"value": "relationships", "label": "人际关系", "emoji": "👥"},
  {"value": "resilience", "label": "逆境坚韧", "emoji": "⛰️"},
  {"value": "healing", "label": "医治恢复", "emoji": "➕"},
  {"value": "surrender", "label": "安心交托", "emoji": "🕊️"},
  {"value": "direction", "label": "寻求方向", "emoji": "🤔"},
  {"value": "deeper", "label": "渴望更深", "emoji": "🙏"},
  {"value": "freedom", "label": "捆绑释放", "emoji": "⛓️"},
  {"value": "passion", "label": "重拾热情", "emoji": "🔥"}
]'),
(7, '光盐旅记可以在哪些方面陪伴你成长?', 'single_select', '[
  {"value": "prayer", "label": "每日祷告引领"},
  {"value": "scripture", "label": "深度经文启示"},
  {"value": "practical", "label": "信仰视角的现实指引"},
  {"value": "companions", "label": "属灵同伴的互助得力"},
  {"value": "watchfulness", "label": "属灵生命督促与守望"}
]')
ON CONFLICT (step_order) DO NOTHING;

-- RLS
ALTER TABLE public.onboarding_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- onboarding_configs: 所有人可读
CREATE POLICY "Anyone can read onboarding configs"
    ON public.onboarding_configs FOR SELECT
    TO public
    USING (true);

-- profiles: 用户只能读写自己的
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
