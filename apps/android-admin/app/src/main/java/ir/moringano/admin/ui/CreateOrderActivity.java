package ir.moringano.admin.ui;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import ir.moringano.admin.R;
import ir.moringano.admin.api.ApiCallback;
import ir.moringano.admin.api.ApiException;
import ir.moringano.admin.api.ApiResponse;
import ir.moringano.admin.api.JsonMapper;
import ir.moringano.admin.model.CartLine;
import ir.moringano.admin.model.Order;
import ir.moringano.admin.model.Product;
import ir.moringano.admin.util.PersianFormatter;
import ir.moringano.admin.util.Validator;

public final class CreateOrderActivity extends BaseActivity {
    private static final String[] SHIPPING_METHODS = {"پست پیشتاز", "تیپاکس", "پیک شهری", "تحویل حضوری"};

    private final List<Product> products = new ArrayList<>();
    private final List<CartLine> cart = new ArrayList<>();
    private ProgressBar progress;
    private TextView errorText;
    private LinearLayout cartContainer;
    private TextView cartEmpty;
    private TextView summaryText;
    private EditText nameInput;
    private EditText phoneInput;
    private EditText provinceInput;
    private EditText cityInput;
    private EditText addressInput;
    private EditText postalCodeInput;
    private EditText shippingFeeInput;
    private EditText discountInput;
    private EditText noteInput;
    private Spinner shippingSpinner;
    private Button addProductButton;
    private Button submitButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_create_order);
        getWindow().getDecorView().setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        bindViews();
        shippingSpinner.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, SHIPPING_METHODS));
        TextWatcher amountWatcher = new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) { updateSummary(); }
            @Override public void afterTextChanged(Editable s) {}
        };
        shippingFeeInput.addTextChangedListener(amountWatcher);
        discountInput.addTextChangedListener(amountWatcher);
        findViewById(R.id.buttonBackCreate).setOnClickListener(view -> finish());
        addProductButton.setOnClickListener(view -> showProductPicker());
        submitButton.setOnClickListener(view -> submitOrder());
        loadProducts();
        renderCart();
    }

    private void bindViews() {
        progress = findViewById(R.id.progressCreateOrder);
        errorText = findViewById(R.id.textCreateError);
        cartContainer = findViewById(R.id.containerCart);
        cartEmpty = findViewById(R.id.textCartEmpty);
        summaryText = findViewById(R.id.textOrderSummary);
        nameInput = findViewById(R.id.inputRecipientName);
        phoneInput = findViewById(R.id.inputRecipientPhone);
        provinceInput = findViewById(R.id.inputProvince);
        cityInput = findViewById(R.id.inputCity);
        addressInput = findViewById(R.id.inputPostalAddress);
        postalCodeInput = findViewById(R.id.inputPostalCode);
        shippingFeeInput = findViewById(R.id.inputShippingFee);
        discountInput = findViewById(R.id.inputDiscount);
        noteInput = findViewById(R.id.inputOrderNote);
        shippingSpinner = findViewById(R.id.spinnerShippingMethod);
        addProductButton = findViewById(R.id.buttonAddProduct);
        submitButton = findViewById(R.id.buttonSubmitOrder);
    }

    private void loadProducts() {
        visible(progress, true);
        addProductButton.setEnabled(false);
        api().get("/admin/products?page=1&limit=100&status=published", new ApiCallback<>() {
            @Override public void onSuccess(ApiResponse response) {
                visible(progress, false);
                try {
                    products.clear();
                    products.addAll(JsonMapper.products(response.body));
                    addProductButton.setEnabled(!products.isEmpty());
                    if (products.isEmpty()) inlineError("محصول قابل فروش از سرور دریافت نشد.");
                } catch (JSONException exception) {
                    inlineError("فرمت کاتالوگ محصولات معتبر نیست.");
                }
            }
            @Override public void onError(ApiException error) {
                visible(progress, false);
                addProductButton.setEnabled(false);
                if (error.isUnauthorized()) showError(error); else inlineError(error.getMessage());
            }
        });
    }

    private void showProductPicker() {
        if (products.isEmpty()) { inlineError("ابتدا کاتالوگ محصولات باید دریافت شود."); return; }
        String[] labels = new String[products.size()];
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            labels[i] = product.title + (product.variantTitle.trim().isEmpty() ? "" : " — " + product.variantTitle)
                    + "\n" + PersianFormatter.toman(product.priceIrr) + " | موجودی " + PersianFormatter.digits(String.valueOf(product.available));
        }
        new AlertDialog.Builder(this)
                .setTitle("انتخاب محصول")
                .setItems(labels, (dialog, which) -> addProduct(products.get(which)))
                .setNegativeButton("بستن", null)
                .show();
    }

    private void addProduct(Product product) {
        if (product.available <= 0) { inlineError("این تنوع محصول موجودی قابل فروش ندارد."); return; }
        for (CartLine line : cart) {
            if (line.product.variantId.equals(product.variantId)) {
                if (line.quantity >= product.available) { inlineError("تعداد بیشتر از موجودی قابل فروش است."); return; }
                line.quantity++;
                renderCart();
                return;
            }
        }
        cart.add(new CartLine(product));
        renderCart();
    }

    private void renderCart() {
        cartContainer.removeAllViews();
        visible(cartEmpty, cart.isEmpty());
        for (CartLine line : cart) {
            LinearLayout row = new LinearLayout(this);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setPadding(0, 8, 0, 8);

            TextView info = new TextView(this);
            info.setText(line.product.title + "\n" + PersianFormatter.toman(line.subtotalIrr()));
            info.setTextColor(getColor(R.color.text_primary));
            row.addView(info, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

            Button plus = smallButton("+");
            plus.setOnClickListener(view -> {
                if (line.quantity < line.product.available) { line.quantity++; renderCart(); }
                else inlineError("تعداد بیشتر از موجودی قابل فروش است.");
            });
            row.addView(plus);

            TextView quantity = new TextView(this);
            quantity.setGravity(Gravity.CENTER);
            quantity.setText(PersianFormatter.digits(String.valueOf(line.quantity)));
            quantity.setTypeface(quantity.getTypeface(), android.graphics.Typeface.BOLD);
            row.addView(quantity, new LinearLayout.LayoutParams(dp(42), dp(44)));

            Button minus = smallButton("−");
            minus.setOnClickListener(view -> {
                line.quantity--;
                if (line.quantity <= 0) cart.remove(line);
                renderCart();
            });
            row.addView(minus);
            cartContainer.addView(row);
        }
        updateSummary();
    }

    private Button smallButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextColor(getColor(R.color.primary));
        button.setBackgroundResource(R.drawable.bg_outline_button);
        button.setMinWidth(0);
        button.setMinimumWidth(0);
        button.setPadding(0, 0, 0, 0);
        button.setLayoutParams(new LinearLayout.LayoutParams(dp(44), dp(44)));
        return button;
    }

    private void updateSummary() {
        try {
            long subtotal = cartSubtotal();
            long shipping = PersianFormatter.parseTomanToIrr(value(shippingFeeInput));
            long discount = PersianFormatter.parseTomanToIrr(value(discountInput));
            long total = Math.max(0L, Math.subtractExact(Math.addExact(subtotal, shipping), discount));
            summaryText.setText("جمع سفارش: " + PersianFormatter.toman(total));
        } catch (RuntimeException exception) {
            summaryText.setText("مبلغ واردشده معتبر نیست.");
        }
    }

    private void submitOrder() {
        visible(errorText, false);
        String name = value(nameInput);
        String phone = PersianFormatter.normalizeDigits(value(phoneInput));
        String province = value(provinceInput);
        String city = value(cityInput);
        String address = value(addressInput);
        String postalCode = PersianFormatter.normalizeDigits(value(postalCodeInput)).replaceAll("\\D", "");
        if (name.trim().isEmpty() || province.trim().isEmpty() || city.trim().isEmpty() || address.trim().isEmpty()) {
            inlineError("نام، استان، شهر و نشانی کامل الزامی است."); return;
        }
        if (!Validator.isIranianMobile(phone)) { inlineError("شماره موبایل معتبر نیست."); return; }
        if (!postalCode.trim().isEmpty() && postalCode.length() != 10) { inlineError("کد پستی باید دقیقاً ده رقم باشد."); return; }
        if (cart.isEmpty()) { inlineError("حداقل یک محصول به سبد اضافه کنید."); return; }

        try {
            long shippingFeeIrr = PersianFormatter.parseTomanToIrr(value(shippingFeeInput));
            long discountIrr = PersianFormatter.parseTomanToIrr(value(discountInput));
            long subtotal = cartSubtotal();
            if (discountIrr > Math.addExact(subtotal, shippingFeeIrr)) { inlineError("تخفیف نمی‌تواند از جمع سفارش بیشتر باشد."); return; }

            JSONArray items = new JSONArray();
            for (CartLine line : cart) {
                items.put(new JSONObject()
                        .put("product_id", line.product.productId)
                        .put("variant_id", line.product.variantId)
                        .put("product_title", line.product.title)
                        .put("variant_title", line.product.variantTitle)
                        .put("sku", line.product.sku)
                        .put("unit_price_irr", line.product.priceIrr)
                        .put("quantity", line.quantity));
            }
            JSONObject body = new JSONObject()
                    .put("recipient_name", name)
                    .put("recipient_phone", phone)
                    .put("province", province)
                    .put("city", city)
                    .put("postal_address", address)
                    .put("postal_code", postalCode)
                    .put("shipping_method", shippingSpinner.getSelectedItem().toString())
                    .put("shipping_fee_irr", shippingFeeIrr)
                    .put("discount_irr", discountIrr)
                    .put("notes", value(noteInput))
                    .put("items", items);
            Map<String, String> headers = new HashMap<>();
            headers.put("Idempotency-Key", UUID.randomUUID().toString());
            setBusy(true);
            api().post("/admin/orders", body, headers, new ApiCallback<>() {
                @Override public void onSuccess(ApiResponse response) {
                    setBusy(false);
                    try {
                        Order created = JsonMapper.order(response.body);
                        showCreated(created);
                    } catch (JSONException exception) {
                        inlineError("سفارش ثبت شد اما پاسخ سرور قابل خواندن نیست؛ فهرست سفارش‌ها را بررسی کنید.");
                    }
                }
                @Override public void onError(ApiException error) {
                    setBusy(false);
                    if (error.isUnauthorized()) showError(error); else inlineError(error.getMessage());
                }
            });
        } catch (ArithmeticException exception) {
            inlineError("مبلغ سفارش بیش از محدوده مجاز است.");
        } catch (JSONException exception) {
            inlineError("آماده‌سازی سفارش ناموفق بود.");
        }
    }

    private long cartSubtotal() {
        long subtotal = 0L;
        for (CartLine line : cart) subtotal = Math.addExact(subtotal, line.subtotalIrr());
        return subtotal;
    }

    private void showCreated(Order created) {
        new AlertDialog.Builder(this)
                .setTitle("سفارش ثبت شد")
                .setMessage("شماره سفارش: " + PersianFormatter.digits(created.orderNumber))
                .setCancelable(false)
                .setNegativeButton("بازگشت", (dialog, which) -> finish())
                .setPositiveButton("مشاهده سفارش", (dialog, which) -> {
                    Intent intent = new Intent(this, OrderDetailActivity.class);
                    intent.putExtra(OrderDetailActivity.EXTRA_ORDER_ID, created.id);
                    startActivity(intent);
                    finish();
                }).show();
    }

    private void setBusy(boolean busy) {
        visible(progress, busy);
        submitButton.setEnabled(!busy);
        addProductButton.setEnabled(!busy && !products.isEmpty());
    }

    private void inlineError(String message) {
        errorText.setText(message);
        visible(errorText, true);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}


