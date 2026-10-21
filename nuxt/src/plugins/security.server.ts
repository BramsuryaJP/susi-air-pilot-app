import { randomBytes } from 'node:crypto';

export default defineNuxtPlugin((app) => {
  // Development tooling needs its own script/connection policy; enforce on builds.
  if (import.meta.dev || !app.ssrContext) return;
  const nonce = randomBytes(24).toString('base64');
  useResponseHeader('Content-Security-Policy').value = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    // Vue's chart coordinates, meters and supplied duty colors use style attributes.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ');
  // Unhead resolves the payload and bootstrap scripts after server rendering.
  app.ssrContext.head.hooks.hook('tags:resolve', ({ tags }) => {
    for (const tag of tags) {
      if (tag.tag === 'script') tag.props.nonce = nonce;
    }
  });
});
