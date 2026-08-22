package carts

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"

	"moringalab/api/internal/catalog"
	"moringalab/api/internal/pricing"
	"moringalab/api/internal/promotions"
)

var (
	ErrCartNotFound = errors.New("سبد خرید یافت نشد")
	ErrItemNotFound = errors.New("آیتم مورد نظر در سبد خرید یافت نشد")
	ErrInvalidQty   = errors.New("تعداد سفارش باید حداقل ۱ عدد باشد")
)

type Service struct {
	mu             sync.RWMutex
	carts          map[uuid.UUID]*Cart
	anonCarts      map[string]*Cart
	userCarts      map[uuid.UUID]*Cart
	catalogService *catalog.Service
	promoService   *promotions.Service
}

func NewService(catSvc *catalog.Service, promoSvc *promotions.Service) *Service {
	return &Service{
		carts:          make(map[uuid.UUID]*Cart),
		anonCarts:      make(map[string]*Cart),
		userCarts:      make(map[uuid.UUID]*Cart),
		catalogService: catSvc,
		promoService:   promoSvc,
	}
}

func (s *Service) GetCart(cartID uuid.UUID) (*Cart, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	cart, exists := s.carts[cartID]
	if !exists {
		return nil, ErrCartNotFound
	}
	s.recalculateCartUnlocked(cart)
	return cart, nil
}

