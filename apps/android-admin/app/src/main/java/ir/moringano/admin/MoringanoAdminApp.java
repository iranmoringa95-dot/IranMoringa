package ir.moringano.admin;

import android.app.Application;
import android.content.res.Configuration;

import java.util.Locale;

import ir.moringano.admin.api.ApiClient;
import ir.moringano.admin.auth.SessionStore;

public final class MoringanoAdminApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        Locale.setDefault(Locale.forLanguageTag("fa-IR"));
        ApiClient.initialize(this, new SessionStore(this));
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Locale.setDefault(Locale.forLanguageTag("fa-IR"));
    }
}
