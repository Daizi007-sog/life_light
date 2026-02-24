/**
 * 经文卡片生成 Edge Function
 * 接收用户输入，调用 LLM API 返回推荐经文
 * 环境变量: OPENAI_API_KEY 或 DASHSCOPE_API_KEY（通义千问）
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

        const { user_input } = await req.json();
        if (!user_input) {
            return new Response(JSON.stringify({ error: '缺少 user_input' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user } } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );
        if (!user) {
            return new Response(JSON.stringify({ error: '用户未登录' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 获取用户画像用于个性化
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('questionnaire_answers, nickname')
            .eq('user_id', user.id)
            .single();

        const prompt = `你是一位基督徒灵修助手。用户此刻的心情或状态是：「${user_input}」。
${profile?.questionnaire_answers ? `用户画像：${JSON.stringify(profile.questionnaire_answers)}` : ''}
请推荐一段合适的圣经经文来安慰或鼓励用户。返回 JSON 格式：
{"scripture_content": "经文正文", "reference": "经节引用如：约翰福音3:16", "ai_text": "简短鼓励语"}`;

        const apiKey = Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('DASHSCOPE_API_KEY');
        let result: { scripture_content?: string; reference?: string; ai_text?: string };

        if (apiKey) {
            if (Deno.env.get('DASHSCOPE_API_KEY')) {
                // 通义千问
                const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: 'qwen-turbo',
                        messages: [{ role: 'user', content: prompt }],
                    }),
                });
                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content || '';
                try {
                    result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
                } catch {
                    result = { scripture_content: text, reference: '', ai_text: '' };
                }
            } else {
                // OpenAI
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: prompt }],
                    }),
                });
                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content || '';
                try {
                    result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
                } catch {
                    result = { scripture_content: text, reference: '', ai_text: '' };
                }
            }
        } else {
            // 无 API Key 时返回示例
            result = {
                scripture_content: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
                reference: '约翰福音 3:16',
                ai_text: '无论你此刻经历什么，神的爱永远与你同在。',
            };
        }

        return new Response(
            JSON.stringify({
                scripture_content: result?.scripture_content,
                reference: result?.reference,
                ai_text: result?.ai_text,
                image_url: null,
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
