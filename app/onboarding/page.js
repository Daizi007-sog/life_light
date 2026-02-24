'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MOCK_ONBOARDING_CONFIGS } from '@/lib/onboarding-config';
import { useOnboarding } from '@/context/OnboardingContext';
import Step1Nickname from './components/Step1Nickname';
import Step2Options from './components/Step2Options';
import StepSingleSelect from './components/StepSingleSelect';

/**
 * Onboarding 主页面
 * 负责分发各个步骤的渲染和数据管理
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { configs, setConfigs, answers, setAnswer, getTraits, getNickname } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // 强制将步骤 5、7 设为多选（覆盖 Supabase 可能返回的旧配置）
  function normalizeConfigs(raw) {
    return (raw || []).map((c) => {
      const step = Number(c.step_order);
      if (step === 5 || step === 7) {
        return {
          ...c,
          input_type: 'multi_select',
          type: 'multi-select',
          subtitle: '(多选)',
          question_text: c.question_text?.replace(/\s*\(多选\)\s*$/, '')?.trim() + ' (多选)',
        };
      }
      return c;
    });
  }

  // 1. 获取问卷配置（含重试，网络异常时自动使用本地配置，不弹红字）
  useEffect(() => {
    async function fetchConfigs() {
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const { data, error } = await supabase
            .from('onboarding_configs')
            .select('*')
            .order('step_order', { ascending: true });
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            setConfigs(normalizeConfigs(data));
            setLoading(false);
            return;
          }
        } catch (err) {
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          setConfigs(MOCK_ONBOARDING_CONFIGS);
        }
      }
      setLoading(false);
    }
    fetchConfigs();
  }, [setConfigs]);

  // 2. 状态检查
  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <p style={{ color: '#030424' }}>加载中...</p>
    </div>
  );

  const config = configs.find((c) => Number(c.step_order) === currentStep);
  const totalSteps = configs.length;
  const isLastStep = currentStep === totalSteps;

  if (!config) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p>暂无步骤配置 (Step {currentStep})</p>
      <button onClick={() => setCurrentStep(1)} style={{ marginTop: 20 }}>回到首页</button>
    </div>
  );

  // 3. 提取当前步骤信息（兼容 title/subtitle/type 与 question_text/input_type 两种表结构）
  const isStep1 = Number(config.step_order) === 1;
  const isStep2 = Number(config.step_order) === 2;

  const rawType = config.type || config.input_type || '';
  const isText = rawType === 'text' || rawType === 'input';
  const isMulti = rawType === 'multi_select' || rawType === 'multi-select';

  // 安全获取标题：优先 title，兼容 question_text
  const rawTitle = config.title || config.question_text || '';
  const stepTitle = rawTitle.replace(/\s*\(多选\)\s*$/, '').trim() || rawTitle;
  const stepSubtitle = config.subtitle || (rawTitle.includes('多选') ? '(多选)' : null);

  // 增强版选项解析逻辑
  let options = [];
  try {
    const rawOptions = config.options;
    let finalOptions = rawOptions;
    // 如果是双重编码的字符串，尝试再次解析
    if (typeof finalOptions === 'string' && (finalOptions.startsWith('[') || finalOptions.startsWith('{'))) {
      try {
        finalOptions = JSON.parse(finalOptions);
      } catch (e) {
        // 解析失败则保持原样
      }
    }

    if (Array.isArray(finalOptions)) {
      options = finalOptions;
    } else if (typeof finalOptions === 'string') {
      try {
        options = JSON.parse(finalOptions || '[]');
      } catch (e) {
        options = [];
      }
    }
    
    // 关键修复：确保每个选项都有必填字段
    options = (Array.isArray(options) ? options : []).map((opt, index) => {
      if (typeof opt === 'string') return { value: opt, label: opt, emoji: '' };
      if (!opt) return { value: `opt_${index}`, label: `Option ${index}`, emoji: '' };
      return {
        value: opt.value || opt.Value || opt.id || `opt_${index}`,
        label: opt.label || opt.Label || opt.name || opt.text || String(opt),
        emoji: opt.emoji || opt.Emoji || opt.icon || ''
      };
    });
  } catch (e) {
    console.error('选项解析失败:', e);
    options = [];
  }

  // 4. 提交/下一步逻辑
  const handleSubmit = async () => {
    if (isLastStep) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const nickname = getNickname();
        const traits = getTraits();

        const payload = { user_id: user?.id, nickname, traits };
        console.log('提交的数据:', payload);

        if (user) {
          let { data, error } = await supabase.from('profiles').upsert(
            payload,
            { onConflict: 'user_id' }
          );

          if (error) {
            console.error('Supabase 返回的 error:', error);
            if (error.code === 'PGRST204' && error.message?.includes('user_id')) {
              const fallbackPayload = { id: user.id, nickname, traits };
              console.log('尝试使用 id 列写入 (Supabase 默认 schema):', fallbackPayload);
              const res = await supabase.from('profiles').upsert(fallbackPayload, { onConflict: 'id' });
              if (res.error) {
                console.error('fallback 失败:', res.error);
                throw res.error;
              }
              console.log('fallback 成功:', res.data);
            } else {
              throw error;
            }
          } else {
            console.log('Supabase 返回的 data:', data);
          }
        } else {
          console.warn('未登录用户，跳过写入 profiles（user 为 null）');
        }
        router.replace('/dashboard');
      } catch (err) {
        console.error('保存画像失败:', err?.message);
        console.error('完整错误对象:', err);
        router.replace('/dashboard'); // 即使保存失败也让用户进入，保证流程通顺
      }
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // 5. 统一全屏包装容器
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      color: '#030424',
    }}>
      {isStep1 ? (
        <Step1Nickname
          questionText={stepTitle}
          value={answers[1] || ''}
          onChange={(v) => setAnswer('1', v)}
          placeholder="请输入昵称"
          onConfirm={handleSubmit}
          canSubmit={!!answers[1]}
          totalSteps={totalSteps}
          currentStep={currentStep}
        />
      ) : isStep2 ? (
        <Step2Options
          questionText={stepTitle}
          subtitle={stepSubtitle}
          options={options}
          selected={answers[2] || []}
          onSelect={(v) => setAnswer('2', v)}
          onConfirm={handleSubmit}
          canSubmit={(answers[2] || []).length > 0}
          onBack={handleBack}
          totalSteps={totalSteps}
          currentStep={currentStep}
        />
      ) : isMulti ? (
        <Step2Options
          questionText={stepTitle}
          subtitle={stepSubtitle}
          options={options}
          selected={answers[currentStep] || []}
          onSelect={(v) => setAnswer(String(currentStep), v)}
          onConfirm={handleSubmit}
          canSubmit={(answers[currentStep] || []).length > 0}
          onBack={handleBack}
          totalSteps={totalSteps}
          currentStep={currentStep}
        />
      ) : isText ? (
        /* 文本输入步骤兜底 */
        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            <button onClick={handleBack} style={{ background: 'none', border: 'none', fontSize: 24, marginRight: 12, cursor: 'pointer' }}>←</button>
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i + 1 <= currentStep ? '#030424' : '#e5e5e5' }} />
              ))}
            </div>
          </header>
          <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8 }}>{stepTitle}</h1>
          <input
            type="text"
            value={answers[currentStep] || ''}
            onChange={(e) => setAnswer(String(currentStep), e.target.value)}
            placeholder="请输入"
            style={{ width: '100%', padding: '16px 20px', border: '1px solid #F1F1F1', borderRadius: 12, fontSize: 16, outline: 'none' }}
          />
          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            <button
              onClick={handleSubmit}
              disabled={!answers[currentStep]}
              style={{ width: '100%', height: 52, background: '#030424', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, opacity: !answers[currentStep] ? 0.3 : 1, cursor: 'pointer' }}
            >
              确定
            </button>
            <p style={{ marginTop: 12, fontSize: 14, color: '#A5A29D', textAlign: 'center' }}>后续可以在设置中更改</p>
          </div>
        </div>
      ) : (
        <StepSingleSelect
          questionText={stepTitle}
          subtitle={stepSubtitle}
          options={options}
          selected={answers[currentStep]}
          onSelect={(v) => setAnswer(String(currentStep), v)}
          onConfirm={handleSubmit}
          canSubmit={!!answers[currentStep]}
          onBack={handleBack}
          totalSteps={totalSteps}
          currentStep={currentStep}
        />
      )}
    </div>
  );
}
