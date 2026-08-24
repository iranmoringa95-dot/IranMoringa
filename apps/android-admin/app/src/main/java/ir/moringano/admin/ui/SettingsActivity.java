package ir.moringano.admin.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Switch;
import android.widget.TextView;

import ir.moringano.admin.R;
import ir.moringano.admin.api.ApiCallback;
import ir.moringano.admin.api.ApiException;
import ir.moringano.admin.api.ApiResponse;
import ir.moringano.admin.service.OrderNotificationService;
import ir.moringano.admin.util.Validator;

public final class SettingsActivity extends BaseActivity {
    private EditText apiUrlInput;
    private Switch notificationsSwitch;
    private ProgressBar progress;
    private TextView statusText;
    private Button saveButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);
        getWindow().getDecorView().setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        apiUrlInput = findViewById(R.id.inputApiUrl);
        notificationsSwitch = findViewById(R.id.switchNotifications);
        progress = findViewById(R.id.progressSettings);
        statusText = findViewById(R.id.textSettingsStatus);
        saveButton = findViewById(R.id.buttonSaveApiUrl);

        apiUrlInput.setText(api().sessionStore().getApiUrl());
        notificationsSwitch.setChecked(api().sessionStore().notificationsEnabled());
        findViewById(R.id.buttonBackSettings).setOnClickListener(view -> finish());
        saveButton.setOnClickListener(view -> saveAndTest());
        notificationsSwitch.setOnCheckedChangeListener((button, checked) -> updateNotifications(checked));
        findViewById(R.id.buttonLogout).setOnClickListener(view -> logout());
    }

    private void saveAndTest() {
        String normalized = Validator.normalizeBaseUrl(value(apiUrlInput));
        if (normalized == null) {
            setStatus("آدرس API معتبر نیست. در نسخه انتشار فقط HTTPS پذیرفته می‌شود.", true);
            return;
        }
        api().sessionStore().setApiUrl(normalized);
        setBusy(true);
        String endpoint = api().sessionStore().hasSession() ? "/me" : "/catalog/categories";
        api().get(endpoint, new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse response) {
                setBusy(false);
                setStatus("اتصال موفق بود و آدرس ذخیره شد.", false);
                if (api().sessionStore().notificationsEnabled() && api().sessionStore().hasSession()) {
                    OrderNotificationService.restart(SettingsActivity.this);
                }
            }
            @Override public void onError(ApiException error) {
                setBusy(false);
                setStatus("آدرس ذخیره شد، اما تست اتصال ناموفق بود: " + error.getMessage(), true);
            }
        });
    }

    private void updateNotifications(boolean enabled) {
        api().sessionStore().setNotificationsEnabled(enabled);
        if (enabled && api().sessionStore().hasSession()) OrderNotificationService.start(this);
        else OrderNotificationService.stop(this);
    }

    private void logout() {
        setBusy(true);
        api().post("/auth/logout", null, new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse response) { finishLogout(); }
            @Override public void onError(ApiException error) { finishLogout(); }
        });
    }

    private void finishLogout() {
        api().sessionStore().clearSession();
        OrderNotificationService.stop(this);
        Intent intent = new Intent(this, LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void setBusy(boolean busy) {
        visible(progress, busy);
        saveButton.setEnabled(!busy);
    }

    private void setStatus(String message, boolean error) {
        statusText.setText(message);
        statusText.setTextColor(getColor(error ? R.color.danger : R.color.primary));
    }
}
