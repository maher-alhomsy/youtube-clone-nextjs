import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, lt, or, and, desc, getTableColumns } from 'drizzle-orm';

import {
  users,
  videos,
  playlists,
  videoViews,
  videoReactions,
  playlistVideos,
  playlistInsertSchema,
} from '@/db/schema';
import { db } from '@/db';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const playlistsRouter = createTRPCRouter({
  getLiked: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), likedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { limit, cursor } = input;

      const viewerVideoReactions = db.$with('viewer_video_reactions').as(
        db
          .select({
            videoId: videoReactions.videoId,
            likedAt: videoReactions.updatedAt,
          })
          .from(videoReactions)
          .where(
            and(
              eq(videoReactions.type, 'like'),
              eq(videoReactions.userId, userId),
            ),
          ),
      );

      const data = await db
        .with(viewerVideoReactions)
        .select({
          ...getTableColumns(videos),
          user: users,
          likedAt: viewerVideoReactions.likedAt,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'like'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'dislike'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .innerJoin(
          viewerVideoReactions,
          eq(viewerVideoReactions.videoId, videos.id),
        )
        .where(
          and(
            eq(videos.visibility, 'public'),
            cursor
              ? or(
                  lt(viewerVideoReactions.likedAt, cursor.likedAt),
                  and(
                    eq(viewerVideoReactions.likedAt, cursor.likedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;

      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, likedAt: lastItem.likedAt }
        : null;

      return { items, nextCursor };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), viewedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { limit, cursor } = input;

      const viewerVideoViews = db.$with('viewer_video_views').as(
        db
          .select({
            videoId: videoViews.videoId,
            viewedAt: videoViews.updatedAt,
          })
          .from(videoViews)
          .where(eq(videoViews.userId, userId)),
      );

      const data = await db
        .with(viewerVideoViews)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewedAt: viewerVideoViews.viewedAt,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'like'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'dislike'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .innerJoin(viewerVideoViews, eq(viewerVideoViews.videoId, videos.id))
        .where(
          and(
            eq(videos.visibility, 'public'),
            cursor
              ? or(
                  lt(viewerVideoViews.viewedAt, cursor.viewedAt),
                  and(
                    eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;

      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, viewedAt: lastItem.viewedAt }
        : null;

      return { items, nextCursor };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          count: db.$count(
            playlistVideos,
            eq(playlistVideos.playlistId, playlists.id),
          ),
          user: users,
        })
        .from(playlists)
        .innerJoin(users, eq(users.id, playlists.userId))
        .where(
          and(
            eq(playlists.userId, userId),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return { items, nextCursor };
    }),

  create: protectedProcedure
    .input(
      playlistInsertSchema
        .omit({ userId: true })
        .extend({ name: z.string().min(1) }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { name, description } = input;

      const [createdPlaylist] = await db
        .insert(playlists)
        .values({
          name,
          userId,
          description,
        })
        .returning();

      if (!createdPlaylist) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      return createdPlaylist;
    }),
});
