import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, getTableColumns, lt, or } from 'drizzle-orm';

import { db } from '@/db';
import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import { users, videoReactions, videos, videoViews } from '@/db/schema';

export const suggestionsRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor, videoId } = input;

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Video not found' });
      }

      const data = await db
        .select({
          ...getTableColumns(videos),
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videoId)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'like'),
              eq(videoReactions.videoId, videoId),
            ),
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'dislike'),
              eq(videoReactions.videoId, videoId),
            ),
          ),
          user: users,
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .where(
          and(
            existingVideo.categoryId
              ? eq(videos.categoryId, existingVideo.categoryId)
              : undefined,
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
