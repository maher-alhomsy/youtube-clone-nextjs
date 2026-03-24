import { db } from '@/db';
import { videos } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { and, desc, eq, lt, or } from 'drizzle-orm';
import { z } from 'zod';

// import { lt, desc } from 'drizzle-orm';

export const studioRouter = createTRPCRouter({
  // getMany: protectedProcedure
  //   .input(z.object({ cursor: z.string().optional() }))
  //   .query(async ({ input }) => {
  //     const limit = 10;
  //     const cursor = input.cursor ? new Date(input.cursor) : new Date();

  //     const data = await db
  //       .select()
  //       .from(videos)
  //       .where(lt(videos.createdAt, cursor))
  //       .orderBy(desc(videos.createdAt))
  //       .limit(limit + 1);

  //     const hasNextPage = data.length > limit;
  //     const items = hasNextPage ? data.slice(0, -1) : data;
  //     const nextCursor = hasNextPage
  //       ? items[items.length - 1].createdAt.toISOString()
  //       : null;

  //     return {
  //       items,
  //       nextCursor,
  //     };
  //   }),

  // getMany: protectedProcedure.query(async () => {
  //   const data = await db.select().from(videos);

  //   return data;
  // }),

  getMany: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const { id: userId } = ctx.user;

      const data = await db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.userId, userId),
            cursor
              ? or(
                  lt(videos.updatedAt, cursor.updatedAt),
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;

      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return { items, nextCursor };
    }),
});
