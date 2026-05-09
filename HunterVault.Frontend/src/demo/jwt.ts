import { DEMO_USER_ID, DEMO_USERNAME } from './seed';

function base64Url(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function buildDemoJwt(): string {
  const header = base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': DEMO_USER_ID,
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': DEMO_USERNAME,
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'User',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  }));
  return `${header}.${payload}.demo`;
}
