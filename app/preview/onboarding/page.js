'use client';

/**
 * Onboarding 预览页 - 无需登录即可查看 UI
 * 访问: http://localhost:3000/preview/onboarding
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { OnboardingProvider, useOnboarding } from '@/context/OnboardingContext';
import { getStepContainer } from '@/app/onboarding/components/StepContainers';
import Step1Nickname from '@/app/onboarding/components/Step1Nickname';
import Step2Options from '@/app/onboarding/components/Step2Options';
import { MOCK_ONBOARDING_CONFIGS } from '@/lib/onboarding-config';

function OnboardingPreviewContent() {
  const { configs, setConfigs, answers, setAnswer, getTraits, getNickname } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfigs() {
      try {
        const { data } = await supabase.from('onboarding_configs').select('*').order('step_order', { ascending: true });
        setConfigs(data?.length ? data : MOCK_ONBOARDING_CONFIGS);
      } catch {
        setConfigs(MOCK_ONBOARDING_CONFIGS);
      }
      setLoading(false);
    }
    fetchConfigs();
  }, [setConfigs]);

  const config = configs.find((c) => c.step_order === currentStep);
  const totalSteps = configs.length;
  const StepContainer = getStepContainer(currentStep);

  const handleSubmit = () => {
    if (currentStep === totalSteps) {
      alert('预览模式：数据不会写入数据库');
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => currentStep > 1 && setCurrentStep((s) => s - 1);

  if (loading) return <div style={{ padding: 24 }}>加载中...</div>;
  if (!config) return <div style={{ padding: 24 }}>暂无配置</div>;

  const options = config.options || [];
  const isMulti = config.input_type === 'multi_select';
  const isText = config.input_type === 'text';

  const handleOptionSelect = (opt) => {
    if (isMulti) {
      const current = answers[currentStep] || [];
      const next = current.includes(opt.value) ? current.filter((v) => v !== opt.value) : [...current, opt.value];
      setAnswer(String(currentStep), next);
    } else {
      setAnswer(String(currentStep), opt.value);
    }
  };

  const canSubmit = isText ? !!answers[currentStep] : isMulti ? (answers[currentStep] || []).length > 0 : !!answers[currentStep];

  if (currentStep === 1 && isText) {
    return (
      <StepContainer>
        <Step1Nickname
          questionText={config.question_text}
          value={answers[1] || ''}
          onChange={(v) => setAnswer('1', v)}
          placeholder="请输入昵称"
          onConfirm={handleSubmit}
          canSubmit={!!answers[1]}
          totalSteps={totalSteps}
          currentStep={currentStep}
        />
      </StepContainer>
    );
  }

  if (currentStep === 2 && isMulti) {
    const title = config.question_text.replace(/\s*\(多选\)\s*$/, '');
    const subtitle = config.question_text.includes('多选') ? '(多选)' : null;
    return (
      <StepContainer>
        <Step2Options
          questionText={title}
          subtitle={subtitle}
          options={options}
          selected={answers[2] || []}
          onSelect={(v) => setAnswer('2', v)}
          onConfirm={handleSubmit}
          canSubmit={(answers[2] || []).length > 0}
          onBack={handleBack}
          totalSteps={totalSteps}
          currentStep={currentStep}
        />
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <div style={{ marginBottom: 16 }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span key={i} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, backgroundColor: i + 1 === currentStep ? '#030424' : '#e5e5e5', marginRight: 8 }} />
        ))}
      </div>
      {currentStep > 1 && <button onClick={handleBack} style={{ marginBottom: 16 }}>返回</button>}
      <h1>{config.question_text}</h1>
      {isText ? (
        <input type="text" placeholder="请输入昵称" value={answers[currentStep] || ''} onChange={(e) => setAnswer(String(currentStep), e.target.value)} style={{ marginTop: 16, padding: 8 }} />
      ) : (
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {options.map((opt) => {
            const selected = isMulti ? (answers[currentStep] || []).includes(opt.value) : answers[currentStep] === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => handleOptionSelect(opt)} style={{ padding: '12px 16px', border: selected ? '2px solid #030424' : '1px solid #ccc' }}>
                {opt.emoji && `${opt.emoji} `}{opt.label}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 32 }}>
        <button onClick={handleSubmit} disabled={!canSubmit}>确定</button>
        <p style={{ marginTop: 8, fontSize: 14, color: '#8D8E9C' }}>后续可以在设置中更改</p>
      </div>
    </StepContainer>
  );
}

export default function OnboardingPreviewPage() {
  return (
    <OnboardingProvider>
      <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999, padding: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 12, borderRadius: '0 0 0 8px' }}>
        预览模式 · 无需登录
      </div>
      <OnboardingPreviewContent />
    </OnboardingProvider>
  );
}
