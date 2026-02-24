-- 为 onboarding_configs 增加 title/subtitle/type 列，兼容新表结构
-- 若表已有 question_text/input_type，则从其中迁移数据

ALTER TABLE public.onboarding_configs
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT;

-- 从 question_text/input_type 迁移（仅当旧列存在时执行）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'onboarding_configs' AND column_name = 'question_text'
  ) THEN
    UPDATE public.onboarding_configs
    SET
      title = COALESCE(title, question_text),
      subtitle = CASE WHEN input_type = 'multi_select' AND (subtitle IS NULL OR subtitle = '') THEN '(多选)' ELSE COALESCE(subtitle, '') END,
      type = COALESCE(NULLIF(type, ''), CASE input_type WHEN 'text' THEN 'input' WHEN 'multi_select' THEN 'multi-select' WHEN 'single_select' THEN 'single-select' ELSE 'single-select' END);
  END IF;
END $$;
