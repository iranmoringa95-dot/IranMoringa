package reviews

import (
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

var (
	ErrInvalidRating    = errors.New("امتیاز باید بین ۱ تا ۵ ستاره باشد")
	ErrReviewNotFound   = errors.New("دیدگاه پیدا نشد")
	ErrQuestionNotFound = errors.New("پرسش پیدا نشد")
	ErrDuplicateReview  = errors.New("شما قبلاً برای این محصول دیدگاه ثبت کرده‌اید")
	ErrAlreadyVoted     = errors.New("شما قبلاً به این دیدگاه رای داده‌اید")
)

type Service struct {
	mu        sync.RWMutex
	reviews   map[uuid.UUID]*ProductReview
	votes     map[string]*ReviewVote // key: "reviewID:voterIdentity"
	questions map[uuid.UUID]*ProductQuestion
	ordersSvc *orders.Service
}

func NewService(ordersSvc *orders.Service) *Service {
	svc := &Service{
		reviews:   make(map[uuid.UUID]*ProductReview),
		votes:     make(map[string]*ReviewVote),
		questions: make(map[uuid.UUID]*ProductQuestion),
		ordersSvc: ordersSvc,
	}

	// Seed test data
	pID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	uID := uuid.MustParse("00000000-0000-0000-0000-000000000002")

	svc.reviews[uuid.New()] = &ProductReview{
		ID:              uuid.New(),
		ProductID:       pID,
		UserID:          &uID,
		CustomerName:    "سارا احمدی",
		Rating:          5,
		Title:           "کیفیت فوق‌العاده روغن مورینگا",
		Comment:         "من چند هفته هست استفاده می‌کنم و پوست و موهام خیلی شفاف شده. ارسال هم بسیار سریع بود.",
		IsVerifiedBuyer: true,
		Status:          StatusApproved,
		HelpfulCount:    12,
		UnhelpfulCount:  0,
		OfficialReply: &OfficialReply{
			ID:        uuid.New(),
			ActorName: "پشتیبانی سبزینه",
			ReplyBody: "سارا عزیز، خرسندیم که از کیفیت روغن ارگانیک مورینگا رضایت دارید. سپاس از اعتماد شما!",
			CreatedAt: time.Now().Add(-12 * time.Hour),
		},
		CreatedAt: time.Now().Add(-24 * time.Hour),
	}

	svc.reviews[uuid.New()] = &ProductReview{
		ID:              uuid.New(),
		ProductID:       pID,
		CustomerName:    "رضا محمدی",
		Rating:          4,
		Title:           "بسته‌بندی عالی",
		Comment:         "محصول با کیفیتی هست فقط درب شیشه‌ای می‌تونست محکم‌تر باشه.",
		IsVerifiedBuyer: true,
		Status:          StatusApproved,
		HelpfulCount:    5,
		UnhelpfulCount:  1,
		CreatedAt:       time.Now().Add(-48 * time.Hour),
	}

	// Seed Question
	qID := uuid.New()
	svc.questions[qID] = &ProductQuestion{
		ID:           qID,
		ProductID:    pID,
		CustomerName: "امیرحسین",
		QuestionBody: "آیا این پودر برای مصرف در چای و دمنوش هم مناسب هست؟",
		Status:       QuestionApproved,
		Answers: []ProductAnswer{
			{
				ID:         uuid.New(),
				QuestionID: qID,
				ActorName:  "کارشناس سبزینه",
				AnswerBody: "بله، پودر مورینگا کاملاً طبیعی است و می‌توانید آن را در چای، دمنوش، ماست و اسموتی حل و میل کنید.",
				IsOfficial: true,
				Status:     QuestionApproved,
				CreatedAt:  time.Now().Add(-6 * time.Hour),
			},
		},
		CreatedAt: time.Now().Add(-36 * time.Hour),
	}

	return svc
}

// ─── XSS HTML Sanitizer ──────────────────────────────────────────────────────

var htmlTagRegex = regexp.MustCompile(`(?i)<[^>]*>`)
var jsScriptRegex = regexp.MustCompile(`(?i)(javascript:|on\w+=)`)

func SanitizeHTML(input string) string {
	cleaned := htmlTagRegex.ReplaceAllString(input, "")
	cleaned = jsScriptRegex.ReplaceAllString(cleaned, "")
	return strings.TrimSpace(cleaned)
}

// ─── Server Verified Purchase Check ──────────────────────────────────────────

func (s *Service) checkVerifiedPurchase(userID *uuid.UUID, productID uuid.UUID) bool {
	if userID == nil || s.ordersSvc == nil {
		return false
	}

	customerOrders := s.ordersSvc.ListOrdersByCustomer(*userID)
	for _, ord := range customerOrders {
		if ord.Status == orders.StatusDelivered || ord.Status == orders.StatusShipped || ord.Status == orders.StatusPaid {
			for _, item := range ord.Items {
				if item.ProductID == productID {
					return true
				}
			}
		}
	}
	return false
}

// ─── Reviews API ─────────────────────────────────────────────────────────────

type SubmitReviewRequest struct {
	ProductID    uuid.UUID  `json:"product_id"`
	UserID       *uuid.UUID `json:"user_id,omitempty"`
	CustomerName string     `json:"customer_name"`
	Rating       int        `json:"rating"`
	Title        string     `json:"title"`
	Comment      string     `json:"comment"`
}

func (s *Service) AddReview(req SubmitReviewRequest) (*ProductReview, error) {
	if req.Rating < 1 || req.Rating > 5 {
		return nil, ErrInvalidRating
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Check duplicate review for user+product
	if req.UserID != nil {
		for _, r := range s.reviews {
			if r.ProductID == req.ProductID && r.UserID != nil && *r.UserID == *req.UserID {
				return nil, ErrDuplicateReview
			}
		}
	}

	// Server-verified purchase assertion
	isVerified := s.checkVerifiedPurchase(req.UserID, req.ProductID)

	now := time.Now()
	rev := &ProductReview{
		ID:              uuid.New(),
		ProductID:       req.ProductID,
		UserID:          req.UserID,
		CustomerName:    SanitizeHTML(req.CustomerName),
		Rating:          req.Rating,
		Title:           SanitizeHTML(req.Title),
		Comment:         SanitizeHTML(req.Comment),
		IsVerifiedBuyer: isVerified,
		Status:          StatusPending, // Sent to moderation queue
		CreatedAt:       now,
	}

	s.reviews[rev.ID] = rev
	return rev, nil
}

func (s *Service) VoteReview(reviewID uuid.UUID, voterIdentity string, isHelpful bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	rev, exists := s.reviews[reviewID]
	if !exists {
		return ErrReviewNotFound
	}

	voteKey := fmt.Sprintf("%s:%s", reviewID.String(), voterIdentity)
	if _, exists := s.votes[voteKey]; exists {
		return ErrAlreadyVoted
	}

	vote := &ReviewVote{
		ID:            uuid.New(),
		ReviewID:      reviewID,
		VoterIdentity: voterIdentity,
		IsHelpful:     isHelpful,
		CreatedAt:     time.Now(),
	}
	s.votes[voteKey] = vote

	if isHelpful {
		rev.HelpfulCount++
	} else {
		rev.UnhelpfulCount++
	}

	return nil
}

// ─── Admin Moderation ────────────────────────────────────────────────────────

func (s *Service) ApproveReview(reviewID uuid.UUID) (*ProductReview, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	rev, exists := s.reviews[reviewID]
	if !exists {
		return nil, ErrReviewNotFound
	}

	rev.Status = StatusApproved
	rev.RejectionReason = ""
	return rev, nil
}

func (s *Service) RejectReview(reviewID uuid.UUID, reason string) (*ProductReview, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	rev, exists := s.reviews[reviewID]
	if !exists {
		return nil, ErrReviewNotFound
	}

	rev.Status = StatusRejected
	rev.RejectionReason = SanitizeHTML(reason)
	return rev, nil
}

func (s *Service) AddOfficialReply(reviewID uuid.UUID, replyBody string) (*OfficialReply, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	rev, exists := s.reviews[reviewID]
	if !exists {
		return nil, ErrReviewNotFound
	}

	reply := &OfficialReply{
		ID:        uuid.New(),
		ReviewID:  reviewID,
		ActorName: "پشتیبانی سبزینه",
		ReplyBody: SanitizeHTML(replyBody),
		CreatedAt: time.Now(),
	}

	rev.OfficialReply = reply
	return reply, nil
}

func (s *Service) ListAllReviewsForAdmin() []*ProductReview {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]*ProductReview, 0, len(s.reviews))
	for _, r := range s.reviews {
		list = append(list, r)
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].CreatedAt.After(list[j].CreatedAt)
	})
	return list
}

