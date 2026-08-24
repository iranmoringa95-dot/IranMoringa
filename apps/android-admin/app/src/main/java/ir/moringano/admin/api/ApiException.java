package ir.moringano.admin.api;

public final class ApiException extends Exception {
    private final int statusCode;
    private final String code;

    public ApiException(int statusCode, String code, String message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code == null ? "UNKNOWN" : code;
    }

    public int getStatusCode() { return statusCode; }
    public String getCode() { return code; }
    public boolean isUnauthorized() { return statusCode == 401 || statusCode == 403; }
}
