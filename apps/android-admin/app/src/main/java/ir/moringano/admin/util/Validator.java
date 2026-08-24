package ir.moringano.admin.util;

import java.net.URI;

import ir.moringano.admin.BuildConfig;

public final class Validator {
    private Validator() {}

    public static boolean isIranianMobile(String input) {
        String value = PersianFormatter.normalizeDigits(input).replaceAll("[\\s-]", "");
        return value.matches("^(?:\\+98|0098|98|0)?9\\d{9}$");
    }

    public static String normalizeBaseUrl(String input) {
        String value = input == null ? "" : input.trim();
        while (value.endsWith("/")) value = value.substring(0, value.length() - 1);
        try {
            URI uri = URI.create(value);
            boolean schemeAllowed = "https".equalsIgnoreCase(uri.getScheme()) || (BuildConfig.DEBUG && "http".equalsIgnoreCase(uri.getScheme()));
            if (!schemeAllowed || uri.getHost() == null) return null;
            return value;
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
