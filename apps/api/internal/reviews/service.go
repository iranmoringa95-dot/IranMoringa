package reviews

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvalidRating = errors.New("امتیاز باید بین ۱ تا ۵ ستاره باشد")
	ErrReviewNotFound = errors.New("دیدگاه پیدا نشد")
)

type ProductReviewSummary struct {
	AverageRating float64         `json:"average_rating"`
	TotalReviews  int             `json:"total_reviews"`
	Reviews       []ProductReview `json:"reviews"`
}

type Service struct {
	mu      sync.RWMutex
	reviews map[uuid.UUID]*ProductReview
}

func NewService() *Service {
	return &Service{
		reviews: make(map[uuid.UUID]*ProductReview),
	}
}

func (s *Service) AddReview(productID uuid.UUID, customerName, title, comment string, rating int, isVerified bool) (*ProductReview, error) {
	if rating < 1 || rating > 5 {
		return nil, ErrInvalidRating
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	rev := &ProductReview{
		ID:               uuid.New(),
		ProductID:        productID,
		CustomerName:     customerName,
		Rating:           rating,
		Title:            title,
		Comment:          comment,
		IsVerifiedBuyer: isVerified,
		Status:           StatusApproved, // Auto-approve in development seed
		CreatedAt:        now,
	}

	s.reviews[rev.ID] = rev
	return rev, nil
}

func (s *Service) GetProductReviews(productID uuid.UUID) ProductReviewSummary {
	s.mu.RLock()
	defer s.mu.RUnlock()

	approved := make([]ProductReview, 0)
	var sumRating float64 = 0

	for _, r := range s.reviews {
		if r.ProductID == productID && r.Status == StatusApproved {
			approved = append(approved, *r)
			sumRating += float64(r.Rating)
		}
	}

	avg := 0.0
	if len(approved) > 0 {
		avg = sumRating / float64(len(approved))
	}

	return ProductReviewSummary{
		AverageRating: avg,
		TotalReviews:  len(approved),
		Reviews:       approved,
	}
}
