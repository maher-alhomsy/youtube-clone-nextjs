import { createTRPCRouter } from '../init';
import { videosRouter } from '@/modules/videos/server/procedure';
import { studioRouter } from '@/modules/studio/server/procedures';
import { categoriesRouter } from '@/modules/categories/server/procedures';

export const appRouter = createTRPCRouter({
  vidoes: videosRouter,
  studio: studioRouter,
  categories: categoriesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
