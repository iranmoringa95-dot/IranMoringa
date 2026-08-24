package ir.moringano.admin.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

import ir.moringano.admin.R;
import ir.moringano.admin.api.ApiCallback;
import ir.moringano.admin.api.ApiException;
import ir.moringano.admin.api.ApiResponse;
import ir.moringano.admin.util.PersianFormatter;
import ir.moringano.admin.util.Validator;

public final class LoginActivity extends BaseActivity {
    private EditText phoneInput;
    private EditText otpInput;
    private LinearLayout otpPanel;
    private ProgressBar progress;
    private TextView statusText;
    private Button requestButton;
    private Button verifyButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        getWindow().getDecorView().setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        phoneInput = findViewById(R.id.inputPhone);
        otpInput = findViewById(R.id.inputOtp);
        otpPanel = findViewById(R.id.otpPanel);
        progress = findViewById(R.id.progressLogin);
        statusText = findViewById(R.id.textLoginStatus);
        requestButton = findViewById(R.id.buttonRequestOtp);
        verifyButton = findViewById(R.id.buttonVerifyOtp);

        requestButton.setOnClickListener(view -> requestOtp());
        verifyButton.setOnClickListener(view -> verifyOtp());
        findViewById(R.id.buttonLoginSettings).setOnClickListener(view -> startActivity(new Intent(this, SettingsActivity.class)));

        if (api().sessionStore().hasSession()) validateExistingSession();
    }

    private void validateExistingSession() {
        setBusy(true);
        api().get("/admin/dashboard/stats", new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse value) { openMain(); }
            @Override public void onError(ApiException error) {
                setBusy(false);
                if (error.isUnauthorized()) api().sessionStore().clearSession();
                else setStatus("اتصال خودکار ممکن نشد؛ می‌توانید دوباره تلاش کنید.", true);
            }
        });
    }

    private void requestOtp() {
        String phone = PersianFormatter.normalizeDigits(value(phoneInput));
        if (!Validator.isIranianMobile(phone)) {
            setStatus("شماره موبایل ایرانی معتبر وارد کنید.", true);
            return;
        }
        try {
            JSONObject body = new JSONObject().put("phone", phone);
            setBusy(true);
            api().post("/auth/otp/request", body, new ApiCallback<>() {
                @Override public void onSuccess(ApiResponse value) {
                    setBusy(false);
                    visible(otpPanel, true);
                    otpInput.requestFocus();
                    setStatus("کد ورود ارسال شد و تا دو دقیقه معتبر است.", false);
                }
                @Override public void onError(ApiException error) {
                    setBusy(false);
                    setStatus(error.getMessage(), true);
                }
            });
        } catch (JSONException exception) {
            setStatus("آماده‌سازی درخواست ناموفق بود.", true);
        }
    }

    private void verifyOtp() {
        String phone = PersianFormatter.normalizeDigits(value(phoneInput));
        String code = PersianFormatter.normalizeDigits(value(otpInput)).replaceAll("\\D", "");
        if (code.length() != 6) {
            setStatus("کد ورود باید شش رقم باشد.", true);
            return;
        }
        try {
            JSONObject body = new JSONObject().put("phone", phone).put("code", code);
            setBusy(true);
            api().post("/auth/otp/verify", body, new ApiCallback<>() {
                @Override public void onSuccess(ApiResponse value) { verifyAdminAccess(); }
                @Override public void onError(ApiException error) {
                    setBusy(false);
                    setStatus(error.getMessage(), true);
                }
            });
        } catch (JSONException exception) {
            setStatus("آماده‌سازی درخواست ناموفق بود.", true);
        }
    }

    private void verifyAdminAccess() {
        if (!api().sessionStore().hasSession()) {
            setBusy(false);
            setStatus("سرور نشست امن صادر نکرد. تنظیمات احراز هویت API را بررسی کنید.", true);
            return;
        }
        api().get("/admin/dashboard/stats", new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse value) { openMain(); }
            @Override public void onError(ApiException error) {
                setBusy(false);
                api().sessionStore().clearSession();
                setStatus(error.isUnauthorized() ? "این شماره مجوز مدیریت سفارش‌ها را ندارد." : error.getMessage(), true);
            }
        });
    }

    private void openMain() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void setBusy(boolean busy) {
        visible(progress, busy);
        requestButton.setEnabled(!busy);
        verifyButton.setEnabled(!busy);
    }

    private void setStatus(String message, boolean error) {
        statusText.setText(message);
        statusText.setTextColor(getColor(error ? R.color.danger : R.color.primary));
    }
}

