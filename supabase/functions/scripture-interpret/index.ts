/**
 * 经文解读 Edge Function - Dify 工作流
 * 从 Supabase profiles 读取用户画像 -> 组装 user_context -> 调用 Dify Workflow API
 * 需在 Supabase Secrets 配置: DIFY_API_KEY（或 DIFY_SCRIPTURE_INTERPRET_API_KEY）
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DIFY_BASE = 'https://api.dify.ai/v1';

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

    const { scripture } = await req.json();
    if (!scripture) {
      return new Response(JSON.stringify({ error: '缺少 scripture' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey =
      Deno.env.get('DIFY_SCRIPTURE_INTERPRET_API_KEY') ?? Deno.env.get('DIFY_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '服务未配置 DIFY_API_KEY 或 DIFY_SCRIPTURE_INTERPRET_API_KEY' }),
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

    let userContext = `待解读经文：\n${scripture}\n\n`;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('nickname, traits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.traits && typeof profile.traits === 'object') {
        userContext += `用户画像：${JSON.stringify(profile.traits)}`;
      } else {
        userContext += '用户画像：（暂无）';
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
    const insight = String(outputs.insight ?? outputs.text ?? outputs.result ?? '').trim();
    const action = String(outputs.action ?? '').trim();
    const background = String(outputs.background ?? '').trim();

    return new Response(
      JSON.stringify({
        insight: insight || '这段经文提醒我们，神的爱是无条件的，信靠祂的人将得着永恒的生命。',
        action: action || '1. 今日默想这段经文 2. 向身边的人分享这份爱',
        background:
          background ||
          '约翰福音 3:16 是圣经中最著名的经节之一，由使徒约翰所写，强调神对世人的爱。',
        image_url: outputs.image_url ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || '解读失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
