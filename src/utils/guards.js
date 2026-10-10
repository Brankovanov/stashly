import { getSession, getUserRole } from '../services/authService.js';

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.replace(
      `/pages/login.html?next=${encodeURIComponent(returnTo)}`,
    );
    return false;
  }

  return session.user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return false;

  if ((await getUserRole(user.id)) !== 'admin') {
    window.location.replace('/');
    return false;
  }

  return user;
}
