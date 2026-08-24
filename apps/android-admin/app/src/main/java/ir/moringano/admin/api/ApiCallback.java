package ir.moringano.admin.api;

public interface ApiCallback<T> {
    void onSuccess(T value);
    void onError(ApiException error);
}
