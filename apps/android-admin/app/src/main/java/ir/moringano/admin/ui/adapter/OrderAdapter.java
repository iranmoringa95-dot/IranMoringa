package ir.moringano.admin.ui.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

import ir.moringano.admin.R;
import ir.moringano.admin.model.Order;
import ir.moringano.admin.util.PersianFormatter;

public final class OrderAdapter extends BaseAdapter {
    private final LayoutInflater inflater;
    private final List<Order> orders = new ArrayList<>();

    public OrderAdapter(Context context) {
        inflater = LayoutInflater.from(context);
    }

    public void replace(List<Order> values) {
        orders.clear();
        orders.addAll(values);
        notifyDataSetChanged();
    }

    @Override public int getCount() { return orders.size(); }
    @Override public Order getItem(int position) { return orders.get(position); }
    @Override public long getItemId(int position) { return position; }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        ViewHolder holder;
        if (convertView == null) {
            convertView = inflater.inflate(R.layout.row_order, parent, false);
            holder = new ViewHolder(convertView);
            convertView.setTag(holder);
        } else {
            holder = (ViewHolder) convertView.getTag();
        }
        Order order = getItem(position);
        holder.number.setText(PersianFormatter.digits(order.orderNumber));
        holder.status.setText(statusLabel(order.status));
        holder.customer.setText(order.address.recipientName + " — " + PersianFormatter.digits(order.address.recipientPhone));
        holder.address.setText(order.address.province + "، " + order.address.city + " — " + order.address.postalAddress);
        holder.total.setText(PersianFormatter.toman(order.totalIrr));
        holder.date.setText(PersianFormatter.digits(order.createdAt.replace('T', ' ')));
        return convertView;
    }

    public static String statusLabel(String status) {
        if (status == null) return "نامشخص";
        return switch (status) {
            case "pending_payment" -> "در انتظار پرداخت";
            case "paid" -> "پرداخت شده";
            case "processing" -> "در حال پردازش";
            case "packed" -> "بسته‌بندی شده";
            case "shipped" -> "ارسال شده";
            case "delivered" -> "تحویل شده";
            case "cancelled" -> "لغو شده";
            case "refund_requested" -> "درخواست بازگشت";
            case "refunded" -> "وجه بازگشته";
            default -> status;
        };
    }

    private static final class ViewHolder {
        final TextView number;
        final TextView status;
        final TextView customer;
        final TextView address;
        final TextView total;
        final TextView date;
        ViewHolder(View view) {
            number = view.findViewById(R.id.textRowOrderNumber);
            status = view.findViewById(R.id.textRowStatus);
            customer = view.findViewById(R.id.textRowCustomer);
            address = view.findViewById(R.id.textRowAddress);
            total = view.findViewById(R.id.textRowTotal);
            date = view.findViewById(R.id.textRowDate);
        }
    }
}
