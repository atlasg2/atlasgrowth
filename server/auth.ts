import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Handle legacy plain text passwords
  if (!stored.includes(".")) {
    return supplied === stored;
  }
  
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (err) {
    console.error("Error comparing passwords:", err);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "hvac-pro-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        if (!user.active) {
          return done(null, false, { message: "Account is inactive" });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Admin-only user registration
  app.post("/api/admin/users", async (req, res, next) => {
    try {
      // Check if the current user is an admin
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create new users" });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Strip password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      next(err);
    }
  });

  // Legacy register endpoint for initial admin setup only
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if there are any users in the system
      const userCount = await storage.getUserCount();
      
      // Only allow registration if there are no users yet (first admin setup)
      if (userCount > 0) {
        return res.status(403).json({ 
          message: "Registration is disabled. Please contact an administrator."
        });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Force the first user to be an admin
      const user = await storage.createUser({
        ...req.body,
        role: "admin",
        password: await hashPassword(req.body.password),
      });

      // Strip password from response
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Strip password from response
        const { password, ...userWithoutPassword } = user;
        
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Strip password from response
    const { password, ...userWithoutPassword } = req.user;
    
    res.json(userWithoutPassword);
  });
  
  // If user is admin, add contractor data
  app.get("/api/user/contractor", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (!req.user.contractorId) {
      return res.status(404).json({ message: "No contractor associated with this user" });
    }
    
    const contractor = await storage.getContractor(req.user.contractorId);
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }
    
    res.json(contractor);
  });
}
