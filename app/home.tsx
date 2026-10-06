import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

import { Screen } from "../components/ui/Screen";
import { colors, spacing, typography } from "../theme/theme";

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Text style={styles.title}>{t("home.title")}</Text>
      <Text style={styles.emptyState}>{t("home.emptyState")}</Text>
      <Link href="/documents" style={styles.link}>
        {t("home.uploadCta")}
      </Link>
      <Link href="/emergency-card" style={styles.link}>
        {t("emergencyCard.title")}
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.md },
  emptyState: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  link: { ...typography.label, color: colors.primary, marginBottom: spacing.md },
});
