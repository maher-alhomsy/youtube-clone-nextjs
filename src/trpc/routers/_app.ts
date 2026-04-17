import { createTRPCRouter } from '../init';
import { videosRouter } from '@/modules/videos/server/procedure';
import { studioRouter } from '@/modules/studio/server/procedures';
import { commentsRouter } from '@/modules/comments/server/procedures';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedures';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedures';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedures';
import { commentReactionsRouter } from '@/modules/comment-reactions/server/procedures';
import { suggestionsRouter } from '@/modules/suggestions/server/procedures';
import { searchRouter } from '@/modules/search/server/procedures';
import { playlistsRouter } from '@/modules/playlists/server/procedure';
import { usersRouter } from '@/modules/users/server/procedures';

export const appRouter = createTRPCRouter({
  videos: videosRouter,
  studio: studioRouter,
  comments: commentsRouter,
  categories: categoriesRouter,
  videoViews: videoViewsRouter,
  subscriptions: subscriptionsRouter,
  videoReactions: videoReactionsRouter,
  commentReactions: commentReactionsRouter,
  suggestions: suggestionsRouter,
  search: searchRouter,
  playlists: playlistsRouter,
  users: usersRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
