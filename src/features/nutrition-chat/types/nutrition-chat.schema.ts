import { z } from 'zod';

export const MAX_CHAT_MESSAGE_LENGTH = 500;
export const MAX_CONTEXT_MESSAGES = 5;

export const chatQuestionSchema = z.string().trim().min(1, 'Nhập câu hỏi').max(
  MAX_CHAT_MESSAGE_LENGTH,
  `Câu hỏi tối đa ${MAX_CHAT_MESSAGE_LENGTH} ký tự`,
);

export const guestSessionSchema = z.object({
  token: z.string().min(1),
  expiresIn: z.number().positive(),
  remaining: z.number().int().nonnegative(),
});

export const nutritionChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string().trim().min(1),
  }).superRefine(({ role, text }, context) => {
    if (role === 'user' && text.length > MAX_CHAT_MESSAGE_LENGTH) {
      context.addIssue({ code: 'custom', path: ['text'], message: `Câu hỏi tối đa ${MAX_CHAT_MESSAGE_LENGTH} ký tự` });
    }
  })).min(1).max(MAX_CONTEXT_MESSAGES),
});

export type NutritionChatRequest = z.infer<typeof nutritionChatRequestSchema>;
