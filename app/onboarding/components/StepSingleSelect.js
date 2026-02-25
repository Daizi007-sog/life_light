'use client';

/**
 * Onboarding 单选步骤（步骤 3-7）
 * Figma: node-id=143-335
 */
export default function StepSingleSelect({
  questionText,
  subtitle,
  options,
  selected,
  onSelect,
  onConfirm,
  canSubmit,
  submitting = false,
  onBack,
  totalSteps,
  currentStep,
}) {
  // Figma 变量定义 (node-id=143-335)
  const BRAND = '#030424';
  const TEXT_SECONDARY = '#5B5C70';
  const TEXT_MUTED = '#A5A29D';
  const BG_GRAY = '#F1F1F1';
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
      {/* Header: 返回按钮 + 进度点 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 40,
          marginTop: 8,
        }}
      >
        <button
          type="button"
          id="onboarding-back"
          name="onboarding_back"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            marginRight: 16,
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
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isCompleted = i + 1 < currentStep;
            const isCurrent = i + 1 === currentStep;
            const isActive = isCompleted || isCurrent;
            return (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: isActive ? BRAND : 'transparent',
                  border: isActive ? 'none' : '1.5px solid #E5E5E5',
                  opacity: isCurrent ? 1 : isCompleted ? 1 : 0.4,
                }}
              />
            );
          })}
        </div>
        <div style={{ width: 40 }} />
      </header>

      {/* 标题 - Figma 7加粗: 24px Medium */}
      <h1
        style={{
          fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
          fontSize: 24,
          fontWeight: 500,
          lineHeight: 1,
          color: BRAND,
          marginBottom: subtitle ? 8 : 32,
        }}
      >
        {questionText}
      </h1>
      {subtitle && (
        <p
          style={{
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1,
            color: TEXT_SECONDARY,
            marginBottom: 32,
          }}
        >
          {subtitle}
        </p>
      )}

      {/* 选项列表 - 垂直堆叠 (严格按照 Figma 描述) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {options.map((opt, index) => {
          const isSelected = selected === opt.value;
          const key = opt.value || `step-opt-${index}`;
          const optId = `onboarding-opt-${currentStep}-${opt.value || index}`;
          const optName = `onboarding_step_${currentStep}_${opt.value || index}`;
          return (
            <button
              key={key}
              type="button"
              id={optId}
              name={optName}
              aria-pressed={isSelected}
              onClick={() => onSelect(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center', // 垂直列表通常文字居中
                height: 56, // 固定高度
                padding: '0 24px',
                fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                fontSize: 16,
                fontWeight: 400,
                color: BRAND,
                background: isSelected ? '#ffffff' : BG_GRAY,
                border: isSelected ? `2px solid ${BRAND}` : '2px solid transparent',
                borderRadius: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {opt.label || '选项'}
              </span>
            </button>
          );
        })}
      </div>

      {/* 底部按钮区域 */}
      <div style={{ marginTop: 'auto' }}>
        <button
          type="button"
          id="onboarding-confirm-single"
          name="onboarding_confirm"
          onClick={onConfirm}
          disabled={!canSubmit || submitting}
          style={{
            width: '100%',
            height: 56,
            fontSize: 16,
            fontWeight: 600,
            color: canSubmit && !submitting ? '#ffffff' : TEXT_MUTED,
            background: canSubmit && !submitting ? BRAND : BUTTON_DISABLED,
            border: 'none',
            borderRadius: 16,
            cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
          }}
        >
          {submitting ? '提交中...' : '确定'}
        </button>
        <p
          style={{
            marginTop: 16,
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 23,
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