func (s *Service) GetOrCreateCart(anonID *string, userID *uuid.UUID) *Cart {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()

	if userID != nil {
		if cart, exists := s.userCarts[*userID]; exists {
			s.recalculateCartUnlocked(cart)
			return cart
		}
		cart := &Cart{
			ID:        uuid.New(),
			UserID:    userID,
			Items:     make([]CartItem, 0),
			CreatedAt: now,
			UpdatedAt: now,
		}
		s.carts[cart.ID] = cart
		s.userCarts[*userID] = cart
		s.recalculateCartUnlocked(cart)
		return cart
	}

	if anonID != nil && *anonID != "" {
		if cart, exists := s.anonCarts[*anonID]; exists {
			s.recalculateCartUnlocked(cart)
			return cart
		}
		cart := &Cart{
			ID:          uuid.New(),
			AnonymousID: anonID,
			Items:       make([]CartItem, 0),
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		s.carts[cart.ID] = cart
		s.anonCarts[*anonID] = cart
		s.recalculateCartUnlocked(cart)
		return cart
	}

	// Default temporary cart
	newAnon := uuid.New().String()
	cart := &Cart{
		ID:          uuid.New(),
		AnonymousID: &newAnon,
		Items:       make([]CartItem, 0),
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.carts[cart.ID] = cart
	s.anonCarts[newAnon] = cart
	s.recalculateCartUnlocked(cart)
	return cart
}

func (s *Service) MergeGuestCartToUser(anonID string, userID uuid.UUID) *Cart {
	s.mu.Lock()
	defer s.mu.Unlock()

	guestCart, guestExists := s.anonCarts[anonID]
	if !guestExists || len(guestCart.Items) == 0 {
		userCart, userExists := s.userCarts[userID]
		if !userExists {
			now := time.Now()
			userCart = &Cart{
				ID:        uuid.New(),
				UserID:    &userID,
				Items:     make([]CartItem, 0),
				CreatedAt: now,
				UpdatedAt: now,
			}
			s.carts[userCart.ID] = userCart
			s.userCarts[userID] = userCart
		}
		s.recalculateCartUnlocked(userCart)
		return userCart
	}

	userCart, userExists := s.userCarts[userID]
	if !userExists {
		now := time.Now()
		userCart = &Cart{
			ID:        uuid.New(),
			UserID:    &userID,
			Items:     make([]CartItem, 0),
			CreatedAt: now,
			UpdatedAt: now,
		}
		s.carts[userCart.ID] = userCart
		s.userCarts[userID] = userCart
	}

	// Merge items from guestCart to userCart without duplicates
	for _, gItem := range guestCart.Items {
		found := false
		for i, uItem := range userCart.Items {
			if uItem.VariantID == gItem.VariantID {
				userCart.Items[i].Quantity += gItem.Quantity
				found = true
				break
			}
		}
		if !found {
			gItem.CartID = userCart.ID
			userCart.Items = append(userCart.Items, gItem)
		}
	}

	// Delete guest cart
	delete(s.anonCarts, anonID)
	delete(s.carts, guestCart.ID)

	s.recalculateCartUnlocked(userCart)
	return userCart
}

func (s *Service) AddItem(cartID uuid.UUID, variantID uuid.UUID, quantity int) (*Cart, error) {
	if quantity < 1 {
		return nil, ErrInvalidQty
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	cart, exists := s.carts[cartID]
	if !exists {
		return nil, ErrCartNotFound
	}

	// Lookup product and variant from catalog service
	products, _ := s.catalogService.SearchProducts(catalog.ProductFilter{})
	var foundProd *catalog.Product
	var foundVar *catalog.ProductVariant

	for _, p := range products {
		for _, v := range p.Variants {
			if v.ID == variantID {
				foundProd = p
				foundVar = &v
				break
			}
		}
		if foundVar != nil {
			break
		}
	}

	if foundVar == nil {
		return nil, errors.New("متغیر محصول مورد نظر پیدا نشد")
	}

	now := time.Now()
	// Check if already in cart
	for i, item := range cart.Items {
		if item.VariantID == variantID {
			cart.Items[i].Quantity += quantity
			cart.Items[i].LineSubtotalIRR = cart.Items[i].UnitPriceIRR * int64(cart.Items[i].Quantity)
			cart.Items[i].UpdatedAt = now
			s.recalculateCartUnlocked(cart)
			return cart, nil
		}
	}

	newItem := CartItem{
		ID:                  uuid.New(),
		CartID:              cart.ID,
		ProductID:           foundProd.ID,
		VariantID:           foundVar.ID,
		ProductTitle:        foundProd.TitleFA,
		VariantTitle:        foundVar.TitleFA,
		SKU:                 foundVar.SKU,
		UnitPriceIRR:        foundVar.PriceIRR,
		CompareAtPriceIRR:   foundVar.CompareAtPriceIRR,
		Quantity:            quantity,
		LineSubtotalIRR:     foundVar.PriceIRR * int64(quantity),
		NetWeightGrams:      foundVar.NetWeightGrams,
		ShippingWeightGrams: foundVar.ShippingWeightGrams,
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	cart.Items = append(cart.Items, newItem)
	s.recalculateCartUnlocked(cart)
	return cart, nil
}

func (s *Service) recalculateCartUnlocked(cart *Cart) {
	lineItems := make([]pricing.CartLineItem, len(cart.Items))
	for i, item := range cart.Items {
		lineItems[i] = pricing.CartLineItem{
			VariantID:         item.VariantID.String(),
			UnitPriceIRR:      item.UnitPriceIRR,
			CompareAtPriceIRR: item.CompareAtPriceIRR,
			Quantity:          item.Quantity,
		}
	}

	var cartDiscount int64 = 0
	if cart.CouponCode != nil && *cart.CouponCode != "" {
		subtotalTemp := int64(0)
		for _, li := range lineItems {
			subtotalTemp += li.UnitPriceIRR * int64(li.Quantity)
		}
		if res, err := s.promoService.EvaluateCoupon(*cart.CouponCode, promotions.EvaluationRequest{SubtotalIRR: subtotalTemp}); err == nil {
			cartDiscount = res.DiscountIRR
		} else {
			cart.CouponCode = nil
		}
	}

	shippingFee := int64(300000) // Default 30,000 Toman shipping fee in development
	cart.Breakdown = pricing.CalculateBreakdown(lineItems, cartDiscount, shippingFee)
	cart.UpdatedAt = time.Now()
}
