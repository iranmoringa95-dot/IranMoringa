package notifications

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{service: svc}
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// AdminListDeliveries handles GET /api/v1/admin/notifications/deliveries
func (h *Handler) AdminListDeliveries(w http.ResponseWriter, r *http.Request) {
	filter := DeliveryFilter{
		Channel: Channel(r.URL.Query().Get("channel")),
		Status:  SendStatus(r.URL.Query().Get("status")),
	}

	if p, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil {
		filter.Page = p
	}
	if ps, err := strconv.Atoi(r.URL.Query().Get("page_size")); err == nil {
		filter.PageSize = ps
	}

	res := h.service.ListDeliveries(filter)
	writeJSON(w, http.StatusOK, res)
}

// AdminRetryDelivery handles POST /api/v1/admin/notifications/deliveries/{id}/retry
func (h *Handler) AdminRetryDelivery(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه ارسال معتبر نیست")
		return
	}

	del, err := h.service.RetryDelivery(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, del.SanitizeForJSON())
}

// AdminGetQueueStatus handles GET /api/v1/admin/notifications/queue-status
func (h *Handler) AdminGetQueueStatus(w http.ResponseWriter, r *http.Request) {
	stats := h.service.GetQueueStatus()
	writeJSON(w, http.StatusOK, stats)
}

// AdminListTemplates handles GET /api/v1/admin/notifications/templates
func (h *Handler) AdminListTemplates(w http.ResponseWriter, r *http.Request) {
	templates := h.service.ListTemplates()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"templates": templates,
	})
}

// AdminTestTemplate handles POST /api/v1/admin/notifications/templates/{code}/test
func (h *Handler) AdminTestTemplate(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var payload struct {
		Recipient string            `json:"recipient"`
		Data      map[string]string `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Recipient == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "گیرنده تست و اطلاعات قالب الزامی است")
		return
	}

	tmpl, err := h.service.GetTemplate(code)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	if payload.Data == nil {
		payload.Data = make(map[string]string)
	}

	delivery, err := h.service.NotifyEvent(tmpl.Code, payload.Recipient, tmpl.Channel, payload.Data, nil, nil)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "SEND_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, delivery.SanitizeForJSON())
}

// ─── Iranian SMS Gateways Management Endpoints ──────────────────────────────

// AdminGetSMSSettings handles GET /api/v1/admin/sms/settings
func (h *Handler) AdminGetSMSSettings(w http.ResponseWriter, r *http.Request) {
	mgr := h.service.GetGatewayManager()
	mgr.mu.RLock()
	defer mgr.mu.RUnlock()

	activeDriver := mgr.GetActiveDriver()
	balance, _ := activeDriver.GetBalance()

	gatewaysList := []map[string]string{
		{"id": "farazsms", "name": "فراز اس‌ام‌اس / آی‌پی‌پنل (FarazSMS / IPPanel)"},
		{"id": "kavenegar", "name": "کاوه‌نگار (Kavenegar Verify / Lookup)"},
		{"id": "melipayamak", "name": "ملی‌پیامک (Melipayamak BaseNumber)"},
		{"id": "smsir", "name": "اس‌ام‌اس دات آی‌آر (SMS.ir Fast Verify)"},
		{"id": "ghasedak", "name": "قاصدک (Ghasedak OTP / Send)"},
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"enable_sms":        mgr.EnableSMS,
		"active_gateway":    mgr.ActiveGateway,
		"active_gateway_name": activeDriver.GetNameFA(),
		"active_balance":    balance,
		"admin_numbers":     mgr.AdminNumbers,
		"tracking_keys":     mgr.TrackingKeys,
		"gateways":          gatewaysList,
		"status_templates":  mgr.StatusTemplates,
	})
}

// AdminUpdateSMSSettings handles PUT /api/v1/admin/sms/settings
func (h *Handler) AdminUpdateSMSSettings(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		EnableSMS       *bool                     `json:"enable_sms,omitempty"`
		ActiveGateway   string                    `json:"active_gateway,omitempty"`
		AdminNumbers    []string                  `json:"admin_numbers,omitempty"`
		TrackingKeys    []string                  `json:"tracking_keys,omitempty"`
		StatusTemplates map[string]StatusTemplate `json:"status_templates,omitempty"`
		Credentials     map[string]struct {
			Username string `json:"username,omitempty"`
			Password string `json:"password,omitempty"`
			APIKey   string `json:"api_key,omitempty"`
			Sender   string `json:"sender,omitempty"`
		} `json:"credentials,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "فرمت درخواست معتبر نیست")
		return
	}

	mgr := h.service.GetGatewayManager()
	mgr.mu.Lock()
	if payload.EnableSMS != nil {
		mgr.EnableSMS = *payload.EnableSMS
	}
	if payload.ActiveGateway != "" {
		mgr.ActiveGateway = payload.ActiveGateway
	}
	if payload.AdminNumbers != nil {
		mgr.AdminNumbers = payload.AdminNumbers
	}
	if payload.TrackingKeys != nil {
		mgr.TrackingKeys = payload.TrackingKeys
	}
	if payload.StatusTemplates != nil {
		for k, v := range payload.StatusTemplates {
			mgr.StatusTemplates[k] = v
		}
	}
	// Update credentials if provided
	if payload.Credentials != nil {
		if c, ok := payload.Credentials["farazsms"]; ok {
			mgr.Gateways["farazsms"] = NewFarazSMSGateway(c.Username, c.Password, c.Sender)
		}
		if c, ok := payload.Credentials["kavenegar"]; ok {
			mgr.Gateways["kavenegar"] = NewKavenegarGateway(c.APIKey, c.Sender)
		}
		if c, ok := payload.Credentials["melipayamak"]; ok {
			mgr.Gateways["melipayamak"] = NewMelipayamakGateway(c.Username, c.Password, c.Sender)
		}
		if c, ok := payload.Credentials["smsir"]; ok {
			mgr.Gateways["smsir"] = NewSMSIRGateway(c.APIKey, c.Sender)
		}
		if c, ok := payload.Credentials["ghasedak"]; ok {
			mgr.Gateways["ghasedak"] = NewGhasedakGateway(c.APIKey, c.Sender)
		}
	}
	mgr.mu.Unlock()

	writeJSON(w, http.StatusOK, map[string]string{"status": "success", "message": "تنظیمات پیامک با موفقیت بروزرسانی شد"})
}

