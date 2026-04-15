import {
  uuid,
  text,
  pgTable,
  timestamp,
  uniqueIndex,
  integer,
  pgEnum,
  primaryKey,
  foreignKey,
} from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: text('clerk_id').notNull().unique(),
    name: text('name').notNull(),
    imageUrl: text('image_url').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('clerk_id_idx').on(t.clerkId)],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    viewerId: uuid('viewer_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    creatorId: uuid('creator_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      name: 'subscriptions_pk',
      columns: [t.viewerId, t.creatorId],
    }),
  ],
);

// export const userRelations = relations(users, ({ many }) => ({
//   videos: many(videos),
// }));

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('name_idx').on(t.name)],
);

// export const categoryRelation = relations(categories, ({ many }) => ({
//   videos: many(videos),
// }));

export const videoVisibility = pgEnum('video_visibility', [
  'private',
  'public',
]);

export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),

  muxStatus: text('mux_status'),
  muxAssetId: text('mux_asset_id').unique(),
  muxUploadId: text('mux_upload_id').unique(),
  muxPlaybackId: text('mux_playback_id').unique(),
  muxTrackId: text('mux_track_id').unique(),
  muxTrackStatus: text('mux_track_status'),

  thumbnailUrl: text('thumbnail_url'),
  thumbnailKey: text('thumbnail_key'),

  previewUrl: text('preview_url'),
  previewKey: text('preview_key'),

  duration: integer('duration').default(0).notNull(),
  visibility: videoVisibility('visibility').default('private').notNull(),

  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const videoInsertSchema = createInsertSchema(videos);
export const videoUpdateSchema = createUpdateSchema(videos);
export const videoSelectSchema = createSelectSchema(videos);

export const videoViews = pgTable(
  'video_views',
  {
    videoId: uuid('video_id')
      .references(() => videos.id, { onDelete: 'cascade' })
      .notNull(),

    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: 'video_views_pk', columns: [t.userId, t.videoId] }),
  ],
);

export const reactionType = pgEnum('reaction_type', ['like', 'dislike']);

export const videoReactions = pgTable(
  'video_reactions',
  {
    videoId: uuid('video_id')
      .references(() => videos.id, { onDelete: 'cascade' })
      .notNull(),

    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    type: reactionType('type').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: 'video_reactions_pk', columns: [t.userId, t.videoId] }),
  ],
);

export const videoReactionSelectSchema = createSelectSchema(videoReactions);
export const videoReactionInsertSchema = createInsertSchema(videoReactions);
export const videoReactionUpdateSchema = createUpdateSchema(videoReactions);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    value: text('value').notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    videoId: uuid('video_id')
      .references(() => videos.id, { onDelete: 'cascade' })
      .notNull(),

    parentId: uuid('parent_id'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
      name: 'comments_parent_id_fkey',
    }).onDelete('cascade'),
  ],
);

export const commentInsertSchema = createInsertSchema(comments);
export const commentUpdateSchema = createUpdateSchema(comments);
export const commentSelectSchema = createSelectSchema(comments);

export const commentReactions = pgTable(
  'comment_reactions',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    commentId: uuid('comment_id')
      .references(() => comments.id, { onDelete: 'cascade' })
      .notNull(),

    type: reactionType('type').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      name: 'comment_reactions_pk',
      columns: [t.userId, t.commentId],
    }),
  ],
);

export const playlistVideos = pgTable(
  'playlist_videos',
  {
    playlistId: uuid('playlist_id')
      .references(() => playlists.id, { onDelete: 'cascade' })
      .notNull(),
    videoId: uuid('video_id')
      .references(() => videos.id, { onDelete: 'cascade' })
      .notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      name: 'playlist_videos_pk',
      columns: [t.playlistId, t.videoId],
    }),
  ],
);

export const playlists = pgTable('playlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  name: text('name').notNull(),
  description: text('description'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const playlistInsertSchema = createInsertSchema(playlists);
export const playlistUpdateSchema = createUpdateSchema(playlists);

// export const videoRelations = relations(videos, ({ one }) => ({
//   user: one(users, {
//     fields: [videos.userId],
//     references: [users.id],
//   }),
//   category: one(categories, {
//     fields: [videos.categoryId],
//     references: [categories.id],
//   }),
// }));
