# ozgerupt Backend API

Secure backend API server for the ozgerupt educational platform.

## Features

- 🔐 **Secure Authentication** - JWT-based auth with httpOnly cookies
- 🛡️ **Security First** - Helmet, CORS, CSRF protection, rate limiting
- 📊 **Supabase Integration** - Database operations through secure API
- ✅ **Input Validation** - Comprehensive validation with express-validator
- 📝 **Logging** - Winston-based logging with audit trails
- 🔄 **Session Management** - Secure session handling

## Security Measures

- **API Keys**: Moved from frontend to secure backend environment
- **HTTPS Enforcement**: HSTS headers and secure cookie flags
- **Rate Limiting**: Prevents brute force and DoS attacks
- **CSRF Protection**: Token-based CSRF prevention
- **Input Sanitization**: All inputs validated and sanitized
- **CORS**: Configured for allowed origins only
- **Helmet**: Security headers for all responses

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | No |
| `PORT` | Server port (default: 3001) | No |
| `SESSION_SECRET` | Secret for session encryption | Yes |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No |
| `CORS_ORIGIN` | Allowed CORS origin | No |

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

### Materials
- `GET /api/materials` - Get user materials
- `POST /api/materials` - Create new material

### Favorites
- `GET /api/favorites` - Get user favorites

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Security
- `GET /csrf-token` - Get CSRF token
- `GET /health` - Health check

## Development

```bash
# Run in development mode with auto-restart
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Deployment

1. Set `NODE_ENV=production`
2. Use a reverse proxy (nginx) for HTTPS
3. Set secure cookie flags
4. Configure proper CORS origins
5. Use environment variables for all secrets

## Security Best Practices

- Never commit API keys to version control
- Use HTTPS in production
- Regularly update dependencies
- Monitor logs for suspicious activity
- Implement proper backup strategies
- Use environment-specific configurations
