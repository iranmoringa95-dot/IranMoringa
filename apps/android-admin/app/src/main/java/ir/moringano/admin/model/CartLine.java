package ir.moringano.admin.model;

public final class CartLine {
    public final Product product;
    public int quantity;

    public CartLine(Product product) {
        this.product = product;
        this.quantity = 1;
    }

    public long subtotalIrr() {
        return Math.multiplyExact(product.priceIrr, quantity);
    }
}
