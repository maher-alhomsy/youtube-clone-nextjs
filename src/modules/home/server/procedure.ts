import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const homeRouter = createTRPCRouter({
  getHome: protectedProcedure.query(async ({ ctx }) => {
    return {
      message: `Welcome to the home page, user ${ctx.clerkId}!`,
    };
  }),
});
