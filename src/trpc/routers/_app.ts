import { z } from 'zod';

import { baseProcedure, createTRPCRouter } from '../init';
import { homeRouter } from '@/modules/home/server/procedure';

export const appRouter = createTRPCRouter({
  hello: baseProcedure.input(z.object({ text: z.string() })).query((opts) => {
    return {
      greeting: `hello ${opts.input.text}`,
    };
  }),

  home: homeRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
