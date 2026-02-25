-- 将步骤 5 和 7 改为多选
UPDATE public.onboarding_configs
SET
  input_type = 'multi_select',
  question_text = CASE step_order
    WHEN 5 THEN '你的属灵生命中面临哪些挑战? (多选)'
    WHEN 7 THEN '光盐旅迹可以在哪些方面陪伴你成长? (多选)'
    ELSE question_text
  END,
  subtitle = '(多选)',
  type = 'multi-select'
WHERE step_order IN (5, 7);
