/**
 * 每日鼓励话语 Edge Function
 * 由 Cron 每 24h 触发，为所有用户生成鼓励语并写入 encouragement_logs
 * 需使用 service_role 调用以绕过 RLS
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // 验证 Cron 密钥（Supabase 调用时传入）
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ error: '未授权' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, questionnaire_answers, nickname');

        const apiKey = Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('DASHSCOPE_API_KEY');
        const url = Deno.env.get('DASHSCOPE_API_KEY')
            ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';
        const model = Deno.env.get('DASHSCOPE_API_KEY') ? 'qwen-turbo' : 'gpt-3.5-turbo';

        const logs: { user_id: string; content: string }[] = [];

        for (const profile of profiles || []) {
            const prompt = `你是一位基督徒灵修助手。请根据以下用户画像，生成一句简短、温暖、鼓励性的话语（50字以内）。只返回这句话，不要其他内容。
用户画像：${JSON.stringify(profile.questionnaire_answers || {})}
昵称：${profile.nickname || '朋友'}`;

            let content = '愿你今日满有平安与喜乐。';

            if (apiKey) {
                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                        body: JSON.stringify({
                            model,
                            messages: [{ role: 'user', content: prompt }],
                        }),
                    });
                    const data = await res.json();
                    const text = data?.choices?.[0]?.message?.content?.trim() || content;
                    content = text.length > 100 ? text.slice(0, 100) : text;
                } catch {
                    // 保持默认
                }
            }

            logs.push({ user_id: profile.user_id, content });
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
            JSON.stringify({ error: err?.message || '生成失败' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
