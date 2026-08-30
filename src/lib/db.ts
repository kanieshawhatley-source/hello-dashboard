import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | null = null;

/**
 * The Neon client, created on first use.
 *
 * This is deliberately lazy: `next build` imports every module to collect
 * metadata, and connecting at import time would make the build fail on any
 * machine that has no DATABASE_URL.
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (client) return client;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local for local development, ' +
        'or to the project environment variables on Vercel.',
    );
  }

  client = neon(url);
  return client;
}
