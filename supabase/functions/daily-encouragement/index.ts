/**
 * 每日鼓励话语 Edge Function - Dify 工作流
 * 由 Cron 每 4 小时触发，为所有用户生成鼓励语并写入 encouragement_logs
 * 需在 Supabase Secrets 配置: DIFY_API_KEY、CRON_SECRET
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

  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('DIFY_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: '服务未配置 DIFY_API_KEY' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nickname, traits');

    const legacyProfiles = await supabase
      .from('user_profiles')
      .select('user_id, questionnaire_answers, nickname');

    const profileMap = new Map<string, { user_context: string }>();
    for (const p of profiles || []) {
      const traits = (p.traits as Record<string, unknown>) || {};
      const dailyIssues = toLabels(traits.step_2, STEP2_LABELS);
      const spiritualChallenges = toLabels(traits.step_5, STEP5_LABELS);
      const user_context = `昵称：${p.nickname || '朋友'}\n日常影响：${dailyIssues.join('、') || '（暂无）'}\n属灵挑战：${spiritualChallenges.join('、') || '（暂无）'}`;
      profileMap.set(p.user_id, { user_context });
    }
    for (const p of legacyProfiles.data || []) {
      if (!profileMap.has(p.user_id)) {
        const user_context = `昵称：${p.nickname || '朋友'}\n用户画像：${JSON.stringify(p.questionnaire_answers || {})}`;
        profileMap.set(p.user_id, { user_context });
      }
    }

    const logs: { user_id: string; content: string }[] = [];

    for (const [userId, { user_context }] of profileMap) {
      let content = '愿你今日满有平安与喜乐。';
      try {
        const res = await fetch(`${DIFY_BASE}/workflows/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            inputs: { user_context },
            response_mode: 'blocking',
            user: userId,
          }),
        });
        const raw = await res.text();
        const data = JSON.parse(raw);
        if (res.ok && data?.data?.outputs) {
          const out = data.data.outputs;
          const text = out.text ?? out.result ?? out.content ?? out.output ?? '';
          content = String(text).trim().slice(0, 200) || content;
        }
      } catch {
        // 保持默认
      }
      logs.push({ user_id: userId, content });
    }

    if (logs.length > 0) {
      const { error } = await supabase.from('encouragement_logs').insert(
        logs.map((l) => ({ user_id: l.user_id, content: l.content }))
      );
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, count: logs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || '生成失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
