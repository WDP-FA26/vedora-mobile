import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { AssistantHeader } from "@/shared/components/chat/assistant-header";
import {
  CHAT_CONTENT_INSET,
  ChatBubble,
  ChatStatus,
} from "@/shared/components/chat/chat-bubble";
import { ChatComposer } from "@/shared/components/chat/chat-composer";

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
  const scrollRef = useRef<ScrollViewInstance>(null);

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
      <AssistantHeader
        avatar={<SproutPet size={38} accessible={false} />}
        title="Trợ lý Vedora"
        subtitle="Hỏi nhanh về dinh dưỡng thực vật"
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bắt đầu lại cuộc trò chuyện"
            onPress={chat.reset}
            hitSlop={8}
            style={({ pressed }) => [
              styles.reset,
              { backgroundColor: theme.muted, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <SymbolView
              name={{
                ios: "arrow.counterclockwise",
                android: "refresh",
                web: "refresh",
              }}
              size={18}
              tintColor={theme.foreground}
            />
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.screen}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messages}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {chat.messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              text={message.text}
              streaming={message.streaming}
              authorLabel="Trợ lý Vedora"
              avatar={<SproutPet size={26} accessible={false} />}
            />
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

          {chat.thinking && <ChatStatus>Trợ lý đang suy nghĩ…</ChatStatus>}
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
                    styles.action,
                    {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
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
                    styles.action,
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
                  ? "Một bước kiểm tra ngắn để giữ lượt hỏi miễn phí cho mọi người."
                  : "Chưa xác minh được lúc này. Bạn quay lại sau nhé."}
              </Text>
              {chat.canVerify && (
                <Pressable
                  accessibilityRole="button"
                  disabled={chat.verifying}
                  onPress={() => void chat.verify()}
                  style={[
                    styles.action,
                    styles.actionFull,
                    {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
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

        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSubmit={() => void submit(draft)}
          placeholder="Hỏi về dinh dưỡng…"
          inputLabel="Câu hỏi về dinh dưỡng"
          sendLabel="Gửi câu hỏi"
          inputDisabled={!chat.ready || chat.busy || !!chat.limit}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  reset: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  suggestions: {
    paddingLeft: CHAT_CONTENT_INSET,
    gap: Spacing.two,
  },
  suggestionLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.1,
  },
  suggestion: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius["2xl"],
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  suggestionText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    paddingLeft: CHAT_CONTENT_INSET,
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
  action: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
  },
  actionFull: { flex: 0, alignSelf: "stretch", marginTop: Spacing.one },
  actionText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },
});
