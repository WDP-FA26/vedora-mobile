import { z } from 'zod';

const id = z.number().int().positive();
const sequence = z.number().int().nonnegative();
export const audioBridgeMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready') }),
  z.object({ type: z.literal('started'), id }),
  z.object({ type: z.literal('stopped'), id }),
  z.object({ type: z.literal('input'), id, audio: z.string().min(4).max(32_768).regex(/^[A-Za-z0-9+/]+={0,2}$/).refine((value) => value.length % 4 === 0) }),
  z.object({ type: z.literal('playback'), id, sequence, playing: z.boolean() }),
  z.object({ type: z.literal('error'), id, code: z.enum(['permission', 'missing-mic', 'unsupported', 'interrupted', 'playback']) }),
]);
export type AudioBridgeMessage = z.infer<typeof audioBridgeMessageSchema>;
export type AudioBridgeCommand =
  | { type: 'start' | 'stop'; id: number }
  | { type: 'interrupt'; id: number; sequence: number }
  | { type: 'play'; id: number; sequence: number; audio: string };
export type VoiceAudioPort = { send: (command: AudioBridgeCommand) => void };
