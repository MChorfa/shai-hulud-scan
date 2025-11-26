import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/shai-hulud.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
