package reviews

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/orders"
)

func setupTestReviewService(t *testing.T) (*Service, *orders.Service, uuid.UUID, uuid.UUID) {
	t.Helper()
	ordersSvc := orders.NewService()
	svc := NewService(ordersSvc)

	productID := uuid.New()
	userID := uuid.New()

	return svc, ordersSvc, productID, userID
}

// ─── Test 1: XSS HTML Sanitizer ──────────────────────────────────────────────

func TestXSSSanitizationInReview(t *testing.T) {
	svc, _, productID, _ := setupTestReviewService(t)

	req := SubmitReviewRequest{
		ProductID:    productID,
		CustomerName: "<script>alert('XSS')</script>علی",
		Rating:       5,
		Title:        "<a href='http://evil.com'>عالی بود</a>",
		Comment:      "محصول عالی <iframe src='http://evil.com'></iframe> بود",
	}

	rev, err := svc.AddReview(req)
	if err != nil {
		t.Fatalf("AddReview failed: %v", err)
	}

	if rev.CustomerName != "علی" {
		t.Errorf("expected customer name 'علی', got '%s'", rev.CustomerName)
	}
	if rev.Title != "عالی بود" {
		t.Errorf("expected title 'عالی بود', got '%s'", rev.Title)
	}
	if rev.Comment != "محصول عالی  بود" {
		t.Errorf("expected clean comment, got '%s'", rev.Comment)
	}
}

// ─── Test 2: Server-Verified Buyer Assertion ─────────────────────────────────

func TestServerVerifiedBuyerCheck(t *testing.T) {
	svc, ordersSvc, productID, userID := setupTestReviewService(t)

	// 1. User without orders -> IsVerifiedBuyer = false
	revUnverified, err := svc.AddReview(SubmitReviewRequest{
		ProductID:    productID,
		UserID:       &userID,
		CustomerName: "کاربر جدید",
		Rating:       4,
		Comment:      "تست عدم خریدار",
	})
	if err != nil {
		t.Fatalf("AddReview failed: %v", err)
	}
	if revUnverified.IsVerifiedBuyer {
		t.Error("expected IsVerifiedBuyer to be false for user with no delivered order")
	}

	// 2. Create delivered order for user containing productID
	anotherUser := uuid.New()
	_, _ = ordersSvc.CreateOrder(&orders.Order{
		UserID:         &anotherUser,
		Status:         orders.StatusDelivered,
		IdempotencyKey: uuid.New().String(),
		Items: []orders.OrderItemSnapshot{
			{ProductID: productID, Quantity: 1},
		},
	})

	// 3. User with delivered order -> IsVerifiedBuyer = true
	revVerified, err := svc.AddReview(SubmitReviewRequest{
		ProductID:    productID,
		UserID:       &anotherUser,
		CustomerName: "خریدار واقعی",
		Rating:       5,
		Comment:      "محصول خریده شده",
	})
	if err != nil {
		t.Fatalf("AddReview verified failed: %v", err)
	}
	if !revVerified.IsVerifiedBuyer {
		t.Error("expected IsVerifiedBuyer to be true for user with delivered order")
	}
}

// ─── Test 3: Duplicate Review Prevention ──────────────────────────────────────

func TestDuplicateReviewGuard(t *testing.T) {
	svc, _, productID, userID := setupTestReviewService(t)

	req := SubmitReviewRequest{
		ProductID:    productID,
		UserID:       &userID,
		CustomerName: "کاربر ثابت",
		Rating:       5,
		Comment:      "دیدگاه اول",
	}

	_, err := svc.AddReview(req)
	if err != nil {
		t.Fatalf("First review failed: %v", err)
	}

	// Second review by same user for same product -> Should fail
	_, err = svc.AddReview(req)
	if err != ErrDuplicateReview {
		t.Errorf("expected ErrDuplicateReview, got %v", err)
	}
}

// ─── Test 4: Duplicate Vote Prevention ───────────────────────────────────────

func TestDuplicateVoteGuard(t *testing.T) {
	svc, _, productID, _ := setupTestReviewService(t)

	rev, _ := svc.AddReview(SubmitReviewRequest{
		ProductID: productID,
		Rating:    5,
		Comment:   "دیدگاه تست رای",
	})

	voter := "voter-ip-127.0.0.1"

	// 1st vote -> Success
	err := svc.VoteReview(rev.ID, voter, true)
	if err != nil {
		t.Fatalf("First VoteReview failed: %v", err)
	}

	// 2nd vote -> Fail with ErrAlreadyVoted
	err = svc.VoteReview(rev.ID, voter, true)
	if err != ErrAlreadyVoted {
		t.Errorf("expected ErrAlreadyVoted, got %v", err)
	}
}

// ─── Test 5: Rating Summary Only Includes Approved Reviews ───────────────────

func TestRatingDistributionAndAverageOnlyIncludesApproved(t *testing.T) {
	svc, _, productID, _ := setupTestReviewService(t)

	// Approved review (5 stars)
	rev1, _ := svc.AddReview(SubmitReviewRequest{ProductID: productID, Rating: 5, Comment: "عالی"})
	_, _ = svc.ApproveReview(rev1.ID)

	// Approved review (3 stars)
	rev2, _ := svc.AddReview(SubmitReviewRequest{ProductID: productID, Rating: 3, Comment: "متوسط"})
	_, _ = svc.ApproveReview(rev2.ID)

	// Pending review (1 star) — SHOULD NOT affect average
	_, _ = svc.AddReview(SubmitReviewRequest{ProductID: productID, Rating: 1, Comment: "بد"})

	summary := svc.GetProductReviews(productID, "newest", false)
	if summary.TotalReviews != 2 {
		t.Errorf("expected 2 approved reviews in summary, got %d", summary.TotalReviews)
	}

	expectedAvg := 4.0 // (5 + 3) / 2
	if summary.AverageRating != expectedAvg {
		t.Errorf("expected average rating %.1f, got %.1f", expectedAvg, summary.AverageRating)
	}

	if summary.Distribution.Star5 != 1 || summary.Distribution.Star3 != 1 || summary.Distribution.Star1 != 0 {
		t.Errorf("unexpected distribution: %+v", summary.Distribution)
	}
}

