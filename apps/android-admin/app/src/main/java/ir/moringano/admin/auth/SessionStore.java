package ir.moringano.admin.auth;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

import ir.moringano.admin.BuildConfig;

public final class SessionStore {
    private static final String PREFS = "moringano_admin";
    private static final String KEY_ALIAS = "moringano_admin_session_v1";
    private static final String KEY_SESSION = "session";
    private static final String KEY_API_URL = "api_url";
    private static final String KEY_NOTIFICATIONS = "notifications";
    private static final String KEY_LAST_EVENT = "last_event";
    private static final String KEY_LAST_SERVER_TIME = "last_server_time";

    private final SharedPreferences preferences;

    public SessionStore(Context context) {
        preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public synchronized void saveSessionCookie(String sessionCookie) {
        if (sessionCookie == null || sessionCookie.trim().isEmpty()) return;
        preferences.edit().putString(KEY_SESSION, encrypt(sessionCookie)).apply();
    }

    public synchronized String getSessionCookie() {
        String encrypted = preferences.getString(KEY_SESSION, null);
        if (encrypted == null) return null;
        try {
            return decrypt(encrypted);
        } catch (RuntimeException exception) {
            clearSession();
            return null;
        }
    }

    public boolean hasSession() {
        String value = getSessionCookie();
        return value != null && !value.trim().isEmpty();
    }

    public void clearSession() {
        preferences.edit().remove(KEY_SESSION).apply();
    }

    public String getApiUrl() {
        return preferences.getString(KEY_API_URL, BuildConfig.DEFAULT_API_URL);
    }

    public void setApiUrl(String value) {
        preferences.edit().putString(KEY_API_URL, value).apply();
    }

    public boolean notificationsEnabled() {
        return preferences.getBoolean(KEY_NOTIFICATIONS, true);
    }

    public void setNotificationsEnabled(boolean enabled) {
        preferences.edit().putBoolean(KEY_NOTIFICATIONS, enabled).apply();
    }

    public String getLastEventKey() {
        return preferences.getString(KEY_LAST_EVENT, "");
    }

    public void setLastEventKey(String key) {
        preferences.edit().putString(KEY_LAST_EVENT, key == null ? "" : key).apply();
    }

    public String getLastServerTime() {
        return preferences.getString(KEY_LAST_SERVER_TIME, "");
    }

    public void setLastServerTime(String value) {
        preferences.edit().putString(KEY_LAST_SERVER_TIME, value == null ? "" : value).apply();
    }

    private String encrypt(String plaintext) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] iv = cipher.getIV();
            byte[] packed = new byte[1 + iv.length + ciphertext.length];
            packed[0] = (byte) iv.length;
            System.arraycopy(iv, 0, packed, 1, iv.length);
            System.arraycopy(ciphertext, 0, packed, 1 + iv.length, ciphertext.length);
            return Base64.encodeToString(packed, Base64.NO_WRAP);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to encrypt session", exception);
        }
    }

    private String decrypt(String encoded) {
        try {
            byte[] packed = Base64.decode(encoded, Base64.NO_WRAP);
            int ivLength = packed[0] & 0xff;
            if (ivLength < 12 || packed.length <= 1 + ivLength) throw new IllegalArgumentException("Invalid session data");
            byte[] iv = new byte[ivLength];
            byte[] ciphertext = new byte[packed.length - 1 - ivLength];
            System.arraycopy(packed, 1, iv, 0, ivLength);
            System.arraycopy(packed, 1 + ivLength, ciphertext, 0, ciphertext.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to decrypt session", exception);
        }
    }

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build());
        return generator.generateKey();
    }
}

