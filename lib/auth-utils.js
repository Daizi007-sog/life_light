/**
 * 用户名与 Supabase 内部邮箱的映射
 * Supabase Auth 使用 email 作为标识，此处用 username@life-light.local 作为内部邮箱
 */
const INTERNAL_DOMAIN = 'life-light.local';

export function usernameToEmail(username) {
  const sanitized = String(username).trim().toLowerCase();
  return `${sanitized}@${INTERNAL_DOMAIN}`;
}

export function validateUsername(username) {
  const s = String(username).trim();
  if (s.length < 2) return '用户名至少 2 个字符';
  if (s.length > 32) return '用户名最多 32 个字符';
  if (s.includes('@')) return '用户名不能包含 @';
  return null;
}
