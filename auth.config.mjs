import GitHub from '@auth/core/providers/github';
import { defineConfig } from 'auth-astro';

export default defineConfig({
  providers: [
    GitHub({
      clientId: import.meta.env.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
        }
      }
    }),
  ],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.username = profile.login;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.username = token.username;
      }
      return session;
    }
  }
});
