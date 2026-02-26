/**
 * 健康检查 - 验证 Supabase Edge Functions 与 Dify 的配置与连接
 * 用于检测 DIFY_API_KEY、Supabase 连接是否正常
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

  const checks: Record<string, string> = {};
  let allOk = true;

  // 1. DIFY_API_KEY
  const difyKey = Deno.env.get('DIFY_API_KEY');
  if (difyKey && difyKey.length > 10) {
    checks['DIFY_API_KEY'] = 'ok';
  } else {
    checks['DIFY_API_KEY'] = 'missing_or_invalid';
    allOk = false;
  }

  // 2. Supabase 环境变量
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (supabaseUrl?.startsWith('http')) {
    checks['SUPABASE_URL'] = 'ok';
  } else {
    checks['SUPABASE_URL'] = 'missing';
    allOk = false;
  }
  if (serviceKey && serviceKey.length > 20) {
    checks['SUPABASE_SERVICE_ROLE_KEY'] = 'ok';
  } else {
    checks['SUPABASE_SERVICE_ROLE_KEY'] = 'missing_or_invalid';
    allOk = false;
  }

  // 3. 测试 Supabase 数据库连接（profiles 表）
  let supabaseDb = 'skipped';
  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (!error) {
        supabaseDb = `ok (profiles: ${count ?? '?'})`;
      } else {
        supabaseDb = `error: ${error.message}`;
        allOk = false;
      }
    } catch (e) {
      supabaseDb = `error: ${(e as Error).message}`;
      allOk = false;
    }
  }
  checks['SUPABASE_DB'] = supabaseDb;

  // 4. Dify API Key 格式（不实际调用，避免消耗额度）
  checks['DIFY_API'] = difyKey ? 'key_configured (未实际调用 Dify)' : 'skipped';

  const body = {
    ok: allOk,
    message: allOk ? '所有检查通过' : '部分检查失败',
    checks,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: allOk ? 200 : 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
