import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PostModeration } from '@/shared/types/post-moderation.schema';
import { POST_STATUS_LABELS } from '../utils/post-status';

const FIELD_LABELS: Record<string, string> = {
  body: 'Nội dung', title: 'Tiêu đề', content: 'Nội dung Blog', transcript: 'Lời nói trong video', frame: 'Khung hình video', image: 'Ảnh',
};

/** Evidence is plain selectable text; it must never be interpreted as HTML or Markdown. */
export function PostModerationNotice({ post }: { post: PostModeration }) {
  const theme = useTheme();
  if (post.status === 'PUBLISHED' || post.status === 'DRAFT') return null;
  const blocked = ['REJECTED', 'REMOVED', 'FAILED'].includes(post.status);
  const reason = post.status === 'REMOVED' ? post.removalReason : post.moderationReason;
  return <View style={[styles.box, { borderColor: blocked ? theme.destructive : theme.border, backgroundColor: theme.muted }]}>
    <Text accessibilityRole="header" style={[styles.title, { color: blocked ? theme.destructive : theme.foreground }]}>{POST_STATUS_LABELS[post.status]}</Text>
    <Text selectable style={[styles.text, { color: theme.foreground }]}>{reason || (
      post.status === 'PROCESSING' ? 'Bài đã được lưu, đang xử lý nội dung và kiểm duyệt trước khi hiển thị.'
        : post.status === 'PENDING_REVIEW' ? 'Bài đã được lưu và đang chờ Vedora xem xét.'
          : post.status === 'REJECTED' ? 'Bài chưa được phép hiển thị. Hãy xem lại nội dung trước khi gửi duyệt lại.'
            : post.status === 'REMOVED' ? 'Bài đã được gỡ và không còn hiển thị công khai.' : 'Không xử lý được bài. Hãy kiểm tra nội dung và video trước khi thử lại.')}</Text>
    {post.status === 'REJECTED' ? post.moderationFindings?.map((finding, index) => <View key={index} style={styles.finding}>
      <Text style={[styles.title, { color: theme.foreground }]}>{FIELD_LABELS[finding.field] ?? 'Nội dung bị đánh dấu'}{finding.seconds !== null ? ` · ${finding.seconds} giây` : ''}</Text>
      {finding.quote ? <Text selectable style={[styles.text, { color: theme.foreground }]}>“{finding.quote}”</Text> : null}
      <Text selectable style={[styles.text, { color: theme.mutedForeground }]}>{finding.reason}{finding.reasonText ? ` (${finding.reasonText})` : ''}</Text>
    </View>) : null}
    {post.appeal?.activeTicket ? <Text style={[styles.text, { color: theme.mutedForeground }]}>Khiếu nại đang được xử lý. Tạm thời không thể sửa hoặc xóa bài.</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, gap: Spacing.two, marginVertical: Spacing.two },
  title: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },
  text: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  finding: { gap: Spacing.one },
});
