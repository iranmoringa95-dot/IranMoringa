package ir.moringano.admin.ui;

import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import ir.moringano.admin.R;
import ir.moringano.admin.api.ApiCallback;
import ir.moringano.admin.api.ApiException;
import ir.moringano.admin.api.ApiResponse;
import ir.moringano.admin.api.JsonMapper;
import ir.moringano.admin.model.Order;
import ir.moringano.admin.model.OrderItem;
import ir.moringano.admin.model.TimelineEvent;
import ir.moringano.admin.ui.adapter.OrderAdapter;
import ir.moringano.admin.util.PersianFormatter;

public final class OrderDetailActivity extends BaseActivity {
    public static final String EXTRA_ORDER_ID = "order_id";

    private final List<String> statusValues = new ArrayList<>();
    private final List<String> statusLabels = new ArrayList<>();
    private String orderId;
    private Order order;
    private ProgressBar progress;
    private TextView errorText;
    private TextView numberText;
    private TextView statusText;
    private TextView customerText;
    private TextView phoneText;
    private TextView addressText;
    private TextView financialsText;
    private LinearLayout itemsContainer;
    private LinearLayout timelineContainer;
    private Spinner statusSpinner;
    private EditText trackingInput;
    private EditText statusNoteInput;
    private EditText adminNoteInput;
    private Button updateButton;
    private Button noteButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        orderId = getIntent().getStringExtra(EXTRA_ORDER_ID);
        if (orderId == null || orderId.trim().isEmpty()) { finish(); return; }
        setContentView(R.layout.activity_order_detail);
        getWindow().getDecorView().setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        bindViews();
        findViewById(R.id.buttonBackDetail).setOnClickListener(view -> finish());
        findViewById(R.id.buttonRefreshDetail).setOnClickListener(view -> loadOrder());
        findViewById(R.id.buttonCallCustomer).setOnClickListener(view -> contact(Intent.ACTION_DIAL, "tel:"));
        findViewById(R.id.buttonSmsCustomer).setOnClickListener(view -> contact(Intent.ACTION_SENDTO, "smsto:"));
        updateButton.setOnClickListener(view -> confirmStatusChange());
        noteButton.setOnClickListener(view -> addNote());
        loadOrder();
    }

    private void bindViews() {
        progress = findViewById(R.id.progressDetail);
        errorText = findViewById(R.id.textDetailError);
        numberText = findViewById(R.id.textDetailOrderNumber);
        statusText = findViewById(R.id.textDetailStatus);
        customerText = findViewById(R.id.textDetailCustomer);
        phoneText = findViewById(R.id.textDetailPhone);
        addressText = findViewById(R.id.textDetailAddress);
        financialsText = findViewById(R.id.textDetailFinancials);
        itemsContainer = findViewById(R.id.containerDetailItems);
        timelineContainer = findViewById(R.id.containerTimeline);
        statusSpinner = findViewById(R.id.spinnerNewStatus);
        trackingInput = findViewById(R.id.inputTrackingCode);
        statusNoteInput = findViewById(R.id.inputStatusNote);
        adminNoteInput = findViewById(R.id.inputAdminNote);
        updateButton = findViewById(R.id.buttonUpdateStatus);
        noteButton = findViewById(R.id.buttonAddNote);
    }

    private void loadOrder() {
        visible(progress, true);
        visible(errorText, false);
        api().get("/admin/orders/" + orderId, new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse response) {
                try {
                    order = JsonMapper.order(response.body);
                    renderOrder();
                    loadTimeline();
                } catch (JSONException exception) {
                    visible(progress, false);
                    inlineError("فرمت جزئیات سفارش معتبر نیست.");
                }
            }
            @Override public void onError(ApiException error) {
                visible(progress, false);
                if (error.isUnauthorized()) showError(error); else inlineError(error.getMessage());
            }
        });
    }

    private void renderOrder() {
        numberText.setText(PersianFormatter.digits(order.orderNumber));
        statusText.setText(OrderAdapter.statusLabel(order.status));
        customerText.setText(order.address.recipientName);
        phoneText.setText(PersianFormatter.digits(order.address.recipientPhone));
        addressText.setText(order.address.province + "، " + order.address.city + "\n" + order.address.postalAddress + "\nکد پستی: " + PersianFormatter.digits(order.address.postalCode));
        trackingInput.setText(order.trackingCode);
        financialsText.setText("جمع کالاها: " + PersianFormatter.toman(order.subtotalIrr)
                + "\nارسال: " + PersianFormatter.toman(order.shippingFeeIrr)
                + "\nتخفیف: " + PersianFormatter.toman(order.discountIrr)
                + "\nمبلغ نهایی: " + PersianFormatter.toman(order.totalIrr));

        itemsContainer.removeAllViews();
        if (order.items.isEmpty()) addLine(itemsContainer, "اطلاعات اقلام برای این سفارش ثبت نشده است.", false);
        for (OrderItem item : order.items) {
            addLine(itemsContainer,
                    item.productTitle + (item.variantTitle.trim().isEmpty() ? "" : " — " + item.variantTitle)
                            + " × " + PersianFormatter.digits(String.valueOf(item.quantity))
                            + "\n" + PersianFormatter.toman(item.subtotalIrr) + " | " + item.sku,
                    false);
        }
        configureTransitions(order.status);
    }

    private void configureTransitions(String current) {
        statusValues.clear();
        statusLabels.clear();
        addStatus(current);
        switch (current) {
            case "pending_payment" -> { addStatus("paid"); addStatus("cancelled"); }
            case "paid" -> { addStatus("processing"); addStatus("cancelled"); addStatus("refund_requested"); addStatus("refunded"); }
            case "processing" -> { addStatus("packed"); addStatus("cancelled"); }
            case "packed" -> addStatus("shipped");
            case "shipped" -> addStatus("delivered");
            case "cancelled" -> addStatus("refunded");
            default -> { }
        }
        statusSpinner.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, statusLabels));
    }

    private void addStatus(String status) {
        if (statusValues.contains(status)) return;
        statusValues.add(status);
        statusLabels.add(OrderAdapter.statusLabel(status));
    }

    private void loadTimeline() {
        api().get("/admin/orders/" + orderId + "/timeline", new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse response) {
                visible(progress, false);
                timelineContainer.removeAllViews();
                try {
                    List<TimelineEvent> timeline = JsonMapper.timeline(response.body);
                    if (timeline.isEmpty()) addLine(timelineContainer, "رویدادی ثبت نشده است.", false);
                    for (TimelineEvent event : timeline) {
                        String title = event.note.trim().isEmpty() ? event.eventType : event.note;
                        if (!event.newStatus.trim().isEmpty()) title += " — " + OrderAdapter.statusLabel(event.newStatus);
                        addLine(timelineContainer, title + "\n" + PersianFormatter.digits(event.createdAt.replace('T', ' ')), false);
                    }
                } catch (JSONException exception) {
                    addLine(timelineContainer, "خواندن تاریخچه ناموفق بود.", true);
                }
            }
            @Override public void onError(ApiException error) {
                visible(progress, false);
                timelineContainer.removeAllViews();
                addLine(timelineContainer, error.getMessage(), true);
            }
        });
    }

    private void confirmStatusChange() {
        if (order == null || statusValues.isEmpty()) return;
        String newStatus = statusValues.get(statusSpinner.getSelectedItemPosition());
        if (newStatus.equals(order.status)) {
            inlineError("وضعیت جدید را انتخاب کنید.");
            return;
        }
        if ("shipped".equals(newStatus) && value(trackingInput).trim().isEmpty()) {
            inlineError("برای وضعیت ارسال‌شده، کد رهگیری الزامی است.");
            return;
        }
        String message = ("cancelled".equals(newStatus) || "refunded".equals(newStatus))
                ? "این عملیات روی سفارش و گزارش‌های مالی اثر دارد. ادامه می‌دهید؟"
                : "وضعیت سفارش به «" + OrderAdapter.statusLabel(newStatus) + "» تغییر کند؟";
        new AlertDialog.Builder(this)
                .setTitle("تأیید تغییر وضعیت")
                .setMessage(message)
                .setNegativeButton("انصراف", null)
                .setPositiveButton("تأیید", (dialog, which) -> updateStatus(newStatus))
                .show();
    }

    private void updateStatus(String newStatus) {
        try {
            JSONObject body = new JSONObject()
                    .put("status", newStatus)
                    .put("tracking_code", value(trackingInput))
                    .put("note", value(statusNoteInput));
            setMutationBusy(true);
            api().patch("/admin/orders/" + orderId + "/status", body, new ApiCallback<>() {
                @Override public void onSuccess(ApiResponse response) {
                    setMutationBusy(false);
                    statusNoteInput.setText("");
                    loadOrder();
                }
                @Override public void onError(ApiException error) {
                    setMutationBusy(false);
                    if (error.isUnauthorized()) showError(error); else inlineError(error.getMessage());
                }
            });
        } catch (JSONException exception) {
            inlineError("آماده‌سازی تغییر وضعیت ناموفق بود.");
        }
    }

    private void addNote() {
        String note = value(adminNoteInput);
        if (note.trim().isEmpty()) { inlineError("متن یادداشت را وارد کنید."); return; }
        try {
            setMutationBusy(true);
            api().post("/admin/orders/" + orderId + "/notes", new JSONObject().put("note", note), new ApiCallback<>() {
                @Override public void onSuccess(ApiResponse response) {
                    setMutationBusy(false);
                    adminNoteInput.setText("");
                    loadOrder();
                }
                @Override public void onError(ApiException error) {
                    setMutationBusy(false);
                    if (error.isUnauthorized()) showError(error); else inlineError(error.getMessage());
                }
            });
        } catch (JSONException exception) {
            inlineError("آماده‌سازی یادداشت ناموفق بود.");
        }
    }

    private void setMutationBusy(boolean busy) {
        visible(progress, busy);
        updateButton.setEnabled(!busy);
        noteButton.setEnabled(!busy);
    }

    private void contact(String action, String scheme) {
        if (order == null || order.address.recipientPhone.trim().isEmpty()) return;
        startActivity(new Intent(action, Uri.parse(scheme + Uri.encode(order.address.recipientPhone))));
    }

    private void inlineError(String message) {
        errorText.setText(message);
        visible(errorText, true);
    }

    private void addLine(LinearLayout parent, String value, boolean error) {
        TextView text = new TextView(this);
        text.setText(value);
        text.setTextColor(getColor(error ? R.color.danger : R.color.text_secondary));
        text.setTextSize(13f);
        text.setPadding(0, 10, 0, 10);
        parent.addView(text, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
    }
}

