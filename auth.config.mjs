import GitHub from '@auth/core/providers/github';
import { defineConfig } from 'auth-astro';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

export default defineConfig({
  providers: [
    GitHub({
      clientId: env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
});
