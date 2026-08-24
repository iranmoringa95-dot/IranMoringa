package ir.moringano.admin.model;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class CartLineTest {
    @Test
    public void calculatesSubtotalWithExactIrrIntegers() {
        Product product = new Product();
        product.priceIrr = 1_250_000L;
        CartLine line = new CartLine(product);
        line.quantity = 3;

        assertEquals(3_750_000L, line.subtotalIrr());
    }

    @Test(expected = ArithmeticException.class)
    public void rejectsSubtotalOverflow() {
        Product product = new Product();
        product.priceIrr = Long.MAX_VALUE;
        CartLine line = new CartLine(product);
        line.quantity = 2;

        line.subtotalIrr();
    }
}