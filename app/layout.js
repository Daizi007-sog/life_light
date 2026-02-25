import './globals.css';

export const metadata = {
  title: '光盐旅迹 - 信仰生命成长助手',
  description: '光盐旅迹 - 信仰生命成长助手',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
