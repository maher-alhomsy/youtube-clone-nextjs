import z from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, getTableColumns, lt, or } from 'drizzle-orm';

import { db } from '@/db';
import { subscriptions, users } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const subscriptionsRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const { id: viewerId } = ctx.user;

      const data = await db
        .select({
          ...getTableColumns(subscriptions),
          user: {
            ...getTableColumns(users),
            subscriberCount: db.$count(
              subscriptions,
              eq(subscriptions.creatorId, users.id),
            ),
          },
        })
        .from(subscriptions)
        .innerJoin(users, eq(users.id, subscriptions.creatorId))
        .where(
          and(
            eq(subscriptions.viewerId, viewerId),
            cursor
              ? or(
                  lt(subscriptions.updatedAt, cursor.updatedAt),
                  and(
                    eq(subscriptions.updatedAt, cursor.updatedAt),
                    lt(subscriptions.creatorId, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(subscriptions.updatedAt), desc(subscriptions.creatorId))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;

      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.creatorId, updatedAt: lastItem.updatedAt }
        : null;

      return { items, nextCursor };
    }),

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
