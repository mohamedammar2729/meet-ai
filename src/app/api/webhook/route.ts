import {
  CallEndedEvent,
  CallTranscriptionReadyEvent,
  CallRecordingReadyEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
} from '@stream-io/node-sdk';

import { and, eq, not } from 'drizzle-orm';
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { agents, meetings } from '@/db/schema';
import { streamVideo } from '@/lib/stream-video';
import { inngest } from '@/inngest/client';

// first we will develope method to verify the signature
// because this will be not protected via our auth system, it will protected via a signature

function verifySignatureWithSDK(signature: string, body: string): boolean {
  return streamVideo.verifyWebhook(body, signature);
}

export async function POST(request: NextRequest) {
  // we have to obtain headers
  // you can use headers from next but i am using native node.js request object
  const signature = request.headers.get('x-signature');
  const apiKey = request.headers.get('x-api-key');

  if (!signature || !apiKey) {
    return NextResponse.json(
      { error: 'Missing signature or API Key' },
      { status: 400 }
    );
  }
  // to verify the signature, we should convert body into a string
  const body = await request.text();

  if (!verifySignatureWithSDK(signature, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
  // we have to assign the payload to type of object and then simply extract the type
  const eventType = (payload as Record<string, unknown>)?.type;

  if (eventType === 'call.session_started') {
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is missing in the event' },
        { status: 400 }
      );
    }
    // find the meeting in the database under certain conditions
    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          not(eq(meetings.status, 'completed')),
          not(eq(meetings.status, 'active')),
          not(eq(meetings.status, 'cancelled')),
          not(eq(meetings.status, 'processing'))
        )
      );
    if (!existingMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found or already completed' },
        { status: 404 }
      );
    }
    // update the meeting status to active
    // we should do this immediatly set status to be active, because after this we will connect to agent
    // if we late this event call.session.started called many times it will connect multiple agents
    // it not good
    await db
      .update(meetings)
      .set({ status: 'active', startedAt: new Date() })
      .where(eq(meetings.id, existingMeeting.id));

    // find the agent for this meeting
    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found for the meeting' },
        { status: 404 }
      );
    }
    // connect the agent to the call
    const call = streamVideo.video.call('default', meetingId);
    const realtimeClient = await streamVideo.video.connectOpenAi({
      call,
      openAiApiKey: process.env.OPENAI_API_KEY!,
      agentUserId: existingAgent.id,
    });

    realtimeClient.updateSession({
      instructions: existingAgent.instructions,
    });
  } else if (eventType === 'call.session_participant_left') {
    const event = payload as CallSessionParticipantLeftEvent;
    // we can get meetingId from call_cid because we not have call in CallSessionParticipantLeftEvent
    // call_cid is a string like "call:meetingId"
    // so we can split it by ':' and get the second part
    const meetingId = event.call_cid?.split(':')[1];
    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is missing in the event' },
        { status: 400 }
      );
    }
    // connect the agent to the call again
    // this is needed because when agent left the call, we need to end it
    const call = streamVideo.video.call('default', meetingId);
    await call.end();
  } else if (eventType === 'call.session_ended') {
    const event = payload as CallEndedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is missing in the event' },
        { status: 400 }
      );
    }

    await db
      .update(meetings)
      .set({ status: 'processing', endedAt: new Date() })
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, 'active')));
  } else if (eventType === 'call.transcription_ready') {
    const event = payload as CallTranscriptionReadyEvent;
    const meetingId = event.call_cid?.split(':')[1];
    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is missing in the event' },
        { status: 400 }
      );
    }
    // update the meeting status to processing
    const [updatedMeeting] = await db
      .update(meetings)
      .set({ transcriptUrl: event.call_transcription.url })
      .where(eq(meetings.id, meetingId))
      .returning();

    if (!updatedMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found or already processed' },
        { status: 404 }
      );
    }

    await inngest.send({
      name: 'meetings/processing',
      data: {
        meetingId: updatedMeeting.id,
        transcriptUrl: updatedMeeting.transcriptUrl,
      },
    });
  } else if (eventType === 'call.recording_ready') {
    const event = payload as CallRecordingReadyEvent;
    const meetingId = event.call_cid?.split(':')[1];

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is missing in the event' },
        { status: 400 }
      );
    }
    // update the meeting status to processing
    await db
      .update(meetings)
      .set({ recordingUrl: event.call_recording.url })
      .where(eq(meetings.id, meetingId));
  }

  return NextResponse.json({ status: 'ok' });
}
