package ir.moringano.admin.ui;

import android.app.Activity;
import android.content.Intent;
import android.view.View;
import android.widget.EditText;
import android.widget.Toast;

import ir.moringano.admin.api.ApiClient;
import ir.moringano.admin.api.ApiException;

abstract class BaseActivity extends Activity {
    protected final ApiClient api() {
        return ApiClient.get();
    }

    protected void showError(ApiException error) {
        if (error.isUnauthorized()) {
            api().sessionStore().clearSession();
            Toast.makeText(this, "نشست شما پایان یافته است؛ دوباره وارد شوید.", Toast.LENGTH_LONG).show();
            Intent intent = new Intent(this, LoginActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            return;
        }
        Toast.makeText(this, error.getMessage(), Toast.LENGTH_LONG).show();
    }

    protected static String value(EditText input) {
        return input.getText() == null ? "" : input.getText().toString().trim();
    }

    protected static void visible(View view, boolean visible) {
        view.setVisibility(visible ? View.VISIBLE : View.GONE);
    }
}
