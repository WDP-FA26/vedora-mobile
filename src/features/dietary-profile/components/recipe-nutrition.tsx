import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nutritionPillars, type NutritionPillar } from '../types/nutrition-pillar.schema';
import { pillarLabels } from '../data/nutrition-labels';

export function RecipeNutrition({ caloriesPerServing, nutritionPillars: pillars }: { caloriesPerServing?: number | null; nutritionPillars?: NutritionPillar[] }) {
  const theme = useTheme();
  return <View style={styles.content}>
    <Text style={[styles.calories, { color: theme.mutedForeground }]}>{caloriesPerServing == null ? 'Chưa có kcal/suất' : `~${caloriesPerServing.toLocaleString('vi-VN')} kcal/suất`}</Text>
    {pillars?.length ? <View style={styles.pillars}>{nutritionPillars.filter((pillar) => pillars.includes(pillar)).map((pillar) => <View key={pillar} accessible accessibilityLabel={pillarLabels[pillar].label} style={[styles.pill, { backgroundColor: theme.secondary }]}><Text style={[styles.label, { color: theme.secondaryForeground }]}>{pillarLabels[pillar].short}</Text></View>)}</View> : null}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: 5 }, calories: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 18 },
  pillars: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  pill: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 11, lineHeight: 16 },
});
