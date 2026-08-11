import { useCallback } from "react";
import { useAppSettings } from "./app-settings";
import { useI18n } from "./i18n";
import { formatMoney } from "./bookings";

export function useMoney() {
  const { settings } = useAppSettings();
  const { locale } = useI18n();
  const currency = settings.currency;
  const money = useCallback(
    (value: number) => formatMoney(value, locale, currency),
    [locale, currency],
  );
  return { money, currency };
}
