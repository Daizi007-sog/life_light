#!/usr/bin/env node
/**
 * 上传首页背景图到 Supabase Storage (life_main_backgrounds)
 * 用法: node scripts/upload-backgrounds.mjs
 * 或:   npm run upload-backgrounds
 *
 * 环境变量（.env.local）:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  （需 Service Role，用于上传）
 *
 * 将图片放入 assets/backgrounds/ 后执行即可
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BUCKET = 'life_main_backgrounds';
const ASSETS_DIR = join(__dirname, '..', 'assets', 'backgrounds');
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('❌ 请配置 .env.local:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
    console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJ...');
    console.error('');
    console.error('Service Role Key 在 Supabase Dashboard -> Settings -> API 中获取');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 确保 bucket 存在
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) {
      console.error('❌ 创建 bucket 失败:', error.message);
      console.error('   请先在 Supabase Dashboard -> Storage 中手动创建 life_main_backgrounds（Public）');
      process.exit(1);
    }
    console.log('✅ 已创建 bucket:', BUCKET);
  }

  // 读取本地图片
  let files = [];
  try {
    const names = await readdir(ASSETS_DIR);
    files = names.filter((n) => ALLOWED_EXT.includes(extname(n).toLowerCase()));
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('❌ 目录不存在:', ASSETS_DIR);
      console.error('   请创建 assets/backgrounds/ 并放入 jpg/png/webp 图片');
      process.exit(1);
    }
    throw err;
  }

  if (files.length === 0) {
    console.error('❌ assets/backgrounds/ 中没有图片（支持 .jpg .png .webp）');
    process.exit(1);
  }

  console.log(`📤 正在上传 ${files.length} 张背景图...`);

  for (const name of files) {
    const filePath = join(ASSETS_DIR, name);
    const buffer = await readFile(filePath);
    const { error } = await supabase.storage.from(BUCKET).upload(name, buffer, {
      contentType: `image/${extname(name).slice(1).toLowerCase().replace('jpg', 'jpeg')}`,
      upsert: true,
    });
    if (error) {
      console.error('  ❌', name, error.message);
    } else {
      console.log('  ✅', name);
    }
  }

  console.log('✅ 背景图上传完成');
}

// 加载 .env.local
const fs = await import('fs');
const path = await import('path');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
