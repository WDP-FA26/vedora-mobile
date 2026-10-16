import { Tabs, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarVisibilityStore } from '@/features/navigation/stores/tab-bar-visibility-store';
import { useTheme } from '@/hooks/use-theme';

type TabIconName = Extract<ComponentProps<typeof SymbolView>['name'], object>;

function TabIcon({ name, color, highlighted = false }: { name: TabIconName; color: ColorValue; highlighted?: boolean }) {
  if (highlighted) {
    return (
      <View style={styles.aiIcon}>
        <SymbolView name={name} size={23} tintColor="#fffefa" />
      </View>
    );
  }
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

  return (
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
        name="recipes"
        options={{
          title: 'Công thức',
          tabBarAccessibilityLabel: 'Công thức',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={{ ios: focused ? 'book.closed.fill' : 'book.closed', android: 'menu_book', web: 'menu_book' }} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Vedora AI',
          tabBarAccessibilityLabel: 'Vedora AI',
          tabBarIcon: ({ color }) => (
            <TabIcon name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} color={color} highlighted />
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Lên thực đơn',
          tabBarAccessibilityLabel: 'Lên thực đơn',
          tabBarIcon: ({ color }) => (
            <TabIcon name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} color={color} />
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
  aiIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#255d32' },
});
