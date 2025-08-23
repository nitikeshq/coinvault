import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { storage } from "./storage";
import connectPg from "connect-pg-simple";
import { User as DBUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends DBUser {}
  }
}

export function setupAuth(app: Express) {
  // Session setup
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.set("trust proxy", 1);
  app.use(session({
    secret: process.env.SESSION_SECRET || "crypto-wallet-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Keep false for development
      maxAge: sessionTtl,
      sameSite: 'lax',
      path: '/',
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password login
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (user.authProvider === 'google') {
        return done(null, false, { message: 'Please login with Google' });
      }

      if (!user.password) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      return done(null, user);
    } catch (error) {
      console.error('Login error:', error);
      return done(error);
    }
  }));

  // Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await storage.getUserByGoogleId(profile.id);
        
        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await storage.getUserByEmail(email);
          if (user) {
            // Link Google account to existing user
            await storage.updateUser(user.id, {
              googleId: profile.id,
              authProvider: 'google',
              profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
            });
            return done(null, { ...user, googleId: profile.id });
          }
        }

        // Create new user
        if (email) {
          const newUser = await storage.createUser({
            name: profile.displayName || 'Google User',
            username: email.split('@')[0] + '_' + Date.now(), // Generate unique username
            email,
            authProvider: 'google',
            googleId: profile.id,
            profileImageUrl: profile.photos?.[0]?.value,
            isActive: true,
          });
          return done(null, newUser);
        }

        return done(null, false, { message: 'No email found in Google profile' });
      } catch (error) {
        return done(error);
      }
    }));
  }

  passport.serializeUser((user, done) => {
    done(null, (user as DBUser).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Validation middleware
  const registerValidation = [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone('any').withMessage('Please provide a valid phone number'),
  ];

  const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ];

  // Auth routes
  app.post('/api/register', registerValidation, async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, username, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await storage.createUser({
        name,
        username,
        email,
        password: hashedPassword,
        phone: phone || null,
        authProvider: 'email',
        isActive: true,
      });

      // Auto login after registration
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: 'Registration successful but login failed' });
        }
        res.status(201).json({ user: { ...user, password: undefined } });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/login', loginValidation, (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Passport authentication error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Invalid credentials' });
      }

      req.login(user, (err: any) => {
        if (err) {
          console.error('req.login error:', err);
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json({ user: { ...user, password: undefined } });
      });
    })(req, res, next);
  });

  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/' }),
      (req, res) => {
        res.redirect('/');
      }
    );
  }

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

}

export const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user?.isActive) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

export const requireAdmin = (req: any, res: any, next: any) => {
  console.log('Admin check:', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    isActive: req.user?.isActive,
    isAdmin: req.user?.isAdmin
  });
  
  if (req.isAuthenticated() && req.user?.isActive && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
};