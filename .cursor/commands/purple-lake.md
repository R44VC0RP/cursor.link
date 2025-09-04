# API Endpoint Generator

This command helps create complete REST API endpoints with proper error handling, validation, and TypeScript types.

## Usage
Use this command by typing `/api-endpoint` in Cursor when you need to create a new API route.

## Description
Generates a full-featured API endpoint including:
- Request/response TypeScript interfaces
- Input validation with Zod schemas
- Proper error handling and HTTP status codes
- Database operations (if needed)
- Authentication middleware integration
- OpenAPI/Swagger documentation comments

## Examples

**Creating a user endpoint:**
- Input: "Create a POST endpoint for user registration"
- Generates: Complete API route with validation, password hashing, database insertion, and error handling

**Creating a data endpoint:**
- Input: "Create a GET endpoint to fetch paginated products with filters"
- Generates: Query parameter validation, database queries with pagination, proper response formatting

## Implementation Details

When you use this command, I will:

1. **Create the API route file** in the correct Next.js App Router structure (`app/api/[route]/route.ts`)

2. **Generate TypeScript interfaces** for request/response objects:
```typescript
interface CreateUserRequest {
  email: string
  password: string
  name: string
}

interface CreateUserResponse {
  id: string
  email: string
  name: string
  createdAt: string
}
```

3. **Add Zod validation schemas**:
```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
})
```

4. **Include proper error handling**:
```typescript
try {
  // API logic here
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

5. **Add authentication checks** when needed:
```typescript
const session = await getSession()
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

6. **Include database operations** with proper transaction handling
7. **Add OpenAPI documentation** comments for automatic API docs generation
8. **Implement rate limiting** for public endpoints
9. **Add request logging** and analytics tracking

## Best Practices Included
- RESTful URL patterns and HTTP methods
- Consistent error response formats
- Input sanitization and validation
- SQL injection prevention
- CORS handling when needed
- Response caching headers
- Request/response compression