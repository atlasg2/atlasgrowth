import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { format } from "date-fns";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);

  // Admin User Management
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.sendStatus(403);
    
    const users = await storage.getAllUsers();
    
    // Remove passwords from response
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(sanitizedUsers);
  });
  
  // Create contractor user
  app.post("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.sendStatus(403);
    
    const { username, password, email, firstName, lastName, contractorId, role = "contractor" } = req.body;
    
    // Validate inputs
    if (!username || !password || !email) {
      return res.status(400).json({ message: "Username, password, and email are required" });
    }
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    try {
      // Create user with contractor role
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        role,
        active: true,
        contractorId: contractorId || null,
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  });
  
  // Contractors
  app.get("/api/contractors", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.sendStatus(403);
    
    const contractors = await storage.getAllContractors();
    res.json(contractors);
  });
  
  app.post("/api/contractors", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.sendStatus(403);
    
    const contractor = await storage.createContractor(req.body);
    res.status(201).json(contractor);
  });
  
  app.get("/api/contractors/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    if (req.user.role !== "admin" && req.user.contractorId !== id) {
      return res.sendStatus(403);
    }
    
    const contractor = await storage.getContractor(id);
    if (!contractor) return res.status(404).json({ message: "Contractor not found" });
    
    res.json(contractor);
  });
  
  app.patch("/api/contractors/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    if (req.user.role !== "admin" && req.user.contractorId !== id) {
      return res.sendStatus(403);
    }
    
    const contractor = await storage.updateContractor(id, req.body);
    if (!contractor) return res.status(404).json({ message: "Contractor not found" });
    
    res.json(contractor);
  });
  
  // Contacts
  app.get("/api/contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const contacts = await storage.getContactsByContractor(req.user.contractorId);
    res.json(contacts);
  });
  
  app.post("/api/contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const contact = await storage.createContact({
      ...req.body,
      contractorId: req.user.contractorId
    });
    
    res.status(201).json(contact);
  });
  
  app.get("/api/contacts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const contact = await storage.getContact(id);
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    
    if (contact.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    res.json(contact);
  });
  
  app.patch("/api/contacts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const contact = await storage.getContact(id);
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    
    if (contact.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    const updatedContact = await storage.updateContact(id, req.body);
    res.json(updatedContact);
  });
  
  app.delete("/api/contacts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const contact = await storage.getContact(id);
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    
    if (contact.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    await storage.deleteContact(id);
    res.sendStatus(204);
  });
  
  // Jobs
  app.get("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const jobs = await storage.getJobsByContractor(req.user.contractorId);
    res.json(jobs);
  });
  
  app.get("/api/jobs/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const jobs = await storage.getRecentJobsByContractor(req.user.contractorId, limit);
    res.json(jobs);
  });
  
  app.post("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    // Generate job number
    const jobPrefix = "JOB";
    const timestamp = new Date().getTime().toString().slice(-6);
    const jobNumber = `${jobPrefix}${timestamp}`;
    
    const job = await storage.createJob({
      ...req.body,
      contractorId: req.user.contractorId,
      jobNumber,
    });
    
    // Create activity
    await storage.createActivity({
      contractorId: req.user.contractorId,
      userId: req.user.id,
      type: "job_created",
      description: `New job created: ${job.title}`,
      entityType: "job",
      entityId: job.id,
    });
    
    res.status(201).json(job);
  });
  
  app.get("/api/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const job = await storage.getJob(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    
    if (job.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    res.json(job);
  });
  
  app.patch("/api/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const job = await storage.getJob(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    
    if (job.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    // Check if status is changing to completed
    const oldStatus = job.status;
    const newStatus = req.body.status;
    
    const updatedJob = await storage.updateJob(id, req.body);
    
    // Create activity if status changes to completed
    if (newStatus === "completed" && oldStatus !== "completed") {
      await storage.createActivity({
        contractorId: req.user.contractorId,
        userId: req.user.id,
        type: "job_completed",
        description: `Job #${job.jobNumber} completed`,
        entityType: "job",
        entityId: job.id,
      });
    }
    
    res.json(updatedJob);
  });
  
  app.delete("/api/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const job = await storage.getJob(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    
    if (job.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    await storage.deleteJob(id);
    res.sendStatus(204);
  });
  
  // Appointments
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const appointments = await storage.getAppointmentsByContractor(req.user.contractorId);
    res.json(appointments);
  });
  
  app.get("/api/appointments/today", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const today = new Date();
    const appointments = await storage.getAppointmentsByDate(req.user.contractorId, today);
    res.json(appointments);
  });
  
  app.get("/api/appointments/date/:date", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) return res.status(400).json({ message: "Invalid date" });
    
    const appointments = await storage.getAppointmentsByDate(req.user.contractorId, date);
    res.json(appointments);
  });
  
  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const appointment = await storage.createAppointment({
      ...req.body,
      contractorId: req.user.contractorId,
    });
    
    res.status(201).json(appointment);
  });
  
  app.get("/api/appointments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const appointment = await storage.getAppointment(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    
    if (appointment.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    res.json(appointment);
  });
  
  app.patch("/api/appointments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const appointment = await storage.getAppointment(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    
    if (appointment.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    const updatedAppointment = await storage.updateAppointment(id, req.body);
    res.json(updatedAppointment);
  });
  
  app.delete("/api/appointments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const appointment = await storage.getAppointment(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    
    if (appointment.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    await storage.deleteAppointment(id);
    res.sendStatus(204);
  });
  
  // Invoices
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const invoices = await storage.getInvoicesByContractor(req.user.contractorId);
    res.json(invoices);
  });
  
  app.get("/api/invoices/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const invoices = await storage.getRecentInvoicesByContractor(req.user.contractorId, limit);
    res.json(invoices);
  });
  
  app.post("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    // Generate invoice number
    const invoicePrefix = "INV";
    const timestamp = new Date().getTime().toString().slice(-6);
    const invoiceNumber = `${invoicePrefix}${timestamp}`;
    
    const invoice = await storage.createInvoice({
      ...req.body,
      contractorId: req.user.contractorId,
      invoiceNumber,
    });
    
    // Add activity
    if (invoice.status === "sent") {
      await storage.createActivity({
        contractorId: req.user.contractorId,
        userId: req.user.id,
        type: "invoice_created",
        description: `Invoice #${invoice.invoiceNumber} sent for $${invoice.amount}`,
        entityType: "invoice",
        entityId: invoice.id,
      });
    }
    
    res.status(201).json(invoice);
  });
  
  app.get("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    
    if (invoice.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    res.json(invoice);
  });
  
  app.patch("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    
    if (invoice.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    // Check if status is changing to paid
    const oldStatus = invoice.status;
    const newStatus = req.body.status;
    
    const updatedInvoice = await storage.updateInvoice(id, req.body);
    
    // Create activity if status changes to paid
    if (newStatus === "paid" && oldStatus !== "paid") {
      await storage.createActivity({
        contractorId: req.user.contractorId,
        userId: req.user.id,
        type: "invoice_paid",
        description: `Invoice #${invoice.invoiceNumber} paid - $${invoice.amount}`,
        entityType: "invoice",
        entityId: invoice.id,
      });
    }
    
    res.json(updatedInvoice);
  });
  
  app.delete("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    
    if (invoice.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    await storage.deleteInvoice(id);
    res.sendStatus(204);
  });
  
  // Reviews
  app.get("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const reviews = await storage.getReviewsByContractor(req.user.contractorId);
    res.json(reviews);
  });
  
  app.get("/api/reviews/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
    const reviews = await storage.getRecentReviewsByContractor(req.user.contractorId, limit);
    res.json(reviews);
  });
  
  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const review = await storage.createReview({
      ...req.body,
      contractorId: req.user.contractorId,
    });
    
    // Create activity
    await storage.createActivity({
      contractorId: req.user.contractorId,
      userId: req.user.id,
      type: "review_received",
      description: `New ${review.rating}-star review received`,
      entityType: "review",
      entityId: review.id,
    });
    
    res.status(201).json(review);
  });
  
  app.get("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const review = await storage.getReview(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    
    if (review.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    res.json(review);
  });
  
  app.patch("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const review = await storage.getReview(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    
    if (review.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    const updatedReview = await storage.updateReview(id, req.body);
    res.json(updatedReview);
  });
  
  app.delete("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const review = await storage.getReview(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    
    if (review.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    await storage.deleteReview(id);
    res.sendStatus(204);
  });
  
  // Messages
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const messages = await storage.getMessagesByContractor(req.user.contractorId);
    res.json(messages);
  });
  
  app.get("/api/messages/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const count = await storage.getUnreadMessageCount(req.user.contractorId);
    res.json({ count });
  });
  
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const message = await storage.createMessage({
      ...req.body,
      contractorId: req.user.contractorId,
      userId: req.user.id,
    });
    
    res.status(201).json(message);
  });
  
  app.patch("/api/messages/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const message = await storage.getMessage(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    
    if (message.contractorId !== req.user.contractorId && req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    
    const updatedMessage = await storage.updateMessage(id, req.body);
    res.json(updatedMessage);
  });
  
  // Activities
  app.get("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const activities = await storage.getActivitiesByContractor(req.user.contractorId);
    res.json(activities);
  });
  
  app.get("/api/activities/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const activities = await storage.getRecentActivitiesByContractor(req.user.contractorId, limit);
    res.json(activities);
  });
  
  // Stats
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.contractorId) return res.sendStatus(403);
    
    const stats = await storage.getContractorStats(req.user.contractorId);
    res.json(stats);
  });
  
  // Simple DB test endpoint
  app.get("/api/db-test", async (req, res) => {
    try {
      // Just try to count users - a simple query to test the connection
      const count = await storage.getUserCount();
      res.json({ success: true, message: "Database connection working!", count, timestamp: new Date() });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
