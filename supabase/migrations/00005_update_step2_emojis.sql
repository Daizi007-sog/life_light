-- 更新第二步选项 emoji 以匹配 Figma 设计稿 (node 143:318)
UPDATE public.onboarding_configs
SET options = '[
  {"value": "work_stress", "label": "工作压力", "emoji": "😩"},
  {"value": "financial", "label": "经济压力", "emoji": "💰"},
  {"value": "future", "label": "未来规划", "emoji": "📝"},
  {"value": "social", "label": "社交关系", "emoji": "👯"},
  {"value": "self_worth", "label": "自我价值", "emoji": "🤳"},
  {"value": "intimate", "label": "亲密关系", "emoji": "👩‍❤️‍👨"},
  {"value": "family", "label": "家庭关系", "emoji": "👨‍👩‍👧‍👦"},
  {"value": "health", "label": "身体健康", "emoji": "🏃"},
  {"value": "exam", "label": "考学考公", "emoji": "📚"},
  {"value": "sleep", "label": "睡眠安歇", "emoji": "🛌"}
]'::jsonb
WHERE step_order = 2;
