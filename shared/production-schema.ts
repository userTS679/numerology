import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, decimal, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with comprehensive profile data
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  createdAtIdx: index("users_created_at_idx").on(table.createdAt),
}));

// User profiles with birth data and preferences
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Birth Information (encrypted)
  dateOfBirth: text("date_of_birth").notNull(), // Encrypted
  timeOfBirth: text("time_of_birth"), // Encrypted, optional
  placeOfBirth: text("place_of_birth").notNull(), // Encrypted
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  timezone: varchar("timezone", { length: 50 }),
  
  // Personal Details
  gender: varchar("gender", { length: 20 }),
  maritalStatus: varchar("marital_status", { length: 30 }),
  occupation: text("occupation"),
  
  // Progressive Profile Data
  careerStage: varchar("career_stage", { length: 50 }),
  mainConcerns: jsonb("main_concerns"), // Array of concerns
  lifeGoals: jsonb("life_goals"),
  pastEvents: jsonb("past_events"), // For validation
  
  // Preferences
  language: varchar("language", { length: 10 }).default('hi-en'),
  notificationPreferences: jsonb("notification_preferences"),
  privacySettings: jsonb("privacy_settings"),
  
  // Consent and Legal
  dataConsent: boolean("data_consent").notNull(),
  consentTimestamp: timestamp("consent_timestamp").notNull(),
  marketingConsent: boolean("marketing_consent").default(false),
  
  // Profile Completion
  profileCompleteness: integer("profile_completeness").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_profiles_user_id_idx").on(table.userId),
  dobIdx: index("user_profiles_dob_idx").on(table.dateOfBirth),
}));

// Generated Kundli charts
export const kundliCharts = pgTable("kundli_charts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid("profile_id").references(() => userProfiles.id, { onDelete: 'cascade' }).notNull(),
  
  // Chart Data
  natalChart: jsonb("natal_chart").notNull(), // Complete birth chart
  vargaCharts: jsonb("varga_charts"), // D9, D10, D12, etc.
  dashaData: jsonb("dasha_data"), // Vimshottari dasha periods
  yogas: jsonb("yogas"), // Detected yogas
  
  // Chart Metadata
  chartType: varchar("chart_type", { length: 50 }).default('natal'),
  calculationMethod: varchar("calculation_method", { length: 50 }).default('swiss_ephemeris'),
  ayanamsa: varchar("ayanamsa", { length: 30 }).default('lahiri'),
  houseSystem: varchar("house_system", { length: 30 }).default('whole_sign'),
  
  // Generation Info
  generatedAt: timestamp("generated_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
  accessCount: integer("access_count").default(0),
}, (table) => ({
  userIdIdx: index("kundli_charts_user_id_idx").on(table.userId),
  generatedAtIdx: index("kundli_charts_generated_at_idx").on(table.generatedAt),
}));

// Astrological readings and interpretations
export const astroReadings = pgTable("astro_readings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  chartId: uuid("chart_id").references(() => kundliCharts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Reading Content
  readingType: varchar("reading_type", { length: 50 }).notNull(), // 'basic', 'detailed', 'compatibility'
  summary: text("summary").notNull(),
  details: jsonb("details").notNull(),
  predictions: jsonb("predictions"),
  remedies: jsonb("remedies"),
  
  // AI Enhancement
  aiEnhanced: boolean("ai_enhanced").default(false),
  aiPromptUsed: text("ai_prompt_used"),
  aiResponse: jsonb("ai_response"),
  
  // Quality Metrics
  confidence: varchar("confidence", { length: 20 }).default('medium'),
  accuracy: integer("accuracy"), // User feedback score
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  chartIdIdx: index("astro_readings_chart_id_idx").on(table.chartId),
  userIdIdx: index("astro_readings_user_id_idx").on(table.userId),
  typeIdx: index("astro_readings_type_idx").on(table.readingType),
}));

