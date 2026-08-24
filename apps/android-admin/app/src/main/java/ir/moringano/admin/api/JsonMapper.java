package ir.moringano.admin.api;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import ir.moringano.admin.model.DashboardStats;
import ir.moringano.admin.model.Order;
import ir.moringano.admin.model.OrderAddress;
import ir.moringano.admin.model.OrderItem;
import ir.moringano.admin.model.Product;
import ir.moringano.admin.model.TimelineEvent;

public final class JsonMapper {
    private JsonMapper() {}

    public static ApiException apiError(int statusCode, String raw) {
        try {
            JSONObject object = new JSONObject(raw);
            String code = first(object, "code", "status");
            String message = first(object, "detail", "error", "message");
            if (message.trim().isEmpty()) message = "سرور درخواست را نپذیرفت.";
            return new ApiException(statusCode, code, message);
        } catch (JSONException ignored) {
            return new ApiException(statusCode, "HTTP_" + statusCode, raw == null || raw.trim().isEmpty() ? "خطای سرور" : raw);
        }
    }

    public static DashboardStats stats(String raw) throws JSONException {
        JSONObject object = new JSONObject(raw);
        if (object.optJSONObject("stats") != null) object = object.getJSONObject("stats");
        DashboardStats stats = new DashboardStats();
        stats.totalSalesIrr = object.optLong("total_sales_irr", object.optLong("today_sales_irr", 0L));
        stats.totalOrders = object.optInt("total_orders", 0);
        stats.pendingOrders = object.optInt("pending_orders",
                object.optInt("pending_payment", 0) + object.optInt("processing", 0));
        stats.lowStockCount = object.optInt("low_stock_count", 0);
        return stats;
    }

