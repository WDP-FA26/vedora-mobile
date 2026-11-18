import { Tabs, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MealPlannerProvider } from '@/features/meal-plan/hooks/meal-planner-provider';
import { useTabBarVisibilityStore } from '@/features/navigation/stores/tab-bar-visibility-store';
import { SproutPet } from '@/features/nutrition-chat/components/sprout-pet';
import { useMessagingUnread } from '@/features/messaging/hooks/use-messaging';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

type TabIconName = Extract<ComponentProps<typeof SymbolView>['name'], object>;

function TabIcon({ name, color }: { name: TabIconName; color: ColorValue }) {
  return <SymbolView name={name} size={24} tintColor={color} />;
}

export default function MainTabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const visible = useTabBarVisibilityStore((state) => state.visible);
  const setVisible = useTabBarVisibilityStore((state) => state.setVisible);
  const hidden = pathname.endsWith('/explore') && !visible;

  useEffect(() => {
    setVisible(true);
  }, [pathname, setVisible]);

  const token = useSessionStore((state) => state.accessToken);
  const unread = useMessagingUnread().data ?? 0;

  return (
    // Keyed by session so a new sign-in never sees the previous user's chat or draft.
    <MealPlannerProvider key={token ?? 'guest'}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.item,
        tabBarStyle: [
          styles.bar,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            height: 54 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 4),
            display: hidden ? 'none' : 'flex',
          },
        ],
      }}>
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Trang chủ',
          tabBarAccessibilityLabel: 'Trang chủ, Khám phá',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={{ ios: focused ? 'house.fill' : 'house', android: 'home', web: 'home' }} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Thực đơn của tôi',
          tabBarAccessibilityLabel: 'Thực đơn của tôi',
          tabBarIcon: ({ color }) => (
            <TabIcon name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Trợ lý Vedora',
          tabBarAccessibilityLabel: 'Trợ lý Vedora',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.aiIcon, focused && { backgroundColor: theme.secondary, borderColor: theme.primary, borderWidth: 1 }]}>
              <SproutPet size={30} accessible={false} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Tin nhắn',
          tabBarAccessibilityLabel: unread > 0 ? `Tin nhắn, ${unread} chưa đọc` : 'Tin nhắn',
          tabBarBadge: token && unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.destructive, color: '#fff', fontSize: 10 },
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={{ ios: focused ? 'bubble.left.and.bubble.right.fill' : 'bubble.left.and.bubble.right', android: 'chat', web: 'chat' }} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Tôi',
          tabBarAccessibilityLabel: 'Tôi, tài khoản',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={{ ios: focused ? 'person.crop.circle.fill' : 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} color={color} />
          ),
        }}
      />
    </Tabs>
    </MealPlannerProvider>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    paddingTop: 4,
    elevation: 6,
    shadowColor: '#14261a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },
  item: { justifyContent: 'center' },
  aiIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