// AdminGetSMSGatewayBalance handles GET /api/v1/admin/sms/gateways/balance
func (h *Handler) AdminGetSMSGatewayBalance(w http.ResponseWriter, r *http.Request) {
	mgr := h.service.GetGatewayManager()
	driver := mgr.GetActiveDriver()
	balance, err := driver.GetBalance()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "BALANCE_CHECK_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"gateway_id":   driver.GetID(),
		"gateway_name": driver.GetNameFA(),
		"balance":      balance,
	})
}

// AdminSendTestSMS handles POST /api/v1/admin/sms/test
func (h *Handler) AdminSendTestSMS(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Mobile  string `json:"mobile"`
		Message string `json:"message,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Mobile == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "شماره موبایل تست الزامی است")
		return
	}

	if payload.Message == "" {
		payload.Message = fmt.Sprintf("این یک پیامک تست از فروشگاه ایران مورینگا است.\nزمان: %s", time.Now().Format("15:04:05"))
	}

	del, err := h.service.SendManualSMS(payload.Mobile, payload.Message, nil)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "SEND_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":      "success",
		"message":     "پیامک آزمایشی با موفقیت ارسال شد",
		"delivery_id": del.ID,
	})
}

// AdminSendBulkSMS handles POST /api/v1/admin/sms/bulk
func (h *Handler) AdminSendBulkSMS(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		TargetType string   `json:"target_type"` // "custom_numbers", "all_users"
		Mobiles    []string `json:"mobiles"`
		Message    string   `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Message == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "متن پیامک و لیست شماره‌ها الزامی است")
		return
	}

	if len(payload.Mobiles) == 0 {
		writeError(w, http.StatusBadRequest, "EMPTY_MOBILES", "هیچ شماره موبایلی وارد نشده است")
		return
	}

	success, failed, err := h.service.SendBulkSMS(payload.Mobiles, payload.Message)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "BULK_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":        "success",
		"success_count": success,
		"failed_count":  failed,
		"total_count":   len(payload.Mobiles),
		"message":       fmt.Sprintf("عملیات ارسال گروهی پایان یافت. موفق: %d | ناموفق: %d", success, failed),
	})
}

// AdminSendOrderManualSMS handles POST /api/v1/admin/orders/{orderNumber}/sms
func (h *Handler) AdminSendOrderManualSMS(w http.ResponseWriter, r *http.Request) {
	orderNumber := chi.URLParam(r, "orderNumber")
	var payload struct {
		Recipient string `json:"recipient"`
		Message   string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Recipient == "" || payload.Message == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "شماره گیرنده و متن پیامک الزامی است")
		return
	}

	orderUUID := uuid.New()
	del, err := h.service.SendManualSMS(payload.Recipient, payload.Message, &orderUUID)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "SEND_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":       "success",
		"message":      fmt.Sprintf("پیامک به شماره %s برای سفارش %s با موفقیت ارسال شد", payload.Recipient, orderNumber),
		"delivery_id":  del.ID,
	})
}

// ─── Customer Endpoints ──────────────────────────────────────────────────────

// CustomerGetPreferences handles GET /api/v1/notifications/preferences
func (h *Handler) CustomerGetPreferences(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr != "" {
		if uid, err := uuid.Parse(userIDStr); err == nil {
			prefs := h.service.GetUserPreferences(uid)
			writeJSON(w, http.StatusOK, map[string]interface{}{"preferences": prefs})
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"preferences": []NotificationPreference{}})
}

// CustomerUpdatePreferences handles PUT /api/v1/notifications/preferences
func (h *Handler) CustomerUpdatePreferences(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Channel  Channel       `json:"channel"`
		Category EventCategory `json:"category"`
		Enabled  bool          `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "درخواست نامعتبر است")
		return
	}
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr != "" {
		if uid, err := uuid.Parse(userIDStr); err == nil {
			h.service.SetUserPreference(uid, payload.Channel, payload.Category, payload.Enabled)
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// CustomerSubscribeStockAlert handles POST /api/v1/stock-alerts
func (h *Handler) CustomerSubscribeStockAlert(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		VariantID string `json:"variant_id"`
		Phone     string `json:"phone"`
		Email     string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "درخواست نامعتبر است")
		return
	}
	vID, err := uuid.Parse(payload.VariantID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_VARIANT_ID", "شناسه تنوع کالا نامعتبر است")
		return
	}
	var uid *uuid.UUID
	if userIDStr := r.Header.Get("X-User-ID"); userIDStr != "" {
		if parsed, err := uuid.Parse(userIDStr); err == nil {
			uid = &parsed
		}
	}
	sub, err := h.service.SubscribeStockAlert(uid, payload.Phone, payload.Email, vID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "SUBSCRIPTION_FAILED", err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, sub)
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, code, detail string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"code":   code,
		"detail": detail,
	})
}
