/**
 * 经文卡片生成 Edge Function - Dify 工作流
 * 从 Supabase profiles 读取用户画像 -> 组装 user_context -> 调用 Dify Workflow API
 * 需在 Supabase Secrets 配置: DIFY_API_KEY（或 DIFY_SCRIPTURE_CARD_API_KEY）
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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_input } = await req.json();
    if (!user_input) {
      return new Response(JSON.stringify({ error: '缺少 user_input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey =
      Deno.env.get('DIFY_SCRIPTURE_CARD_API_KEY') ?? Deno.env.get('DIFY_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '服务未配置 DIFY_API_KEY 或 DIFY_SCRIPTURE_CARD_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '用户未登录' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let userContext = `用户此刻的心情或状态：「${user_input}」\n`;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('nickname, traits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        const traits = (profile.traits as Record<string, unknown>) || {};
        const dailyIssues = toLabels(traits.step_2, STEP2_LABELS);
        const spiritualChallenges = toLabels(traits.step_5, STEP5_LABELS);
        const nickname = profile.nickname || '朋友';
        userContext += `用户画像：昵称=${nickname}；日常影响：${dailyIssues.length ? dailyIssues.join('、') : '（暂无）'}；属灵挑战：${spiritualChallenges.length ? spiritualChallenges.join('、') : '（暂无）'}`;
      } else {
        const { data: legacyProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('questionnaire_answers, nickname')
          .eq('user_id', user.id)
          .maybeSingle();
        if (legacyProfile?.questionnaire_answers) {
          userContext += `用户画像：${JSON.stringify(legacyProfile.questionnaire_answers)}`;
        } else {
          userContext += '用户画像：（暂无）';
        }
      }
    } catch {
      userContext += '用户画像：（暂无）';
    }

    const res = await fetch(`${DIFY_BASE}/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: {
          user_context: userContext,
        },
        response_mode: 'blocking',
        user: user.id,
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

    const outputs = (data.data as { outputs?: Record<string, unknown> })?.outputs ?? {};
    const scripture_content =
      String(outputs.scripture_content ?? outputs.text ?? outputs.result ?? outputs.content ?? '').trim() ||
      '';
    const reference =
      String(outputs.reference ?? outputs.ref ?? '').trim();
    const ai_text =
      String(outputs.ai_text ?? outputs.encouragement ?? '').trim();

    return new Response(
      JSON.stringify({
        scripture_content: scripture_content || '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
        reference: reference || '约翰福音 3:16',
        ai_text: ai_text || '无论你此刻经历什么，神的爱永远与你同在。',
        image_url: outputs.image_url ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || '生成失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
