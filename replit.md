# Overview

CryptoWallet Pro is a full-stack cryptocurrency wallet application built for managing BEP-20 tokens. The platform provides secure wallet functionality, token swapping through PancakeSwap integration, deposit management, and cryptocurrency news. It features a modern React frontend with TypeScript, Express.js backend, PostgreSQL database with Drizzle ORM, and Replit authentication system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom crypto-themed design system and CSS variables
- **State Management**: TanStack Query (React Query) for server state and API caching
- **Routing**: Wouter for lightweight client-side routing
- **PWA Support**: Service worker implementation with offline caching and manifest.json

## Backend Architecture
- **Framework**: Express.js with TypeScript in ESM module format
- **Authentication**: Replit OpenID Connect (OIDC) integration with Passport.js
- **Session Management**: Express sessions with PostgreSQL session store
- **File Uploads**: Multer middleware for image uploads with file type validation
- **Error Handling**: Centralized error middleware with structured API responses

## Database Design
- **ORM**: Drizzle with PostgreSQL dialect using Neon serverless driver
- **Schema**: Comprehensive tables for users, token configuration, balances, deposits, news, social links, prices, and transactions
- **Sessions**: Dedicated sessions table for authentication state persistence
- **Migrations**: Drizzle Kit for schema management and database migrations

## Authentication & Security
- **Provider**: Replit OIDC authentication with automatic user provisioning
- **Sessions**: Secure HTTP-only cookies with PostgreSQL backing store
- **Authorization**: Route-level authentication middleware protecting API endpoints
- **Wallet Generation**: Automatic wallet address generation for new users

## API Architecture
- **Design**: RESTful API with consistent JSON responses
- **Routes**: Organized route handlers with Express Router
- **Middleware**: Request logging, authentication, file upload, and error handling
- **Validation**: Zod schema validation for request payloads

## Development Setup
- **Monorepo**: Single repository with client, server, and shared directories
- **Path Aliases**: TypeScript path mapping for clean imports (@/, @shared/)
- **Hot Reload**: Vite HMR for frontend and tsx for backend development
- **Build Process**: Separate builds for client (Vite) and server (esbuild)

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, TanStack Query for state management
- **Backend Runtime**: Node.js with Express.js framework and TypeScript
- **Build Tools**: Vite for frontend bundling, esbuild for server compilation

## Database & ORM
- **Database**: PostgreSQL with Neon serverless driver (@neondatabase/serverless)
- **ORM**: Drizzle ORM with PostgreSQL adapter and Drizzle Kit for migrations
- **Session Store**: connect-pg-simple for PostgreSQL session persistence

## Authentication Services
- **Provider**: Replit OpenID Connect authentication
- **Library**: openid-client and passport for OIDC integration
- **Session**: express-session with secure cookie configuration

## UI & Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: Lucide React for consistent iconography
- **Utilities**: class-variance-authority and clsx for conditional styling

## File Upload & Processing
- **Upload Handler**: Multer for multipart form data and file uploads
- **Validation**: File type and size restrictions for image uploads

## Development Tools
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint integration through Vite
- **Development**: Replit-specific plugins for enhanced development experience