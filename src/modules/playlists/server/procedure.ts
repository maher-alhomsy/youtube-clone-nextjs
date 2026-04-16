import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, lt, or, and, desc, getTableColumns, sql } from 'drizzle-orm';

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

      // const videoInPlaylist = db.$with('video_in_playlist').as(
      //   db
      //     .select({
      //       videoId: playlistVideos.videoId,
      //       playlistId: playlistVideos.playlistId,
      //     })
      //     .from(playlistVideos)
      //     .orderBy(desc(playlistVideos.createdAt)),
      // );

      const data = await db
        // .with(videoInPlaylist)
        .select({
          ...getTableColumns(playlists),
          count: db.$count(
            playlistVideos,
            eq(playlistVideos.playlistId, playlists.id),
          ),
          user: users,
          // thumbnailUrl: sql<string>`(SELECT v.thumbnail_url FROM ${videoInPlaylist} vip INNER JOIN ${videos} v ON v.id = vip.video_id WHERE vip.playlist_id = ${playlists.id} LIMIT 1)`,
          thumbnailUrl: sql<string | null>`(
          SELECT v.thumbnail_url
          FROM ${playlistVideos} pv
          JOIN ${videos} v ON v.id = pv.video_id 
          WHERE pv.playlist_id = ${playlists.id} 
          ORDER BY pv.created_at DESC
          LIMIT 1
          )`,
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

  getManyForVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit, videoId } = input;

      const videoIntoPlaylist = db
        .$with('video_in_playlist')
        .as(
          db
            .select({ playlistId: playlistVideos.playlistId })
            .from(playlistVideos)
            .where(eq(playlistVideos.videoId, videoId)),
        );

      const data = await db
        .with(videoIntoPlaylist)
        .select({
          ...getTableColumns(playlists),
          user: users,
          videoCount: db.$count(
            playlistVideos,
            eq(playlistVideos.playlistId, playlists.id),
          ),
          containsVideo: sql<boolean>`${videoIntoPlaylist.playlistId} is not null`,

          // containsVideo: videoId
          //   ? sql<boolean>`(SELECT EXISTS (SELECT 1 FROM ${playlistVideos} pv WHERE pv.video_id = ${videoId} AND pv.playlist_id = ${playlists.id}))`
          //   : sql<boolean>`false`,
        })
        .from(playlists)
        .innerJoin(users, eq(users.id, playlists.userId))
        .leftJoin(
          videoIntoPlaylist,
          eq(videoIntoPlaylist.playlistId, playlists.id),
        )
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

  addVideo: protectedProcedure
    .input(z.object({ videoId: z.uuid(), playlistId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { playlistId, videoId } = input;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.videoId, videoId),
            eq(playlistVideos.playlistId, playlistId),
          ),
        );

      if (existingPlaylistVideo) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Video already exists in the playlist',
        });
      }

      const [playlistVideo] = await db
        .insert(playlistVideos)
        .values({ playlistId, videoId })
        .returning();

      if (!playlistVideo) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      return playlistVideo;
    }),

  removeVideo: protectedProcedure
    .input(z.object({ videoId: z.uuid(), playlistId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { playlistId, videoId } = input;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.videoId, videoId),
            eq(playlistVideos.playlistId, playlistId),
          ),
        );

      if (!existingPlaylistVideo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Video not found in the playlist',
        });
      }

      const [removedPlaylistVideo] = await db
        .delete(playlistVideos)
        .where(
          and(
            eq(playlistVideos.videoId, videoId),
            eq(playlistVideos.playlistId, playlistId),
          ),
        )
        .returning();

      if (!removedPlaylistVideo) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      return removedPlaylistVideo;
    }),

  getVideos: protectedProcedure
    .input(
      z.object({
        playlistId: z.uuid(),
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { playlistId, limit, cursor } = input;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const videosFormPlaylist = db
        .$with('videos_in_playlist')
        .as(
          db
            .select({ videoId: playlistVideos.videoId })
            .from(playlistVideos)
            .where(eq(playlistVideos.playlistId, playlistId)),
        );

      const data = await db
        .with(videosFormPlaylist)
        .select({
          ...getTableColumns(videos),
          user: users,
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
          videosFormPlaylist,
          eq(videosFormPlaylist.videoId, videos.id),
        )
        .where(
          and(
            eq(videos.visibility, 'public'),
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
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return { items, nextCursor };
    }),

  getOne: protectedProcedure
    .input(z.object({ playlistId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const { playlistId } = input;
      const { id: userId } = ctx.user;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return existingPlaylist;
    }),

  remove: protectedProcedure
    .input(z.object({ playlistId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { playlistId } = input;
      const { id: userId } = ctx.user;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [removedPlaylist] = await db
        .delete(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
        .returning();

      if (!removedPlaylist) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      return removedPlaylist;
    }),
});
