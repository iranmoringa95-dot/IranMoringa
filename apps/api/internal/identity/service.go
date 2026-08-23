package identity

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrOTPExpired      = errors.New("کد تایید انقضا یافته است")
	ErrOTPMaxAttempts  = errors.New("تعداد تلاش‌های مجاز کد تایید به پایان رسیده است")
	ErrOTPInvalid      = errors.New("کد تایید واردشده نادرست است")
	ErrOTPGeneration   = errors.New("تولید کد تایید ناموفق بود")
	ErrOTPDelivery     = errors.New("ارسال کد تایید ناموفق بود")
	ErrAccountLocked   = errors.New("حساب کاربری به دلیل تلاش‌های ناموفق متوالی موقتاً مسدود شده است")
	ErrInvalidPassword = errors.New("ایمیل یا رمز عبور واردشده نادرست است")
	ErrUnauthorized    = errors.New("دسترسی احراز نشده است")
	ErrForbidden       = errors.New("شما مجوز دسترسی به این بخش را ندارید")
)

type MemoryStore struct {
	mu           sync.RWMutex
	users        map[uuid.UUID]*User
	usersByPhone map[string]*User
	usersByEmail map[string]*User
	credentials  map[uuid.UUID]*UserCredentials
	otps         map[string]*OTPChallenge // key: phone
	sessions     map[string]*Session      // key: tokenHash
	userRoles    map[uuid.UUID][]string   // userID -> role names
	rolePerms    map[string][]string      // role name -> perm codes
}

func NewMemoryStore() *MemoryStore {
	store := &MemoryStore{
		users:        make(map[uuid.UUID]*User),
		usersByPhone: make(map[string]*User),
		usersByEmail: make(map[string]*User),
		credentials:  make(map[uuid.UUID]*UserCredentials),
		otps:         make(map[string]*OTPChallenge),
		sessions:     make(map[string]*Session),
		userRoles:    make(map[uuid.UUID][]string),
		rolePerms:    make(map[string][]string),
	}

	// Seed default roles & permissions
	store.rolePerms["super_admin"] = []string{"*"}
	store.rolePerms["catalog_manager"] = []string{"product.read", "product.write", "category.manage"}
	store.rolePerms["warehouse_manager"] = []string{"inventory.read", "inventory.adjust"}
	store.rolePerms["order_support"] = []string{"order.read", "order.status.update"}
	store.rolePerms["finance_manager"] = []string{"payment.read", "payment.refund"}
	store.rolePerms["customer"] = []string{"me.read", "me.write", "order.create"}

	return store
}

type Service struct {
	store      *MemoryStore
	deliverOTP func(phone, code string) error
}

func NewService(store *MemoryStore, delivery ...func(phone, code string) error) *Service {
	service := &Service{store: store}
	if len(delivery) > 0 {
		service.deliverOTP = delivery[0]
	}
	return service
}

func HashSHA256(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}

// GenerateOTPCode generates a cryptographically secure 6-digit OTP code using crypto/rand.
func GenerateOTPCode() (string, error) {
	nBig, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", nBig.Int64()+100000), nil
}

func GenerateSessionToken() (plain string, tokenHash string, err error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	plain = hex.EncodeToString(b)
	tokenHash = HashSHA256(plain)
	return plain, tokenHash, nil
}

func (s *Service) RequestOTP(phone string) (string, error) {
	normPhone, err := NormalizeIranianPhone(phone)
	if err != nil {
		return "", err
	}

	otpCode, err := GenerateOTPCode()
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrOTPGeneration, err)
	}

	if s.deliverOTP != nil {
		if err := s.deliverOTP(normPhone, otpCode); err != nil {
			return "", fmt.Errorf("%w: %v", ErrOTPDelivery, err)
		}
	}

	otpHash := HashSHA256(otpCode)
	challenge := &OTPChallenge{
		ID:          uuid.New(),
		Phone:       normPhone,
		OTPHash:     otpHash,
		Attempts:    0,
		MaxAttempts: 3,
		ExpiresAt:   time.Now().Add(2 * time.Minute), // 2-minute expiration
		CreatedAt:   time.Now(),
	}

	s.store.mu.Lock()
	s.store.otps[normPhone] = challenge
	s.store.mu.Unlock()

	return otpCode, nil
}

func (s *Service) VerifyOTP(phone, code string) (string, *User, error) {
	normPhone, err := NormalizeIranianPhone(phone)
	if err != nil {
		return "", nil, err
	}

	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	challenge, exists := s.store.otps[normPhone]
	if !exists {
		return "", nil, ErrOTPInvalid
	}

	if time.Now().After(challenge.ExpiresAt) {
		return "", nil, ErrOTPExpired
	}

	if challenge.Attempts >= challenge.MaxAttempts {
		return "", nil, ErrOTPMaxAttempts
	}

	inputHash := HashSHA256(code)
	// Constant-time hash comparison to prevent timing attacks
	if subtle.ConstantTimeCompare([]byte(inputHash), []byte(challenge.OTPHash)) != 1 {
		challenge.Attempts++
		return "", nil, ErrOTPInvalid
	}

	// Consumed successfully
	now := time.Now()
	challenge.ConsumedAt = &now
	delete(s.store.otps, normPhone)

	// Get or Create Customer User
	user, exists := s.store.usersByPhone[normPhone]
	if !exists {
		user = &User{
			ID:        uuid.New(),
			Phone:     normPhone,
			IsActive:  true,
			CreatedAt: now,
			UpdatedAt: now,
		}
		s.store.users[user.ID] = user
		s.store.usersByPhone[normPhone] = user
		s.store.userRoles[user.ID] = []string{"customer"}
	}

	// Issue Session
	plainToken, tokenHash, err := GenerateSessionToken()
	if err != nil {
		return "", nil, err
	}

	sess := &Session{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour), // 30 days
		CreatedAt: now,
	}
	s.store.sessions[tokenHash] = sess

	return plainToken, user, nil
}

func (s *Service) Logout(plainToken string) error {
	tokenHash := HashSHA256(plainToken)

	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	delete(s.store.sessions, tokenHash)
	return nil
}

func (s *Service) LogoutAll(userID uuid.UUID) error {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	for tokenHash, sess := range s.store.sessions {
		if sess.UserID == userID {
			delete(s.store.sessions, tokenHash)
		}
	}
	return nil
}

func (s *Service) ValidateSession(plainToken string) (*User, error) {
	tokenHash := HashSHA256(plainToken)

	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	sess, exists := s.store.sessions[tokenHash]
	if !exists {
		return nil, ErrUnauthorized
	}

	if time.Now().After(sess.ExpiresAt) {
		return nil, ErrUnauthorized
	}

	user, exists := s.store.users[sess.UserID]
	if !exists || !user.IsActive {
		return nil, ErrUnauthorized
	}

	return user, nil
}

func (s *Service) HasPermission(userID uuid.UUID, requiredPerm string) bool {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	roles, exists := s.store.userRoles[userID]
	if !exists {
		return false
	}

	for _, role := range roles {
		perms := s.store.rolePerms[role]
		for _, p := range perms {
			if p == "*" || p == requiredPerm {
				return true
			}
		}
	}
	return false
}
