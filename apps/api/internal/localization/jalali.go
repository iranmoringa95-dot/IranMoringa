package localization

import (
	"fmt"
	"time"
)

var jalaliMonthNames = [...]string{
	"فروردین", "اردیبهشت", "خرداد",
	"تیر", "مرداد", "شهریور",
	"مهر", "آبان", "آذر",
	"دی", "بهمن", "اسفند",
}

// ToJalali converts a Gregorian time.Time to Jalali (Solar Hijri) year, month (1-12), and day (1-31).
func ToJalali(t time.Time) (jy, jm, jd int) {
	gy, gm, gd := t.Date()
	gDaysInMonth := [...]int{0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}
	if isLeapGregorian(gy) {
		gDaysInMonth[2] = 29
	}

	gDayNo := 0
	for i := 1; i < int(gm); i++ {
		gDayNo += gDaysInMonth[i]
	}
	gDayNo += gd

	// Days from 1 A.D. to gy-1
	gDayNo += (gy - 1) * 365
	gDayNo += (gy - 1) / 4
	gDayNo -= (gy - 1) / 100
	gDayNo += (gy - 1) / 400

	jDayNo := gDayNo - 79

	jNp := jDayNo / 12053
	jDayNo %= 12053

	jy = 979 + 33*jNp + 4*(jDayNo/1461)
	jDayNo %= 1461

	if jDayNo >= 366 {
		jy += (jDayNo - 1) / 365
		jDayNo = (jDayNo - 1) % 365
	}

	if jDayNo < 186 {
		jm = 1 + jDayNo/31
		jd = 1 + (jDayNo % 31)
	} else {
		jm = 7 + (jDayNo-186)/30
		jd = 1 + ((jDayNo - 186) % 30)
	}

	return jy, jm, jd
}

func isLeapGregorian(year int) bool {
	return year%4 == 0 && (year%100 != 0 || year%400 == 0)
}

// FormatJalali formats time.Time to Jalali string (e.g. "۱۵ مرداد ۱۴۰۵" or "1405/05/15").
func FormatJalali(t time.Time, longFormat bool) string {
	jy, jm, jd := ToJalali(t)
	if longFormat {
		monthName := jalaliMonthNames[jm-1]
		formatted := fmt.Sprintf("%d %s %d", jd, monthName, jy)
		return convertToPersianDigits(formatted)
	}
	formatted := fmt.Sprintf("%04d/%02d/%02d", jy, jm, jd)
	return convertToPersianDigits(formatted)
}

// TehranDateRangeToUTC converts a Jalali day (Year, Month, Day) in Asia/Tehran timezone to UTC start/end range.
func TehranDateRangeToUTC(jy, jm, jd int) (startUTC, endUTC time.Time, err error) {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.FixedZone("Asia/Tehran", 3*3600+30*60) // Fallback +03:30
	}

	// Approximate Gregorian year
	gy := jy + 621
	// Simple lookup for start
	startLocal := time.Date(gy, time.Month(1), 1, 0, 0, 0, 0, loc)
	// Adjust to exact day by stepping
	for {
		y, m, d := ToJalali(startLocal)
		if y == jy && m == jm && d == jd {
			break
		}
		if y < jy || (y == jy && m < jm) || (y == jy && m == jm && d < jd) {
			startLocal = startLocal.Add(12 * time.Hour)
		} else {
			startLocal = startLocal.Add(-12 * time.Hour)
		}
	}

	startDayLocal := time.Date(startLocal.Year(), startLocal.Month(), startLocal.Day(), 0, 0, 0, 0, loc)
	endDayLocal := startDayLocal.Add(24 * time.Hour)

	return startDayLocal.UTC(), endDayLocal.UTC(), nil
}
