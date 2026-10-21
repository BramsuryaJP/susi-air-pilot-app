export default defineNuxtRouteMiddleware(async (to) => {
  // Page privacy must not depend on case-sensitive server path rules.
  if (import.meta.server) {
    useResponseHeader('Cache-Control').value = 'private, no-store';
    useResponseHeader('Vary').value = 'Cookie';
  }
  if (useError().value) return;
  const isLoginPage = to.name === 'login';
  const session = useSessionStore();
  const app = useNuxtApp();
  try {
    // The server already validated the session for this hydrated response.
    if (!(
      import.meta.client &&
      app.isHydrating &&
      app.payload.serverRendered
    )) {
      await session.refresh();
    }
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'The sign-in service is unavailable. Please try again.',
    });
  }
  if (isLoginPage) {
    if (session.profile) return navigateTo('/', { replace: true });
    return;
  }
  if (!session.profile) return navigateTo('/login', { replace: true });
});
