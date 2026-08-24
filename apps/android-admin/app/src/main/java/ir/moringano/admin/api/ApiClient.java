package ir.moringano.admin.api;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import ir.moringano.admin.auth.SessionStore;

public final class ApiClient {
    private static volatile ApiClient instance;

    private final SessionStore sessionStore;
    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private ApiClient(Context context, SessionStore sessionStore) {
        this.sessionStore = sessionStore;
    }

    public static void initialize(Context context, SessionStore sessionStore) {
        if (instance == null) {
            synchronized (ApiClient.class) {
                if (instance == null) instance = new ApiClient(context.getApplicationContext(), sessionStore);
            }
        }
    }

    public static ApiClient get() {
        if (instance == null) throw new IllegalStateException("ApiClient is not initialized");
        return instance;
    }

    public SessionStore sessionStore() {
        return sessionStore;
    }

    public String url(String endpoint) {
        String base = sessionStore.getApiUrl();
        return base + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
    }

    public void get(String endpoint, ApiCallback<ApiResponse> callback) {
        request("GET", endpoint, null, Collections.emptyMap(), callback);
    }

    public void post(String endpoint, JSONObject body, ApiCallback<ApiResponse> callback) {
        request("POST", endpoint, body, Collections.emptyMap(), callback);
    }

    public void post(String endpoint, JSONObject body, Map<String, String> headers, ApiCallback<ApiResponse> callback) {
        request("POST", endpoint, body, headers, callback);
    }

    public void patch(String endpoint, JSONObject body, ApiCallback<ApiResponse> callback) {
        request("PATCH", endpoint, body, Collections.emptyMap(), callback);
    }

    public void request(String method, String endpoint, JSONObject body, Map<String, String> extraHeaders, ApiCallback<ApiResponse> callback) {
        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = openConnection(url(endpoint), method);
                for (Map.Entry<String, String> header : extraHeaders.entrySet()) {
                    connection.setRequestProperty(header.getKey(), header.getValue());
                }
                if (body != null) {
                    byte[] payload = body.toString().getBytes(StandardCharsets.UTF_8);
                    connection.setDoOutput(true);
                    connection.setFixedLengthStreamingMode(payload.length);
                    connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                    try (OutputStream stream = connection.getOutputStream()) {
                        stream.write(payload);
                    }
                }

                int statusCode = connection.getResponseCode();
                captureSessionCookie(connection);
                String responseBody = readBody(statusCode >= 400 ? connection.getErrorStream() : connection.getInputStream());
                if (statusCode >= 200 && statusCode < 300) {
                    deliverSuccess(callback, new ApiResponse(statusCode, responseBody));
                } else {
                    if (statusCode == 401) sessionStore.clearSession();
                    deliverError(callback, JsonMapper.apiError(statusCode, responseBody));
                }
            } catch (Exception exception) {
                deliverError(callback, new ApiException(0, "NETWORK_ERROR", readableNetworkError(exception)));
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    public HttpURLConnection openEventStream(String endpoint) throws IOException {
        HttpURLConnection connection = openConnection(url(endpoint), "GET");
        connection.setRequestProperty("Accept", "text/event-stream");
        connection.setReadTimeout(45_000);
        return connection;
    }

    private HttpURLConnection openConnection(String target, String method) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(target).openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(15_000);
        connection.setReadTimeout(25_000);
        connection.setUseCaches(false);
        connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("Accept-Language", "fa-IR");
        connection.setRequestProperty("User-Agent", "Moringano-Android-Admin/1.0");
        String cookie = sessionStore.getSessionCookie();
        if (cookie != null && !cookie.trim().isEmpty()) connection.setRequestProperty("Cookie", cookie);
        return connection;
    }

    private void captureSessionCookie(HttpURLConnection connection) {
        for (Map.Entry<String, List<String>> header : connection.getHeaderFields().entrySet()) {
            if (header.getKey() == null || !"set-cookie".equalsIgnoreCase(header.getKey())) continue;
            for (String value : header.getValue()) {
                int start = value.toLowerCase(Locale.ROOT).indexOf("session_token=");
                if (start >= 0) {
                    int end = value.indexOf(';', start);
                    sessionStore.saveSessionCookie(end < 0 ? value.substring(start) : value.substring(start, end));
                    return;
                }
                start = value.toLowerCase(Locale.ROOT).indexOf("moringa_auth_session=");
                if (start >= 0) {
                    int end = value.indexOf(';', start);
                    sessionStore.saveSessionCookie(end < 0 ? value.substring(start) : value.substring(start, end));
                    return;
                }
            }
        }
    }

    private static String readBody(InputStream input) throws IOException {
        if (input == null) return "";
        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) result.append(line).append('\n');
        }
        return result.toString().trim();
    }

    private static String readableNetworkError(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.trim().isEmpty()) return "ارتباط با سرور برقرار نشد.";
        if (message.toLowerCase(Locale.ROOT).contains("timeout")) return "زمان پاسخ‌گویی سرور به پایان رسید.";
        return "ارتباط با سرور برقرار نشد: " + message;
    }

    private <T> void deliverSuccess(ApiCallback<T> callback, T value) {
        mainHandler.post(() -> callback.onSuccess(value));
    }

    private void deliverError(ApiCallback<?> callback, ApiException error) {
        mainHandler.post(() -> callback.onError(error));
    }
}

