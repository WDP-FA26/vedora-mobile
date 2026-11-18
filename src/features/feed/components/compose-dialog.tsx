import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image, useWindowDimensions, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { createClientMessageId } from "@/features/messaging/utils/messaging";
import { ProfessionalName } from '@/shared/components/professional-name';
import type { VideoDraftInput } from "../hooks/use-compose-actions";
import { useDeleteDraft, usePostDrafts } from "../hooks/use-post-drafts";
import { isVideoPublishActive, useVideoPublishStore } from "../stores/video-publish-store";
import { MAX_POST_LENGTH, MAX_VIDEO_DURATION_SECONDS, type DraftMedia, type PostDraft, type SelectedComposeVideo } from "../types/compose.schema";
import { composeVideoBody, filledDescription } from "../utils/compose-body";

type Mode = "choose" | "video" | "drafts";

export type { SelectedComposeVideo } from "../types/compose.schema";

export type ComposeDialogProps = {
  visible: boolean;
  authorName?: string | null;
  authorProfessional?: boolean;
  initialMode?: Mode;
  onClose: () => void;
  onPickVideo: () => Promise<SelectedComposeVideo | null>;
  onRemoveVideo?: (video: SelectedComposeVideo) => void;
  /** Starts publishing in the background; the dialog closes right after. Throws a user-facing message when the draft is refused. */
  onSubmitVideo: (draft: VideoDraftInput) => void;
  /** Saves the form into its server draft in the background; throws a user-facing message when refused. */
  onSaveDraft: (draft: VideoDraftInput) => void;
};

type GuideTemplate = { id: string; name: string; headings: readonly string[] };

const TEMPLATES: readonly GuideTemplate[] = [
  {
    id: "step-by-step",
    name: "Hướng dẫn từng bước",
    headings: ["Tên món", "Giới thiệu", "Nguyên liệu", "Các bước thực hiện", "Mẹo khi nấu"],
  },
  {
    id: "quick-vegetarian",
    name: "Món chay nhanh",
    headings: ["Tên món", "Thời gian chuẩn bị và nấu", "Nguyên liệu chính", "Cách làm", "Mẹo tiết kiệm thời gian"],
  },
  {
    id: "kitchen-tip",
    name: "Mẹo bếp chay",
    headings: ["Mẹo muốn chia sẻ", "Chuẩn bị", "Cách thực hiện", "Lưu ý"],
  },
  {
    id: "food-story",
    name: "Câu chuyện món ăn",
    headings: ["Tên món", "Câu chuyện của món", "Điểm đặc biệt", "Cách làm", "Lời nhắn"],
  },
];

function videoDuration(seconds: number | null | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return null;
  const rounded = Math.floor(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function draftVideoText(media: DraftMedia | undefined): string {
  if (!media) return "Chưa có video";
  switch (media.status) {
    case "READY": return "Video sẵn sàng";
    case "PROCESSING": return "Video đang được xử lý";
    case "WAITING_UPLOAD": return "Video chưa tải xong. Nếu không đăng được, hãy chọn lại video.";
    case "FAILED": return "Video bị lỗi, hãy chọn video khác";
  }
}

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Plays a picked file, or a draft's video from its playback URL. */
function LocalVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={styles.videoPreview} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} />;
}

