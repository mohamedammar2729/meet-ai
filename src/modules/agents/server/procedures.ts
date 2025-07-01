import { db } from '@/db';
import { z } from 'zod';
import { agents } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { agentsInsertSchema } from '../schemas';
import { eq, getTableColumns, sql } from 'drizzle-orm';

export const agentsRouter = createTRPCRouter({
  // baseProcedure is equivalent to api request which has absolutly no security
  // you should create protectedProcedure for authenticated requests
  //TODO: Change `getOne` to `protectedProcedure` when authentication is implemented
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [existingAgent] = await db
        .select({
          meetingCount: sql<number>`COUNT(*)`,
          // to preserve other fields used ...getTebleColumns
          ...getTableColumns(agents),
        })
        .from(agents)
        .where(eq(agents.id, input.id));

      return existingAgent;
    }),
  //TODO: Change `getMany` to `protectedProcedure` when authentication is implemented
  getMany: protectedProcedure.query(async () => {
    const data = await db.select().from(agents);

    return data;
  }),
  create: protectedProcedure
    .input(agentsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      // we used [createdAgent] instead of createdAgent
      // because drizzle returns an array of inserted rows
      // we are only interested in the first one record
      // to simply access the first item in the array immediately
      const [createdAgent] = await db
        .insert(agents)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      return createdAgent;
    }),
});

// if there is wrong in name or instructions
// it will throw an error with the message from the schema validation .input(agentsInsertSchema)
// if there is no userId in the session, it will throw an error with the message 'UNAUTHORIZED'
