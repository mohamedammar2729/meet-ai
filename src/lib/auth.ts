import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db'; // your drizzle instance
import { polar, checkout, portal } from '@polar-sh/better-auth'; // import Polar SDK
import * as schema from '@/db/schema'; // your schema file
import { polarClient } from './polar';

export const auth = betterAuth({
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true, // Automatically create a Polar customer on sign up
      use: [
        checkout({
          authenticatedUsersOnly: true, // Only authenticated users can access the checkout
          successUrl: '/upgrade',
        }),
        portal(),
      ],
    }),
  ],

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg', // or "mysql", "sqlite"
    schema: {
      ...schema, // import your schema here
    },
  }),
});
