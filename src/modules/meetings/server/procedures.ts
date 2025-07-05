import { db } from '@/db';
import { z } from 'zod';
import { agents, meetings } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { and, count, desc, eq, getTableColumns, ilike, sql } from 'drizzle-orm';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from '@/constants';
import { TRPCError } from '@trpc/server';
import { meetingsInsertSchema, meetingsUpdateSchema } from '../schemas';
import { MeetingStatus } from '../types';

// This is a tRPC helper function. It is used to create a group of API endpoints (we call these procedures).
export const meetingsRouter = createTRPCRouter({
  // Defines a new API endpoint called "create" for creating meetings
  create: protectedProcedure
    // Applies the meetingsInsertSchema validation rules to incoming data
    .input(meetingsInsertSchema)
    // The user's authentication info is available in the ctx (context)
    // defining a mutation, which means this function is used to modify data (e.g., create, update, or delete something in your database).
    .mutation(async ({ input, ctx }) => {
      const [createdMeeting] = await db
        // Drizzle ORM's .insert() method always returns an array of inserted records
        // Tells Drizzle to insert data into the agents table
        .insert(meetings)
        // Specifies what data to insert into the database
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        // Tells the database to return the complete inserted record
        .returning();
      //TODO: create stream call, upsert stream users

      // API response: Sends the newly created agent back to the client
      return createdMeeting;
    }),

  // Defines a new API endpoint called "update" for updating an existing meeting
  update: protectedProcedure
    // Applies the meetingsInsertSchema validation rules to incoming data
    .input(meetingsUpdateSchema)
    // Defines this as a mutation operation (changes data)
    .mutation(async ({ input, ctx }) => {
      // Uses array destructuring because Drizzle returns arrays, but we only want the first item
      const [updatedMeeting] = await db
        // Tells Drizzle to update the meetings table
        .update(meetings)
        // Specifies the new values to update
        .set(input)
        // Adds a WHERE condition to find the meeting with the specified ID
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id) // Ensures the meeting belongs to the authenticated user
          )
        )
        // Tells Drizzle to return the updated record
        .returning();

      // If no Meeting is found, updatedMeeting will be undefined
      if (!updatedMeeting) {
        // Throws an error if the Meeting does not exist
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      return updatedMeeting;
    }),

  // Defines a new API endpoint called "remove" for deleting an existing meeting
  remove: protectedProcedure
    // Defines the input validation for this procedure, Requires an object with an id field that must be a string
    .input(z.object({ id: z.string() }))
    // Defines this as a mutation operation (changes data)
    .mutation(async ({ input, ctx }) => {
      // Uses array destructuring because Drizzle returns arrays, but we only want the first item
      const [removedMeeting] = await db
        // Tells Drizzle to delete from the meetings table
        .delete(meetings)
        // Adds a WHERE condition to find the meeting with the specified ID
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id) // Ensures the meeting belongs to the authenticated user
          )
        )
        // Tells Drizzle to return the deleted record
        .returning();

      // If no Meeting is found, deletedMeeting will be undefined
      if (!removedMeeting) {
        // Throws an error if the Meeting does not exist
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      return removedMeeting;
    }),

  // Defines a new API endpoint called "getOne" for retrieving a single agent
  getOne: protectedProcedure
    // Defines the input validation for this procedure, Requires an object with an id field that must be a string
    .input(z.object({ id: z.string() }))
    // Defines this as a query operation (read-only, doesn't modify data)Takes the validated input as a parameter
    .query(async ({ input, ctx }) => {
      // Uses array destructuring because Drizzle returns arrays, but we only want the first item
      const [existingMeeting] = await db
        .select({
          // Spreads all actual columns from the meetings table
          ...getTableColumns(meetings),
          agent: agents,
          // Calculates the duration of the meeting in seconds
          // Uses SQL to calculate the duration between ended_at and started_at timestamps
          duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
            'duration'
          ),
        })
        // Specifies we're querying from the meetings table
        .from(meetings)
        // Adds a WHERE condition to find the meetings with the specified ID
        // Uses the eq function to create an equality comparison
        .innerJoin(
          agents, // Joins the agents table to get agent details
          eq(meetings.agentId, agents.id) // Matches meetings.agentId with agents.id
        )
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id) // Ensures the agent belongs to the authenticated user
          )
        );

      // If no Meeting is found, existingMeeting will be undefined
      if (!existingMeeting) {
        // Throws an error if the Meeting does not exist
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      return existingMeeting;
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
        agentId: z.string().nullish(), // Optional agentId for filtering
        status: z
          .enum([
            MeetingStatus.Upcoming,
            MeetingStatus.Active,
            MeetingStatus.Completed,
            MeetingStatus.Processing,
            MeetingStatus.Cancelled,
          ])
          .nullish(), // Optional status for filtering
      })
    )
    // Defines as a query operation Takes both context (ctx) and input parameters
    // .query(...) means this is a read-only procedure (unlike .mutation() which changes data)
    .query(async ({ ctx, input }) => {
      // Destructures the input parameters
      const { page, pageSize, search, status, agentId } = input;
      // Database query setup like the previous one, but with pagination and search
      const data = await db
        .select({
          // to preserve other fields used ...getTebleColumns
          ...getTableColumns(meetings),
          agent: agents,
          // Calculates the duration of the meeting in seconds
          // Uses SQL to calculate the duration between ended_at and started_at timestamps
          duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
            'duration'
          ),
          //duration: sql<number>`CASE +WHEN ended_at IS NOT NULL AND started_at IS NOT NULL +            THEN EXTRACT(EPOCH FROM (ended_at - started_at)) + ELSE NULL +END`.as('duration'),
        })
        // Specifies we're querying from the meetings table
        .from(meetings)
        // Joins the agents table to get agent details
        // This allows us to access agent information related to each meeting
        .innerJoin(
          agents, // Joins the agents table to get agent details
          eq(meetings.agentId, agents.id) // Matches meetings.agentId with agents.id
        )
        // Adds a WHERE condition to filter meetings
        .where(
          // and(): Combines multiple conditions
          and(
            // Only shows meetings belonging to the authenticated user
            eq(meetings.userId, ctx.auth.user.id),
            // If search term exists, filter by meetings name using case-insensitive partial matching
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined, // Filters by meeting status if provided
            agentId ? eq(meetings.agentId, agentId) : undefined // Filters by agent ID if provided
          )
        )
        // if two meetings have the same creation date, order by ID in descending order
        .orderBy(desc(meetings.createdAt), desc(meetings.id))
        // Limits the number of results to the specified page size
        .limit(pageSize)
        // Calculates the offset for pagination
        .offset((page - 1) * pageSize);

      // Returns the paginated data
      // The data will be an array of agents that match the search criteria
      // The total count of agents for the authenticated user, used for pagination
      const [total] = await db
        .select({ count: count() })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined, // Filters by meeting status if provided
            agentId ? eq(meetings.agentId, agentId) : undefined // Filters by agent ID if provided
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
});

// if there is wrong in name or instructions
// it will throw an error with the message from the schema validation .input(agentsInsertSchema)
// if there is no userId in the session, it will throw an error with the message 'UNAUTHORIZED'
