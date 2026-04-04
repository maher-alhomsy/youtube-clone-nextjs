import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import z from 'zod';

export const subscriptionsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ creatorId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: viewerId } = ctx.user;
      const { creatorId } = input;

      if (viewerId === creatorId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot subscribe to yourself',
        });
      }

      const [newSubscription] = await db
        .insert(subscriptions)
        .values({ creatorId, viewerId })
        .returning();

      return newSubscription;
    }),

  remove: protectedProcedure
    .input(z.object({ creatorId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: viewerId } = ctx.user;
      const { creatorId } = input;

      if (viewerId === creatorId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot unsubscribe from yourself',
        });
      }

      const [deletedSubscription] = await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.creatorId, creatorId),
            eq(subscriptions.viewerId, viewerId),
          ),
        )
        .returning();

      return deletedSubscription;
    }),
});
