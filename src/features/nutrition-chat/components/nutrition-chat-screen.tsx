import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { NUTRITION_CHAT_SUGGESTIONS } from "../data/suggestions";
import { useNutritionChat } from "../hooks/use-nutrition-chat";
import { MAX_CHAT_MESSAGE_LENGTH } from "../types/nutrition-chat.schema";
import { SproutPet } from "./sprout-pet";

type NutritionChatScreenProps = {
  /** Supply a genuine, fresh Turnstile response. Without it guest chat stays locked. */
  getTurnstileToken?: () => Promise<string>;
};

export function NutritionChatScreen({
  getTurnstileToken,
}: NutritionChatScreenProps) {
  const theme = useTheme();
  const chat = useNutritionChat(getTurnstileToken);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const submit = async (question: string, fromSuggestion = false) => {
    const sent = await chat.send(question);
    if (fromSuggestion) {
      if (!sent) setDraft((current) => (current.trim() ? current : question));
    } else {
      setDraft(sent ? "" : question);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: theme.card, borderBottomColor: theme.border },
          ]}
        >
          <View
            style={[styles.headerPet, { backgroundColor: theme.secondary }]}
          >
            <SproutPet size={50} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: theme.foreground }]}>
              Trợ lý Vedora
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: theme.mutedForeground }]}
            >
              Hỏi nhanh về dinh dưỡng thực vật
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bắt đầu lại cuộc trò chuyện"
            onPress={chat.reset}
            hitSlop={10}
            style={styles.reset}
          >
            <SymbolView
              name={{
                ios: "arrow.counterclockwise",
                android: "refresh",
                web: "refresh",
              }}
              size={20}
              tintColor={theme.foreground}
            />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messages}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {chat.messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.role === "user" && styles.userRow,
              ]}
            >
              {message.role === "assistant" && (
                <View
                  style={[styles.avatar, { backgroundColor: theme.secondary }]}
                >
                  <SproutPet size={31} />
                </View>
              )}
              <View
                style={[
                  styles.messageColumn,
                  message.role === "user" && styles.userColumn,
                ]}
              >
                {message.role === "assistant" && (
                  <Text style={[styles.author, { color: theme.foreground }]}>
                    Trợ lý Vedora
                  </Text>
                )}
                <View
                  style={[
                    styles.bubble,
                    message.role === "user"
                      ? {
                          backgroundColor: theme.primary,
                          borderBottomRightRadius: Radius.sm,
                        }
                      : {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                          borderWidth: 1,
                          borderBottomLeftRadius: Radius.sm,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color:
                          message.role === "user"
                            ? theme.primaryForeground
                            : theme.foreground,
                      },
                    ]}
                  >
                    {message.text}
                    {message.streaming ? " ▍" : ""}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {chat.messages.length === 1 && !chat.busy && !chat.limit && (
            <View style={styles.suggestions}>
              <Text
                style={[
                  styles.suggestionLabel,
                  { color: theme.mutedForeground },
                ]}
              >
                BẠN CÓ THỂ HỎI
              </Text>
              {NUTRITION_CHAT_SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  accessibilityRole="button"
                  disabled={!chat.ready}
                  onPress={() => void submit(suggestion, true)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      opacity: !chat.ready ? 0.6 : pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.suggestionText, { color: theme.foreground }]}
                  >
                    {suggestion}
                  </Text>
                  <SymbolView
                    name={{
                      ios: "arrow.up.left",
                      android: "north_west",
                      web: "north_west",
                    }}
                    size={15}
                    tintColor={theme.mutedForeground}
                  />
                </Pressable>
              ))}
            </View>
          )}

          {chat.thinking && (
            <Text style={[styles.status, { color: theme.mutedForeground }]}>
              Trợ lý đang suy nghĩ…
            </Text>
          )}
          {chat.error && (
            <Text
              accessibilityRole="alert"
              style={[styles.error, { color: theme.destructive }]}
            >
              {chat.error}
            </Text>
          )}

          {chat.limit && (
            <View
              style={[
                styles.noticeCard,
                { backgroundColor: theme.secondary, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.noticeTitle, { color: theme.foreground }]}>
                {chat.limit === "quota"
                  ? "Bạn đã hết lượt hỏi thử hôm nay"
                  : "Hôm nay đã hết lượt dành cho khách"}
              </Text>
              <Text
                style={[styles.noticeText, { color: theme.mutedForeground }]}
              >
                Đăng ký hoặc đăng nhập để tiếp tục sử dụng Vedora.
              </Text>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/register",
                      params: { returnTo: "/ai" },
                    })
                  }
                  style={({ pressed }) => [
                    styles.primaryAction,
                    {
                      backgroundColor: theme.primary,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      { color: theme.primaryForeground },
                    ]}
                  >
                    Đăng ký
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/login",
                      params: { returnTo: "/ai" },
                    })
                  }
                  style={({ pressed }) => [
                    styles.secondaryAction,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.actionText, { color: theme.primary }]}>
                    Đăng nhập
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {!chat.ready && !chat.limit && (
            <View
              style={[
                styles.noticeCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.noticeTitle, { color: theme.foreground }]}>
                Xác minh để hỏi thử
              </Text>
              <Text
                style={[styles.noticeText, { color: theme.mutedForeground }]}
              >
                {chat.canVerify
                  ? "Một bước kiểm tra ngắn giúp bảo vệ lượt hỏi miễn phí cho mọi người."
                  : "Bước xác minh chưa sẵn sàng. Bạn có thể quay lại sau."}
              </Text>
              {chat.canVerify && (
                <Pressable
                  accessibilityRole="button"
                  disabled={chat.verifying}
                  onPress={() => void chat.verify()}
                  style={[
                    styles.primaryAction,
                    {
                      backgroundColor: theme.primary,
                      opacity: chat.verifying ? 0.55 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      { color: theme.primaryForeground },
                    ]}
                  >
                    {chat.verifying ? "Đang xác minh…" : "Xác minh và bắt đầu"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.composerWrap,
            { backgroundColor: theme.card, borderTopColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.composer,
              { backgroundColor: theme.muted, borderColor: theme.border },
            ]}
          >
            <TextInput
              accessibilityLabel="Câu hỏi về dinh dưỡng"
              editable={chat.ready && !chat.busy && !chat.limit}
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              multiline
              onChangeText={setDraft}
              placeholder="Hỏi về dinh dưỡng…"
              placeholderTextColor={theme.mutedForeground}
              style={[styles.input, { color: theme.foreground }]}
              value={draft}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gửi câu hỏi"
              disabled={
                !chat.ready || chat.busy || !!chat.limit || !draft.trim()
              }
              onPress={() => void submit(draft)}
              style={[
                styles.send,
                {
                  backgroundColor: theme.primary,
                  opacity:
                    !chat.ready || chat.busy || !!chat.limit || !draft.trim()
                      ? 0.45
                      : 1,
                },
              ]}
            >
              <SymbolView
                name={{
                  ios: "arrow.up",
                  android: "arrow_upward",
                  web: "arrow_upward",
                }}
                size={18}
                tintColor={theme.primaryForeground}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  headerPet: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, gap: 1 },
  headerTitle: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 25 },
  headerSubtitle: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  reset: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  messages: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  messageRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  userRow: { justifyContent: "flex-end" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  messageColumn: { flex: 1, maxWidth: "88%", gap: Spacing.one },
  userColumn: { flex: 0, minWidth: 80, alignItems: "flex-end" },
  author: { fontFamily: Fonts.sansBold, fontSize: 13 },
  bubble: {
    borderRadius: Radius["2xl"],
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  messageText: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23 },
  suggestions: { paddingLeft: 44, gap: Spacing.two, paddingTop: Spacing.two },
  suggestionLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: Spacing.one,
  },
  suggestion: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius["2xl"],
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  suggestionText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  status: { paddingLeft: 44, fontFamily: Fonts.sans, fontSize: 14 },
  error: {
    paddingLeft: 44,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  noticeCard: {
    borderWidth: 1,
    borderRadius: Radius["2xl"],
    padding: Spacing.three,
    gap: Spacing.two,
  },
  noticeTitle: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 23 },
  noticeText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", gap: Spacing.two, paddingTop: Spacing.one },
  primaryAction: {
    minHeight: 42,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  secondaryAction: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  composerWrap: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  composer: {
    maxWidth: 680,
    alignSelf: "center",
    width: "100%",
    borderWidth: 1,
    borderRadius: Radius["2xl"],
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    paddingTop: 12,
    paddingBottom: 8,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: "top",
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    maxWidth: 680,
    alignSelf: "center",
    textAlign: "center",
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
});