// Compatibility analysis
export const compatibilityAnalysis = pgTable("compatibility_analysis", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: uuid("user1_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  user2Id: uuid("user2_id").references(() => users.id, { onDelete: 'cascade' }),
  chart1Id: uuid("chart1_id").references(() => kundliCharts.id, { onDelete: 'cascade' }).notNull(),
  chart2Id: uuid("chart2_id").references(() => kundliCharts.id, { onDelete: 'cascade' }),
  
  // Partner 2 data (if not registered user)
  partner2Name: text("partner2_name"),
  partner2BirthData: jsonb("partner2_birth_data"), // Encrypted birth details
  
  // Compatibility Results
  overallScore: integer("overall_score").notNull(),
  categoryScores: jsonb("category_scores").notNull(), // Love, career, family, etc.
  detailedAnalysis: jsonb("detailed_analysis").notNull(),
  recommendations: jsonb("recommendations"),
  
  // Analysis Metadata
  analysisType: varchar("analysis_type", { length: 50 }).default('standard'),
  methodUsed: varchar("method_used", { length: 100 }).default('vedic_numerology_combined'),
  
  createdAt: timestamp("created_at").defaultNow(),
  sharedWith: jsonb("shared_with"), // User IDs who can view this analysis
}, (table) => ({
  user1IdIdx: index("compatibility_user1_id_idx").on(table.user1Id),
  scoreIdx: index("compatibility_score_idx").on(table.overallScore),
  createdAtIdx: index("compatibility_created_at_idx").on(table.createdAt),
}));

// Chat sessions with persistent history
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Session Data
  sessionName: varchar("session_name", { length: 100 }),
  messages: jsonb("messages").notNull(),
  context: jsonb("context"), // User's chart data for context-aware responses
  
  // Session Metadata
  isActive: boolean("is_active").default(true),
  messageCount: integer("message_count").default(0),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("chat_sessions_user_id_idx").on(table.userId),
  activeIdx: index("chat_sessions_active_idx").on(table.isActive),
  lastMessageIdx: index("chat_sessions_last_message_idx").on(table.lastMessageAt),
}));

// Subscription and payment tracking
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Subscription Details
  plan: varchar("plan", { length: 50 }).notNull(), // 'free', 'monthly', 'yearly'
  status: varchar("status", { length: 30 }).notNull(), // 'active', 'cancelled', 'expired'
  amount: integer("amount"), // In paise for INR
  currency: varchar("currency", { length: 3 }).default('INR'),
  
  // Billing Cycle
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  nextBillingDate: timestamp("next_billing_date"),
  
  // Payment Provider Data
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  
  // Features
  features: jsonb("features").notNull(), // Available features for this plan
  usageStats: jsonb("usage_stats"), // Track usage against limits
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
  statusIdx: index("subscriptions_status_idx").on(table.status),
  endDateIdx: index("subscriptions_end_date_idx").on(table.endDate),
}));

// Payment transactions
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  
  // Payment Details
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default('INR'),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  
  // Provider Data
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
  transactionId: varchar("transaction_id", { length: 100 }),
  
  // Metadata
  description: text("description"),
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
}, (table) => ({
  userIdIdx: index("payments_user_id_idx").on(table.userId),
  statusIdx: index("payments_status_idx").on(table.status),
  createdAtIdx: index("payments_created_at_idx").on(table.createdAt),
}));

// Audit logs for security and compliance
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  
  // Action Details
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }),
  resourceId: varchar("resource_id", { length: 100 }),
  
  // Request Context
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 100 }),
  
  // Result
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKundliChartSchema = createInsertSchema(kundliCharts).omit({
  id: true,
  generatedAt: true,
  lastAccessedAt: true,
  accessCount: true,
});

export const insertCompatibilityAnalysisSchema = createInsertSchema(compatibilityAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type KundliChart = typeof kundliCharts.$inferSelect;
export type InsertKundliChart = z.infer<typeof insertKundliChartSchema>;
export type AstroReading = typeof astroReadings.$inferSelect;
export type CompatibilityAnalysis = typeof compatibilityAnalysis.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;