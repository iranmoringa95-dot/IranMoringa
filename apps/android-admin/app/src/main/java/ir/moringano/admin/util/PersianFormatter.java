package ir.moringano.admin.util;

import java.text.NumberFormat;
import java.util.Locale;

public final class PersianFormatter {
    private static final char[] PERSIAN_DIGITS = {'۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'};

    private PersianFormatter() {}

    public static String toman(long irr) {
        return NumberFormat.getIntegerInstance(Locale.forLanguageTag("fa-IR")).format(irr / 10L) + " تومان";
    }

    public static String digits(String input) {
        if (input == null) return "";
        StringBuilder result = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char value = input.charAt(i);
            result.append(value >= '0' && value <= '9' ? PERSIAN_DIGITS[value - '0'] : value);
        }
        return result.toString();
    }

    public static String normalizeDigits(String input) {
        if (input == null) return "";
        StringBuilder result = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char value = input.charAt(i);
            if (value >= '۰' && value <= '۹') value = (char) ('0' + value - '۰');
            else if (value >= '٠' && value <= '٩') value = (char) ('0' + value - '٠');
            result.append(value);
        }
        return result.toString();
    }

    public static long parseTomanToIrr(String input) {
        String normalized = normalizeDigits(input).replaceAll("[^0-9]", "");
        if (normalized.isEmpty()) return 0L;
        return Math.multiplyExact(Long.parseLong(normalized), 10L);
    }
}
