package ir.moringano.admin.model;

import java.util.ArrayList;
import java.util.List;

public final class Order {
    public String id = "";
    public String orderNumber = "";
    public String status = "";
    public long subtotalIrr;
    public long discountIrr;
    public long shippingFeeIrr;
    public long totalIrr;
    public String shippingMethod = "";
    public String trackingCode = "";
    public String notes = "";
    public String createdAt = "";
    public String updatedAt = "";
    public OrderAddress address = new OrderAddress();
    public List<OrderItem> items = new ArrayList<>();
}
