package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"moringalab/api/internal/identity"
)

type adminContextKey string

const (
	AdminUserContextKey adminContextKey = "admin_user"
	AdminRoleContextKey adminContextKey = "admin_role"
)

// RequireAdminAuth enforces valid session authentication and optional RBAC permission checks for admin endpoints.
func RequireAdminAuth(identityService *identity.Service, requiredPermissions ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := ""

			// 1. Check session_token cookie
			if cookie, err := r.Cookie("session_token"); err == nil && strings.TrimSpace(cookie.Value) != "" {
				token = strings.TrimSpace(cookie.Value)
			}

			// 2. Check Authorization Bearer header
			if token == "" {
				authHeader := r.Header.Get("Authorization")
				if strings.HasPrefix(authHeader, "Bearer ") {
					token = strings.TrimPrefix(authHeader, "Bearer ")
				}
			}

			// 3. Reject if no token
			if token == "" {
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusUnauthorized)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"code":   "UNAUTHORIZED",
					"detail": "دسترسی به بخش مدیریت نیازمند ورود معتبر است.",
				})
				return
			}

			// 4. Validate session
			user, err := identityService.ValidateSession(token)
			if err != nil || user == nil {
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusUnauthorized)
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"code":   "UNAUTHORIZED",
					"detail": "نشست مدیریت معتبر نیست یا منقضی شده است.",
				})
				return
			}

			// 5. Check permissions if required
			for _, perm := range requiredPermissions {
				if !identityService.HasPermission(user.ID, perm) {
					w.Header().Set("Content-Type", "application/json; charset=utf-8")
					w.WriteHeader(http.StatusForbidden)
					_ = json.NewEncoder(w).Encode(map[string]interface{}{
						"code":   "FORBIDDEN",
						"detail": "شما مجوز دسترسی به این بخش مدیریتی را ندارید.",
					})
					return
				}
			}

			// Attach user to request context
			ctx := context.WithValue(r.Context(), AdminUserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetAuthenticatedUser extracts the authenticated user from context if available.
func GetAuthenticatedUser(ctx context.Context) *identity.User {
	if val := ctx.Value(AdminUserContextKey); val != nil {
		if user, ok := val.(*identity.User); ok {
			return user
		}
	}
	return nil
}

// GetAuthenticatedUserID extracts the user UUID or returns nil.
func GetAuthenticatedUserID(ctx context.Context) *uuid.UUID {
	user := GetAuthenticatedUser(ctx)
	if user != nil {
		return &user.ID
	}
	return nil
}
