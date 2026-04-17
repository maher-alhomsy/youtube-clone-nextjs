import z from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, getTableColumns, inArray, isNotNull } from 'drizzle-orm';

import { db } from '@/db';
import { subscriptions, users, videos } from '@/db/schema';
import { baseProcedure, createTRPCRouter } from '@/trpc/init';

export const usersRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ userId: z.uuid() }))
    .query(async ({ input, ctx }) => {
      const { clerkId } = ctx;
      const { userId } = input;

      let viewerUserId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkId ? [clerkId] : []));

      if (user) viewerUserId = user.id;

      const viewerSubscriptions = db.$with('viewer_subscriptions').as(
        db
          .select()
          .from(subscriptions)
          .where(
            inArray(subscriptions.viewerId, viewerUserId ? [viewerUserId] : []),
          ),
      );

      const [existingUser] = await db
        .with(viewerSubscriptions)
        .select({
          ...getTableColumns(users),
          subscriptionsCount: db.$count(
            subscriptions,
            eq(subscriptions.creatorId, users.id),
          ),
          videosCount: db.$count(videos, eq(videos.userId, users.id)),
          viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(
            Boolean,
          ),
        })
        .from(users)
        .leftJoin(
          viewerSubscriptions,
          eq(viewerSubscriptions.creatorId, users.id),
        )
        .where(eq(users.id, userId));

      if (!existingUser) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return existingUser;
    }),
});
