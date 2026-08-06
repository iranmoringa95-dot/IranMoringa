package account

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"moringalab/api/internal/localization"
)

var (
	ErrAddressNotFound = errors.New("آدرس مورد نظر یافت نشد")
	ErrForbiddenAccess = errors.New("شما اجازه دسترسی به این آدرس را ندارید (عدم مطابقت مالکیت)")
	ErrAddressLimit    = errors.New("حداکثر تعداد آدرس‌های مجاز (۱۰ آدرس) تکمیل شده است")
)

type Service struct {
	mu        sync.RWMutex
	profiles  map[uuid.UUID]*CustomerProfile
	addresses map[uuid.UUID]*CustomerAddress
}

func NewService() *Service {
	return &Service{
		profiles:  make(map[uuid.UUID]*CustomerProfile),
		addresses: make(map[uuid.UUID]*CustomerAddress),
	}
}

func (s *Service) GetProfile(userID uuid.UUID) *CustomerProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p, exists := s.profiles[userID]
	if !exists {
		return &CustomerProfile{
			UserID:    userID,
			FirstName: "کاربر",
			LastName:  "سبزینه",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
	}
	return p
}

func (s *Service) UpdateProfile(userID uuid.UUID, firstName, lastName, email string) *CustomerProfile {
	s.mu.Lock()
	defer s.mu.Unlock()

	p := &CustomerProfile{
		UserID:    userID,
		FirstName: localization.NormalizePersianText(firstName),
		LastName:  localization.NormalizePersianText(lastName),
		Email:     email,
		UpdatedAt: time.Now(),
	}
	s.profiles[userID] = p
	return p
}

func (s *Service) CreateAddress(userID uuid.UUID, label, recipient, phone, province, city, postalCode, addressLine string, isDefault bool) (*CustomerAddress, error) {
	normPostal, errPost := localization.ValidatePostalCode(postalCode)
	if errPost != nil {
		return nil, errPost
	}

	normPhone, errPhone := localization.NormalizeIranianPhone(phone)
	if errPhone != nil {
		return nil, errPhone
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Check address limit per user
	userAddrCount := 0
	for _, a := range s.addresses {
		if a.UserID == userID {
			userAddrCount++
		}
	}
	if userAddrCount >= 10 {
		return nil, ErrAddressLimit
	}

	// Atomic default address unsetting
	if isDefault {
		for _, a := range s.addresses {
			if a.UserID == userID {
				a.IsDefaultShipping = false
				a.IsDefaultBilling = false
			}
		}
	}

	addr := &CustomerAddress{
		ID:                uuid.New(),
		UserID:            userID,
		Label:             localization.NormalizePersianText(label),
		RecipientName:     localization.NormalizePersianText(recipient),
		PhoneE164:         normPhone,
		ProvinceName:      localization.NormalizePersianText(province),
		CityName:          localization.NormalizePersianText(city),
		PostalCode:        normPostal,
		AddressLine:       localization.NormalizePersianText(addressLine),
		IsDefaultShipping: isDefault || userAddrCount == 0,
		IsDefaultBilling:  isDefault || userAddrCount == 0,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	s.addresses[addr.ID] = addr
	return addr, nil
}

func (s *Service) ListAddresses(userID uuid.UUID) []CustomerAddress {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]CustomerAddress, 0)
	for _, a := range s.addresses {
		if a.UserID == userID {
			result = append(result, *a)
		}
	}
	return result
}

func (s *Service) SetDefaultAddress(userID, addressID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	addr, exists := s.addresses[addressID]
	if !exists {
		return ErrAddressNotFound
	}
	// IDOR Protection: Scoped to UserID
	if addr.UserID != userID {
		return ErrForbiddenAccess
	}

	for _, a := range s.addresses {
		if a.UserID == userID {
			a.IsDefaultShipping = (a.ID == addressID)
			a.IsDefaultBilling = (a.ID == addressID)
		}
	}
	return nil
}

func (s *Service) DeleteAddress(userID, addressID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	addr, exists := s.addresses[addressID]
	if !exists {
		return ErrAddressNotFound
	}
	// IDOR Protection: Scoped to UserID
	if addr.UserID != userID {
		return ErrForbiddenAccess
	}

	delete(s.addresses, addressID)
	return nil
}
