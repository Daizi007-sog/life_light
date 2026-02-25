'use client';

/**
 * Onboarding 第一步：怎么称呼你？
 * Figma: node-id=143-377
 */
export default function Step1Nickname({
  questionText,
  value,
  onChange,
  placeholder,
  onConfirm,
  canSubmit,
  totalSteps,
  currentStep,
}) {
  const BRAND = '#030424';
  const TEXT_MUTED = '#A5A29D';
  const BORDER = '#F1F1F1';
  const BUTTON_DISABLED = '#E8E8E8';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px',
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        background: '#ffffff',
      }}
    >
      {/* Header: 返回按钮 + 进度点 (居中) */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 40,
          marginTop: 8,
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            // 第一步返回启动页
            window.location.href = '/splash';
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            marginLeft: -8, // 抵消内边距，对齐视觉边缘
            background: 'none',
            border: 'none',
            color: BRAND,
            cursor: 'pointer',
            padding: 0,
          }}
          aria-label="返回"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'center' }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: i + 1 === currentStep ? BRAND : 'transparent',
                border: i + 1 === currentStep ? 'none' : `1.5px solid #E5E5E5`,
                opacity: i + 1 === currentStep ? 1 : 0.3,
              }}
            />
          ))}
        </div>
        <div style={{ width: 40, marginRight: -8 }} /> {/* 占位平衡返回按钮 */}
      </header>

      {/* 标题 - 严格匹配 Figma: 24px Medium */}
      <h1
        style={{
          fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
          fontSize: 24,
          fontWeight: 500,
          lineHeight: 1,
          color: BRAND,
          marginBottom: 40,
        }}
      >
        {questionText}
      </h1>

      {/* 输入框区域 - 严格匹配 Figma: 16px */}
      <div style={{ flex: 1 }}>
        <input
          type="text"
          id="onboarding-step-1-input"
          name="onboarding_step_1_nickname"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          autoComplete="nickname"
          style={{
            width: '100%',
            padding: '20px',
            fontSize: 16,
            lineHeight: '27px',
            color: BRAND,
            background: '#ffffff',
            border: `1.5px solid ${BORDER}`,
            borderRadius: 16,
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s'
          }}
        />
      </div>

      {/* 底部按钮区域 */}
      <div style={{ marginTop: 'auto' }}>
        <button
          type="button"
          id="onboarding-confirm-step1"
          name="onboarding_confirm_step1"
          onClick={onConfirm}
          disabled={!canSubmit}
          style={{
            width: '100%',
            height: 56,
            fontSize: 16,
            fontWeight: 600,
            color: canSubmit ? '#ffffff' : '#A5A29D',
            background: canSubmit ? BRAND : BUTTON_DISABLED,
            border: 'none',
            borderRadius: 16,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
          }}
        >
          确定
        </button>
        <p
          style={{
            marginTop: 16,
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: '23px',
            color: TEXT_MUTED,
            textAlign: 'center',
          }}
        >
          后续可以在设置中更改
        </p>
      </div>
    </div>
  );
}
