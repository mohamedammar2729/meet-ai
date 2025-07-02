import { db } from '@/db';
import { z } from 'zod';
import { agents } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { agentsInsertSchema, agentsUpdateSchema } from '../schemas';
import { and, count, desc, eq, getTableColumns, ilike, sql } from 'drizzle-orm';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from '@/constants';
import { TRPCError } from '@trpc/server';

// This is a tRPC helper function. It is used to create a group of API endpoints (we call these procedures).
export const agentsRouter = createTRPCRouter({
  // Defines a new API endpoint called "remove" for remove an agent
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Deletes an agent from the database based on the provided ID
      const [removedAgent] = await db
        .delete(agents)
        // Specifies the table to delete from
        .where(
          and(
            eq(agents.id, input.id), // Matches the agent by ID
            eq(agents.userId, ctx.auth.user.id) // Ensures the agent belongs to the authenticated user
          )
        )
        // Returns the deleted agent record
        .returning();
      // If no agent was removed, it means the agent does not exist or does not belong to the user
      if (!removedAgent) {
        // Throws an error if the agent does not exist
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      // Returns the removed agent record
      return removedAgent;
    }),

  // Defines a new API endpoint called "update" for updating an agent
  update: protectedProcedure
    // Input validation schema for the update operation
    .input(agentsUpdateSchema)
    // Defines this as a mutation operation (changes data in the database)
    .mutation(async ({ input, ctx }) => {
      // Updates an agent in the database with the provided input
      const [updatedAgent] = await db
        .update(agents)
        // Specifies the table to update
        .set({
          name: input.name,
          instructions: input.instructions,
        })
        // Adds a WHERE condition to find the agent with the specified ID
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, ctx.auth.user.id) // Ensures the agent belongs to the authenticated user
          )
        )
        // Returns the updated agent record
        .returning();
      // If no agent was updated, it means the agent does not exist or does not belong to the user
      if (!updatedAgent) {
        // Throws an error if the agent does not exist
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      // Returns the updated agent record
      return updatedAgent;
    }),

  // Defines a new API endpoint called "getOne" for retrieving a single agent
  getOne: protectedProcedure
    // Defines the input validation for this procedure, Requires an object with an id field that must be a string
    .input(z.object({ id: z.string() }))
    // Defines this as a query operation (read-only, doesn't modify data)Takes the validated input as a parameter
    .query(async ({ input, ctx }) => {
      // Uses array destructuring because Drizzle returns arrays, but we only want the first item
      const [existingAgent] = await db
        .select({
          meetingCount: sql<number>`5`,
          // Spreads all actual columns from the agents table
          ...getTableColumns(agents),
        })
        // Specifies we're querying from the agents table
        .from(agents)
        // Adds a WHERE condition to find the agent with the specified ID
        // Uses the eq function to create an equality comparison
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, ctx.auth.user.id) // Ensures the agent belongs to the authenticated user
          )
        );

      // If no agent is found, existingAgent will be undefined
      if (!existingAgent) {
        // Throws an error if the agent does not exist
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }

      return existingAgent;
    }),

  // Defines a new API endpoint called "getMany" to fetch multiple agents (with pagination and search)
  getMany: protectedProcedure
    // Input validation schema
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        // Optional search term that can be null or undefined
        search: z.string().nullish(),
      })
    )
    // Defines as a query operation Takes both context (ctx) and input parameters
    // .query(...) means this is a read-only procedure (unlike .mutation() which changes data)
    .query(async ({ ctx, input }) => {
      // Destructures the input parameters
      const { page, pageSize, search } = input;
      // Database query setup like the previous one, but with pagination and search
      const data = await db
        .select({
          meetingCount: sql<number>`5`,
          // to preserve other fields used ...getTebleColumns
          ...getTableColumns(agents),
        })
        // Specifies we're querying from the agents table
        .from(agents)
        .where(
          // and(): Combines multiple conditions
          and(
            // Only shows agents belonging to the authenticated user
            eq(agents.userId, ctx.auth.user.id),
            // If search term exists, filter by agent name using case-insensitive partial matching
            input?.search ? ilike(agents.name, `%${search}%`) : undefined
          )
        )
        // if two agents have the same creation date, order by ID in descending order
        .orderBy(desc(agents.createdAt), desc(agents.id))
        // Limits the number of results to the specified page size
        .limit(pageSize)
        // Calculates the offset for pagination
        .offset((page - 1) * pageSize);

      // Returns the paginated data
      // The data will be an array of agents that match the search criteria
      // The total count of agents for the authenticated user, used for pagination
      const [total] = await db
        .select({ count: count() })
        .from(agents)
        .where(
          and(
            eq(agents.userId, ctx.auth.user.id),
            input?.search ? ilike(agents.name, `%${search}%`) : undefined
          )
        );
      // Calculates the total number of pages based on the total count and page size
      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),
  // Defines a new API endpoint called "create" for creating agents
  //protectedProcedure means:Only authenticated users can call this endpoint
  create: protectedProcedure
    // Applies the agentsInsertSchema validation rules to incoming data
    .input(agentsInsertSchema)
    // The user's authentication info is available in the ctx (context)
    // defining a mutation, which means this function is used to modify data (e.g., create, update, or delete something in your database).
    .mutation(async ({ input, ctx }) => {
      // we used [createdAgent] instead of createdAgent
      // because drizzle returns an array of inserted rows
      // we are only interested in the first one record
      // to simply access the first item in the array immediately
      const [createdAgent] = await db
        // Drizzle ORM's .insert() method always returns an array of inserted records
        // Tells Drizzle to insert data into the agents table
        .insert(agents)
        // Specifies what data to insert into the database
        .values({
          // Takes all fields from the validated input (name and instructions)
          // This is equivalent to writing name: input.name, instructions: input.instructions
          ...input,
          // Connects the new agent to the currently authenticated user
          // This creates the foreign key relationship to the user table
          userId: ctx.auth.user.id,
        })
        // Tells the database to return the complete inserted record
        .returning();
      // API response: Sends the newly created agent back to the client
      return createdAgent;
    }),
});

// if there is wrong in name or instructions
// it will throw an error with the message from the schema validation .input(agentsInsertSchema)
// if there is no userId in the session, it will throw an error with the message 'UNAUTHORIZED'
