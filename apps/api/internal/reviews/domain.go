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

type QuestionStatus string

const (
	QuestionPending  QuestionStatus = "pending"
	QuestionApproved QuestionStatus = "approved"
	QuestionRejected QuestionStatus = "rejected"
)

type OfficialReply struct {
	ID        uuid.UUID `json:"id"`
	ReviewID  uuid.UUID `json:"review_id"`
	ActorName string    `json:"actor_name"`
	ReplyBody string    `json:"reply_body"`
	CreatedAt time.Time `json:"created_at"`
}

type ProductReview struct {
	ID              uuid.UUID      `json:"id"`
	ProductID       uuid.UUID      `json:"product_id"`
	UserID          *uuid.UUID     `json:"user_id,omitempty"`
	CustomerName    string         `json:"customer_name"`
	Rating          int            `json:"rating"` // 1 to 5
	Title           string         `json:"title"`
	Comment         string         `json:"comment"`
	IsVerifiedBuyer bool           `json:"is_verified_buyer"`
	Status          ReviewStatus   `json:"status"`
	RejectionReason string         `json:"rejection_reason,omitempty"`
	HelpfulCount    int            `json:"helpful_count"`
	UnhelpfulCount  int            `json:"unhelpful_count"`
	OfficialReply   *OfficialReply `json:"official_reply,omitempty"`
	CreatedAt       time.Time      `json:"created_at"`
}

type ReviewVote struct {
	ID            uuid.UUID `json:"id"`
	ReviewID      uuid.UUID `json:"review_id"`
	VoterIdentity string    `json:"voter_identity"`
	IsHelpful     bool      `json:"is_helpful"`
	CreatedAt     time.Time `json:"created_at"`
}

type ProductAnswer struct {
	ID         uuid.UUID      `json:"id"`
	QuestionID uuid.UUID      `json:"question_id"`
	ActorName  string         `json:"actor_name"`
	AnswerBody string         `json:"answer_body"`
	IsOfficial bool           `json:"is_official"`
	Status     QuestionStatus `json:"status"`
	CreatedAt  time.Time      `json:"created_at"`
}

type ProductQuestion struct {
	ID              uuid.UUID       `json:"id"`
	ProductID       uuid.UUID       `json:"product_id"`
	UserID          *uuid.UUID      `json:"user_id,omitempty"`
	CustomerName    string          `json:"customer_name"`
	QuestionBody    string          `json:"question_body"`
	Status          QuestionStatus  `json:"status"`
	RejectionReason string          `json:"rejection_reason,omitempty"`
	Answers         []ProductAnswer `json:"answers"`
	CreatedAt       time.Time       `json:"created_at"`
}

type RatingDistribution struct {
	Star5 int `json:"star_5"`
	Star4 int `json:"star_4"`
	Star3 int `json:"star_3"`
	Star2 int `json:"star_2"`
	Star1 int `json:"star_1"`
}

type ProductReviewSummary struct {
	AverageRating float64            `json:"average_rating"`
	TotalReviews  int                `json:"total_reviews"`
	Distribution  RatingDistribution `json:"distribution"`
	Reviews       []ProductReview    `json:"reviews"`
}
