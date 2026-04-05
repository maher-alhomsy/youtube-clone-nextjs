import z from 'zod';
import { and, desc, eq, getTableColumns, lt, or } from 'drizzle-orm';

import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { db } from '@/db';
import { comments, users } from '@/db/schema';
import { TRPCError } from '@trpc/server';

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ value: z.string(), videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { value, videoId } = input;

      const [createdComment] = await db
        .insert(comments)
        .values({ value, videoId, userId })
        .returning();

      return createdComment;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: commentId } = input;
      const { id: userId } = ctx.user;

      const [deletedComment] = await db
        .delete(comments)
        .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
        .returning();

      if (!deletedComment) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return deletedComment;
    }),

  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const { videoId, limit, cursor } = input;

      const commentsList = await db
        .select({
          ...getTableColumns(comments),
          user: users,
          totalCount: db.$count(comments, eq(comments.videoId, videoId)),
        })
        .from(comments)
        .where(
          and(
            eq(comments.videoId, videoId),
            cursor
              ? or(
                  lt(comments.updatedAt, cursor.updatedAt),
                  and(
                    eq(comments.updatedAt, cursor.updatedAt),
                    lt(comments.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .innerJoin(users, eq(users.id, comments.userId))
        .orderBy(desc(comments.updatedAt), desc(comments.id))
        .limit(limit + 1);

      const hasMore = commentsList.length > limit;
      const items = hasMore ? commentsList.slice(0, -1) : commentsList;
      const lastItem = items[items.length - 1];

      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return { items, nextCursor, totalCount: items[0]?.totalCount ?? 0 };
    }),
});
