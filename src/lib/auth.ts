import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

// const baseURL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export const auth = betterAuth({
  appName: "NakaFin",
  // baseURL,
  database: prismaAdapter(prisma, {
    provider: 'mongodb',
  }),
  // trustedOrigins: [baseURL],
  // advanced: {
  //   defaultCookieAttributes: {
  //     secure: true, //process.env.NODE_ENV === 'production',
  //     httpOnly: true,
  //     sameSite: 'lax',
  //     maxAge: 60 * 60 * 24 * 30,
  //   },
  // },
  // secret: process.env.BETTER_AUTH_SECRET ?? '',
  emailAndPassword: {
    enabled: true,
    // resetPasswordTokenExpiresIn: 60 * 60,
    // // requireEmailVerification: true,
    // sendResetPassword: async ({ user, url }) => {
    //   await sendEmail({
    //     to: user.email,
    //     subject: 'Redefinir sua senha - Adriana Cotrim Acessórios',
    //     template: ResetPasswordEmail,
    //     props: {
    //       baseURL,
    //       userName: user.name,
    //       resetUrl: url.replace('undefined', `${baseURL}/reset-password`),
    //     },
    //   });
    // },
  },
  plugins: [
    admin(),
    nextCookies(),
  ],
});
