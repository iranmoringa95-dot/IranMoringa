package reviews

import (
	"time"

	"github.com/google/uuid"
)

type ReviewStatus string

const (
	StatusPending  ReviewStatus = "pending"
	StatusApproved ReviewStatus = "approved"
	StatusRejected ReviewStatus = "rejected"
)

type ProductReview struct {
	ID               uuid.UUID    `json:"id"`
	ProductID        uuid.UUID    `json:"product_id"`
	CustomerName     string       `json:"customer_name"`
	Rating           int          `json:"rating"` // 1 to 5
	Title            string       `json:"title"`
	Comment          string       `json:"comment"`
	IsVerifiedBuyer bool         `json:"is_verified_buyer"`
	Status           ReviewStatus `json:"status"`
	CreatedAt        time.Time    `json:"created_at"`
}
