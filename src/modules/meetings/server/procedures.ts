import { db } from '@/db';
import { z } from 'zod';
import JSONL from 'jsonl-parse-stringify';
import { agents, meetings, user } from '@/db/schema';
import { createTRPCRouter, premiumProcedure, protectedProcedure } from '@/trpc/init';
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  sql,
} from 'drizzle-orm';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from '@/constants';
import { TRPCError } from '@trpc/server';
import { meetingsInsertSchema, meetingsUpdateSchema } from '../schemas';
import { MeetingStatus, StreamTranscriptItem } from '../types';
import { streamVideo } from '@/lib/stream-video';
import { generateAvatarUri } from '@/lib/avatar';
import { streamChat } from '@/lib/stream-chat';

// This is a tRPC helper function. It is used to create a group of API endpoints (we call these procedures).
export const meetingsRouter = createTRPCRouter({
  generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
    const token = streamChat.createToken(ctx.auth.user.id);
    await streamChat.upsertUser({
      id: ctx.auth.user.id,
      role: 'admin',
    });
    return token;
  }),

  getTranscript: protectedProcedure
    // Defines the input validation for this procedure, Requires an object with an id field that must
    .input(z.object({ id: z.string() }))
    // Defines this as a query operation (read-only, doesn't modify data)
    .query(async ({ input, ctx }) => {
      // Uses array destructuring because Drizzle returns arrays, but we only want the first item
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.id), // Checks if the meeting ID matches the input
            eq(meetings.userId, ctx.auth.user.id) // Ensures the meeting belongs to the authenticated user
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

      if (!existingMeeting.transcriptUrl) {
        return [];
      }

      // Fetches the transcript for the meeting using Stream Video SDK
      const transcript = await fetch(existingMeeting.transcriptUrl)
        .then((res) => res.text())
        .then((text) => {
          // Parses the JSONL (JSON Lines) format into an array of objects
          return JSONL.parse<StreamTranscriptItem>(text);
        })
        .catch(() => {
          return [];
        });

      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds))
        .then((users) =>
          users.map((user) => ({
            ...user,
            image:
              user.image ??
              generateAvatarUri({
                seed: user.name,
                variant: 'initials',
              }),
          }))
        );
      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds))
        .then((agents) =>
          agents.map((agent) => ({
            ...agent,
            image: generateAvatarUri({
              seed: agent.name,
              variant: 'botttsNeutral',
            }),
          }))
        );

      const speakers = [...userSpeakers, ...agentSpeakers];
      const transcriptWithSpeakers = transcript.map((item) => {
        const speaker = speakers.find((s) => s.id === item.speaker_id);
        if (!speaker) {
          return {
            ...item,
            user: {
              name: 'Unknown Speaker',
              image: generateAvatarUri({
                seed: 'unknown',
                variant: 'initials',
              }),
            },
          };
        }
        return {
          ...item,
          user: {
            name: speaker.name,
            image: speaker.image,
          },
        };
      });
      return transcriptWithSpeakers;
    }),

  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    // add user to stream video list of users
    await streamVideo.upsertUsers([
      {
        id: ctx.auth.user.id,
        name: ctx.auth.user.name,
        role: 'admin',
        image:
          ctx.auth.user.image ??
          generateAvatarUri({
            seed: ctx.auth.user.name,
            variant: 'initials',
          }),
      },
    ]);
    // now create actial token for the user
    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now
    const issuedAt = Math.floor(Date.now() / 1000) - 60; // 1 minute ago

    // Generate a user token using the Stream Video SDK
    // id must match the user id in stream video list of users
    const token = streamVideo.generateUserToken({
      user_id: ctx.auth.user.id,
      exp: expirationTime,
      validity_in_seconds: issuedAt,
    });

    return token;
  }),

  // Defines a new API endpoint called "create" for creating meetings
  create: premiumProcedure('meetings')
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

      // Create a video call using the Stream Video SDK
      // the 'default' channel is used for the meeting
      // 'createdMeeting.id' is will aassociate the call with the meeting
      const call = streamVideo.video.call('default', createdMeeting.id);

      await call.create({
        data: {
          created_by_id: ctx.auth.user.id,
          custom: {
            meetingId: createdMeeting.id,
            meetingName: createdMeeting.name,
          },
          settings_override: {
            transcription: {
              language: 'en',
              mode: 'auto-on',
              closed_caption_mode: 'auto-on',
            },
            recording: {
              mode: 'auto-on',
              quality: '1080p',
            },
          },
        },
      });
      // we have to fetch an existing agent that this newly created meeting
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, createdMeeting.agentId));
      // If no Meeting is found, existingMeeting will be undefined
      if (!existingAgent) {
        // Throws an error if the Meeting does not exist
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      await streamVideo.upsertUsers([
        {
          id: existingAgent.id,
          name: existingAgent.name,
          role: 'user',
          image: generateAvatarUri({
            seed: existingAgent.name,
            variant: 'botttsNeutral',
          }),
        },
      ]);

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
