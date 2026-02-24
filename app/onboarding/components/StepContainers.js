/**
 * 每一步的预留容器组件 - Step1/2 有自带全屏布局，3-7 使用统一包装
 */
const stepWrapperStyle = {
  minHeight: '100vh',
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  padding: 24,
  paddingTop: 'max(24px, env(safe-area-inset-top))',
  paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
  background: '#ffffff',
};

export function Step1Container({ children }) {
  return <div data-step="1" style={{ minHeight: '100vh' }}>{children}</div>;
}

export function Step2Container({ children }) {
  return <div data-step="2">{children}</div>;
}

export function Step3Container({ children }) {
  return <div data-step="3" style={stepWrapperStyle}>{children}</div>;
}

export function Step4Container({ children }) {
  return <div data-step="4" style={stepWrapperStyle}>{children}</div>;
}

export function Step5Container({ children }) {
  return <div data-step="5" style={stepWrapperStyle}>{children}</div>;
}

export function Step6Container({ children }) {
  return <div data-step="6" style={stepWrapperStyle}>{children}</div>;
}

export function Step7Container({ children }) {
  return <div data-step="7" style={stepWrapperStyle}>{children}</div>;
}

const CONTAINERS = {
  1: Step1Container,
  2: Step2Container,
  3: Step3Container,
  4: Step4Container,
  5: Step5Container,
  6: Step6Container,
  7: Step7Container,
};

export function getStepContainer(stepOrder) {
  return CONTAINERS[stepOrder] || Step1Container;
}