// ─── Public Review Listing & Summary ─────────────────────────────────────────

func (s *Service) GetProductReviews(productID uuid.UUID, sortOption string, filterVerified bool) ProductReviewSummary {
	s.mu.RLock()
	defer s.mu.RUnlock()

	approved := make([]ProductReview, 0)
	var dist RatingDistribution
	var sumRating float64 = 0

	for _, r := range s.reviews {
		if r.ProductID == productID && r.Status == StatusApproved {
			if filterVerified && !r.IsVerifiedBuyer {
				continue
			}

			approved = append(approved, *r)
			sumRating += float64(r.Rating)

			switch r.Rating {
			case 5:
				dist.Star5++
			case 4:
				dist.Star4++
			case 3:
				dist.Star3++
			case 2:
				dist.Star2++
			case 1:
				dist.Star1++
			}
		}
	}

	// Sorting
	switch sortOption {
	case "highest_rating":
		sort.Slice(approved, func(i, j int) bool { return approved[i].Rating > approved[j].Rating })
	case "lowest_rating":
		sort.Slice(approved, func(i, j int) bool { return approved[i].Rating < approved[j].Rating })
	case "most_helpful":
		sort.Slice(approved, func(i, j int) bool { return approved[i].HelpfulCount > approved[j].HelpfulCount })
	default: // "newest"
		sort.Slice(approved, func(i, j int) bool { return approved[i].CreatedAt.After(approved[j].CreatedAt) })
	}

	avg := 0.0
	if len(approved) > 0 {
		avg = sumRating / float64(len(approved))
	}

	return ProductReviewSummary{
		AverageRating: avg,
		TotalReviews:  len(approved),
		Distribution:  dist,
		Reviews:       approved,
	}
}

