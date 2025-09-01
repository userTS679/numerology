# NumenCoach - Numerology & Astrology Application

## Overview

NumenCoach is a full-stack web application that provides numerology readings and compatibility analysis with AI-powered insights. The application targets Indian users aged 40+ and delivers personalized numerology calculations, Vedic astrology integration, and an AI chat interface. Built as a modern React application with Express.js backend, it combines traditional numerology wisdom with contemporary technology to provide accessible spiritual guidance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with **React 18** and **TypeScript**, utilizing modern React patterns including functional components with hooks. The UI framework is **shadcn/ui** with **Radix UI** primitives for accessible, customizable components. **Tailwind CSS** provides utility-first styling with a warm, culturally-appropriate color scheme featuring oranges and earth tones.

**State Management**: Uses React Query (TanStack Query) for server state management and caching, eliminating the need for complex global state solutions. Form handling is implemented with React Hook Form for performance and validation.

**Routing**: Implements client-side routing with Wouter, a lightweight alternative to React Router suitable for single-page applications.

**Component Structure**: Follows atomic design principles with reusable UI components, feature-specific sections, and page-level containers. The Lo Shu Grid component demonstrates custom visualization for numerology data.

### Backend Architecture
The server runs on **Express.js** with **TypeScript**, structured as a REST API serving both data and the built frontend. The architecture follows a service-oriented pattern with clear separation of concerns:

**API Layer**: RESTful endpoints for numerology calculations, compatibility analysis, and chat functionality
**Service Layer**: Business logic for numerology calculations and AI integrations
**Storage Layer**: Abstracted storage interface supporting both in-memory and database implementations

**Development Setup**: Vite handles hot module replacement and development server proxy, with custom middleware for request logging and error handling.

### Data Storage Solutions
**Database**: PostgreSQL with **Drizzle ORM** for type-safe database operations. The schema supports users, numerology readings, compatibility analyses, and chat sessions with JSON fields for complex nested data.

**Session Management**: Uses connect-pg-simple for PostgreSQL-based session storage, enabling persistent user sessions.

**Development Storage**: Implements an in-memory storage adapter for development and testing, allowing rapid prototyping without database dependencies.

### Authentication and Authorization
Currently implements a basic user system with username/password authentication. The storage layer includes user management methods, though the full authentication flow appears to be in development. Session-based authentication is configured but not fully implemented in the current codebase.

## External Dependencies

### Database Services
- **Neon Database** (@neondatabase/serverless): Serverless PostgreSQL database provider for production deployments
- **Drizzle Kit**: Database migration and schema management tools

### AI and Machine Learning
- **Groq SDK**: AI service integration for generating numerology insights and powering the chat interface. Provides fast inference for natural language generation using LLaMA models.

### UI and Styling
- **Radix UI**: Comprehensive primitive component library for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library providing consistent iconography
- **Class Variance Authority**: Utility for creating variant-based component APIs

### Development Tools
- **Vite**: Build tool and development server with hot module replacement
- **TypeScript**: Type safety and enhanced developer experience
- **Replit Integration**: Custom Vite plugins for Replit environment compatibility

### Form and Data Handling
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Schema validation library integrated with Drizzle for runtime type checking
- **Date-fns**: Date manipulation and formatting utilities

### Real-time Features
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates for chat functionality

The application is designed to be deployed on Replit with seamless integration to their development environment, while maintaining compatibility with standard Node.js deployment platforms.