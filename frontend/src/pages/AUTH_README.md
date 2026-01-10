# Authentication Pages

This directory contains the login and sign-up pages for the application.

## Files

### Pages
- **Login.tsx** - User login page with email/password and social login
- **SignUp.tsx** - User registration page with validation and password strength

### Assets (in /public/icons/)
- **logo.svg** - Application logo (120x120px)
- **google.svg** - Google icon for social login (24x24px)
- **github.svg** - GitHub icon for social login (24x24px)
- **hero-illustration.svg** - Hero illustration for auth pages (600x600px)

## Features

### Login Page
- Email/password authentication
- Social login (Google, GitHub)
- Remember me checkbox
- Password visibility toggle
- Forgot password link
- Responsive split-screen design

### Sign Up Page
- User registration form
- Real-time password strength indicator
- Password confirmation validation
- Social signup (Google, GitHub)
- Terms & conditions acceptance
- Responsive split-screen design

## Design System

Both pages follow the application's design system:
- **Background**: `#0A0A0A` (black)
- **Accent**: `#3B82F6` (blue)
- **Font**: Inter (sans-serif)
- **Components**: Reuses existing form inputs, buttons, and utilities

## Usage

Add routes in your router configuration:

```typescript
import { Login, SignUp } from '@/pages';

// In your routes
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<SignUp />} />
```

## Customization

All assets are SVG files that can be easily modified:
- Replace logo.svg with your brand logo
- Update hero-illustration.svg for custom artwork
- Social login icons can be swapped for different providers

## Future Enhancements
- Email verification flow
- OAuth integration
- Two-factor authentication
- Password reset functionality
- Social login callbacks
