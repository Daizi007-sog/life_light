/**
 * 主页鼓励话语 - Dify 工作流
 * 从 Supabase profiles 读取用户画像 -> 调用 Dify 工作流 API -> 返回鼓励文字
 * 需在 Supabase Secrets 配置: DIFY_API_KEY
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DIFY_BASE = 'https://api.dify.ai/v1';

function toLabels(values: unknown, labels: Record<string, string>): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => labels[String(v)] || String(v)).filter(Boolean);
}

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

  const apiKey = Deno.env.get('DIFY_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: '服务未配置 DIFY_API_KEY' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let profileText = '（暂无画像）';
  let userId = 'anonymous';

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '')?.trim();
  if (token) {
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, traits')
          .eq('user_id', user.id)
          .maybeSingle();
        const traits = (profile?.traits as Record<string, unknown>) || {};
        const dailyIssues = toLabels(traits.step_2, STEP2_LABELS);
        const spiritualChallenges = toLabels(traits.step_5, STEP5_LABELS);
        const nickname = profile?.nickname || '朋友';
        profileText = `昵称：${nickname}\n日常影响你的问题：${dailyIssues.length ? dailyIssues.join('、') : '（暂无）'}\n属灵挑战：${spiritualChallenges.length ? spiritualChallenges.join('、') : '（暂无）'}`;
      }
    } catch {
      // 匿名
    }
  }

  try {
    const res = await fetch(`${DIFY_BASE}/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: {
          user_context: profileText,
        },
        response_mode: 'blocking',
        user: userId,
      }),
    });

    const raw = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Dify 响应解析失败', raw: raw.slice(0, 500) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: (data as { message?: string }).message || raw }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const outputs = (data.data as { outputs?: Record<string, unknown> })?.outputs;
    let final_text = '';
    if (outputs && typeof outputs === 'object') {
      final_text =
        String(outputs.final_text ?? outputs.text ?? outputs.result ?? outputs.output ?? outputs.content ?? '').trim();
    }
    if (!final_text) {
      final_text = (data.data as { text?: string })?.text?.trim() || '今日愿你平安，在祂的恩典中得享安息。';
    }

    return new Response(JSON.stringify({ content: final_text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || '生成失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
