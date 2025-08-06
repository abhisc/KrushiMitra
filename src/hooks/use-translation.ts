import { useLanguage } from "@/contexts/language-context";
import { translate } from "@/utils/translations";

export function useTranslation() {
  const { currentLanguage } = useLanguage();
  
  const t = (key: string): string => {
    return translate(key, currentLanguage.code);
  };
  
  return { t, currentLanguage };
} 