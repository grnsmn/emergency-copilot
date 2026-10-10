import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "../components/ui/Button";
import { Screen } from "../components/ui/Screen";
import { supabase } from "../lib/supabase";
import { colors, radius, spacing, typography } from "../theme/theme";

const CODE_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Passwordless sign-in in two steps: email → 6-digit code sent by email.
// On success Supabase stores the session and the root layout's guards
// redirect to the app on their own.
export default function AuthScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  async function sendCode() {
    setError(null);
    setBusy(true);
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
    });
    setBusy(false);

    if (sendError) {
      console.warn("[auth] signInWithOtp failed", sendError);
      setError(
        sendError.status === 429
          ? t("auth.errors.tooManyRequests")
          : t("auth.errors.sendFailed"),
      );
      return;
    }

    setCode("");
    setStep("code");
  }

  async function verifyCode() {
    setError(null);
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type: "email",
    });
    setBusy(false);

    if (verifyError) {
      console.warn("[auth] verifyOtp failed", verifyError);
      setError(t("auth.errors.invalidCode"));
    }
  }

  function changeEmail() {
    setError(null);
    setCode("");
    setStep("email");
  }

  return (
    <Screen>
      <Text style={styles.title}>{t("auth.title")}</Text>

      {step === "email" ? (
        <>
          <Text style={styles.subtitle}>{t("auth.subtitle")}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={sendCode}
            placeholder={t("auth.emailPlaceholder")}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={t("auth.sendCode")}
            onPress={sendCode}
            loading={busy}
            disabled={!EMAIL_PATTERN.test(normalizedEmail)}
          />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            {t("auth.codeSent", { email: normalizedEmail })}
          </Text>
          <TextInput
            value={code}
            onChangeText={(value) =>
              setCode(value.replace(/\D/g, "").slice(0, CODE_LENGTH))
            }
            onSubmitEditing={verifyCode}
            placeholder={t("auth.codePlaceholder")}
            placeholderTextColor={colors.textMuted}
            autoComplete="one-time-code"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={CODE_LENGTH}
            autoFocus
            style={[styles.input, styles.codeInput]}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={t("auth.verifyCode")}
            onPress={verifyCode}
            loading={busy}
            disabled={code.length !== CODE_LENGTH}
          />
          <View style={styles.secondaryActions}>
            <Button
              label={t("auth.resendCode")}
              onPress={sendCode}
              disabled={busy}
              variant="secondary"
            />
            <Button
              label={t("auth.changeEmail")}
              onPress={changeEmail}
              disabled={busy}
              variant="secondary"
            />
          </View>
        </>
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
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  codeInput: { fontSize: 24, letterSpacing: 8, textAlign: "center" },
  error: { color: colors.danger, marginBottom: spacing.md },
  secondaryActions: { gap: spacing.sm, marginTop: spacing.md },
});
