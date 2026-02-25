'use client';

import { useRouter } from 'next/navigation';

/**
 * 愿景页面 - 价值观与愿景 (长滚动版)
 * 严格对齐 Figma 设计稿 (node-id=180-453)
 * 来源区分：from=home 返回首页，from=onboarding 返回首页（Onboarding 流程完成后）
 */
export default function VisionPage() {
  const router = useRouter();
  const BRAND = '#030424';

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* 滚动内容区 */}
      <div style={{ padding: '0 32px', paddingBottom: 40 }}>
        {/* 1. 标题 */}
        <h1
          style={{
            fontFamily: '"PingFang SC", sans-serif',
            fontSize: 18,
            fontWeight: 400,
            color: BRAND,
            textAlign: 'center',
            marginTop: 'max(24px, env(safe-area-inset-top))',
            marginBottom: 32,
            opacity: 0.8
          }}
        >
          价值观与愿景
        </h1>

        {/* 2. 顶部插画 */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <img
            src="/illustrations/value.png"
            alt=""
            style={{ width: '100%', maxWidth: 340, height: 'auto', display: 'block', margin: '0 auto' }}
          />
        </div>

        {/* 3. 主文案区 */}
        <div
          style={{
            fontFamily: '"PingFang SC", sans-serif',
            fontSize: 15,
            fontWeight: 400,
            lineHeight: '1.8',
            color: BRAND,
            textAlign: 'justify'
          }}
        >
          <p style={{ marginBottom: 24 }}>
            朋友，我们盼望为你带来平安、安慰与盼望。
          </p>
          
          <p style={{ marginBottom: 24 }}>
            在生活中，我们常常拼尽全力想要走出一条自己的路，但有时却发现前方一片迷茫，仿佛无路可行。若你正经历这样的时刻，也许这正是上帝邀请你转向祂的时刻——放下我们自己的坚持和骄傲，单单来到那位独一真神面前。
          </p>

          <p style={{ marginBottom: 24 }}>
            亲爱的弟兄姊妹，愿祂的话语成为你脚前的灯，路上的光，使你在幽暗中仍有指引，在动荡中仍有盼望。
          </p>

          <p style={{ marginBottom: 32 }}>
            你并不孤单。耶稣知道你所经历的一切，祂愿意与你同行，引导你走出困境，进入那属天的安息。
          </p>

          {/* 分割线 */}
          <div style={{ width: '100%', borderTop: '1px dashed #E5E5E5', marginBottom: 32 }} />

          {/* 开发者寄语 */}
          <p style={{ fontWeight: 600, fontSize: 17, marginBottom: 24 }}>
            开发者寄语：
          </p>
          
          <p style={{ marginBottom: 16 }}>
            亲爱的同路人，也许我们素未谋面，却“恰好”在那天坐在了一起。那位陌生人递来张纸条，纸上写着：
          </p>

          <p style={{ marginBottom: 24, fontStyle: 'italic', padding: '0 12px', borderLeft: `3px solid ${BRAND}` }}>
            “我相信上帝要我告诉你：持守我对你的应许，并与祂同行。在任何处境中都要喜乐，因为喜乐是圣灵所结的果子之一。”
          </p>

          <p style={{ marginBottom: 16 }}>
            今天，开发者也想把这份安慰送给你，也许你此刻正身处泥泞之中，但请记得，神看见你。祂没有忘记你，祂正在邀请你信靠祂、同行在这条路上。
          </p>

          <p style={{ marginBottom: 16 }}>
            不是靠自己的能力，而是靠祂的大能，要让我们在这地上做光做盐，所以我邀请你一同在这里重新得力、日日更新。也为要记录你一路径上的丰盛与恩典！
          </p>
        </div>

        {/* 4. 底部插画 */}
        <div style={{ marginTop: 40, marginBottom: 48, textAlign: 'center' }}>
          <img
            src="/illustrations/loading.png"
            alt=""
            style={{ width: 120, height: 120, objectFit: 'contain' }}
          />
        </div>

        {/* 5. 底部双按钮 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            type="button"
            onClick={() => router.push('/home')}
            style={{
              flex: 0.4,
              height: 56,
              fontSize: 16,
              fontWeight: 600,
              color: BRAND,
              background: '#ffffff',
              border: `1.5px solid ${BRAND}`,
              borderRadius: 16,
              cursor: 'pointer',
            }}
          >
            知道啦
          </button>
          <button
            type="button"
            onClick={() => router.push('/beta')}
            style={{
              flex: 1,
              height: 56,
              fontSize: 15, // 稍微调小一点确保在窄屏下不换行
              fontWeight: 600,
              color: '#ffffff',
              background: BRAND,
              border: 'none',
              borderRadius: 16,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            成为正式版内测用户
          </button>
        </div>
        
        {/* 底部安全区占位 */}
        <div style={{ height: 'max(24px, env(safe-area-inset-bottom))' }} />
      </div>
    </div>
  );
}
