import z from 'zod';

import { db } from '@/db';
import { comments, users } from '@/db/schema';
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { and, eq, getTableColumns } from 'drizzle-orm';

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

  getMany: baseProcedure
    .input(z.object({ videoId: z.uuid() }))
    .query(async ({ input }) => {
      const { videoId } = input;

      const commentsList = await db
        .select({ ...getTableColumns(comments), user: users })
        .from(comments)
        .where(and(eq(comments.videoId, videoId)))
        .innerJoin(users, eq(users.id, comments.userId));

      return commentsList;
    }),
});
