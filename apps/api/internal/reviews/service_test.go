package reviews

import (
	"testing"

	"github.com/google/uuid"
)

func TestProductReviewRatingAverage(t *testing.T) {
	svc := NewService()
	prodID := uuid.New()

	// Add 5-star and 3-star reviews
	_, _ = svc.AddReview(prodID, "علی", "عالی", "کیفیت بسیار عالی", 5, true)
	_, _ = svc.AddReview(prodID, "مریم", "خوب", "رضایت‌بخش", 3, false)

	summary := svc.GetProductReviews(prodID)
	if summary.TotalReviews != 2 {
		t.Fatalf("expected 2 reviews, got %d", summary.TotalReviews)
	}
	if summary.AverageRating != 4.0 {
		t.Errorf("expected 4.0 average rating, got %f", summary.AverageRating)
	}
}
