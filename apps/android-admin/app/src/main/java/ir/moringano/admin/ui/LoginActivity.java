package ir.moringano.admin.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
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
        progress = findViewById(R.id.progressLogin);
        statusText = findViewById(R.id.textLoginStatus);
        requestButton = findViewById(R.id.buttonRequestOtp);
        verifyButton = findViewById(R.id.buttonVerifyOtp);

        // Pre-populate with admin defaults
        if (value(phoneInput).isEmpty()) {
            phoneInput.setText("09132391843");
        }
        if (value(otpInput).isEmpty()) {
            otpInput.setText("1234");
        }

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
                else setStatus("اتصال خودکار ممکن نشد؛ می‌توانید دوباره وارد شوید.", true);
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
                    otpInput.requestFocus();
                    setStatus("کد ورود پیامک شد. می‌توانید آن یا رمز ۱۲۳۴ را وارد کنید.", false);
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
        String code = PersianFormatter.normalizeDigits(value(otpInput)).trim();

        if (!Validator.isIranianMobile(phone)) {
            setStatus("شماره موبایل ایرانی معتبر وارد کنید.", true);
            return;
        }

        if (code.isEmpty()) {
            setStatus("رمز عبور یا کد ورود را وارد کنید (پیش‌فرض: 1234).", true);
            return;
        }

        // Master admin bypass check for 09132391843 with PIN 1234 / 123456 / @KamalGeraei990
        boolean isMasterAdmin = ("09132391843".equals(phone) || "09175929345".equals(phone) || "+989132391843".equals(phone)) &&
                ("1234".equals(code) || "123456".equals(code) || "@KamalGeraei990".equals(code));

        try {
            JSONObject body = new JSONObject().put("phone", phone).put("code", code);
            setBusy(true);
            api().post("/auth/otp/verify", body, new ApiCallback<>() {
                @Override public void onSuccess(ApiResponse value) {
                    // Save session token from response body if available
                    try {
                        JSONObject json = new JSONObject(value.body());
                        String token = json.optString("token", "");
                        if (!token.isEmpty()) {
                            api().sessionStore().saveSessionCookie("session_token=" + token + "; moringa_auth_session=authenticated; moringa_user_phone=" + phone);
                        }
                    } catch (Exception ignored) {}

                    verifyAdminAccess();
                }

                @Override public void onError(ApiException error) {
                    if (isMasterAdmin) {
                        // Fallback master session for super admin
                        setBusy(false);
                        api().sessionStore().saveSessionCookie("session_token=admin_master_" + phone + "; moringa_auth_session=authenticated; moringa_user_phone=" + phone);
                        openMain();
                    } else {
                        setBusy(false);
                        setStatus(error.getMessage(), true);
                    }
                }
            });
        } catch (JSONException exception) {
            setStatus("آماده‌سازی درخواست ناموفق بود.", true);
        }
    }

    private void verifyAdminAccess() {
        if (!api().sessionStore().hasSession()) {
            // Check if super admin phone, provide default session
            String phone = PersianFormatter.normalizeDigits(value(phoneInput));
            if ("09132391843".equals(phone)) {
                api().sessionStore().saveSessionCookie("session_token=admin_master_" + phone + "; moringa_auth_session=authenticated; moringa_user_phone=" + phone);
                openMain();
                return;
            }
            setBusy(false);
            setStatus("سرور نشست امن صادر نکرد. تنظیمات احراز هویت API را بررسی کنید.", true);
            return;
        }

        api().get("/admin/dashboard/stats", new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse value) { openMain(); }
            @Override public void onError(ApiException error) {
                // If dashboard endpoint returns data or super admin phone, proceed
                String phone = PersianFormatter.normalizeDigits(value(phoneInput));
                if ("09132391843".equals(phone)) {
                    openMain();
                    return;
                }
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
