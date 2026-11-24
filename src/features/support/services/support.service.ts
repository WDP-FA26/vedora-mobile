import { z } from 'zod';

import { requestJson } from '@/shared/api/request-json';

import { attachmentInputSchema, attachmentUploadSchema, createTicketSchema, replyTicketSchema, ticketDetailSchema, ticketPageSchema, type CreateTicketInput, type ReplyTicketInput, type TicketStatus } from '../types/support.schema';

export function getTickets(page: number, status?: TicketStatus, signal?: AbortSignal) {
  return requestJson(ticketPageSchema, { method: 'GET', url: '/support/tickets', params: { page, limit: 20, ...(status ? { status } : {}) }, signal });
}
export function getTicket(id: string, signal?: AbortSignal) {
  return requestJson(ticketDetailSchema, { method: 'GET', url: `/support/tickets/${z.uuidv4().parse(id)}`, signal });
}
export function createTicket(input: CreateTicketInput) {
  return requestJson(ticketDetailSchema, { method: 'POST', url: '/support/tickets', data: createTicketSchema.parse(input) });
}
export function replyTicket(id: string, input: ReplyTicketInput) {
  return requestJson(ticketDetailSchema, { method: 'POST', url: `/support/tickets/${z.uuidv4().parse(id)}/messages`, data: replyTicketSchema.parse(input) });
}
export function withdrawTicket(id: string) {
  return requestJson(ticketDetailSchema, { method: 'POST', url: `/support/tickets/${z.uuidv4().parse(id)}/withdraw` });
}
export function requestAttachmentUpload(input: z.input<typeof attachmentInputSchema>) {
  return requestJson(attachmentUploadSchema, { method: 'POST', url: '/support/attachments', data: attachmentInputSchema.parse(input) });
}
