/**
 * 主页正文 AI 生成 Edge Function (life_main_text)
 * 结合 profiles 用户画像，调用 DeepSeek 生成个性化灵修内容
 * 需在 Supabase Secrets 中配置 DEEPSEEK_API_KEY
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

// 选项 value -> label 映射（与 onboarding 配置一致）
const STEP2_LABELS: Record<string, string> = {
  work_stress: '工作压力',
  financial: '经济压力',
  future: '未来规划',
  social: '社交关系',
  self_worth: '自我价值',
  intimate: '亲密关系',
  family: '家庭关系',
  health: '身体健康',
  exam: '考学考公',
  sleep: '睡眠安歇',
};

const STEP5_LABELS: Record<string, string> = {
  peace_calling: '寻求内心的平安与召命',
  god_will: '辨明上帝对我生活的旨意',
  faith: '渴望建立更坚固的信心',
  struggles: '诚实面对内心的挣扎与疑惑',
  prayer: '建立规律且持续的祷告习惯',
};

function toLabels(values: unknown, labels: Record<string, string>): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => labels[String(v)] || String(v)).filter(Boolean);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: '仅支持 POST' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: '未授权' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(
      JSON.stringify({ error: '无效的 Authorization 头' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: '服务未配置 DEEPSEEK_API_KEY' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: authError?.message || '未登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, traits')
      .eq('user_id', user.id)
      .maybeSingle();

    const traits = (profile?.traits as Record<string, unknown>) || {};
    const dailyIssues = toLabels(traits.step_2, STEP2_LABELS);
    const spiritualChallenges = toLabels(traits.step_5, STEP5_LABELS);
    const nickname = profile?.nickname || '朋友';

    const systemPrompt = `你是一位基督徒灵修助手，擅长用温暖、鼓励、有同理心的话语陪伴读者。
语言风格：灵性、基督文化、温柔、安慰性。
核心价值观：相信、盼望、爱。
要求：
1. 严格针对用户画像中【日常影响你的问题】的其中一个选项，做出安慰性回答；
2. 严格针对用户画像中【你的属灵生命中面临哪些挑战】的用户选项，做出安慰性回答；
3. 具有同理心，温柔的语气；
4. 可以以整本圣经为素材，不限于固定典故，句式丰富多样，不要固定模版；
5. 输出约 150-250 字，分段可换行，保持可读性。`;

    const userPrompt = `请根据以下用户画像，生成一段个性化的灵修正文：

【日常影响你的问题】（请从中选一个重点回应）：${dailyIssues.length ? dailyIssues.join('、') : '（暂无）'}
【属灵生命中面临的挑战】：${spiritualChallenges.length ? spiritualChallenges.join('、') : '（暂无）'}
昵称：${nickname}

若用户未填写画像，请生成一段普适的温暖鼓励语。`;

    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || data?.message || res.statusText;
      return new Response(
        JSON.stringify({ error: `DeepSeek 请求失败: ${errMsg}` }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = data?.choices?.[0]?.message?.content?.trim() || '';

    return new Response(
      JSON.stringify({
        content: text,
        model: MODEL,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || '生成失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