export function ComposeDialog({
  visible,
  authorName,
  authorProfessional,
  initialMode = "choose",
  onClose,
  onPickVideo,
  onRemoveVideo,
  onSubmitVideo,
  onSaveDraft,
}: ComposeDialogProps) {
  const theme = useTheme();
  const isDark = useColorScheme() === "dark";
  const { width, height } = useWindowDimensions();
  const compact = width < 700;
  // Read outside the Modal: a SafeAreaView inside it reports zero insets, which pushed the close button under the status bar.
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<SelectedComposeVideo | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<GuideTemplate | null>(null);
  const [undoTemplate, setUndoTemplate] = useState<{ before: string; applied: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pickingVideo, setPickingVideo] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string; video?: string }>({});
  // Every form writes to one server draft; a fresh ID until a saved draft is opened.
  const [draftId, setDraftId] = useState(createClientMessageId);
  const [editingDraft, setEditingDraft] = useState(false);
  /** The video already in the opened draft; replaced by `video` when a new file is picked. */
  const [serverVideo, setServerVideo] = useState<DraftMedia | null>(null);
  const drafts = usePostDrafts(visible);
  const removeDraft = useDeleteDraft();
  const activeJob = useVideoPublishStore((state) => state.job);
  const busyDraftId = isVideoPublishActive(activeJob) ? activeJob?.draftId : null;

  // Opening the video shortcut should select its form even if the dialog stays mounted.
  useEffect(() => {
    if (visible && !title && !description && !video && !serverVideo) setMode(initialMode);
  }, [visible, initialMode, title, description, video, serverVideo]);

  const displayName = authorName?.trim() || "Thành viên Vedora";
  const hasDraft = Boolean(title.trim() || description.trim() || video || serverVideo);
  const body = composeVideoBody(title, description);
  const canPreview = Boolean(title.trim() || filledDescription(description) || video);

  /** `handoff`: the video now belongs to the background job, so the form must not release it. */
  function clearForm(handoff = false) {
    if (video && !handoff) onRemoveVideo?.(video);
    setMode("choose");
    setTitle("");
    setDescription("");
    setVideo(null);
    setServerVideo(null);
    setDraftId(createClientMessageId());
    setEditingDraft(false);
    setTemplateOpen(false);
    setPendingTemplate(null);
    setUndoTemplate(null);
    setPreviewOpen(false);
    setConfirmDiscard(false);
    setSubmitError(null);
    setFieldErrors({});
  }

  function resetAndClose(handoff = false) {
    clearForm(handoff);
    onClose();
  }

  function draftInput(): VideoDraftInput {
    return { draftId, title, description, video, keepMediaId: video ? null : serverVideo?.id ?? null };
  }

  function saveAndClose() {
    setSubmitError(null);
    try {
      onSaveDraft(draftInput());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Chưa lưu được bản nháp. Bạn có thể thử lại.");
      return;
    }
    resetAndClose(true);
  }

  function openDraft(draft: PostDraft) {
    if (video) onRemoveVideo?.(video);
    setTitle(draft.title);
    setDescription(draft.description);
    setVideo(null);
    setServerVideo(draft.media[0] ?? null);
    setDraftId(draft.id);
    setEditingDraft(true);
    setUndoTemplate(null);
    setSubmitError(null);
    setFieldErrors({});
    setMode("video");
  }

  function confirmDeleteDraft(draft: PostDraft) {
    Alert.alert("Xóa bản nháp?", `"${draft.title.trim() || "Bản nháp chưa có tiêu đề"}" và video của nó sẽ bị xóa, không khôi phục được.`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => removeDraft.mutate(draft.id, {
          onSuccess: () => { if (draft.id === draftId) clearForm(); setMode("drafts"); },
          onError: () => Alert.alert("Chưa xóa được bản nháp", "Kiểm tra kết nối rồi thử lại."),
        }),
      },
    ]);
  }

  function requestClose() {
    if (pickingVideo) return;
    if (!hasDraft) resetAndClose();
    else {
      setPreviewOpen(false);
      setConfirmDiscard(true);
    }
  }

  async function selectVideo() {
    if (pickingVideo) return;
    setPickingVideo(true);
    setSubmitError(null);
    try {
      const picked = await onPickVideo();
      if (picked) {
        if (video && video.uri !== picked.uri) onRemoveVideo?.(video);
        setVideo(picked);
        // The new file replaces the draft's video when the draft is saved or published.
        setServerVideo(null);
        setFieldErrors((previous) => ({ ...previous, video: undefined }));
      }
    } catch (error) {
      setFieldErrors((previous) => ({
        ...previous,
        video: error instanceof Error ? error.message : "Không chọn được video. Vui lòng thử lại.",
      }));
    } finally {
      setPickingVideo(false);
    }
  }

  function applyTemplate(template: GuideTemplate) {
    const applied = template.headings.map((heading) => `${heading}:`).join("\n");
    setUndoTemplate({ before: description, applied });
    setDescription(applied);
    setFieldErrors((previous) => ({ ...previous, description: undefined }));
    setTemplateOpen(false);
    setPendingTemplate(null);
    setPreviewOpen(false);
  }

  function chooseTemplate(template: GuideTemplate) {
    setTemplateOpen(false);
    if (description.trim()) setPendingTemplate(template);
    else applyTemplate(template);
  }

  function publish() {
    if (pickingVideo) return;
    setSubmitError(null);
    if (mode === "video") {
      const next: typeof fieldErrors = {};
      if (!title.trim()) next.title = "Nhập tiêu đề video.";
      if (!filledDescription(description)) next.description = "Viết nội dung hướng dẫn. Các đề mục mẫu chưa được tính là nội dung.";
      if (body.length > MAX_POST_LENGTH) next.description = `Tiêu đề và mô tả cộng lại tối đa ${MAX_POST_LENGTH} ký tự.`;
      if (!video && !serverVideo) next.video = "Chọn video hướng dẫn.";
      else if (!video && serverVideo?.status === "FAILED") next.video = "Video trong bản nháp bị lỗi. Hãy chọn video khác.";
      else if (video && typeof video.durationSeconds === "number" && video.durationSeconds > MAX_VIDEO_DURATION_SECONDS)
        next.video = "Video tối đa 3 phút theo giới hạn hiện tại.";
      if (Object.keys(next).length) {
        setFieldErrors(next);
        setPreviewOpen(false);
        return;
      }
      setFieldErrors({});
      try {
        onSubmitVideo(draftInput());
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Chưa thể đăng video. Nội dung vẫn được giữ để bạn thử lại.");
        return;
      }
      resetAndClose(true);
    }
  }

  const dialogTitle = confirmDiscard ? (editingDraft ? "Lưu thay đổi vào bản nháp?" : "Lưu bài viết thành bản nháp?") : previewOpen ? "Xem trước bài đăng" : mode === "drafts" ? "Bản nháp" : mode === "video" ? (editingDraft ? "Sửa bản nháp" : "Tạo video hướng dẫn") : "Tạo nội dung";
  const draftItems = drafts.data ?? [];

  return (
    <Modal visible={visible} animationType={compact ? "slide" : "fade"} transparent onRequestClose={requestClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.overlay, { backgroundColor: "rgba(14, 30, 18, 0.48)" }]}>
        <View
          style={[
            styles.sheet,
            { paddingBottom: compact ? insets.bottom : 0, backgroundColor: isDark ? theme.background : "#f8f9f1", width: compact ? width : Math.min(width - 36, 740), height: compact ? height : undefined, maxHeight: compact ? height : Math.min(height * 0.9, 860), borderColor: theme.border, borderRadius: compact ? 0 : Radius["3xl"] },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card, paddingTop: compact ? insets.top : 0, minHeight: 60 + (compact ? insets.top : 0) }]}>
            {mode !== "choose" && !confirmDiscard && !previewOpen ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Trở lại chọn loại bài" onPress={() => setMode("choose")} style={styles.headerIcon}>
                <SymbolView name={{ ios: "arrow.left", android: "arrow_back", web: "arrow_back" }} size={22} tintColor={theme.foreground} />
              </Pressable>
            ) : previewOpen ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Quay lại chỉnh sửa" onPress={() => setPreviewOpen(false)} style={styles.headerIcon}>
                <SymbolView name={{ ios: "arrow.left", android: "arrow_back", web: "arrow_back" }} size={22} tintColor={theme.foreground} />
              </Pressable>
            ) : <View style={styles.headerIcon} />}
            <Text numberOfLines={1} style={[styles.dialogTitle, { color: theme.foreground }]}>{dialogTitle}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={requestClose} style={styles.headerIcon}>
              <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={20} tintColor={theme.foreground} />
            </Pressable>
          </View>

          {confirmDiscard ? (
            <View style={styles.confirmPane}>
              <Text style={[styles.confirmCopy, { color: theme.mutedForeground }]}>
                {editingDraft
                  ? "Lưu để giữ thay đổi trong bản nháp. Nếu bỏ, bản nháp giữ nội dung đã lưu lần trước."
                  : "Lưu nháp để viết tiếp sau, cả trên thiết bị khác khi video đã tải xong. Nếu bỏ, phần đã nhập và video đã chọn sẽ mất."}
              </Text>
              {submitError ? <Text accessibilityRole="alert" style={[styles.submitError, { color: theme.destructive }]}>{submitError}</Text> : null}
              <Pressable accessibilityRole="button" onPress={saveAndClose} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
                <Text style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>Lưu nháp</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setConfirmDiscard(false); setSubmitError(null); }} style={[styles.secondaryButton, { borderColor: theme.border }]}>
                <Text style={[styles.secondaryButtonText, { color: theme.foreground }]}>Tiếp tục chỉnh sửa</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => resetAndClose()} style={styles.textButton}>
                <Text style={[styles.secondaryButtonText, { color: theme.destructive }]}>{editingDraft ? "Bỏ thay đổi" : "Bỏ bài viết"}</Text>
              </Pressable>
            </View>
          ) : previewOpen ? (
            <ScrollView style={[styles.body, compact && styles.bodyCompact]} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
              <View style={styles.authorRow}>
                <View style={[styles.avatar, { backgroundColor: theme.secondary }]}><Text style={[styles.avatarText, { color: theme.secondaryForeground }]}>{displayName.charAt(0).toUpperCase()}</Text></View>
                <View><ProfessionalName name={displayName} isProfessional={authorProfessional} textStyle={[styles.authorName, { color: theme.foreground }]} /><Text style={[styles.caption, { color: theme.mutedForeground }]}>Công khai</Text></View>
              </View>
              <Text style={[styles.previewHeadline, { color: theme.foreground }]}>{title.trim() || "Tiêu đề video"}</Text>
              <Text style={[styles.previewText, { color: theme.foreground }]}>{filledDescription(description) || "Nội dung hướng dẫn của bạn sẽ hiện ở đây."}</Text>
              {video ? <LocalVideoPreview key={video.uri} uri={video.uri} /> : serverVideo?.status === "READY" && serverVideo.playbackUrl ? <LocalVideoPreview key={serverVideo.playbackUrl} uri={serverVideo.playbackUrl} /> : null}
              <Text style={[styles.caption, { color: theme.mutedForeground }]}>Bản xem trước này chỉ ở trên thiết bị, chưa đăng bài.</Text>
            </ScrollView>
          ) : mode === "choose" ? (
            <ScrollView style={[styles.body, compact && styles.bodyCompact]} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
              <View style={[styles.hero, { backgroundColor: isDark ? theme.secondary : "#edf5e4", borderColor: theme.border }]}>
                <View pointerEvents="none" style={[styles.heroCircle, { backgroundColor: isDark ? "rgba(117,182,92,0.12)" : "rgba(117,182,92,0.17)" }]} />
                <View style={styles.heroCopy}>
                  <Text style={[styles.heroEyebrow, { color: theme.primary }]}>CỘNG ĐỒNG VEDORA</Text>
                  <Text style={[styles.heroTitle, { color: theme.foreground }]}>Chia sẻ món chay theo cách của bạn</Text>
                  <Text style={[styles.heroDescription, { color: theme.mutedForeground }]}>Chọn hình thức bạn muốn đăng.</Text>
                </View>
                <Image source={require("@/assets/branding/tomato-sticker.png")} style={styles.heroSticker} resizeMode="contain" accessible={false} />
              </View>
              <Pressable accessibilityRole="button" onPress={() => { setMode("video"); setSubmitError(null); }} style={[styles.choice, styles.choicePrimary, { borderColor: isDark ? theme.primary : "#b5d5ae", backgroundColor: isDark ? theme.secondary : "#f1f7ed" }]}>
                <View style={[styles.choiceIcon, { backgroundColor: theme.primary }]}><SymbolView name={{ ios: "video", android: "videocam", web: "videocam" }} size={25} tintColor={theme.primaryForeground} /></View>
                <View style={styles.choiceCopy}><Text style={[styles.choiceTitle, { color: theme.foreground }]}>Video hướng dẫn</Text><Text style={[styles.choiceDescription, { color: theme.mutedForeground }]}>Chia sẻ cách nấu bằng video và phần hướng dẫn ngắn.</Text></View>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push('/blogs/new'); }} style={[styles.choice, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <View style={[styles.choiceIcon, { backgroundColor: theme.secondary }]}><SymbolView name={{ ios: "doc.text", android: "article", web: "article" }} size={25} tintColor={theme.primary} /></View>
                <View style={styles.choiceCopy}><Text style={[styles.choiceTitle, { color: theme.foreground }]}>Blog</Text><Text style={[styles.choiceDescription, { color: theme.mutedForeground }]}>Viết bài dài, thêm ảnh và lưu nháp.</Text></View>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setMode("drafts"); setSubmitError(null); }} style={[styles.choice, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <View style={[styles.choiceIcon, { backgroundColor: theme.secondary }]}><SymbolView name={{ ios: "tray.full", android: "drafts", web: "drafts" }} size={25} tintColor={theme.primary} /></View>
                <View style={styles.choiceCopy}><Text style={[styles.choiceTitle, { color: theme.foreground }]}>Bản nháp{draftItems.length ? ` (${draftItems.length})` : ""}</Text><Text style={[styles.choiceDescription, { color: theme.mutedForeground }]}>Video hướng dẫn bạn đã lưu để đăng sau.</Text></View>
              </Pressable>
            </ScrollView>
          ) : mode === "drafts" ? (
            <ScrollView style={[styles.body, compact && styles.bodyCompact]} contentContainerStyle={styles.bodyContent}>
              {drafts.isPending ? <ActivityIndicator color={theme.primary} style={styles.draftState} /> : drafts.isError ? (
                <Pressable accessibilityRole="button" onPress={() => void drafts.refetch()} style={styles.draftState}>
                  <Text style={[styles.caption, { color: theme.mutedForeground }]}>Chưa tải được bản nháp.</Text>
                  <Text style={[styles.inlineActionText, { color: theme.primary }]}>Thử lại</Text>
                </Pressable>
              ) : draftItems.length === 0 ? (
                <Text style={[styles.caption, styles.draftState, { color: theme.mutedForeground }]}>Chưa có bản nháp nào. Khi đóng form đang soạn, chọn “Lưu nháp” để giữ lại.</Text>
              ) : draftItems.map((draft) => {
                const busy = draft.id === busyDraftId;
                return (
                  <View key={draft.id} style={[styles.draftRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Mở bản nháp ${draft.title.trim() || "chưa có tiêu đề"}`}
                      accessibilityState={{ disabled: busy }}
                      disabled={busy}
                      onPress={() => openDraft(draft)}
                      style={({ pressed }) => [styles.draftCopy, { opacity: pressed ? 0.6 : 1 }]}>
                      <Text numberOfLines={1} style={[styles.videoName, { color: theme.foreground }]}>{draft.title.trim() || "Bản nháp chưa có tiêu đề"}</Text>
                      <Text numberOfLines={2} style={[styles.caption, { color: theme.mutedForeground }]}>
                        {busy ? "Đang lưu hoặc đăng…" : draftVideoText(draft.media[0])}
                      </Text>
                      <Text style={[styles.counter, styles.draftTime, { color: theme.mutedForeground }]}>Lưu lúc {formatSavedAt(draft.updatedAt)}</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa bản nháp ${draft.title.trim() || "chưa có tiêu đề"}`}
                      disabled={busy || removeDraft.isPending}
                      onPress={() => confirmDeleteDraft(draft)}
                      hitSlop={8}
                      style={[styles.headerIcon, { opacity: busy ? 0.4 : 1 }]}>
                      <SymbolView name={{ ios: "trash", android: "delete", web: "delete" }} size={18} tintColor={theme.mutedForeground} />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          ) : mode === "video" ? (
            <ScrollView style={[styles.body, compact && styles.bodyCompact]} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
              <View style={styles.authorRow}>
                <View style={[styles.avatar, { backgroundColor: theme.secondary }]}><Text style={[styles.avatarText, { color: theme.secondaryForeground }]}>{displayName.charAt(0).toUpperCase()}</Text></View>
                <View style={styles.authorDetails}><ProfessionalName name={displayName} isProfessional={authorProfessional} textStyle={[styles.authorName, { color: theme.foreground }]} /><View style={[styles.audienceChip, { borderColor: theme.border }]}><SymbolView name={{ ios: "globe", android: "public", web: "public" }} size={14} tintColor={theme.mutedForeground} /><Text style={[styles.audienceText, { color: theme.mutedForeground }]}>Công khai</Text></View></View>
              </View>
              <View style={[styles.guideBanner, { backgroundColor: isDark ? theme.secondary : "#fff4de", borderColor: theme.border }]}>
                <View style={styles.guideBannerCopy}>
                  <Text style={[styles.guideBannerTitle, { color: theme.foreground }]}>Góc bếp của bạn</Text>
                  <Text style={[styles.guideBannerText, { color: theme.mutedForeground }]}>Viết hướng dẫn ngắn, thêm video rồi chia sẻ.</Text>
                </View>
                <Image source={require("@/assets/branding/carrot-sticker.png")} style={styles.guideBannerSticker} resizeMode="contain" accessible={false} />
              </View>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleText}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Nội dung hướng dẫn</Text><Text style={[styles.caption, { color: theme.mutedForeground }]}>Tiêu đề và mô tả sẽ cùng xuất hiện trong bài đăng.</Text></View>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: templateOpen }} onPress={() => setTemplateOpen((open) => !open)} style={[styles.templateButton, { borderColor: theme.border }]}><Text style={[styles.templateButtonText, { color: theme.foreground }]}>Chọn mẫu</Text></Pressable>
              </View>
              {templateOpen ? <View style={[styles.templateList, { borderColor: theme.border, backgroundColor: theme.card }]}>{TEMPLATES.map((template) => <Pressable key={template.id} accessibilityRole="button" onPress={() => chooseTemplate(template)} style={[styles.templateItem, { borderBottomColor: theme.border }]}><Text style={[styles.templateName, { color: theme.foreground }]}>{template.name}</Text><Text numberOfLines={2} style={[styles.templateHeadings, { color: theme.mutedForeground }]}>{template.headings.join(" · ")}</Text></Pressable>)}</View> : null}
              {pendingTemplate ? <View style={[styles.templateConfirm, { backgroundColor: theme.secondary }]}><Text style={[styles.templateConfirmText, { color: theme.foreground }]}>Thay nội dung hiện tại bằng mẫu “{pendingTemplate.name}”?</Text><View style={styles.inlineActions}><Pressable accessibilityRole="button" onPress={() => setPendingTemplate(null)}><Text style={[styles.inlineActionText, { color: theme.mutedForeground }]}>Giữ nội dung</Text></Pressable><Pressable accessibilityRole="button" onPress={() => applyTemplate(pendingTemplate)}><Text style={[styles.inlineActionText, { color: theme.primary }]}>Thay mẫu</Text></Pressable></View></View> : null}
              {undoTemplate && description === undoTemplate.applied ? <Pressable accessibilityRole="button" onPress={() => { setDescription(undoTemplate.before); setUndoTemplate(null); }}><Text style={[styles.undoText, { color: theme.primary }]}>Hoàn tác thay mẫu</Text></Pressable> : null}
              <Text style={[styles.label, { color: theme.foreground }]}>Tiêu đề video</Text>
              <TextInput accessibilityLabel="Tiêu đề video" placeholder="Ví dụ: Cách làm bún riêu chay" placeholderTextColor={theme.mutedForeground} value={title} onChangeText={(value) => { setTitle(value); setFieldErrors((previous) => ({ ...previous, title: undefined, description: undefined })); setSubmitError(null); }} style={[styles.input, { color: theme.foreground, borderColor: fieldErrors.title ? theme.destructive : theme.border, backgroundColor: theme.card }]} />
              {fieldErrors.title ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.destructive }]}>{fieldErrors.title}</Text> : null}
              <Text style={[styles.label, { color: theme.foreground }]}>Mô tả và các bước hướng dẫn</Text>
              <TextInput accessibilityLabel="Mô tả và các bước hướng dẫn" placeholder="Giới thiệu món ăn, nguyên liệu, cách thực hiện và mẹo của bạn..." placeholderTextColor={theme.mutedForeground} value={description} onChangeText={(value) => { setDescription(value); setFieldErrors((previous) => ({ ...previous, description: undefined })); setSubmitError(null); }} multiline textAlignVertical="top" style={[styles.textArea, { color: theme.foreground, borderColor: fieldErrors.description ? theme.destructive : theme.border, backgroundColor: theme.card }]} />
              <Text style={[styles.counter, { color: body.length > MAX_POST_LENGTH ? theme.destructive : theme.mutedForeground }]}>{body.length}/{MAX_POST_LENGTH} ký tự</Text>
              {fieldErrors.description ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.destructive }]}>{fieldErrors.description}</Text> : null}
              <View style={styles.mediaHeading}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Video hướng dẫn</Text><Text style={[styles.caption, { color: theme.mutedForeground }]}>Video tối đa 3 phút theo giới hạn hiện tại.</Text></View>
              {!video && serverVideo ? <View style={[styles.selectedVideo, { borderColor: serverVideo.status === "FAILED" ? theme.destructive : theme.border, backgroundColor: theme.card }]}>{serverVideo.status === "READY" && serverVideo.playbackUrl ? <LocalVideoPreview key={serverVideo.playbackUrl} uri={serverVideo.playbackUrl} /> : serverVideo.posterUrl ? <Image source={{ uri: serverVideo.posterUrl }} style={styles.videoPreview} resizeMode="contain" accessible={false} /> : null}<View style={styles.videoMeta}><View style={styles.videoMetaText}><Text numberOfLines={1} style={[styles.videoName, { color: theme.foreground }]}>Video trong bản nháp</Text><Text style={[styles.caption, { color: serverVideo.status === "FAILED" ? theme.destructive : theme.mutedForeground }]}>{draftVideoText(serverVideo)}{videoDuration(serverVideo.durationSec) ? ` · ${videoDuration(serverVideo.durationSec)}` : ""}</Text></View></View><View style={styles.inlineActions}><Pressable accessibilityRole="button" disabled={pickingVideo} onPress={() => { void selectVideo(); }}><Text style={[styles.inlineActionText, { color: theme.primary }]}>Thay video</Text></Pressable><Pressable accessibilityRole="button" disabled={pickingVideo} onPress={() => setServerVideo(null)}><Text style={[styles.inlineActionText, { color: theme.destructive }]}>Xóa video</Text></Pressable></View></View> : video ? <View style={[styles.selectedVideo, { borderColor: theme.border, backgroundColor: theme.card }]}><LocalVideoPreview key={video.uri} uri={video.uri} /><View style={styles.videoMeta}><View style={styles.videoMetaText}><Text numberOfLines={1} style={[styles.videoName, { color: theme.foreground }]}>{video.fileName || "Video đã chọn"}</Text>{videoDuration(video.durationSeconds) ? <Text style={[styles.caption, { color: theme.mutedForeground }]}>Thời lượng {videoDuration(video.durationSeconds)}</Text> : null}</View></View><View style={styles.inlineActions}><Pressable accessibilityRole="button" disabled={pickingVideo} onPress={() => { void selectVideo(); }}><Text style={[styles.inlineActionText, { color: theme.primary }]}>Thay video</Text></Pressable><Pressable accessibilityRole="button" disabled={pickingVideo} onPress={() => { onRemoveVideo?.(video); setVideo(null); }}><Text style={[styles.inlineActionText, { color: theme.destructive }]}>Xóa video</Text></Pressable></View></View> : <Pressable accessibilityRole="button" disabled={pickingVideo} onPress={() => { void selectVideo(); }} style={[styles.uploadZone, { backgroundColor: theme.card, borderColor: theme.primary }]}><SymbolView name={{ ios: "video", android: "videocam", web: "videocam" }} size={30} tintColor={theme.primary} /><Text style={[styles.uploadTitle, { color: theme.foreground }]}>Thêm video hướng dẫn nấu ăn</Text><Text style={[styles.caption, { color: theme.mutedForeground }]}>Chọn video từ thiết bị của bạn.</Text><View style={[styles.pickButton, { borderColor: theme.border }]}><Text style={[styles.pickButtonText, { color: theme.foreground }]}>{pickingVideo ? "Đang mở thư viện..." : "Chọn video"}</Text></View></Pressable>}
              {fieldErrors.video ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.destructive }]}>{fieldErrors.video}</Text> : null}
            </ScrollView>
          ) : null}

          {!confirmDiscard && mode === "video" ? <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
            {submitError ? <Text accessibilityRole="alert" style={[styles.submitError, { color: theme.destructive }]}>{submitError}</Text> : null}
            <View style={styles.footerActions}>
              <Pressable accessibilityRole="button" disabled={!canPreview} onPress={() => setPreviewOpen((open) => !open)} style={[styles.previewButton, { borderColor: theme.border, opacity: canPreview ? 1 : 0.55 }]}><SymbolView name={{ ios: "eye", android: "visibility", web: "visibility" }} size={17} tintColor={theme.foreground} /><Text style={[styles.previewButtonText, { color: theme.foreground }]}>{previewOpen ? "Chỉnh sửa" : "Xem trước"}</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={pickingVideo || previewOpen} onPress={publish} style={[styles.publishButton, { backgroundColor: theme.primary, opacity: pickingVideo || previewOpen ? 0.6 : 1 }]}><Text style={[styles.publishButtonText, { color: theme.primaryForeground }]}>Đăng video</Text></Pressable>
            </View>
          </View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  sheet: { overflow: "hidden", borderWidth: 1, flexShrink: 1 },
  header: { minHeight: 60, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.two },
  headerIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  dialogTitle: { flex: 1, textAlign: "center", fontFamily: Fonts.headingBold, fontSize: 17 },
  body: { flexShrink: 1 },
  bodyCompact: { flex: 1 },
  bodyContent: { padding: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.two },
  hero: { minHeight: 154, flexDirection: "row", alignItems: "center", overflow: "hidden", borderWidth: 1, borderRadius: Radius["2xl"], paddingLeft: Spacing.three, paddingRight: Spacing.two, marginBottom: Spacing.two },
  heroCircle: { position: "absolute", width: 164, height: 164, borderRadius: 82, right: -42, top: -52 },
  heroCopy: { flex: 1, gap: 5, zIndex: 1 },
  heroEyebrow: { fontFamily: Fonts.sansBold, fontSize: 11, letterSpacing: 1.3 },
  heroTitle: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 25 },
  heroDescription: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  heroSticker: { width: 90, height: 102, marginLeft: Spacing.one, zIndex: 1 },
  choice: { minHeight: 86, flexDirection: "row", alignItems: "center", gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius["2xl"] },
  choicePrimary: { minHeight: 94 },
  choiceIcon: { width: 46, height: 46, borderRadius: Radius.xl, alignItems: "center", justifyContent: "center" },
  choiceCopy: { flex: 1, gap: 3 },
  choiceTitle: { fontFamily: Fonts.headingBold, fontSize: 16 },
  choiceDescription: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, marginBottom: Spacing.three },
  avatar: { width: 45, height: 45, borderRadius: 23, justifyContent: "center", alignItems: "center" },
  avatarText: { fontFamily: Fonts.headingBold, fontSize: 16 },
  authorDetails: { gap: 3 },
  authorName: { fontFamily: Fonts.headingBold, fontSize: 14 },
  audienceChip: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 100, paddingHorizontal: Spacing.two, paddingVertical: 3 },
  audienceText: { fontFamily: Fonts.sansMedium, fontSize: 12 },
  guideBanner: { minHeight: 82, borderWidth: 1, borderRadius: Radius["2xl"], flexDirection: "row", alignItems: "center", paddingLeft: Spacing.three, paddingRight: Spacing.two, marginBottom: Spacing.three, overflow: "hidden" },
  guideBannerCopy: { flex: 1, gap: 3 },
  guideBannerTitle: { fontFamily: Fonts.headingBold, fontSize: 15 },
  guideBannerText: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  guideBannerSticker: { width: 65, height: 70, marginLeft: Spacing.two },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.one, marginBottom: Spacing.two },
  sectionTitleText: { flex: 1 },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 16 },
  caption: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  templateButton: { borderWidth: 1, borderRadius: 100, minHeight: 44, paddingHorizontal: Spacing.two, justifyContent: "center" },
  templateButtonText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  templateList: { borderWidth: 1, borderRadius: Radius.xl, overflow: "hidden", marginBottom: Spacing.one },
  templateItem: { borderBottomWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: 3 },
  templateName: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  templateHeadings: { fontFamily: Fonts.sans, fontSize: 12 },
  templateConfirm: { padding: Spacing.three, borderRadius: Radius.xl, gap: Spacing.two },
  templateConfirmText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  inlineActions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: Spacing.three, paddingHorizontal: Spacing.two, paddingBottom: Spacing.two },
  inlineActionText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  undoText: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 14, marginTop: Spacing.one },
  input: { borderWidth: 1, borderRadius: Radius.xl, minHeight: 48, paddingHorizontal: Spacing.three, fontFamily: Fonts.sans, fontSize: 14 },
  textArea: { borderWidth: 1, borderRadius: Radius.xl, minHeight: 160, padding: Spacing.three, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  counter: { textAlign: "right", fontFamily: Fonts.sans, fontSize: 12 },
  errorText: { fontFamily: Fonts.sans, fontSize: 12 },
  mediaHeading: { marginTop: Spacing.three, gap: 2 },
  uploadZone: { minHeight: 180, borderWidth: 1, borderStyle: "dashed", borderRadius: Radius["2xl"], justifyContent: "center", alignItems: "center", gap: Spacing.two, padding: Spacing.three },
  uploadTitle: { fontFamily: Fonts.sansBold, fontSize: 14, textAlign: "center" },
  pickButton: { minHeight: 34, borderWidth: 1, borderRadius: 100, paddingHorizontal: Spacing.three, justifyContent: "center" },
  pickButtonText: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
  selectedVideo: { borderWidth: 1, borderRadius: Radius.xl, overflow: "hidden" },
  videoPreview: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#101b14" },
  videoMeta: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, flexDirection: "row" },
  videoMetaText: { flex: 1, gap: 2 },
  videoName: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  footer: { borderTopWidth: 1, padding: Spacing.three, gap: Spacing.two },
  footerActions: { flexDirection: "row", gap: Spacing.two },
  previewButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 44, borderWidth: 1, borderRadius: 100, paddingHorizontal: Spacing.three },
  previewButtonText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  publishButton: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 44, borderRadius: 100 },
  publishButtonText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  submitError: { fontFamily: Fonts.sans, fontSize: 12 },
  confirmPane: { padding: Spacing.four, alignItems: "center", gap: Spacing.three },
  confirmCopy: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22, textAlign: "center" },
  primaryButton: { width: "100%", minHeight: 45, borderRadius: 100, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  secondaryButton: { width: "100%", minHeight: 45, borderRadius: 100, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  textButton: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.three },
  draftState: { padding: Spacing.five, alignItems: "center", gap: Spacing.two, textAlign: "center" },
  draftRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, borderWidth: 1, borderRadius: Radius.xl, paddingLeft: Spacing.three, paddingRight: Spacing.one },
  draftCopy: { flex: 1, minHeight: 64, paddingVertical: Spacing.two + Spacing.one, gap: 2 },
  draftTime: { textAlign: "left" },
  previewHeadline: { fontFamily: Fonts.headingBold, fontSize: 17 },
  previewText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
});
