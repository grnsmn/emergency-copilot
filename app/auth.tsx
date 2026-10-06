import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput } from "react-native";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { supabase } from "../lib/supabase";
import { colors, spacing, typography } from "../theme/theme";

export default function AuthScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    setError(null);
    setSending(true);
    const { error: signInError } = await supabase.auth.signInWithOtp({ email });
    setSending(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // TODO: add the OTP-entry screen once the passwordless flow is designed.
    // For now this placeholder only confirms the email was sent.
    setCodeSent(true);
  }

  return (
    <Screen>
      <Text style={styles.title}>{t("auth.title")}</Text>
      <Text style={styles.subtitle}>{t("auth.subtitle")}</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t("auth.emailPlaceholder")}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!codeSent}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {codeSent ? (
        <Text style={styles.confirmation}>{email}</Text>
      ) : (
        <Button
          label={t("auth.sendCode")}
          onPress={handleSendCode}
          loading={sending}
          disabled={!email}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.subtitle, color: colors.textMuted, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  error: { color: colors.danger, marginBottom: spacing.md },
  confirmation: { ...typography.body, color: colors.primary },
});