    public static List<Order> orders(String raw) throws JSONException {
        Object root = raw.trim().startsWith("[") ? new JSONArray(raw) : new JSONObject(raw);
        JSONArray array;
        if (root instanceof JSONArray) array = (JSONArray) root;
        else {
            JSONObject object = (JSONObject) root;
            array = object.optJSONArray("orders");
            if (array == null) array = object.optJSONArray("items");
            if (array == null) array = new JSONArray();
        }
        List<Order> result = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) result.add(order(array.getJSONObject(i)));
        return result;
    }

    public static Order order(String raw) throws JSONException {
        JSONObject object = new JSONObject(raw);
        if (object.optJSONObject("order") != null) object = object.getJSONObject("order");
        return order(object);
    }

    public static Order order(JSONObject object) throws JSONException {
        Order order = new Order();
        order.id = object.optString("id");
        order.orderNumber = object.optString("order_number", object.optString("orderNumber"));
        order.status = object.optString("status");
        order.subtotalIrr = object.optLong("subtotal_irr", 0L);
        order.discountIrr = object.optLong("discount_irr", 0L);
        order.shippingFeeIrr = object.optLong("shipping_fee_irr", 0L);
        order.totalIrr = object.optLong("total_irr", 0L);
        order.shippingMethod = object.optString("shipping_method");
        order.trackingCode = object.optString("tracking_code");
        order.notes = object.optString("notes", object.optString("admin_notes"));
        order.createdAt = object.optString("created_at");
        order.updatedAt = object.optString("updated_at", order.createdAt);

        JSONObject addressObject = object.optJSONObject("address");
        if (addressObject == null) addressObject = new JSONObject();
        JSONObject customerObject = object.optJSONObject("customer");
        if (customerObject == null) customerObject = new JSONObject();
        OrderAddress address = new OrderAddress();
        address.recipientName = addressObject.optString("recipient_name",
                object.optString("customer_name", fullName(customerObject)));
        address.recipientPhone = addressObject.optString("recipient_phone",
                object.optString("guest_phone", customerObject.optString("phone", object.optString("customer_phone"))));
        address.province = addressObject.optString("province", object.optString("province"));
        address.city = addressObject.optString("city", object.optString("city"));
        address.postalAddress = addressObject.optString("postal_address", object.optString("postal_address"));
        address.postalCode = addressObject.optString("postal_code", object.optString("postal_code"));
        order.address = address;

        JSONArray items = object.optJSONArray("items");
        if (items != null) {
            for (int i = 0; i < items.length(); i++) {
                JSONObject itemObject = items.getJSONObject(i);
                OrderItem item = new OrderItem();
                item.id = itemObject.optString("id");
                item.productId = itemObject.optString("product_id");
                item.variantId = itemObject.optString("variant_id");
                item.productTitle = itemObject.optString("product_title", itemObject.optString("title_fa"));
                item.variantTitle = itemObject.optString("variant_title");
                item.sku = itemObject.optString("sku");
                item.unitPriceIrr = itemObject.optLong("unit_price_irr", 0L);
                item.quantity = itemObject.optInt("quantity", 1);
                item.subtotalIrr = itemObject.optLong("subtotal_irr", item.unitPriceIrr * item.quantity);
                order.items.add(item);
            }
        }
        return order;
    }

    public static List<Product> products(String raw) throws JSONException {
        Object root = raw.trim().startsWith("[") ? new JSONArray(raw) : new JSONObject(raw);
        JSONArray array;
        if (root instanceof JSONArray) array = (JSONArray) root;
        else {
            JSONObject object = (JSONObject) root;
            array = object.optJSONArray("products");
            if (array == null) array = object.optJSONArray("items");
            if (array == null) array = new JSONArray();
        }
        List<Product> result = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            JSONObject productObject = array.getJSONObject(i);
            JSONArray variants = productObject.optJSONArray("variants");
            if (variants != null && variants.length() > 0) {
                for (int j = 0; j < variants.length(); j++) {
                    JSONObject variant = variants.getJSONObject(j);
                    if (!variant.optBoolean("is_active", true)) continue;
                    result.add(product(productObject, variant));
                }
            } else {
                result.add(product(productObject, productObject));
            }
        }
        return result;
    }

    public static List<TimelineEvent> timeline(String raw) throws JSONException {
        JSONObject object = new JSONObject(raw);
        JSONArray array = object.optJSONArray("events");
        if (array == null) array = object.optJSONArray("timeline");
        if (array == null) array = new JSONArray();
        List<TimelineEvent> result = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            JSONObject value = array.getJSONObject(i);
            TimelineEvent event = new TimelineEvent();
            event.eventType = value.optString("event_type", value.optString("title"));
            event.oldStatus = value.optString("old_status");
            event.newStatus = value.optString("new_status");
            event.actorType = value.optString("actor_type");
            event.note = value.optString("note");
            event.createdAt = value.optString("created_at");
            result.add(event);
        }
        return result;
    }

    private static Product product(JSONObject product, JSONObject variant) {
        Product result = new Product();
        result.productId = product.optString("id", variant.optString("product_id"));
        result.variantId = variant.optString("id", product.optString("variant_id", result.productId));
        result.title = product.optString("title_fa", product.optString("title"));
        result.variantTitle = variant == product ? "" : variant.optString("title_fa");
        result.sku = variant.optString("sku", product.optString("sku"));
        result.priceIrr = variant.optLong("price_irr", product.optLong("price_irr", 0L));
        int onHand = variant.optInt("on_hand", product.optInt("on_hand", 0));
        int reserved = variant.optInt("reserved", product.optInt("reserved", 0));
        result.available = variant.has("available") ? variant.optInt("available") : product.optInt("available", onHand - reserved);
        return result;
    }

    private static String first(JSONObject object, String... keys) {
        for (String key : keys) {
            String value = object.optString(key);
            if (!value.trim().isEmpty()) return value;
        }
        return "";
    }

    private static String fullName(JSONObject customer) {
        return (customer.optString("first_name") + " " + customer.optString("last_name")).trim();
    }
}

