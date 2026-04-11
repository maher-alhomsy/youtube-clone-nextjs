import z from 'zod';
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
} from 'drizzle-orm';

import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { db } from '@/db';
import { commentReactions, comments, users } from '@/db/schema';
import { TRPCError } from '@trpc/server';

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        value: z.string(),
        videoId: z.uuid(),
        parentId: z.uuid().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { value, videoId, parentId } = input;

      const [existingComment] = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, parentId ? [parentId] : []));

      if (!existingComment && parentId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (existingComment?.parentId && parentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot reply to a reply',
        });
      }

      const [createdComment] = await db
        .insert(comments)
        .values({ value, videoId, parentId, userId })
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
        parentId: z.uuid().nullish(),
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { clerkId: clerkUserId } = ctx;
      const { videoId, limit, cursor, parentId } = input;

      let userId;

      if (clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));

        if (user) userId = user.id;
      }

      const viewerReactions = db.$with('viewer_reactions').as(
        db
          .select({
            type: commentReactions.type,
            commentId: commentReactions.commentId,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, userId ? [userId] : [])),
      );

      const replies = db.$with('replies').as(
        db
          .select({
            parentId: comments.parentId,
            count: count(comments.id).as('count'),
          })
          .from(comments)
          .where(isNotNull(comments.parentId))
          .groupBy(comments.parentId),
      );

      const commentsList = await db
        .with(viewerReactions, replies)
        .select({
          ...getTableColumns(comments),
          user: users,
          totalCount: db.$count(
            comments,
            and(eq(comments.videoId, videoId), isNull(comments.parentId)),
          ),

          replyCount: replies.count,

          likeCount: db.$count(
            commentReactions,
            and(
              eq(commentReactions.commentId, comments.id),
              eq(commentReactions.type, 'like'),
            ),
          ),

          dislikeCount: db.$count(
            commentReactions,
            and(
              eq(commentReactions.commentId, comments.id),
              eq(commentReactions.type, 'dislike'),
            ),
          ),

          viewerReaction: viewerReactions.type,
        })
        .from(comments)
        .where(
          and(
            eq(comments.videoId, videoId),
            parentId
              ? eq(comments.parentId, parentId)
              : isNull(comments.parentId),
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
        .leftJoin(viewerReactions, eq(viewerReactions.commentId, comments.id))
        .leftJoin(replies, eq(replies.parentId, comments.id))
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
