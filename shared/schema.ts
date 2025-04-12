import { pgTable, text, serial, integer, boolean, date, timestamp, numeric, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenant/Contractor table
export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  placeId: text("place_id").unique(), // Google Places ID as unique identifier
  siteUrl: text("site_url"), // Custom site URL for the contractor
  yearFounded: text("year_founded"),
  email: text("email").notNull(),
  phone: text("phone"),
  phoneType: text("phone_type"), // Type of phone (mobile, landline, etc)
  address: text("address"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  rating: text("rating"), // Business rating
  reviewCount: text("review_count"), // Number of reviews
  reviewsLink: text("reviews_link"), // Link to reviews
  workingHours: text("working_hours"), // JSON string of working hours
  acceptsCreditCards: boolean("accepts_credit_cards"),
  logo: text("logo"),
  verifiedLocation: boolean("verified_location"),
  locationLink: text("location_link"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  linkedin: text("linkedin"),
  twitter: text("twitter"),
  website: text("website"),
  websiteTitle: text("website_title"),
  websiteGenerator: text("website_generator"),
  websiteKeywords: text("website_keywords"),
  primaryColor: text("primary_color").default("#2563EB"),
  active: boolean("active").default(true),
  description: text("description"),
  createdById: integer("created_by_id").references(() => users.id),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("contractor"), // admin, contractor, technician, office
  contractorId: integer("contractor_id").references(() => contractors.id),
  active: boolean("active").default(true),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  type: text("type").default("residential"), // residential, commercial
  companyName: text("company_name"),
  notes: text("notes"),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobNumber: text("job_number").notNull(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("estimate"), // estimate, scheduled, in_progress, completed, cancelled
  type: text("type").notNull(), // ac_repair, ac_maintenance, heating_repair, etc.
  createdAt: timestamp("created_at").defaultNow(),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  notes: text("notes"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).default("0"),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").default("pending"), // pending, confirmed, completed, cancelled
  assignedToId: integer("assigned_to_id").references(() => users.id),
  location: text("location"),
  notes: text("notes"),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  status: text("status").default("draft"), // draft, sent, paid, overdue, cancelled
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  paymentMethod: text("payment_method"),
  paymentDate: date("payment_date"),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  serviceType: text("service_type"),
  date: timestamp("date").defaultNow(),
  verified: boolean("verified").default(false),
  response: text("response"),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
  type: text("type").default("chat"), // chat, email, sms
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // invoice_paid, job_completed, review_received, job_created, message_received
  description: text("description").notNull(),
  entityType: text("entity_type"), // invoice, job, review, message
  entityId: integer("entity_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Define insert schemas
export const insertContractorSchema = createInsertSchema(contractors).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });

// Define types
export type InsertContractor = z.infer<typeof insertContractorSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Contractor = typeof contractors.$inferSelect;
export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Activity = typeof activities.$inferSelect;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
