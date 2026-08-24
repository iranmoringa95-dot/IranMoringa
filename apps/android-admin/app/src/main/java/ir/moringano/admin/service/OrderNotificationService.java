package ir.moringano.admin.service;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import ir.moringano.admin.R;
import ir.moringano.admin.api.ApiClient;
import ir.moringano.admin.auth.SessionStore;
import ir.moringano.admin.ui.OrderDetailActivity;
import ir.moringano.admin.util.PersianFormatter;

public final class OrderNotificationService extends Service {
    private static final String ORDERS_CHANNEL = "new_orders";
    private static final String SERVICE_CHANNEL = "order_connection";
    private static final int SERVICE_NOTIFICATION_ID = 7100;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private volatile HttpURLConnection activeConnection;

    public static void start(Context context) {
        Intent intent = new Intent(context, OrderNotificationService.class);
        context.startForegroundService(intent);
    }

    public static void stop(Context context) {
        context.stopService(new Intent(context, OrderNotificationService.class));
    }

    public static void restart(Context context) {
        stop(context);
        start(context);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannels();
        startForeground(SERVICE_NOTIFICATION_ID, connectionNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        SessionStore store = ApiClient.get().sessionStore();
        if (!store.hasSession() || !store.notificationsEnabled()) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (running.compareAndSet(false, true)) executor.execute(this::connectionLoop);
        return START_STICKY;
    }

    private void connectionLoop() {
        long retryDelay = 2_000L;
        while (running.get()) {
            try {
                readEventStream();
                retryDelay = 2_000L;
            } catch (Exception ignored) {
                closeConnection();
                if (!running.get()) break;
                try { Thread.sleep(retryDelay); } catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); break; }
                retryDelay = Math.min(30_000L, retryDelay * 2L);
            }
        }
    }

    private void readEventStream() throws Exception {
        HttpURLConnection connection = ApiClient.get().openEventStream("/admin/orders/notifications/stream");
        activeConnection = connection;
        int status = connection.getResponseCode();
        if (status == 401 || status == 403) {
            ApiClient.get().sessionStore().clearSession();
            stopSelf();
            return;
        }
        if (status < 200 || status >= 300) throw new IllegalStateException("SSE HTTP " + status);
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
            String event = "";
            StringBuilder data = new StringBuilder();
            String line;
            while (running.get() && (line = reader.readLine()) != null) {
                if (line.isEmpty()) {
                    if (data.length() > 0) handleEvent(event, data.toString());
                    event = "";
                    data.setLength(0);
                } else if (line.startsWith("event:")) {
                    event = line.substring(6).trim();
                } else if (line.startsWith("data:")) {
                    if (data.length() > 0) data.append('\n');
                    data.append(line.substring(5).trim());
                }
            }
        } finally {
            closeConnection();
        }
    }

    private void handleEvent(String eventName, String rawData) {
        if (!"order_notification".equals(eventName)) return;
        try {
            JSONObject data = new JSONObject(rawData);
            if (!"order_created".equals(data.optString("event"))) return;
            String orderId = data.optString("order_id");
            String orderNumber = data.optString("order_number");
            String createdAt = data.optString("created_at");
            String eventKey = orderId + "|" + createdAt;
            SessionStore store = ApiClient.get().sessionStore();
            if (eventKey.equals(store.getLastEventKey())) return;
            store.setLastEventKey(eventKey);
            showOrderNotification(
                    orderId,
                    orderNumber,
                    data.optString("customer", "مشتری"),
                    data.optLong("total_irr", 0L));
        } catch (Exception ignored) {
            // Invalid server event is discarded and the stream remains alive.
        }
    }

    private void showOrderNotification(String orderId, String orderNumber, String customer, long totalIrr) {
        Intent detailIntent = new Intent(this, OrderDetailActivity.class);
        detailIntent.putExtra(OrderDetailActivity.EXTRA_ORDER_ID, orderId);
        detailIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                orderId.hashCode(),
                detailIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new Notification.Builder(this, ORDERS_CHANNEL)
                .setSmallIcon(R.drawable.ic_app)
                .setContentTitle("سفارش جدید " + PersianFormatter.digits(orderNumber))
                .setContentText(customer + " — " + PersianFormatter.toman(totalIrr))
                .setStyle(new Notification.BigTextStyle().bigText("سفارش جدید از " + customer + " به مبلغ " + PersianFormatter.toman(totalIrr) + " ثبت شد."))
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_MESSAGE)
                .build();
        getSystemService(NotificationManager.class).notify(7200 + Math.abs(orderId.hashCode() % 1000), notification);
    }

    private Notification connectionNotification() {
        Intent appIntent = new Intent(this, ir.moringano.admin.ui.MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, appIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this, SERVICE_CHANNEL)
                .setSmallIcon(R.drawable.ic_app)
                .setContentTitle(getString(R.string.notification_service_title))
                .setContentText(getString(R.string.notification_service_text))
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setCategory(Notification.CATEGORY_SERVICE)
                .build();
    }

    private void createChannels() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        NotificationChannel orders = new NotificationChannel(ORDERS_CHANNEL, getString(R.string.notification_channel_orders), NotificationManager.IMPORTANCE_HIGH);
        orders.enableVibration(true);
        orders.setDescription("اعلان فوری هنگام ثبت سفارش جدید");
        manager.createNotificationChannel(orders);
        NotificationChannel service = new NotificationChannel(SERVICE_CHANNEL, getString(R.string.notification_channel_service), NotificationManager.IMPORTANCE_LOW);
        service.setSound(null, null);
        service.enableVibration(false);
        manager.createNotificationChannel(service);
    }

    private void closeConnection() {
        HttpURLConnection connection = activeConnection;
        activeConnection = null;
        if (connection != null) connection.disconnect();
    }

    @Override
    public void onDestroy() {
        running.set(false);
        closeConnection();
        executor.shutdownNow();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