// ─── Test 6: Review Moderation Workflow ──────────────────────────────────────

func TestReviewModerationWorkflow(t *testing.T) {
	svc, _, productID, _ := setupTestReviewService(t)

	rev, _ := svc.AddReview(SubmitReviewRequest{ProductID: productID, Rating: 2, Comment: "نقد"})
	if rev.Status != StatusPending {
		t.Errorf("expected status pending, got %s", rev.Status)
	}

	// Approve
	approved, err := svc.ApproveReview(rev.ID)
	if err != nil || approved.Status != StatusApproved {
		t.Fatalf("ApproveReview failed: %v", err)
	}

	// Reject
	rejected, err := svc.RejectReview(rev.ID, "محتوای اسپم")
	if err != nil || rejected.Status != StatusRejected {
		t.Fatalf("RejectReview failed: %v", err)
	}
	if rejected.RejectionReason != "محتوای اسپم" {
		t.Errorf("expected rejection reason recorded, got '%s'", rejected.RejectionReason)
	}
}

// ─── Test 7: Official Staff Reply ────────────────────────────────────────────

func TestOfficialStaffReply(t *testing.T) {
	svc, _, productID, _ := setupTestReviewService(t)

	rev, _ := svc.AddReview(SubmitReviewRequest{ProductID: productID, Rating: 5, Comment: "فوق‌العاده"})

	reply, err := svc.AddOfficialReply(rev.ID, "باتشکر از دیدگاه شما")
	if err != nil {
		t.Fatalf("AddOfficialReply failed: %v", err)
	}

	if reply.ActorName != "پشتیبانی سبزینه" {
		t.Errorf("expected actor name پشتیبانی سبزینه, got '%s'", reply.ActorName)
	}
	if reply.ReplyBody != "باتشکر از دیدگاه شما" {
		t.Errorf("expected reply body, got '%s'", reply.ReplyBody)
	}
}

// ─── Test 8: Product Q&A Submission & Moderation ─────────────────────────────

func TestProductQASubmissionAndModeration(t *testing.T) {
	svc, _, productID, _ := setupTestReviewService(t)

	// 1. Submit Question
	q, err := svc.SubmitQuestion(productID, nil, "خریدار", "آیا محصول گارانتی دارد؟")
	if err != nil {
		t.Fatalf("SubmitQuestion failed: %v", err)
	}
	if q.Status != QuestionPending {
		t.Errorf("expected question status pending, got %s", q.Status)
	}

	// 2. Approve Question
	_, _ = svc.ApproveQuestion(q.ID)

	// 3. Staff Answer Question
	ans, err := svc.AnswerQuestion(q.ID, "پشتیبانی سبزینه", "بله، دارای اصالت کالا و گارانتی مرجوعی ۷ روزه است.", true)
	if err != nil {
		t.Fatalf("AnswerQuestion failed: %v", err)
	}
	if !ans.IsOfficial {
		t.Error("expected answer to be marked as official")
	}

	// 4. Public Q&A query returns question with approved answer
	questions := svc.GetProductQuestions(productID)
	if len(questions) != 1 {
		t.Fatalf("expected 1 approved question, got %d", len(questions))
	}
	if len(questions[0].Answers) != 1 {
		t.Fatalf("expected 1 approved answer, got %d", len(questions[0].Answers))
	}
}

// ─── Test 9: Review Sorting Options ─────────────────────────────────────────

func TestReviewSortingOptions(t *testing.T) {
	svc, _, productID, _ := setupTestReviewService(t)

	r1, _ := svc.AddReview(SubmitReviewRequest{ProductID: productID, Rating: 1, Comment: "کمتر"})
	r2, _ := svc.AddReview(SubmitReviewRequest{ProductID: productID, Rating: 5, Comment: "بیشتر"})
	_, _ = svc.ApproveReview(r1.ID)
	_, _ = svc.ApproveReview(r2.ID)

	// Sort Highest Rating
	summaryHighest := svc.GetProductReviews(productID, "highest_rating", false)
	if summaryHighest.Reviews[0].Rating != 5 {
		t.Errorf("expected highest rating first (5), got %d", summaryHighest.Reviews[0].Rating)
	}

	// Sort Lowest Rating
	summaryLowest := svc.GetProductReviews(productID, "lowest_rating", false)
	if summaryLowest.Reviews[0].Rating != 1 {
		t.Errorf("expected lowest rating first (1), got %d", summaryLowest.Reviews[0].Rating)
	}
}

// ─── Test 10: Invalid Rating Range Guard ──────────────────────────────────────

func TestInvalidRatingRangeGuard(t *testing.T) {
	svc, _, productID, _ := setupTestReviewService(t)

	_, err0 := svc.AddReview(SubmitReviewRequest{ProductID: productID, Rating: 0, Comment: "صفر"})
	if err0 != ErrInvalidRating {
		t.Errorf("expected ErrInvalidRating for 0, got %v", err0)
	}

	_, err6 := svc.AddReview(SubmitReviewRequest{ProductID: productID, Rating: 6, Comment: "شیش"})
	if err6 != ErrInvalidRating {
		t.Errorf("expected ErrInvalidRating for 6, got %v", err6)
	}
}
