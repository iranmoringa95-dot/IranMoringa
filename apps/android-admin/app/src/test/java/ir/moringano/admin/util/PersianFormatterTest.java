package ir.moringano.admin.util;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class PersianFormatterTest {
    @Test
    public void convertsTomanToIrrWithoutFloatingPoint() {
        assertEquals(12_345_670L, PersianFormatter.parseTomanToIrr("۱٬۲۳۴٬۵۶۷"));
    }

    @Test(expected = ArithmeticException.class)
    public void rejectsOverflowDuringCurrencyConversion() {
        PersianFormatter.parseTomanToIrr("999999999999999999");
    }

    @Test
    public void validatesIranianMobileNumbers() {
        assertTrue(Validator.isIranianMobile("۰۹۱۲ ۱۲۳ ۴۵۶۷"));
        assertTrue(Validator.isIranianMobile("+989121234567"));
        assertFalse(Validator.isIranianMobile("02112345678"));
        assertFalse(Validator.isIranianMobile("0912123456"));
    }
}
