import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import it from "../locales/it.json";

const deviceLanguage = getLocales()[0]?.languageCode ?? "en";
const supportedLanguages = ["it", "en"];
const fallbackLanguage = "en";

// eslint-disable-next-line import/no-named-as-default-member -- i18next's documented default-export API
void i18n.use(initReactI18next).init({
  resources: {
    it: { translation: it },
    en: { translation: en },
  },
  lng: supportedLanguages.includes(deviceLanguage) ? deviceLanguage : fallbackLanguage,
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
