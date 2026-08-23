package seo

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	seoService *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{seoService: svc}
}

// ─── Public Endpoints ────────────────────────────────────────────────────────

// ServeSitemap handles GET /sitemap.xml
func (h *Handler) ServeSitemap(w http.ResponseWriter, r *http.Request) {
	xmlData, err := h.seoService.GenerateSitemapXML()
	if err != nil {
		http.Error(w, "Error generating sitemap", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(xmlData)
}

// ServeRobotsTxt handles GET /robots.txt
func (h *Handler) ServeRobotsTxt(w http.ResponseWriter, r *http.Request) {
	txt := h.seoService.GenerateRobotsTxt()

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(txt))
}

// GetSEOMetadata handles GET /api/v1/seo/metadata
func (h *Handler) GetSEOMetadata(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		path = "/"
	}

	canonical := h.seoService.GetCanonicalBase() + normalizePath(path)
	meta := SEOMetadata{
		Title:         "فروشگاه سبزینه | فرآورده‌های طبیعی مورینگا",
		Description:   "فروشگاه تخصصی روغن و مکمل‌های ارگانیک مورینگا اولیفرا با گواهی سلامت و اصالت کالا.",
		CanonicalURL:  canonical,
		Robots:        "index, follow",
		OGTitle:       "فروشگاه سبزینه | MoringaLab",
		OGDescription: "مکمل‌ها و فرآورده‌های طبیعی ارگانیک مورینگا",
	}

	writeJSON(w, http.StatusOK, meta)
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// AdminListRedirects handles GET /api/v1/admin/seo/redirects
func (h *Handler) AdminListRedirects(w http.ResponseWriter, r *http.Request) {
	redirects := h.seoService.ListRedirectRules()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"redirects": redirects,
	})
}

// AdminCreateRedirect handles POST /api/v1/admin/seo/redirects
func (h *Handler) AdminCreateRedirect(w http.ResponseWriter, r *http.Request) {
	var payload RedirectRule
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.SourcePath == "" || payload.TargetURL == "" {
		writeError(w, http.StatusBadRequest, "INVALID_INPUT", "آدرس مبدا و مقصد الزامی است")
		return
	}

	payload.CreatedBy = "مدیر سئو"
	rule, err := h.seoService.AddRedirectRule(&payload)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "REDIRECT_ERROR", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, rule)
}

// AdminDeleteRedirect handles DELETE /api/v1/admin/seo/redirects/{id}
func (h *Handler) AdminDeleteRedirect(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "شناسه قانون ریدایرکت معتبر نیست")
		return
	}

	err = h.seoService.DeleteRedirectRule(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// AdminList404Events handles GET /api/v1/admin/seo/404-events
func (h *Handler) AdminList404Events(w http.ResponseWriter, r *http.Request) {
	events := h.seoService.List404Events()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"not_found_events": events,
	})
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
