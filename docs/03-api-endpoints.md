# API Endpoints

## Overview

This document catalogs all API endpoints in the EIMS Django backend, organized by module. Each endpoint includes HTTP methods, request/response formats, and authentication requirements.

## Base URL

- **Development**: `http://localhost:8000/api/`
- **Production**: `https://your-domain.com/api/`

## Authentication

All endpoints (except login) require token authentication:

```http
Authorization: Token <token_value>
```

## Users Module Endpoints

### Authentication

#### POST `/api/login`
**Purpose**: User authentication

**Request**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "token": "string",
  "user_id": 1,
  "user_type": "Secretary"
}
```

#### GET `/api/user-info`
**Purpose**: Get current user information
**Auth**: Required

**Response**:
```json
{
  "id": 1,
  "custom_id": 100001,
  "username": "john.doe",
  "email": "john@example.com",
  "user_type": "Secretary",
  "contact_number": "1234567890",
  "first_name": "John",
  "last_name": "Doe",
  "profile_picture": "https://cloudinary.com/..."
}
```

#### POST `/api/change-password`
**Purpose**: Change user password
**Auth**: Required

**Request**:
```json
{
  "current": "old_password",
  "new": "new_password",
  "confirm": "new_password"
}
```

### User Management

#### GET `/api/users`
**Purpose**: List all users (paginated)
**Auth**: Required (Admin only)
**Query Params**: `search`, `user_type`, `department`, `page`, `page_size`

**Response**:
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/users?page=2",
  "previous": null,
  "results": [
    {
      