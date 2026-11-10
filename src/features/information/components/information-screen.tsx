import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { informationPages } from '../data/information-pages';

type Page = (typeof informationPages)[number];
const icons: Record<Page['slug'], SymbolViewProps['name']> = {
  terms: { ios: 'doc.text', android: 'description', web: 'description' },
  privacy: { ios: 'lock.shield', android: 'shield', web: 'shield' },
  community: { ios: 'person.2', android: 'groups', web: 'groups' },
  accessibility: { ios: 'accessibility', android: 'accessibility_new', web: 'accessibility_new' },
};

function InformationLayout({ title, children }: PropsWithChildren<{ title: string }>) {
  const theme = useTheme();
  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { borderColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace('/me')} style={({ pressed }) => [styles.back, { backgroundColor: theme.muted, opacity: pressed ? 0.7 : 1 }]}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.foreground} /></Pressable>
      <Text numberOfLines={2} accessibilityRole="header" style={[styles.headerTitle, { color: theme.foreground }]}>{title}</Text>
    </View>
    <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
  </SafeAreaView>;
}

function PageRow({ page }: { page: Page }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Đọc ${page.title}`} onPress={() => router.push({ pathname: '/about/[slug]', params: { slug: page.slug } })} style={({ pressed }) => [styles.pageRow, { borderColor: theme.border, backgroundColor: theme.card, opacity: pressed ? 0.75 : 1 }]}>
    <View style={[styles.icon, { backgroundColor: theme.secondary }]}><SymbolView name={icons[page.slug]} size={23} tintColor={theme.primary} /></View>
    <View style={styles.copy}><Text style={[styles.rowTitle, { color: theme.foreground }]}>{page.title}</Text><Text style={[styles.caption, { color: theme.mutedForeground }]}>{page.description}</Text></View>
    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} tintColor={theme.mutedForeground} />
  </Pressable>;
}

export function InformationEntry() {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel="Thông tin Vedora: Điều khoản, Quyền riêng tư, Tiêu chuẩn cộng đồng và Trợ năng" onPress={() => router.push('/about')} style={({ pressed }) => [styles.entry, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.75 : 1 }]}>
    <View style={[styles.icon, { backgroundColor: theme.muted }]}><SymbolView name={{ ios: 'info.circle', android: 'info', web: 'info' }} size={23} tintColor={theme.primary} /></View>
    <View style={styles.copy}><Text style={[styles.rowTitle, { color: theme.foreground }]}>Thông tin Vedora</Text><Text style={[styles.caption, { color: theme.mutedForeground }]}>Chính sách, cộng đồng & trợ năng</Text></View>
    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={18} tintColor={theme.mutedForeground} />
  </Pressable>;
}

export function InformationScreen() {
  const theme = useTheme();
  return <InformationLayout title="Thông tin Vedora">
    <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
      <View style={styles.heroRow}>
        <View style={styles.copy}><Text style={[styles.eyebrow, { color: theme.secondaryForeground }]}>HIỂU NHAU HƠN MỘT CHÚT</Text><Text accessibilityRole="header" style={[styles.heroTitle, { color: theme.foreground }]}>Cùng chăm chút{ '\n' }góc bếp xanh</Text></View>
        <View style={styles.stickerFrame}><Image source={require('@/assets/branding/avocado-sticker.png')} contentFit="contain" style={styles.sticker} accessible={false} /></View>
      </View>
      <Text style={[styles.body, { color: theme.secondaryForeground }]}>Những thông tin giúp bạn chia sẻ thoải mái và sử dụng Vedora chủ động hơn.</Text>
    </View>
    <View style={styles.sectionIntro}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.foreground }]}>Bạn muốn tìm hiểu gì?</Text><Text style={[styles.caption, { color: theme.mutedForeground }]}>Chọn một mục để đọc chi tiết.</Text></View>
    <View style={styles.list}>{informationPages.map((page) => <PageRow key={page.slug} page={page} />)}</View>
    <View style={styles.brandFooter}><Image source={require('@/assets/branding/carrot-sticker.png')} contentFit="contain" style={styles.footerSticker} accessible={false} /><Text style={[styles.caption, { color: theme.mutedForeground }]}>Vedora · Sống xanh có ý thức</Text></View>
  </InformationLayout>;
}

export function InformationDetailScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = informationPages.find((item) => item.slug === slug);
  if (!page) return <InformationLayout title="Thông tin Vedora"><View style={styles.sectionIntro}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.foreground }]}>Không tìm thấy trang</Text><Text style={[styles.body, { color: theme.mutedForeground }]}>Vui lòng mở lại từ mục Thông tin Vedora.</Text></View><InformationEntry /></InformationLayout>;
  return <InformationArticle key={page.slug} page={page} />;
}

function InformationArticle({ page }: { page: Page }) {
  const theme = useTheme();
  return <InformationLayout title={page.shortTitle}>
    <View style={[styles.articleHero, { backgroundColor: theme.secondary }]}>
      <View style={[styles.icon, { backgroundColor: theme.card }]}><SymbolView name={icons[page.slug]} size={26} tintColor={theme.primary} /></View>
      <Text accessibilityRole="header" style={[styles.heroTitle, { color: theme.foreground }]}>{page.title}</Text>
      <Text style={[styles.body, { color: theme.secondaryForeground }]}>{page.intro}</Text>
      <Text style={[styles.caption, { color: theme.secondaryForeground }]}>{page.sections.length} mục · Nội dung tiếng Việt</Text>
    </View>
    <View style={[styles.article, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {page.sections.map((section, index) => <View key={section.title} style={[styles.articleSection, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, paddingTop: 22 }]}>
        <View style={styles.sectionHeading}><Text style={[styles.number, { color: theme.primary, backgroundColor: theme.secondary }]}>{String(index + 1).padStart(2, '0')}</Text><Text accessibilityRole="header" style={[styles.sectionTitle, styles.flex, { color: theme.foreground }]}>{section.title}</Text></View>
        {section.paragraphs.map((paragraph) => <Text key={paragraph} selectable style={[styles.body, { color: theme.foreground }]}>{paragraph}</Text>)}
      </View>)}
    </View>
    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.foreground }]}>Tìm hiểu thêm</Text>
    <View style={styles.list}>{informationPages.filter((item) => item.slug !== page.slug).map((item) => <PageRow key={item.slug} page={item} />)}</View>
    <Text style={[styles.endNote, styles.caption, { color: theme.mutedForeground }]}>Cảm ơn bạn đã cùng xây dựng một cộng đồng Vedora tử tế.</Text>
  </InformationLayout>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 72, paddingHorizontal: Spacing.three, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 44, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 16, paddingBottom: 32, gap: 20 },
  hero: { borderRadius: Radius['4xl'], padding: 20, gap: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroTitle: { fontFamily: Fonts.headingBold, fontSize: 24, lineHeight: 35 },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 10, lineHeight: 16, letterSpacing: 1 },
  stickerFrame: { width: 72, height: 92, borderRadius: 36, backgroundColor: BrandColors.cream, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '7deg' }] },
  sticker: { width: 62, height: 82 },
  flex: { flex: 1, minWidth: 0 },
  copy: { flex: 1, minWidth: 0, gap: 5 },
  body: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 27 },
  caption: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  sectionIntro: { gap: 5 },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 27 },
  list: { gap: 10 },
  pageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderRadius: Radius['3xl'], minHeight: 96 },
  entry: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderRadius: Radius['2xl'], minHeight: 80 },
  rowTitle: { fontFamily: Fonts.sansBold, fontSize: 16, lineHeight: 24 },
  icon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  brandFooter: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  footerSticker: { width: 40, height: 50 },
  articleHero: { padding: 22, borderRadius: Radius['4xl'], gap: 12 },
  article: { borderWidth: 1, borderRadius: Radius['3xl'], padding: 20, gap: 22 },
  articleSection: { gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  number: { fontFamily: Fonts.sansBold, fontSize: 12, lineHeight: 22, minWidth: 32, paddingHorizontal: 6, paddingVertical: 2, textAlign: 'center', borderRadius: 8, overflow: 'hidden' },
  endNote: { textAlign: 'center', paddingVertical: 8 },
});
