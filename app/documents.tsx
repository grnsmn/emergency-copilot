import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { colors, spacing, typography } from "../theme/theme";

export default function DocumentsScreen() {
  const { t } = useTranslation();

  // TODO: list documents from `public.documents` and wire up upload
  // (Supabase Storage `documents` bucket) once the upload flow lands.
  return (
    <Screen>
      <Text style={styles.title}>{t("documents.title")}</Text>
      <Text style={styles.emptyState}>{t("home.emptyState")}</Text>
      <Button label={t("home.uploadCta")} onPress={() => {}} disabled />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.md },
  emptyState: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
});
