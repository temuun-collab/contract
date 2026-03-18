import { pgTable, uuid, varchar, text, timestamp, integer, real, pgEnum, boolean, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ============================================
// ENUMS
// ============================================

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "pending",
  "partially_signed",
  "completed",
  "expired",
  "cancelled"
])

export const fieldTypeEnum = pgEnum("field_type", [
  "signature",
  "initials",
  "date",
  "text",
  "checkbox"
])

export const signerStatusEnum = pgEnum("signer_status", [
  "pending",
  "viewed",
  "signed",
  "declined"
])

// ============================================
// USERS TABLE
// ============================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"), // For custom auth, null if using OAuth
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ============================================
// TEMPLATES TABLE
// ============================================

export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  pdfUrl: text("pdf_url"), // URL to stored PDF (e.g., Vercel Blob, S3)
  pdfSize: integer("pdf_size"), // File size in bytes
  pageCount: integer("page_count").default(1),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ============================================
// TEMPLATE FIELDS TABLE (Signature field positions on template)
// ============================================

export const templateFields = pgTable("template_fields", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  type: fieldTypeEnum("type").default("signature").notNull(),
  page: integer("page").notNull().default(1),
  x: real("x").notNull(), // X position (pixels from left)
  y: real("y").notNull(), // Y position (pixels from top)
  width: real("width").notNull().default(200),
  height: real("height").notNull().default(80),
  label: varchar("label", { length: 255 }), // Optional label like "Client Signature"
  required: boolean("required").default(true),
  signerIndex: integer("signer_index").default(0), // Which signer this field is for (0-indexed)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ============================================
// CONTRACTS TABLE (Instance of a template sent for signing)
// ============================================

export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id").references(() => templates.id, { onDelete: "set null" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  pdfUrl: text("pdf_url"), // Original PDF URL
  signedPdfUrl: text("signed_pdf_url"), // Final signed PDF URL
  status: contractStatusEnum("status").default("draft").notNull(),
  message: text("message"), // Optional message to signers
  expiresAt: timestamp("expires_at"), // Optional expiration date
  completedAt: timestamp("completed_at"), // When all signatures collected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ============================================
// SIGNERS TABLE (People who need to sign a contract)
// ============================================

export const signers = pgTable("signers", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  signerIndex: integer("signer_index").notNull().default(0), // Order of signing
  status: signerStatusEnum("status").default("pending").notNull(),
  accessToken: uuid("access_token").defaultRandom().notNull().unique(), // Unique token for signing link
  viewedAt: timestamp("viewed_at"),
  signedAt: timestamp("signed_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 compatible
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ============================================
// CONTRACT FIELDS TABLE (Actual signature fields on a contract instance)
// ============================================

export const contractFields = pgTable("contract_fields", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  signerId: uuid("signer_id").references(() => signers.id, { onDelete: "set null" }),
  type: fieldTypeEnum("type").default("signature").notNull(),
  page: integer("page").notNull().default(1),
  x: real("x").notNull(),
  y: real("y").notNull(),
  width: real("width").notNull().default(200),
  height: real("height").notNull().default(80),
  label: varchar("label", { length: 255 }),
  required: boolean("required").default(true),
  value: text("value"), // The signature data (base64 image or typed text)
  signedAt: timestamp("signed_at"), // When this specific field was signed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ============================================
// AUDIT LOG TABLE (Track all actions for compliance)
// ============================================

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "cascade" }),
  signerId: uuid("signer_id").references(() => signers.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "contract_created", "document_viewed", "signature_added"
  details: jsonb("details"), // Additional context as JSON
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  templates: many(templates),
  contracts: many(contracts),
  auditLogs: many(auditLogs),
}))

export const templatesRelations = relations(templates, ({ one, many }) => ({
  user: one(users, {
    fields: [templates.userId],
    references: [users.id],
  }),
  fields: many(templateFields),
  contracts: many(contracts),
}))

export const templateFieldsRelations = relations(templateFields, ({ one }) => ({
  template: one(templates, {
    fields: [templateFields.templateId],
    references: [templates.id],
  }),
}))

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  template: one(templates, {
    fields: [contracts.templateId],
    references: [templates.id],
  }),
  user: one(users, {
    fields: [contracts.userId],
    references: [users.id],
  }),
  signers: many(signers),
  fields: many(contractFields),
  auditLogs: many(auditLogs),
}))

export const signersRelations = relations(signers, ({ one, many }) => ({
  contract: one(contracts, {
    fields: [signers.contractId],
    references: [contracts.id],
  }),
  fields: many(contractFields),
  auditLogs: many(auditLogs),
}))

export const contractFieldsRelations = relations(contractFields, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractFields.contractId],
    references: [contracts.id],
  }),
  signer: one(signers, {
    fields: [contractFields.signerId],
    references: [signers.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  contract: one(contracts, {
    fields: [auditLogs.contractId],
    references: [contracts.id],
  }),
  signer: one(signers, {
    fields: [auditLogs.signerId],
    references: [signers.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))

// ============================================
// TYPE EXPORTS (for use in your application)
// ============================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Template = typeof templates.$inferSelect
export type NewTemplate = typeof templates.$inferInsert

export type TemplateField = typeof templateFields.$inferSelect
export type NewTemplateField = typeof templateFields.$inferInsert

export type Contract = typeof contracts.$inferSelect
export type NewContract = typeof contracts.$inferInsert

export type Signer = typeof signers.$inferSelect
export type NewSigner = typeof signers.$inferInsert

export type ContractField = typeof contractFields.$inferSelect
export type NewContractField = typeof contractFields.$inferInsert

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
