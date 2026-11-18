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
    case "LIKE":
      return "đã tim bài viết của bạn";
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
