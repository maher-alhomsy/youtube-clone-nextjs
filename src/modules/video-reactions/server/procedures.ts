import z from 'zod';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { videoReactions } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const videoReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      const [existingVideoReaction] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.type, 'like'),
          ),
        );

      if (existingVideoReaction) {
        const [deletedVideoReaction] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.videoId, videoId),
              eq(videoReactions.userId, userId),
            ),
          )
          .returning();

        return deletedVideoReaction;
      }

      const [createdVideoReaction] = await db
        .insert(videoReactions)
        .values({ userId, videoId, type: 'like' })
        .onConflictDoUpdate({
          target: [videoReactions.userId, videoReactions.videoId],
          set: { type: 'like' },
        })
        .returning();

      return createdVideoReaction;
    }),

  dislike: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      const [existingVideoReaction] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.type, 'dislike'),
          ),
        );

      if (existingVideoReaction) {
        const [deletedVideoReaction] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.videoId, videoId),
              eq(videoReactions.userId, userId),
            ),
          )
          .returning();

        return deletedVideoReaction;
      }

      const [createdVideoReaction] = await db
        .insert(videoReactions)
        .values({ userId, videoId, type: 'dislike' })
        .onConflictDoUpdate({
          target: [videoReactions.userId, videoReactions.videoId],
          set: { type: 'dislike' },
        })
        .returning();

      return createdVideoReaction;
    }),
});
