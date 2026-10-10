import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { useSession } from "../lib/session";
import { colors, spacing, typography } from "../theme/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { session, signOut } = useSession();

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
      <View style={styles.footer}>
        <Text style={styles.account}>{session?.user.email}</Text>
        <Button label={t("auth.signOut")} onPress={signOut} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.md },
  emptyState: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  link: { ...typography.label, color: colors.primary, marginBottom: spacing.md },
  footer: { marginTop: "auto", gap: spacing.sm },
  account: { ...typography.body, color: colors.textMuted, textAlign: "center" },
});
