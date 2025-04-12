import { 
  users, type User, type InsertUser,
  contractors, type Contractor, type InsertContractor,
  contacts, type Contact, type InsertContact,
  jobs, type Job, type InsertJob,
  appointments, type Appointment, type InsertAppointment,
  invoices, type Invoice, type InsertInvoice,
  reviews, type Review, type InsertReview,
  messages, type Message, type InsertMessage,
  activities, type Activity, type InsertActivity
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, desc, lte, gte } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contractors
  getContractor(id: number): Promise<Contractor | undefined>;
  getContractorBySlug(slug: string): Promise<Contractor | undefined>;
  getAllContractors(): Promise<Contractor[]>;
  createContractor(contractor: InsertContractor): Promise<Contractor>;
  updateContractor(id: number, data: Partial<InsertContractor>): Promise<Contractor | undefined>;
  
  // Contacts
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByContractor(contractorId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Jobs
  getJob(id: number): Promise<Job | undefined>;
  getJobsByContractor(contractorId: number): Promise<Job[]>;
  getRecentJobsByContractor(contractorId: number, limit: number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, data: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  
  // Appointments
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByContractor(contractorId: number): Promise<Appointment[]>;
  getAppointmentsByDate(contractorId: number, date: Date): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Invoices
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByContractor(contractorId: number): Promise<Invoice[]>;
  getRecentInvoicesByContractor(contractorId: number, limit: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Reviews
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByContractor(contractorId: number): Promise<Review[]>;
  getRecentReviewsByContractor(contractorId: number, limit: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Messages
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByContractor(contractorId: number): Promise<Message[]>;
  getUnreadMessageCount(contractorId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, data: Partial<InsertMessage>): Promise<Message | undefined>;
  
  // Activities
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByContractor(contractorId: number): Promise<Activity[]>;
  getRecentActivitiesByContractor(contractorId: number, limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Stats
  getContractorStats(contractorId: number): Promise<{
    activeJobs: number;
    scheduledToday: number;
    pendingInvoicesAmount: number;
    pendingInvoicesCount: number;
    averageRating: number;
    reviewCount: number;
  }>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contractors: Map<number, Contractor>;
  private contacts: Map<number, Contact>;
  private jobs: Map<number, Job>;
  private appointments: Map<number, Appointment>;
  private invoices: Map<number, Invoice>;
  private reviews: Map<number, Review>;
  private messages: Map<number, Message>;
  private activities: Map<number, Activity>;
  
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private contractorIdCounter: number;
  private contactIdCounter: number;
  private jobIdCounter: number;
  private appointmentIdCounter: number;
  private invoiceIdCounter: number;
  private reviewIdCounter: number;
  private messageIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.contractors = new Map();
    this.contacts = new Map();
    this.jobs = new Map();
    this.appointments = new Map();
    this.invoices = new Map();
    this.reviews = new Map();
    this.messages = new Map();
    this.activities = new Map();
    
    this.userIdCounter = 1;
    this.contractorIdCounter = 1;
    this.contactIdCounter = 1;
    this.jobIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.reviewIdCounter = 1;
    this.messageIdCounter = 1;
    this.activityIdCounter = 1;
    
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });

    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123", // Will be hashed in auth.ts
      email: "admin@hvacpro.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      active: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Contractor methods
  async getContractor(id: number): Promise<Contractor | undefined> {
    return this.contractors.get(id);
  }

  async getContractorBySlug(slug: string): Promise<Contractor | undefined> {
    return Array.from(this.contractors.values()).find(
      (contractor) => contractor.slug === slug,
    );
  }

  async getAllContractors(): Promise<Contractor[]> {
    return Array.from(this.contractors.values());
  }

  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    const id = this.contractorIdCounter++;
    const newContractor: Contractor = { ...contractor, id };
    this.contractors.set(id, newContractor);
    return newContractor;
  }

  async updateContractor(id: number, data: Partial<InsertContractor>): Promise<Contractor | undefined> {
    const contractor = await this.getContractor(id);
    if (!contractor) return undefined;
    
    const updatedContractor = { ...contractor, ...data };
    this.contractors.set(id, updatedContractor);
    return updatedContractor;
  }

  // Contact methods
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsByContractor(contractorId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(
      (contact) => contact.contractorId === contractorId,
    );
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.contactIdCounter++;
    const newContact: Contact = { ...contact, id };
    this.contacts.set(id, newContact);
    return newContact;
  }

  async updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = await this.getContact(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...data };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // Job methods
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobsByContractor(contractorId: number): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter((job) => job.contractorId === contractorId);
  }

  async getRecentJobsByContractor(contractorId: number, limit: number): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter((job) => job.contractorId === contractorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const newJob: Job = { 
      ...job, 
      id, 
      createdAt: job.createdAt || new Date() 
    };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJob(id: number, data: Partial<InsertJob>): Promise<Job | undefined> {
    const job = await this.getJob(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...data };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByContractor(contractorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter((appointment) => appointment.contractorId === contractorId);
  }

  async getAppointmentsByDate(contractorId: number, date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.appointments.values())
      .filter((appointment) => 
        appointment.contractorId === contractorId &&
        new Date(appointment.startTime) >= startOfDay &&
        new Date(appointment.startTime) <= endOfDay
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const newAppointment: Appointment = { ...appointment, id };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = await this.getAppointment(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...data };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByContractor(contractorId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter((invoice) => invoice.contractorId === contractorId);
  }

  async getRecentInvoicesByContractor(contractorId: number, limit: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter((invoice) => invoice.contractorId === contractorId)
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, limit);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const newInvoice: Invoice = { ...invoice, id };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...data };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Review methods
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByContractor(contractorId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter((review) => review.contractorId === contractorId);
  }

  async getRecentReviewsByContractor(contractorId: number, limit: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter((review) => review.contractorId === contractorId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const newReview: Review = { 
      ...review, 
      id, 
      date: review.date || new Date() 
    };
    this.reviews.set(id, newReview);
    return newReview;
  }

  async updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined> {
    const review = await this.getReview(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, ...data };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByContractor(contractorId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.contractorId === contractorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getUnreadMessageCount(contractorId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter((message) => message.contractorId === contractorId && !message.isRead)
      .length;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const newMessage: Message = { 
      ...message, 
      id, 
      timestamp: message.timestamp || new Date() 
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async updateMessage(id: number, data: Partial<InsertMessage>): Promise<Message | undefined> {
    const message = await this.getMessage(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, ...data };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByContractor(contractorId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.contractorId === contractorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getRecentActivitiesByContractor(contractorId: number, limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.contractorId === contractorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const newActivity: Activity = { 
      ...activity, 
      id, 
      timestamp: activity.timestamp || new Date() 
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Stats
  async getContractorStats(contractorId: number): Promise<{
    activeJobs: number;
    scheduledToday: number;
    pendingInvoicesAmount: number;
    pendingInvoicesCount: number;
    averageRating: number;
    reviewCount: number;
  }> {
    // Active jobs count
    const activeJobs = Array.from(this.jobs.values())
      .filter(job => 
        job.contractorId === contractorId && 
        (job.status === 'scheduled' || job.status === 'in_progress')
      ).length;
    
    // Scheduled today count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const scheduledToday = Array.from(this.appointments.values())
      .filter(apt => 
        apt.contractorId === contractorId && 
        new Date(apt.startTime) >= today && 
        new Date(apt.startTime) < tomorrow
      ).length;
    
    // Pending invoices
    const pendingInvoices = Array.from(this.invoices.values())
      .filter(inv => 
        inv.contractorId === contractorId && 
        (inv.status === 'sent' || inv.status === 'overdue')
      );
    
    const pendingInvoicesAmount = pendingInvoices.reduce((sum, inv) => 
      sum + Number(inv.amount), 0);
    
    const pendingInvoicesCount = pendingInvoices.length;
    
    // Average rating
    const reviews = Array.from(this.reviews.values())
      .filter(review => review.contractorId === contractorId);
    
    const reviewCount = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
    
    return {
      activeJobs,
      scheduledToday,
      pendingInvoicesAmount,
      pendingInvoicesCount,
      averageRating,
      reviewCount
    };
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });

    // Initialize the admin user if it doesn't exist
    this.initializeAdmin().catch(err => {
      console.error("Failed to initialize admin user:", err);
    });
  }

  private async initializeAdmin() {
    const admin = await this.getUserByUsername("admin");
    if (!admin) {
      // Create admin user with password that will be hashed in auth.ts
      try {
        await this.createUser({
          username: "admin",
          password: "admin123", // Will be hashed in auth.ts
          email: "admin@hvacpro.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          active: true,
          contractorId: null,
        });
        console.log("Admin user created successfully");
      } catch (error) {
        console.error("Error creating admin user:", error);
      }
    }
  }

  // Auth methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Contractor methods
  async getContractor(id: number): Promise<Contractor | undefined> {
    const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
    return contractor;
  }

  async getContractorBySlug(slug: string): Promise<Contractor | undefined> {
    const [contractor] = await db.select().from(contractors).where(eq(contractors.slug, slug));
    return contractor;
  }

  async getAllContractors(): Promise<Contractor[]> {
    return await db.select().from(contractors);
  }

  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    const [newContractor] = await db.insert(contractors).values(contractor).returning();
    return newContractor;
  }

  async updateContractor(id: number, data: Partial<InsertContractor>): Promise<Contractor | undefined> {
    const [updatedContractor] = await db
      .update(contractors)
      .set(data)
      .where(eq(contractors.id, id))
      .returning();
    return updatedContractor;
  }

  // Contact methods
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContactsByContractor(contractorId: number): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.contractorId, contractorId));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(contacts)
      .set(data)
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    await db.delete(contacts).where(eq(contacts.id, id));
    return true;
  }

  // Job methods
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobsByContractor(contractorId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.contractorId, contractorId));
  }

  async getRecentJobsByContractor(contractorId: number, limit: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.contractorId, contractorId))
      .orderBy(desc(jobs.createdAt))
      .limit(limit);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const newJob = {
      ...job,
      createdAt: job.createdAt || new Date()
    };
    const [createdJob] = await db.insert(jobs).values(newJob).returning();
    return createdJob;
  }

  async updateJob(id: number, data: Partial<InsertJob>): Promise<Job | undefined> {
    const [updatedJob] = await db
      .update(jobs)
      .set(data)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    await db.delete(jobs).where(eq(jobs.id, id));
    return true;
  }

  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentsByContractor(contractorId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.contractorId, contractorId));
  }

  async getAppointmentsByDate(contractorId: number, date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.contractorId, contractorId),
          gte(appointments.startTime, startOfDay),
          lte(appointments.startTime, endOfDay)
        )
      )
      .orderBy(appointments.startTime);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(data)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    await db.delete(appointments).where(eq(appointments.id, id));
    return true;
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoicesByContractor(contractorId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.contractorId, contractorId));
  }

  async getRecentInvoicesByContractor(contractorId: number, limit: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.contractorId, contractorId))
      .orderBy(desc(invoices.issueDate))
      .limit(limit);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(data)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    await db.delete(invoices).where(eq(invoices.id, id));
    return true;
  }

  // Review methods
  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByContractor(contractorId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.contractorId, contractorId));
  }

  async getRecentReviewsByContractor(contractorId: number, limit: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.contractorId, contractorId))
      .orderBy(desc(reviews.date))
      .limit(limit);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const newReview = {
      ...review,
      date: review.date || new Date()
    };
    const [createdReview] = await db.insert(reviews).values(newReview).returning();
    return createdReview;
  }

  async updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined> {
    const [updatedReview] = await db
      .update(reviews)
      .set(data)
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    await db.delete(reviews).where(eq(reviews.id, id));
    return true;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByContractor(contractorId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.contractorId, contractorId))
      .orderBy(desc(messages.timestamp));
  }

  async getUnreadMessageCount(contractorId: number): Promise<number> {
    const result = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.contractorId, contractorId),
          eq(messages.isRead, false)
        )
      );
    return result.length;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage = {
      ...message,
      timestamp: message.timestamp || new Date()
    };
    const [createdMessage] = await db.insert(messages).values(newMessage).returning();
    return createdMessage;
  }

  async updateMessage(id: number, data: Partial<InsertMessage>): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set(data)
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async getActivitiesByContractor(contractorId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.contractorId, contractorId))
      .orderBy(desc(activities.timestamp));
  }

  async getRecentActivitiesByContractor(contractorId: number, limit: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.contractorId, contractorId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity = {
      ...activity,
      timestamp: activity.timestamp || new Date()
    };
    const [createdActivity] = await db.insert(activities).values(newActivity).returning();
    return createdActivity;
  }
  
  // Stats
  async getContractorStats(contractorId: number): Promise<{
    activeJobs: number;
    scheduledToday: number;
    pendingInvoicesAmount: number;
    pendingInvoicesCount: number;
    averageRating: number;
    reviewCount: number;
  }> {
    // Active jobs count
    const activeJobsResult = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.contractorId, contractorId),
          eq(jobs.status, "in_progress")
        )
      );
    const activeJobs = activeJobsResult.length;
    
    // Scheduled appointments today
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const scheduledAppointmentsResult = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.contractorId, contractorId),
          gte(appointments.startTime, startOfDay),
          lte(appointments.startTime, endOfDay)
        )
      );
    const scheduledToday = scheduledAppointmentsResult.length;
    
    // Pending invoices
    const pendingInvoicesResult = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.contractorId, contractorId),
          eq(invoices.status, "sent")
        )
      );
    
    const pendingInvoicesCount = pendingInvoicesResult.length;
    const pendingInvoicesAmount = pendingInvoicesResult.reduce((sum, invoice) => {
      const amount = typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount;
      return sum + Number(amount);
    }, 0);
    
    // Reviews
    const reviewsResult = await db
      .select()
      .from(reviews)
      .where(eq(reviews.contractorId, contractorId));
    
    const reviewCount = reviewsResult.length;
    const totalRating = reviewsResult.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
    
    return {
      activeJobs,
      scheduledToday,
      pendingInvoicesAmount,
      pendingInvoicesCount,
      averageRating,
      reviewCount
    };
  }
}

export const storage = new DatabaseStorage();
