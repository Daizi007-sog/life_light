'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const BUCKET = 'life_main_backgrounds';
const BASE = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL || '' : '').trim();

/** 12 张背景图完整 URL（可按需替换为你的实际地址） */
const IMAGE_SOURCES = Array.from({ length: 12 }, (_, i) =>
  `${BASE}/storage/v1/object/public/${BUCKET}/${i + 1}.jpg`
).filter((url) => url.includes('supabase'));

/** 若 IMAGE_SOURCES 为空（如未配置 env），至少保留一个占位 */
const SOURCES = IMAGE_SOURCES.length > 0 ? IMAGE_SOURCES : [`${BASE}/storage/v1/object/public/${BUCKET}/1.jpg`];

/** 拼接并编码 URL，确保空格等字符正确转义 */
function buildUrl(index, bust) {
  if (index < 0 || index >= SOURCES.length) return '';
  const raw = SOURCES[index];
  const url = `${raw}${raw.includes('?') ? '&' : '?'}v=${bust}`;
  return encodeURI(url);
}

/** 生成与 excludeIndex 绝对不同的随机索引 */
function pickDifferentIndex(excludeIndex) {
  if (SOURCES.length <= 1) return 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * SOURCES.length);
  } while (idx === excludeIndex);
  return idx;
}

/**
 * 首页背景图 - 预加载 + 防重复
 * @returns {{ url: string, refresh: () => void }} 背景图 URL 与手动刷新函数
 */
export function useDailyBackground() {
  const [index, setIndex] = useState(-1);
  const [bust, setBust] = useState(() => Date.now());
  const [flashing, setFlashing] = useState(false);
  const indexRef = useRef(-1);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIndex(pickDifferentIndex(-1));
  }, []);

  const refresh = useCallback(() => {
    setFlashing(true);
    const nextIndex = pickDifferentIndex(indexRef.current);
    const nextBust = Date.now();
    const nextUrl = buildUrl(nextIndex, nextBust);

    const img = new Image();
    img.onload = () => {
      setIndex(nextIndex);
      setBust(nextBust);
      setFlashing(false);
    };
    img.onerror = () => {
      setFlashing(false);
    };
    img.src = nextUrl;
  }, []);

  const url = buildUrl(index, bust);

  return { url, refresh, flashing };
}