// ─── Product Q&A System ──────────────────────────────────────────────────────

func (s *Service) SubmitQuestion(productID uuid.UUID, userID *uuid.UUID, customerName, body string) (*ProductQuestion, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	q := &ProductQuestion{
		ID:           uuid.New(),
		ProductID:    productID,
		UserID:       userID,
		CustomerName: SanitizeHTML(customerName),
		QuestionBody: SanitizeHTML(body),
		Status:       QuestionPending,
		Answers:      make([]ProductAnswer, 0),
		CreatedAt:    time.Now(),
	}

	s.questions[q.ID] = q
	return q, nil
}

func (s *Service) AnswerQuestion(questionID uuid.UUID, actorName, answerBody string, isOfficial bool) (*ProductAnswer, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	q, exists := s.questions[questionID]
	if !exists {
		return nil, ErrQuestionNotFound
	}

	status := QuestionPending
	if isOfficial {
		status = QuestionApproved
	}

	answer := ProductAnswer{
		ID:         uuid.New(),
		QuestionID: questionID,
		ActorName:  SanitizeHTML(actorName),
		AnswerBody: SanitizeHTML(answerBody),
		IsOfficial: isOfficial,
		Status:     status,
		CreatedAt:  time.Now(),
	}

	q.Answers = append(q.Answers, answer)
	return &answer, nil
}

func (s *Service) ApproveQuestion(questionID uuid.UUID) (*ProductQuestion, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	q, exists := s.questions[questionID]
	if !exists {
		return nil, ErrQuestionNotFound
	}

	q.Status = QuestionApproved
	return q, nil
}

func (s *Service) RejectQuestion(questionID uuid.UUID, reason string) (*ProductQuestion, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	q, exists := s.questions[questionID]
	if !exists {
		return nil, ErrQuestionNotFound
	}

	q.Status = QuestionRejected
	q.RejectionReason = SanitizeHTML(reason)
	return q, nil
}

func (s *Service) GetProductQuestions(productID uuid.UUID) []*ProductQuestion {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*ProductQuestion, 0)
	for _, q := range s.questions {
		if q.ProductID == productID && q.Status == QuestionApproved {
			// Filter approved answers
			approvedAnswers := make([]ProductAnswer, 0)
			for _, a := range q.Answers {
				if a.Status == QuestionApproved {
					approvedAnswers = append(approvedAnswers, a)
				}
			}
			qCopy := *q
			qCopy.Answers = approvedAnswers
			result = append(result, &qCopy)
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})

	return result
}

func (s *Service) ListAllQuestionsForAdmin() []*ProductQuestion {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]*ProductQuestion, 0, len(s.questions))
	for _, q := range s.questions {
		list = append(list, q)
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].CreatedAt.After(list[j].CreatedAt)
	})
	return list
}
