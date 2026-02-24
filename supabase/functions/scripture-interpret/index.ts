/**
 * 经文解读 Edge Function
 * 深度解读经文：洞察、行动指引、背景概览
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

        const prompt = `你是一位圣经学者和灵修导师。请对以下经文进行深度解读，返回 JSON 格式：
{"insight": "核心洞察（2-3句话）", "action": "行动指引（1-2条可实践的建议）", "background": "经文背景概览（历史、作者、写作目的等）"}

经文内容：
${scripture}`;

        const apiKey = Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('DASHSCOPE_API_KEY');
        let result: { insight?: string; action?: string; background?: string };

        if (apiKey) {
            const url = Deno.env.get('DASHSCOPE_API_KEY')
                ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
                : 'https://api.openai.com/v1/chat/completions';
            const model = Deno.env.get('DASHSCOPE_API_KEY') ? 'qwen-turbo' : 'gpt-3.5-turbo';

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                }),
            });
            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content || '';
            try {
                result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
            } catch {
                result = { insight: text, action: '', background: '' };
            }
        } else {
            result = {
                insight: '这段经文提醒我们，神的爱是无条件的，信靠祂的人将得着永恒的生命。',
                action: '1. 今日默想这段经文 2. 向身边的人分享这份爱',
                background: '约翰福音 3:16 是圣经中最著名的经节之一，由使徒约翰所写，强调神对世人的爱。',
            };
        }

        return new Response(
            JSON.stringify({
                insight: result?.insight,
                action: result?.action,
                background: result?.background,
                image_url: null,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err?.message || '解读失败' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
