package ir.moringano.admin.ui;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import org.json.JSONException;

import ir.moringano.admin.R;
import ir.moringano.admin.api.ApiCallback;
import ir.moringano.admin.api.ApiException;
import ir.moringano.admin.api.ApiResponse;
import ir.moringano.admin.api.JsonMapper;
import ir.moringano.admin.model.DashboardStats;
import ir.moringano.admin.service.OrderNotificationService;
import ir.moringano.admin.util.PersianFormatter;

public final class MainActivity extends BaseActivity {
    private TextView connectionStatus;
    private TextView totalOrders;
    private TextView pendingOrders;
    private TextView totalSales;
    private ProgressBar progress;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (!api().sessionStore().hasSession()) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }
        setContentView(R.layout.activity_main);
        getWindow().getDecorView().setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        connectionStatus = findViewById(R.id.textConnectionStatus);
        totalOrders = findViewById(R.id.textTotalOrders);
        pendingOrders = findViewById(R.id.textPendingOrders);
        totalSales = findViewById(R.id.textTotalSales);
        progress = findViewById(R.id.progressDashboard);

        findViewById(R.id.buttonRefreshDashboard).setOnClickListener(view -> loadDashboard());
        findViewById(R.id.buttonOrders).setOnClickListener(view -> startActivity(new Intent(this, OrdersActivity.class)));
        findViewById(R.id.buttonCreateOrder).setOnClickListener(view -> startActivity(new Intent(this, CreateOrderActivity.class)));
        findViewById(R.id.buttonSettings).setOnClickListener(view -> startActivity(new Intent(this, SettingsActivity.class)));

        requestNotificationPermission();
        loadDashboard();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (api().sessionStore().notificationsEnabled() && api().sessionStore().hasSession()) {
            OrderNotificationService.start(this);
        } else {
            OrderNotificationService.stop(this);
        }
    }

    private void loadDashboard() {
        visible(progress, true);
        connectionStatus.setText("در حال دریافت اطلاعات…");
        api().get("/admin/dashboard/stats", new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse response) {
                visible(progress, false);
                try {
                    showStats(JsonMapper.stats(response.body));
                    connectionStatus.setText("متصل به " + api().sessionStore().getApiUrl());
                    connectionStatus.setTextColor(getColor(R.color.primary));
                } catch (JSONException exception) {
                    connectionStatus.setText("پاسخ سرور قابل خواندن نیست.");
                    connectionStatus.setTextColor(getColor(R.color.danger));
                }
            }
            @Override public void onError(ApiException error) {
                visible(progress, false);
                if (error.isUnauthorized()) showError(error);
                else {
                    connectionStatus.setText(error.getMessage());
                    connectionStatus.setTextColor(getColor(R.color.danger));
                }
            }
        });
    }

    private void showStats(DashboardStats stats) {
        totalOrders.setText(PersianFormatter.digits(String.valueOf(stats.totalOrders)));
        pendingOrders.setText(PersianFormatter.digits(String.valueOf(stats.pendingOrders)));
        totalSales.setText(PersianFormatter.toman(stats.totalSalesIrr));
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 4001);
        }
    }
}
