# JWT Authentication Documentation
*Última actualización: 2025-08-08*

## Overview
This document explains how to use JWT authentication with the Hospital Management API.

## Authentication Flow
1. Login to get JWT tokens (access token and refresh token stored in HTTP-only cookies)
2. Access protected routes (tokens are automatically sent with requests)
3. Token refresh happens automatically when the access token expires
4. Logout to invalidate tokens

## How to Test

### 1. Login to Get JWT Tokens
Make a POST request to the login endpoint:

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

Expected response:
```json
{
  "id": 1,
  "uid": 1,
  "pid": 1,
  "nombre": "User Name",
  "email": "your-email@example.com",
  "role": "ADMIN",
  "puesto": "Administrator"
}
```

The response will also include HTTP-only cookies containing the access token and refresh token.

### 2. Access Protected Routes
After login, you can access protected routes without manually adding an Authorization header. The cookies are automatically sent with each request:

```
GET http://localhost:3000/api/pacientes
```

### Example in JavaScript (fetch)
```javascript
// Login to get tokens (stored as HTTP-only cookies)
async function login() {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'your-email@example.com',
      password: 'your-password'
    }),
    credentials: 'include' // Important: This tells fetch to include cookies
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return await response.json(); // Returns user data, tokens are in cookies
}

// Access protected route (cookies are sent automatically)
async function getPacientes() {
  const response = await fetch('http://localhost:3000/api/pacientes', {
    method: 'GET',
    credentials: 'include' // Important: This tells fetch to include cookies
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch pacientes');
  }
  
  return await response.json();
}

// Refresh token when needed
async function refreshToken() {
  const response = await fetch('http://localhost:3000/api/auth/token', {
    method: 'POST',
    credentials: 'include' // Important: This tells fetch to include cookies
  });
  
  if (!response.ok) {
    throw new Error('Token refresh failed');
  }
  
  return true; // New tokens are set as cookies
}

// Logout to invalidate tokens
async function logout() {
  const response = await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    credentials: 'include' // Important: This tells fetch to include cookies
  });
  
  if (!response.ok) {
    console.warn('Logout request failed, but proceeding with local logout');
  }
  
  // Clear any local state
  return true;
}

// Example usage
async function main() {
  try {
    const userData = await login();
    console.log('Logged in as:', userData.nombre);
    
    const pacientes = await getPacientes();
    console.log('Pacientes:', pacientes);
    
    // When you're done
    await logout();
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Example in Postman
1. Create a POST request to http://localhost:3000/api/auth/login
2. Set the Content-Type header to application/json
3. In the request settings, under "Cookies", enable "Automatically handle cookies"
4. Add the login credentials in the request body
5. Send the request - you'll see the cookies being set in the "Cookies" tab
6. Create a new request for the protected route
7. Make sure "Automatically handle cookies" is still enabled
8. Send the request - the cookies will be sent automatically

### Token Refresh
The system automatically refreshes tokens when they expire:

1. When an access token expires, the server returns a 401 Unauthorized response
2. The client automatically makes a request to /api/auth/token to get a new access token
3. If the refresh token is valid, a new access token is issued
4. The original request is retried with the new access token

To manually refresh a token, make a POST request to:
```
POST http://localhost:3000/api/auth/token
```

### Logout
To logout and invalidate tokens, make a POST request to:
```
POST http://localhost:3000/api/auth/logout
```

## Protected Routes
The following routes require authentication:
- All routes under /api/pacientes (requires ENCARGADO role)
- All routes under /api/medicamentos (requires ENCARGADO role)
- All routes under /api/personal (requires ADMIN role)
- All routes under /api/doctores (requires ADMIN or ENCARGADO role)
- All routes under /api/entregas (requires ENCARGADO role)
- GET /api/auth/profile (requires any authenticated user)

## Notes
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- If both tokens are invalid or expired, you'll need to login again
- If you don't have the required role for a route, you'll receive a 403 Forbidden response
- Session inactivity timeout is set to 30 minutes
- Tokens are stored as HTTP-only cookies for enhanced security