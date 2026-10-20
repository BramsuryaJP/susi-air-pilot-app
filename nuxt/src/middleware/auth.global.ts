export default defineNuxtRouteMiddleware(async (to) => {
  if (useError().value) return;
  if (to.path === '/login') return;
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
  if (!session.profile) return navigateTo('/login', { replace: true });
});
