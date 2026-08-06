package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"

	"moringalab/api/db/seeds"
	"moringalab/api/internal/carts"
	"moringalab/api/internal/catalog"
	"moringalab/api/internal/checkout"
	"moringalab/api/internal/content"
	"moringalab/api/internal/identity"
	"moringalab/api/internal/inventory"
	"moringalab/api/internal/orders"
	"moringalab/api/internal/payments"
	"moringalab/api/internal/platform/config"
	"moringalab/api/internal/platform/health"
	"moringalab/api/internal/platform/middleware"
	"moringalab/api/internal/promotions"
	"moringalab/api/internal/returns"
	"moringalab/api/internal/shipping"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load configuration", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Initialize modules
	identityStore := identity.NewMemoryStore()
	identityService := identity.NewService(identityStore)
	identityHandler := identity.NewHandler(identityService)

	catalogService := catalog.NewService()
	catalogHandler := catalog.NewHandler(catalogService)

	contentService := content.NewService()
	contentHandler := content.NewHandler(contentService)

	promotionsService := promotions.NewService()
	cartService := carts.NewService(catalogService, promotionsService)
	cartHandler := carts.NewHandler(cartService)

	inventoryService := inventory.NewService()
	ordersService := orders.NewService()
	paymentsService := payments.NewService(ordersService)

	checkoutService := checkout.NewService(cartService, inventoryService, ordersService, paymentsService)
	checkoutHandler := checkout.NewHandler(checkoutService, paymentsService)

	shippingService := shipping.NewService(ordersService, paymentsService)
	returnsService := returns.NewService(ordersService)
	shippingHandler := shipping.NewHandler(shippingService, returnsService)

	// Seed data
	seeds.PopulateSeedData(catalogService, contentService)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.CORS)
	r.Use(middleware.Recoverer(logger))

	healthHandler := health.NewHealthHandler()
	r.Get("/health/live", healthHandler.Liveness)
	r.Get("/health/ready", healthHandler.Readiness)

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/otp/request", identityHandler.RequestOTP)
		r.Post("/auth/otp/verify", identityHandler.VerifyOTP)
		r.Post("/auth/logout", identityHandler.Logout)
		r.Get("/me", identityHandler.GetMe)

		// Catalog Routes
		r.Get("/catalog/categories", catalogHandler.ListCategories)
		r.Get("/catalog/products", catalogHandler.SearchProducts)
		r.Get("/catalog/products/{slug}", catalogHandler.GetProductBySlug)

		// Content Routes
		r.Get("/content/articles", contentHandler.ListArticles)
		r.Get("/content/articles/{slug}", contentHandler.GetArticleBySlug)
		r.Get("/content/faqs", contentHandler.ListFAQs)

		// Cart Routes
		r.Get("/carts/current", cartHandler.GetCurrentCart)
		r.Post("/carts/current/items", cartHandler.AddItem)

		// Checkout & Order Routes
		r.Post("/orders", checkoutHandler.SubmitOrder)
		r.Get("/payments/{paymentId}", checkoutHandler.GetPayment)
		r.Post("/payments/{paymentId}/verify", checkoutHandler.VerifyPayment)

		// Tracking & Return Routes
		r.Post("/order-tracking/lookup", shippingHandler.LookupTracking)
		r.Post("/account/orders/{orderNumber}/returns", shippingHandler.CreateReturn)
	})

	serverAddr := fmt.Sprintf(":%d", cfg.AppPort)
	server := &http.Server{
		Addr:         serverAddr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		logger.Info("starting server", slog.String("addr", serverAddr), slog.String("env", cfg.AppEnv))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", slog.String("error", err.Error()))
		}
	}()

	<-stop
	logger.Info("shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("server forced shutdown", slog.String("error", err.Error()))
	} else {
		logger.Info("server exited cleanly")
	}
}
