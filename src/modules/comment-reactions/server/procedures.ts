import z from 'zod';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { commentReactions } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const commentReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ commentId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { commentId } = input;
      const { id: userId } = ctx.user;

      const [existingCommentReaction] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId),
            eq(commentReactions.type, 'like'),
          ),
        );

      if (existingCommentReaction) {
        const [deletedCommentReaction] = await db
          .delete(commentReactions)
          .where(eq(commentReactions.commentId, commentId))
          .returning();

        return deletedCommentReaction;
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({ commentId, userId, type: 'like' })
        .onConflictDoUpdate({
          set: { type: 'like' },
          target: [commentReactions.commentId, commentReactions.userId],
        })
        .returning();

      return createdCommentReaction;
    }),

  dislike: protectedProcedure
    .input(z.object({ commentId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { commentId } = input;
      const { id: userId } = ctx.user;

      const [existingCommentReaction] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId),
            eq(commentReactions.type, 'dislike'),
          ),
        );

      if (existingCommentReaction) {
        const [deletedCommentReaction] = await db
          .delete(commentReactions)
          .where(eq(commentReactions.commentId, commentId))
          .returning();

        return deletedCommentReaction;
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({ commentId, userId, type: 'dislike' })
        .onConflictDoUpdate({
          set: { type: 'dislike' },
          target: [commentReactions.commentId, commentReactions.userId],
        })
        .returning();

      return createdCommentReaction;
    }),
});
