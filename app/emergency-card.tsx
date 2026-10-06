import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

import { Screen } from "../components/ui/Screen";
import { colors, spacing, typography } from "../theme/theme";

export default function EmergencyCardScreen() {
  const { t } = useTranslation();

  // TODO: render confirmed `public.extractions` + latest `public.summaries` for the current user.
  // This screen is patient-only in the MVP: no sharing, no clinician view.
  return (
    <Screen>
      <Text style={styles.title}>{t("emergencyCard.title")}</Text>
      <Text style={styles.subtitle}>{t("emergencyCard.subtitle")}</Text>
      <Text style={styles.emptyState}>{t("emergencyCard.emptyState")}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.subtitle, color: colors.textMuted, marginBottom: spacing.lg },
  emptyState: { ...typography.body, color: colors.textMuted },
});
