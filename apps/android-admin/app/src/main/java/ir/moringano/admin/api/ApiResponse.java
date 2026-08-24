package ir.moringano.admin.api;

public final class ApiResponse {
    public final int statusCode;
    public final String body;

    public ApiResponse(int statusCode, String body) {
        this.statusCode = statusCode;
        this.body = body == null ? "" : body;
    }
}
