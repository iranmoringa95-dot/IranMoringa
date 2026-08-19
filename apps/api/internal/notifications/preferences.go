package notifications

import (
	"sync"

	"github.com/google/uuid"
)

type EventCategory string

const (
	CategoryTransactional EventCategory = "transactional"
	CategoryMarketing     EventCategory = "marketing"
)

type NotificationPreference struct {
	UserID        uuid.UUID     `json:"user_id"`
	Channel       Channel       `json:"channel"`
	EventCategory EventCategory `json:"event_category"`
	Enabled       bool          `json:"enabled"`
}

type PreferencesStore struct {
	mu    sync.RWMutex
	prefs map[string]bool // key: "userID:channel:category"
}

func NewPreferencesStore() *PreferencesStore {
	return &PreferencesStore{
		prefs: make(map[string]bool),
	}
}

func (s *PreferencesStore) SetPreference(userID uuid.UUID, channel Channel, category EventCategory, enabled bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	key := preferenceKey(userID, channel, category)
	s.prefs[key] = enabled
}

func (s *PreferencesStore) GetPreference(userID uuid.UUID, channel Channel, category EventCategory) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	key := preferenceKey(userID, channel, category)
	enabled, exists := s.prefs[key]
	if !exists {
		return true // Default enabled
	}
	return enabled
}

func (s *PreferencesStore) GetUserPreferences(userID uuid.UUID) []NotificationPreference {
	s.mu.RLock()
	defer s.mu.RUnlock()

	channels := []Channel{ChannelSMS, ChannelEmail}
	categories := []EventCategory{CategoryTransactional, CategoryMarketing}

	res := make([]NotificationPreference, 0, len(channels)*len(categories))
	for _, ch := range channels {
		for _, cat := range categories {
			key := preferenceKey(userID, ch, cat)
			enabled, exists := s.prefs[key]
			if !exists {
				enabled = true
			}
			res = append(res, NotificationPreference{
				UserID:        userID,
				Channel:       ch,
				EventCategory: cat,
				Enabled:       enabled,
			})
		}
	}
	return res
}

// IsTransactionalEvent returns true for critical operational notifications that ignore user opt-outs.
func IsTransactionalEvent(eventCode string) bool {
	switch eventCode {
	case "otp_requested",
		"order_placed",
		"payment_paid",
		"payment_failed",
		"order_processing",
		"order_shipped",
		"order_delivered",
		"order_cancelled",
		"refund_completed":
		return true
	default:
		return false
	}
}

// ShouldDeliverNotification returns true if the notification should be delivered,
// enforcing that transactional notifications always override opt-out preferences.
func (s *PreferencesStore) ShouldDeliverNotification(userID *uuid.UUID, channel Channel, eventCode string) bool {
	// 1. Transactional messages ALWAYS override opt-out
	if IsTransactionalEvent(eventCode) {
		return true
	}

	// 2. Anonymous/Guest users without UserID default to sending marketing if requested
	if userID == nil {
		return true
	}

	// 3. Marketing messages check user preferences
	return s.GetPreference(*userID, channel, CategoryMarketing)
}

func preferenceKey(userID uuid.UUID, channel Channel, category EventCategory) string {
	return userID.String() + ":" + string(channel) + ":" + string(category)
}
