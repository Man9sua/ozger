# ozgerupt - Educational Platform

A secure educational platform for ENT (National Testing) preparation with comprehensive security measures.

## 🛡️ Security Features

### ✅ Completed Security Improvements

1. **Backend API Architecture**
   - Moved Supabase API keys to secure backend environment
   - Implemented proper authentication with httpOnly cookies
   - Added comprehensive input validation
   - Rate limiting and CSRF protection

2. **XSS Prevention**
   - Replaced all `innerHTML` usage with secure `createElement`/`textContent`
   - Implemented proper input sanitization
   - Safe DOM manipulation throughout the application

3. **Content Security Policy (CSP)**
   - Strict CSP headers preventing XSS attacks
   - Subresource integrity checks for external scripts
   - Secure resource loading policies

4. **HTTPS Enforcement**
   - HSTS headers for secure connections
   - Automatic HTTPS redirection
   - Secure cookie configuration

5. **Updated Dependencies**
   - Latest Supabase JS library (v2.89.0)
   - Security-focused dependency updates

## 🏗️ Architecture

```
Frontend (Static HTML/CSS/JS)
    ↓ (API calls)
Backend API (Node.js/Express)
    ↓ (Database operations)
Supabase (PostgreSQL)
```

### Backend API Endpoints

- `POST /auth/login` - Secure login with httpOnly cookies
- `POST /auth/register` - User registration with validation
- `GET /api/materials` - Get user learning materials
- `POST /api/materials` - Create new materials (validated)
- `GET /api/favorites` - User favorites
- `GET /api/profile` - User profile data

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
cp env.example .env  # Configure your environment variables
npm start
```

### Frontend Setup

The frontend is a static site that can be served by any web server or deployed to services like Vercel, Netlify, or GitHub Pages.

## 🔒 Security Measures

### Authentication
- JWT tokens stored in httpOnly cookies
- Secure session management
- CSRF protection on sensitive operations

### Data Validation
- Server-side input validation using express-validator
- Sanitization of all user inputs
- Type checking and length limits

### Rate Limiting
- API rate limiting to prevent abuse
- Different limits for different endpoints
- Automatic blocking of suspicious activity

### Monitoring & Logging
- Winston-based logging system
- Audit trails for security events
- Error tracking and monitoring

## 📋 Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Environment Variables
```bash
# Backend (.env)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SESSION_SECRET=your-secure-session-secret
PORT=3001
```

### Testing
```bash
cd backend
npm test
```

## 🔧 Deployment

### Backend
```bash
cd backend
npm run build
npm start
# or for production
NODE_ENV=production npm start
```

### Frontend
Deploy the `ozger project/` directory to any static hosting service.

## 📚 Features

- **Learning Materials**: Create and share educational content
- **Flashcards**: Interactive learning with spaced repetition
- **Quizzes**: Test knowledge with multiple choice questions
- **Progress Tracking**: Monitor learning progress
- **Social Features**: Classmates and rating system
- **Multi-language**: Kazakh, Russian, English support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make security-conscious changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## ⚠️ Security Notice

This application implements multiple layers of security:
- API keys never exposed to frontend
- All inputs validated and sanitized
- XSS prevention through safe DOM manipulation
- CSRF protection on state-changing operations
- Rate limiting to prevent abuse
- Secure cookie configuration
- HTTPS enforcement

Report any security vulnerabilities privately to the maintainers.
