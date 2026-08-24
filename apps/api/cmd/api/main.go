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
	"moringalab/api/internal/account"
	"moringalab/api/internal/admin"
	"moringalab/api/internal/audit"
	"moringalab/api/internal/carts"
	"moringalab/api/internal/catalog"
	"moringalab/api/internal/chatbot"
	"moringalab/api/internal/checkout"
	"moringalab/api/internal/content"
	"moringalab/api/internal/identity"
	"moringalab/api/internal/inventory"
	"moringalab/api/internal/invoices"
	"moringalab/api/internal/localization"
	"moringalab/api/internal/media"
	"moringalab/api/internal/notifications"
	"moringalab/api/internal/orders"
	"moringalab/api/internal/outbox"
	"moringalab/api/internal/payments"
	"moringalab/api/internal/platform/config"
	"moringalab/api/internal/platform/database"
	"moringalab/api/internal/platform/health"
	"moringalab/api/internal/platform/middleware"
	"moringalab/api/internal/promotions"
	"moringalab/api/internal/reports"
	"moringalab/api/internal/returns"
	"moringalab/api/internal/reviews"
	"moringalab/api/internal/seo"
	"moringalab/api/internal/shipping"
	"moringalab/api/internal/support"
	"moringalab/api/internal/wishlist"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load configuration", slog.String("error", err.Error()))
		os.Exit(1)
	}

	logger.Info("application starting", slog.String("env", cfg.AppEnv), slog.String("database_url", cfg.SanitizedDatabaseURL()))

	// Initialize Database Connection Pool (pgxpool)
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 10*time.Second)
	db, dbErr := database.ConnectPool(dbCtx, cfg.DatabaseURL)
	dbCancel()
	if dbErr != nil {
		logger.Warn("database connection failed (fallback to in-memory mode)", slog.String("url", cfg.SanitizedDatabaseURL()), slog.String("error", dbErr.Error()))
	} else {
		defer db.Close()
	}

	// Initialize external providers before services that depend on them
	var smsProvider notifications.SMSProvider
	smsProviderEnv := os.Getenv("SMS_PROVIDER")
	if smsProviderEnv == "fake" {
		smsProvider = notifications.NewFakeSMSProvider()
	} else {
		apiKey := os.Getenv("WEBONESMS_API_KEY")
		username := os.Getenv("WEBONESMS_USERNAME")
		sender := os.Getenv("WEBONESMS_SENDER")
		if sender == "" {
			sender = "10002147"
		}
		baseURL := os.Getenv("WEBONESMS_BASE_URL")
		if baseURL == "" {
			baseURL = "https://api.payamakapi.ir/api/v1"
		}
		smsProvider = notifications.NewWebOneSMSProvider(notifications.WebOneSMSConfig{
			Username:      username,
			Password:      os.Getenv("WEBONESMS_PASSWORD"),
			APIKey:        apiKey,
			SenderNumber:  sender,
			BaseURL:       baseURL,
			OTPTemplateID: os.Getenv("WEBONESMS_OTP_TEMPLATE_ID"),
		})
	}

	// Initialize modules
	identityStore := identity.NewMemoryStore()
	otpDelivery := func(phone, code string) error {
		if provider, ok := smsProvider.(interface {
			SendOTP(string, string) (*notifications.SendResult, error)
		}); ok {
			result, err := provider.SendOTP(phone, code)
			if err != nil {
				return err
			}
			if result == nil || result.Status != notifications.SendStatusSent {
				return fmt.Errorf("درگاه پیامک ارسال را تایید نکرد")
			}
			return nil
		}

		result, err := smsProvider.SendSMS(phone, fmt.Sprintf("کد ورود به ایران مورینگا: %s", code))
		if err != nil {
			return err
		}
		if result == nil || result.Status != notifications.SendStatusSent {
			return fmt.Errorf("درگاه پیامک ارسال را تایید نکرد")
		}
		return nil
	}
	identityService := identity.NewService(identityStore, otpDelivery)
	identityHandler := identity.NewHandler(identityService, cfg.AppEnv == "production")

	accountService := account.NewService()
	accountHandler := account.NewHandler(accountService)

	auditService := audit.NewService()

	catalogService := catalog.NewService()
	catalogHandler := catalog.NewHandler(catalogService, auditService)

	contentService := content.NewService()
	contentHandler := content.NewHandler(contentService)

	promotionsService := promotions.NewService()
	cartService := carts.NewService(catalogService, promotionsService)
	cartHandler := carts.NewHandler(cartService)

	fakeEmailProvider := notifications.NewFakeEmailProvider()
	notificationsService := notifications.NewService(smsProvider, fakeEmailProvider)
	notificationsHandler := notifications.NewHandler(notificationsService)

	inventoryService := inventory.NewService()
	ordersService := orders.NewService()
	ordersService.SetNotifier(notificationsService)

	paymentsService := payments.NewService(ordersService)
	paymentsService.SetNotifier(notificationsService)

	shippingService := shipping.NewService(ordersService, paymentsService)
	returnsService := returns.NewService(ordersService)
	shippingHandler := shipping.NewHandler(shippingService, returnsService)

	checkoutService := checkout.NewService(cartService, inventoryService, ordersService, paymentsService, shippingService)
	checkoutService.SetNotifier(notificationsService)
	checkoutHandler := checkout.NewHandler(checkoutService, paymentsService)

	promotionsHandler := promotions.NewHandler(promotionsService)

	ordersHandler := orders.NewHandler(ordersService)

	invoicesService := invoices.NewService(ordersService)
	invoicesHandler := invoices.NewHandler(invoicesService)

	adminService := admin.NewService(auditService, ordersService, inventoryService)
	adminHandler := admin.NewHandler(adminService, auditService)

	reviewsService := reviews.NewService(ordersService)
	wishlistService := wishlist.NewService()
	reviewsHandler := reviews.NewHandler(reviewsService, wishlistService, catalogService)

	localizationHandler := localization.NewHandler()

	mediaStorage := media.NewFakeStorage()
	mediaService := media.NewService(mediaStorage)
	mediaHandler := media.NewHandler(mediaService)

	outboxWorker := outbox.NewWorker(logger)
	outboxWorker.EnqueueEvent("SYSTEM_BOOTSTRAP", `{"version":"1.0.0"}`)

	seoService := seo.NewService("https://moringano.ir", catalogService, contentService, reviewsService)
	seoHandler := seo.NewHandler(seoService)

	supportService := support.NewService(ordersService)
	supportHandler := support.NewHandler(supportService)

	fakeLLM := chatbot.NewFakeLLMProvider()
	chatbotService := chatbot.NewService(catalogService, contentService, supportService, fakeLLM)
	chatbotHandler := chatbot.NewHandler(chatbotService)

	reportsService := reports.NewService(ordersService, inventoryService, promotionsService)
	reportsHandler := reports.NewHandler(reportsService)

	// Seed data
	seeds.PopulateSeedData(catalogService, contentService)
	seeds.PopulateDemoArticlesSeed(contentService)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.CORS)
	r.Use(middleware.Recoverer(logger))

	healthHandler := health.NewHealthHandler()
	r.Get("/health/live", healthHandler.Liveness)
	r.Get("/health/ready", healthHandler.Readiness)

	// Dynamic Sitemap & Robots.txt
	r.Get("/sitemap.xml", seoHandler.ServeSitemap)
	r.Get("/robots.txt", seoHandler.ServeRobotsTxt)

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/otp/request", identityHandler.RequestOTP)
		r.Post("/auth/otp/verify", identityHandler.VerifyOTP)
		r.Post("/auth/logout", identityHandler.Logout)
		r.Post("/auth/logout-all", identityHandler.LogoutAll)
		r.Get("/me", identityHandler.GetMe)

		// Account & Address Routes
		r.Get("/account/profile", accountHandler.GetProfile)
		r.Get("/account/addresses", accountHandler.ListAddresses)
		r.Post("/account/addresses", accountHandler.CreateAddress)
		r.Post("/account/addresses/{id}/set-default", accountHandler.SetDefaultAddress)
		r.Delete("/account/addresses/{id}", accountHandler.DeleteAddress)

		// Localization Routes
		r.Get("/localization/provinces", localizationHandler.GetProvinces)

		// Media Routes
		r.Post("/media/upload-session", mediaHandler.CreateUploadSession)
		r.Get("/media/assets", mediaHandler.ListAssets)
		r.Delete("/media/assets/{id}", mediaHandler.DeleteAsset)

		// Notification & Stock Alert Routes (M11 - Customer)
		r.Get("/notifications/preferences", notificationsHandler.CustomerGetPreferences)
		r.Put("/notifications/preferences", notificationsHandler.CustomerUpdatePreferences)
		r.Post("/stock-alerts", notificationsHandler.CustomerSubscribeStockAlert)

		// Support & Channels Routes (M17 - Customer)
		r.Get("/support/channels", supportHandler.GetSupportChannels)
		r.Post("/support/inquiries", supportHandler.CreateInquiry)
		r.Get("/support/inquiries/{ticketNumber}", supportHandler.GetInquiryByTicketNumber)
		r.Get("/support/channels/{id}/whatsapp-url", supportHandler.GetWhatsAppURL)

		// Chatbot Routes (M18 - Customer)
		r.Post("/chatbot/conversations", chatbotHandler.StartConversation)
		r.Post("/chatbot/conversations/{id}/messages", chatbotHandler.SendMessage)
		r.Post("/chatbot/conversations/{id}/handoff", chatbotHandler.RequestHandoff)

		// Promotion Validation Route (M13 - Customer)
		r.Post("/promotions/validate", promotionsHandler.CustomerValidateCoupon)

		// SEO Metadata Route (M16 - Customer)
		r.Get("/seo/metadata", seoHandler.GetSEOMetadata)

		// Catalog Routes
		r.Get("/catalog/categories", catalogHandler.ListCategories)
		r.Get("/catalog/brands", catalogHandler.ListBrands)
		r.Get("/catalog/attributes", catalogHandler.ListAttributes)
		r.Get("/catalog/products", catalogHandler.SearchProducts)
		r.Get("/catalog/products/{slug}", catalogHandler.GetProductBySlug)

		// Reviews & Q&A Routes (M14 - Public)
		r.Get("/catalog/products/{slug}/reviews", reviewsHandler.GetProductReviews)
		r.Post("/catalog/products/{slug}/reviews", reviewsHandler.AddReview)
		r.Post("/reviews/{id}/vote", reviewsHandler.VoteReview)
		r.Get("/catalog/products/{slug}/questions", reviewsHandler.GetProductQuestions)
		r.Post("/catalog/products/{slug}/questions", reviewsHandler.SubmitQuestion)

		// Content Routes
		r.Get("/content/articles", contentHandler.ListArticles)
		r.Get("/content/articles/{slug}", contentHandler.GetArticleBySlug)
		r.Get("/content/article-categories", contentHandler.ListCategories)
		r.Get("/content/faqs", contentHandler.ListFAQs)

		// Cart Routes
		r.Get("/carts/current", cartHandler.GetCurrentCart)
		r.Post("/carts/current/items", cartHandler.AddItem)

		// Checkout & Payment Routes
		r.Post("/orders", checkoutHandler.SubmitOrder)
		r.Get("/payments/{paymentId}", checkoutHandler.GetPayment)
		r.Post("/payments/{paymentId}/verify", checkoutHandler.VerifyPayment)

		// Customer Order Routes (M10 & M12 Invoice)
		r.Get("/orders/my", ordersHandler.CustomerListOrders)
		r.Get("/orders/{orderNumber}", ordersHandler.CustomerGetOrder)
		r.Post("/orders/{orderNumber}/cancel", ordersHandler.CustomerCancelOrder)
		r.Get("/orders/{orderNumber}/invoice", invoicesHandler.CustomerGetInvoice)

		// Public Tracking & Shipping Quotes (M10)
		r.Get("/tracking/{query}", ordersHandler.PublicTrackOrder)
		r.Post("/order-tracking/lookup", shippingHandler.LookupTracking)
		r.Post("/shipping/quotes", shippingHandler.GetShippingQuotes)

		// Admin Protected Routes (RBAC & Session Enforced)
		r.Group(func(adminRouter chi.Router) {
			adminRouter.Use(middleware.RequireAdminAuth(identityService))

			// Admin Shipping Tariffs (Post & Courier)
			adminRouter.Get("/admin/shipping/tariffs", shippingHandler.AdminGetTariffs)
			adminRouter.Put("/admin/shipping/tariffs", shippingHandler.AdminUpdateTariffs)
			adminRouter.Post("/admin/shipping/tariffs/sync", shippingHandler.AdminSyncTariffs)

			// Admin Dashboard & Operations
			adminRouter.Get("/admin/dashboard/stats", adminHandler.GetDashboardStats)
			adminRouter.Patch("/admin/orders/{orderNumber}/status", adminHandler.FulfillOrder)
			adminRouter.Post("/admin/inventory/adjust", adminHandler.AdjustInventory)
			adminRouter.Get("/admin/audit-logs", adminHandler.ListAuditLogs)

			// Admin Product Management (PROMPT A)
			adminRouter.Get("/admin/products", catalogHandler.AdminListProducts)
			adminRouter.Post("/admin/products", catalogHandler.AdminCreateProduct)
			adminRouter.Get("/admin/products/{id}", catalogHandler.AdminGetProductByID)
			adminRouter.Patch("/admin/products/{id}", catalogHandler.AdminUpdateProduct)
			adminRouter.Post("/admin/products/{id}/publish", catalogHandler.AdminPublishProduct)
			adminRouter.Post("/admin/products/{id}/unpublish", catalogHandler.AdminUnpublishProduct)
			adminRouter.Post("/admin/products/{id}/archive", catalogHandler.AdminArchiveProduct)

			// Admin Customer Management
			adminRouter.Get("/admin/customers", adminHandler.AdminListCustomers)

			// Admin Order Management (M10)
			adminRouter.Get("/admin/orders", ordersHandler.AdminListOrders)
			adminRouter.Post("/admin/orders", ordersHandler.AdminCreateOrder)
			adminRouter.Get("/admin/orders/stats/summary", ordersHandler.AdminGetOrderSummaryStats)
			adminRouter.Get("/admin/orders/notifications/poll", ordersHandler.AdminPollNewOrders)
			adminRouter.Get("/admin/orders/notifications/stream", ordersHandler.AdminOrderNotificationStream)
			adminRouter.Get("/admin/orders/{id}", ordersHandler.AdminGetOrder)
			adminRouter.Patch("/admin/orders/{id}/status", ordersHandler.AdminTransitionStatus)
			adminRouter.Get("/admin/orders/{id}/timeline", ordersHandler.AdminGetTimeline)
			adminRouter.Post("/admin/orders/{id}/notes", ordersHandler.AdminAddNote)

			// Admin Invoices & Export Engine (M12)
			adminRouter.Post("/admin/orders/{orderNumber}/invoice", invoicesHandler.AdminIssueInvoice)
			adminRouter.Get("/admin/invoices/{invoiceNumber}", invoicesHandler.AdminGetInvoice)
			adminRouter.Post("/admin/invoices/{invoiceNumber}/void", invoicesHandler.AdminVoidInvoice)
			adminRouter.Get("/admin/invoices/{invoiceNumber}/print", invoicesHandler.AdminPrintInvoice)
			adminRouter.Post("/admin/exports/orders", invoicesHandler.AdminCreateExportJob)
			adminRouter.Get("/admin/exports/{jobId}", invoicesHandler.AdminGetExportJob)
			adminRouter.Get("/admin/exports/{jobId}/download", invoicesHandler.AdminDownloadExportJob)

			// Admin Promotion Management (M13)
			adminRouter.Get("/admin/promotions/coupons", promotionsHandler.AdminListCoupons)
			adminRouter.Post("/admin/promotions/coupons", promotionsHandler.AdminCreateCoupon)
			adminRouter.Get("/admin/promotions/coupons/{code}", promotionsHandler.AdminGetCoupon)
			adminRouter.Get("/admin/promotions/redemptions", promotionsHandler.AdminListRedemptions)
			adminRouter.Post("/admin/promotions/simulate", promotionsHandler.AdminSimulatePromotion)

			// Admin Reviews & Q&A Moderation Queue (M14)
			adminRouter.Get("/admin/reviews", reviewsHandler.AdminListReviews)
			adminRouter.Patch("/admin/reviews/{id}/status", reviewsHandler.AdminUpdateReviewStatus)
			adminRouter.Post("/admin/reviews/{id}/reply", reviewsHandler.AdminAddOfficialReply)
			adminRouter.Get("/admin/questions", reviewsHandler.AdminListQuestions)
			adminRouter.Patch("/admin/questions/{id}/status", reviewsHandler.AdminUpdateQuestionStatus)
			adminRouter.Post("/admin/questions/{id}/answers", reviewsHandler.AdminAnswerQuestion)

			// Admin Content & Editorial Workflow (M15 & PROMPT B)
			adminRouter.Get("/admin/articles", contentHandler.AdminListArticles)
			adminRouter.Post("/admin/articles", contentHandler.AdminCreateArticle)
			adminRouter.Get("/admin/articles/{id}", contentHandler.AdminGetArticleByID)
			adminRouter.Put("/admin/articles/{id}", contentHandler.AdminUpdateArticle)
			adminRouter.Patch("/admin/articles/{id}", contentHandler.AdminUpdateArticle)
			adminRouter.Post("/admin/articles/{id}/submit-review", contentHandler.AdminSubmitReview)
			adminRouter.Post("/admin/articles/{id}/review", contentHandler.AdminReviewArticle)
			adminRouter.Post("/admin/articles/{id}/publish", contentHandler.AdminPublishArticle)
			adminRouter.Post("/admin/articles/{id}/unpublish", contentHandler.AdminUnpublishArticle)
			adminRouter.Post("/admin/articles/{id}/archive", contentHandler.AdminArchiveArticle)
			adminRouter.Get("/admin/articles/{id}/revisions", contentHandler.AdminListRevisions)
			adminRouter.Post("/admin/articles/{id}/revisions/{revId}/restore", contentHandler.AdminRestoreRevision)
			adminRouter.Post("/admin/faqs", contentHandler.AdminCreateFAQ)

			// Admin SEO & Redirects Management (M16)
			adminRouter.Get("/admin/seo/redirects", seoHandler.AdminListRedirects)
			adminRouter.Post("/admin/seo/redirects", seoHandler.AdminCreateRedirect)
			adminRouter.Delete("/admin/seo/redirects/{id}", seoHandler.AdminDeleteRedirect)
			adminRouter.Get("/admin/seo/404-events", seoHandler.AdminList404Events)

			// Admin Support Center Inbox (M17)
			adminRouter.Get("/admin/support/inquiries", supportHandler.AdminListInquiries)
			adminRouter.Patch("/admin/support/inquiries/{id}", supportHandler.AdminUpdateInquiry)

			// Admin Chatbot Dashboard & Transcripts (M18)
			adminRouter.Get("/admin/chatbot/stats", chatbotHandler.AdminGetStats)
			adminRouter.Post("/admin/chatbot/sync", chatbotHandler.AdminSyncKnowledge)
			adminRouter.Get("/admin/chatbot/conversations", chatbotHandler.AdminListConversations)
			adminRouter.Get("/admin/chatbot/conversations/{id}/messages", chatbotHandler.AdminGetConversationMessages)

			// Admin Financial Reports & Analytics (M20)
			adminRouter.Get("/admin/reports/summary", reportsHandler.GetExecutiveSummary)
			adminRouter.Get("/admin/reports/sales-timeseries", reportsHandler.GetSalesTimeSeries)
			adminRouter.Get("/admin/reports/products", reportsHandler.GetTopSellingProducts)
			adminRouter.Post("/admin/reports/exports", reportsHandler.CreateExportJob)
			adminRouter.Get("/admin/reports/exports/{id}/download", reportsHandler.DownloadExportJob)

			// Admin Notification Center & Iranian SMS Gateway Management (Persian WooCommerce SMS Pro)
			adminRouter.Get("/admin/notifications/deliveries", notificationsHandler.AdminListDeliveries)
			adminRouter.Post("/admin/notifications/deliveries/{id}/retry", notificationsHandler.AdminRetryDelivery)
			adminRouter.Get("/admin/notifications/queue-status", notificationsHandler.AdminGetQueueStatus)
			adminRouter.Get("/admin/notifications/templates", notificationsHandler.AdminListTemplates)
			adminRouter.Post("/admin/notifications/templates/{code}/test", notificationsHandler.AdminTestTemplate)
			adminRouter.Get("/admin/sms/settings", notificationsHandler.AdminGetSMSSettings)
			adminRouter.Put("/admin/sms/settings", notificationsHandler.AdminUpdateSMSSettings)
			adminRouter.Get("/admin/sms/gateways/balance", notificationsHandler.AdminGetSMSGatewayBalance)
			adminRouter.Post("/admin/sms/test", notificationsHandler.AdminSendTestSMS)
			adminRouter.Post("/admin/sms/bulk", notificationsHandler.AdminSendBulkSMS)
			adminRouter.Post("/admin/orders/{orderNumber}/sms", notificationsHandler.AdminSendOrderManualSMS)
		})
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
