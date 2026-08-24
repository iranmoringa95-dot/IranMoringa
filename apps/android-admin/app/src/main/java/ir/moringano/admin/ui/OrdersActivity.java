package ir.moringano.admin.ui;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;

import org.json.JSONException;

import java.util.List;

import ir.moringano.admin.R;
import ir.moringano.admin.api.ApiCallback;
import ir.moringano.admin.api.ApiException;
import ir.moringano.admin.api.ApiResponse;
import ir.moringano.admin.api.JsonMapper;
import ir.moringano.admin.model.Order;
import ir.moringano.admin.ui.adapter.OrderAdapter;

public final class OrdersActivity extends BaseActivity {
    private static final String[] STATUS_LABELS = {"همه وضعیت‌ها", "در انتظار پرداخت", "پرداخت شده", "در حال پردازش", "بسته‌بندی شده", "ارسال شده", "تحویل شده", "لغو شده", "بازگشت وجه"};
    private static final String[] STATUS_VALUES = {"", "pending_payment", "paid", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"};

    private final Handler debounceHandler = new Handler(Looper.getMainLooper());
    private final Runnable debouncedLoad = this::loadOrders;
    private OrderAdapter adapter;
    private EditText searchInput;
    private Spinner statusSpinner;
    private ProgressBar progress;
    private TextView errorText;
    private TextView emptyText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_orders);
        getWindow().getDecorView().setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        searchInput = findViewById(R.id.inputOrderSearch);
        statusSpinner = findViewById(R.id.spinnerOrderStatus);
        progress = findViewById(R.id.progressOrders);
        errorText = findViewById(R.id.textOrdersError);
        emptyText = findViewById(R.id.textOrdersEmpty);
        ListView list = findViewById(R.id.listOrders);
        adapter = new OrderAdapter(this);
        list.setAdapter(adapter);
        list.setOnItemClickListener((parent, view, position, id) -> openOrder(adapter.getItem(position).id));

        ArrayAdapter<String> statuses = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, STATUS_LABELS);
        statusSpinner.setAdapter(statuses);
        statusSpinner.setOnItemSelectedListener(new SimpleItemSelectedListener(this::loadOrders));

        searchInput.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                debounceHandler.removeCallbacks(debouncedLoad);
                debounceHandler.postDelayed(debouncedLoad, 450L);
            }
            @Override public void afterTextChanged(Editable s) {}
        });

        findViewById(R.id.buttonBackOrders).setOnClickListener(view -> finish());
        findViewById(R.id.buttonNewOrder).setOnClickListener(view -> startActivity(new Intent(this, CreateOrderActivity.class)));
        findViewById(R.id.buttonRefreshOrders).setOnClickListener(view -> loadOrders());
        loadOrders();
    }

    @Override protected void onResume() {
        super.onResume();
        if (adapter != null && adapter.getCount() > 0) loadOrders();
    }

    private void loadOrders() {
        String query = value(searchInput);
        String status = STATUS_VALUES[Math.max(0, statusSpinner.getSelectedItemPosition())];
        StringBuilder endpoint = new StringBuilder("/admin/orders?page=1&page_size=100");
        if (!status.trim().isEmpty()) endpoint.append("&status=").append(status);
        if (!query.trim().isEmpty()) endpoint.append("&q=").append(Uri.encode(query));
        visible(progress, true);
        visible(errorText, false);
        api().get(endpoint.toString(), new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse response) {
                visible(progress, false);
                try {
                    List<Order> orders = JsonMapper.orders(response.body);
                    adapter.replace(orders);
                    visible(emptyText, orders.isEmpty());
                } catch (JSONException exception) {
                    showInlineError("فرمت فهرست سفارش‌های سرور معتبر نیست.");
                }
            }
            @Override public void onError(ApiException error) {
                visible(progress, false);
                if (error.isUnauthorized()) showError(error); else showInlineError(error.getMessage());
            }
        });
    }

    private void showInlineError(String message) {
        errorText.setText(message);
        visible(errorText, true);
    }

    private void openOrder(String orderId) {
        Intent intent = new Intent(this, OrderDetailActivity.class);
        intent.putExtra(OrderDetailActivity.EXTRA_ORDER_ID, orderId);
        startActivity(intent);
    }
}


