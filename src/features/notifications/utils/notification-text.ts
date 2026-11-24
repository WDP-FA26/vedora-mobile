import {
  REPORT_REASON_LABELS,
  type ReportReason,
} from "@/features/posts/types/posts.schema";

import type { AppNotification } from "../types/notification.schema";

function reportReason(reason: string | null | undefined) {
  const label = reason
    ? REPORT_REASON_LABELS[reason as ReportReason]
    : undefined;
  return label ? ` (lý do: ${label.toLocaleLowerCase("vi")})` : "";
}

function quoted(note: string | null | undefined) {
  return note ? ` "${note}"` : "";
}

/** What the actor (or Vedora, when `actor` is null) did, worded for "<name> <text>". */
export function notificationText(item: AppNotification): string {
  switch (item.type) {
    case "COMMENT_REMOVED":
      return `đã gỡ bình luận${quoted(item.note)} của bạn${reportReason(item.reason)}`;
    case "COMMENT_REMOVED_BY_POST_OWNER":
      return `thông báo chủ bài viết đã xóa bình luận${quoted(item.note)} của bạn`;
    case "COMMENT_THREAD_REMOVED":
      return `thông báo phản hồi${quoted(item.note)} của bạn đã bị xóa theo luồng bình luận gốc`;
    case "COMMENT_REPORT_RESOLVED":
      return `đã xử lý báo cáo: bình luận${quoted(item.note)} không còn hiển thị${reportReason(item.reason)}`;
    case "COMMENT_REPORT_DISMISSED":
      return `đã xem xét báo cáo và giữ lại bình luận${quoted(item.note)}${reportReason(item.reason)}`;
    case "SUPPORT_TICKET_REPLIED":
      return "đã phản hồi yêu cầu hỗ trợ của bạn";
    case "SUPPORT_TICKET_RESOLVED":
      return "đã giải quyết yêu cầu hỗ trợ của bạn";
    case "SUPPORT_TICKET_CLOSED":
      return "đã đóng yêu cầu hỗ trợ của bạn";
    case "SUPPORT_TICKET_EXPIRED":
      return "đã đóng yêu cầu do hết hạn phản hồi";
    case "SUPPORT_TICKET_REMINDER":
      return "đang chờ bạn phản hồi yêu cầu hỗ trợ";
    case "POST_RESTORED":
      return "đã khôi phục bài viết sau khi xem xét khiếu nại";
    case "LIKE":
      return "đã tim bài viết của bạn";
    case "COMMENT_REPLY":
      return "đã trả lời bình luận của bạn";
    case "COMMENT":
      return "đã bình luận bài viết của bạn";
    case "REPOST":
      return "đã đăng lại bài viết của bạn";
    case "FOLLOW":
      return "đã bắt đầu theo dõi bạn";
    case "POST_PENDING_REVIEW":
      return "đang xem xét bài viết của bạn trước khi hiển thị";
    case "POST_APPROVED":
      return `đã duyệt bài viết của bạn${item.note ? `. Ghi chú: ${item.note}` : ""}`;
    case "POST_REJECTED":
      return `không duyệt bài viết của bạn${item.reasonText ? ` vì ${item.reasonText}` : ""}${item.note ? `. Ghi chú: ${item.note}` : ""}`;
    case "POST_REMOVED":
      return `đã gỡ bài viết${quoted(item.note)} của bạn${reportReason(item.reason)}`;
    case "REPORT_RESOLVED":
      return `đã xử lý báo cáo của bạn về một bài viết${reportReason(item.reason)}`;
    case "REPORT_DISMISSED":
      return `đã xem báo cáo của bạn và giữ lại bài viết${reportReason(item.reason)}`;
    case "REPORTED_POST_REMOVED":
      return `đã gỡ bài viết${quoted(item.note)} mà bạn báo cáo`;
    default:
      return "có thông báo mới cho bạn";
  }
}
