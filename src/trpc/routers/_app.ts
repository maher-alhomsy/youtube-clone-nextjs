import { createTRPCRouter } from '../init';
import { videosRouter } from '@/modules/videos/server/procedure';
import { studioRouter } from '@/modules/studio/server/procedures';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedures';

export const appRouter = createTRPCRouter({
  videos: videosRouter,
  studio: studioRouter,
  categories: categoriesRouter,
  videoViews: videoViewsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
