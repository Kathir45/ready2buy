# Ready2Buy Backend - Authentication API

## Base URL
```
http://localhost:8000/api
```

## Authentication Endpoints

### 1. Register New User
**POST** `/auth/register`

Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 2. Login
**POST** `/auth/login`

Request Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 3. Get Current User (Protected)
**GET** `/auth/me`

Headers:
```
Authorization: Bearer <your_access_token>
```

Response:
```json
{
  "id": "uuid-here",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2026-01-10T20:35:00.000Z"
}
```

## How to Use

1. **Register** or **Login** to get an access token
2. Store the token in localStorage: `localStorage.setItem('token', data.access_token)`
3. Include the token in protected API requests:
   ```javascript
   fetch('http://localhost:8000/api/auth/me', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   ```

## Frontend Integration

The Login page now automatically:
- Calls `/auth/login` or `/auth/register`
- Stores the JWT token in localStorage
- Stores user info in localStorage
- Redirects to home page on successful authentication

No Google or Facebook login - only JWT-based email/password authentication.
