import './globals.css';

export const metadata = {
  title: '光盐旅记 - 基督徒灵修助手',
  description: '生命之光',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
