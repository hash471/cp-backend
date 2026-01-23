# Visakhapatnam City Police e-Complaint Service Backend

A NestJS backend API for managing police complaints with authentication, status tracking, and audit logs.

## Features

- **CRUD Operations**: Create, Read, Update, Delete complaints
- **Base64 Authentication**: Simple authentication using Base64 encoded credentials
- **Filtering & Search**: Filter complaints by any field, global search, pagination
- **Status Tracking**: Track complaint status with configurable states
- **Audit Logs**: Automatic logging of all status changes and updates
- **Statistics**: Get complaint counts by status
- **Police Stations**: Manage police stations with GPS coordinates
- **Nearest Station**: Find nearest police station by location
- **Database Seeding**: Pre-populated Visakhapatnam police stations data
- **Swagger Documentation**: Interactive API docs at `/docs`

## Installation

```bash
npm install
```

## Database Seeding

Seed the database with sample Visakhapatnam police stations:

```bash
# Seed data (skips if data exists)
npm run seed

# Force re-seed (clears existing data)
npm run seed:force
```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

**Swagger Documentation**: `http://localhost:3000/docs`

## Authentication

All endpoints require Basic Authentication. Pass credentials as Base64 encoded `username:password` in the Authorization header.

**Default Credentials:**
- `admin:admin123`
- `officer:officer123`

**Header Format:**
```
Authorization: Basic <base64(username:password)>
```

Example for `admin:admin123`:
```
Authorization: Basic YWRtaW46YWRtaW4xMjM=
```

## API Endpoints

### Complaints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints` | Create a new complaint |
| GET | `/api/complaints` | Get all complaints (with filters) |
| GET | `/api/complaints/stats` | Get complaint statistics by status |
| GET | `/api/complaints/:id` | Get a single complaint by ID |
| GET | `/api/complaints/by-number/:complaintNumber` | Get complaint by number |
| PATCH | `/api/complaints/:id` | Update a complaint |
| PATCH | `/api/complaints/:id/status` | Update complaint status |
| GET | `/api/complaints/:id/logs` | Get all logs for a complaint |
| DELETE | `/api/complaints/:id` | Delete a complaint |

### Query Parameters for GET /api/complaints

| Parameter | Type | Description |
|-----------|------|-------------|
| `complaintNumber` | string | Filter by complaint number (partial match) |
| `language` | string | Filter by language |
| `policeStation` | string | Filter by police station |
| `citizenName` | string | Filter by citizen name |
| `mobileNumber` | string | Filter by mobile number |
| `aadharNumber` | string | Filter by Aadhar number |
| `fatherOrMotherName` | string | Filter by parent name |
| `permanentAddress` | string | Filter by permanent address |
| `presentAddress` | string | Filter by present address |
| `pincode` | string | Filter by pincode |
| `locationOfIncident` | string | Filter by incident location |
| `complaintSummary` | string | Filter by complaint summary |
| `status` | enum | Filter by status |
| `createdAfter` | date | Filter complaints created after date |
| `createdBefore` | date | Filter complaints created before date |
| `search` | string | Global search across multiple fields |
| `sortBy` | string | Sort by field (default: createdAt) |
| `sortOrder` | ASC/DESC | Sort order (default: DESC) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 100) |

### Complaint Status Values

- `NEW` - Newly created complaint
- `ASSIGNED` - Assigned to an officer
- `IN_PROGRESS` - Investigation in progress
- `REJECTED` - Complaint rejected
- `RESOLVED` - Issue resolved
- `CLOSED` - Case closed

### Police Stations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/police-stations` | No | Get all police stations (with filters) |
| GET | `/api/police-stations/active` | No | Get active police stations only |
| GET | `/api/police-stations/nearest` | No | Find nearest station by coordinates |
| GET | `/api/police-stations/:id` | No | Get station by ID |
| GET | `/api/police-stations/by-code/:code` | No | Get station by code |
| POST | `/api/police-stations` | Yes | Create a new station |
| PATCH | `/api/police-stations/:id` | Yes | Update a station |
| DELETE | `/api/police-stations/:id` | Yes | Delete a station |

### Query Parameters for GET /api/police-stations

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name, code, or address |
| `district` | string | Filter by district |
| `city` | string | Filter by city |
| `isActive` | boolean | Filter by active status |
| `nearLatitude` | number | Latitude for distance calculation |
| `nearLongitude` | number | Longitude for distance calculation |
| `radiusKm` | number | Filter within radius (km)

## Example Requests

### Create Complaint

```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -d '{
    "language": "English",
    "policeStation": "Central Police Station",
    "citizenName": "John Doe",
    "mobileNumber": "9876543210",
    "aadharNumber": "123456789012",
    "fatherOrMotherName": "James Doe",
    "permanentAddress": "123 Main Street",
    "presentAddress": "456 Park Avenue",
    "pincode": "500001",
    "locationOfIncident": "MG Road Junction",
    "complaintSummary": "Theft of mobile phone"
  }'
```

### Update Status

```bash
curl -X PATCH http://localhost:3000/api/complaints/{id}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -d '{
    "status": "ASSIGNED",
    "remarks": "Assigned to Officer Sharma"
  }'
```

### Get Complaints with Filters

```bash
curl -X GET "http://localhost:3000/api/complaints?status=NEW&policeStation=Central&page=1&limit=20" \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM="
```

### Get Complaint Logs

```bash
curl -X GET http://localhost:3000/api/complaints/{id}/logs \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM="
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

For paginated responses:

```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

## Database

The application uses PostgreSQL. Configure the connection via environment variables:

```bash
# Copy the example env file
cp .env.example .env

# Edit with your PostgreSQL credentials
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_USERNAME` | Database username | postgres |
| `DB_PASSWORD` | Database password | postgres |
| `DB_DATABASE` | Database name | complaints |
| `DB_SSL` | Enable SSL connection | false |
| `AUTH_CREDENTIALS` | Comma-separated user:pass pairs | admin:admin123,officer:officer123 |

## Docker

### Build and Run Locally

```bash
# Build the image
docker build -t cp-backend .

# Run with environment variables
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_DATABASE=complaints \
  -e AUTH_CREDENTIALS=admin:admin123 \
  cp-backend
```

## AWS ECS Deployment

The project includes GitHub Actions workflow for automatic deployment to AWS ECS.

### Prerequisites

1. AWS account with ECS, ECR, and RDS set up
2. GitHub repository secrets configured:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### Setup Steps

1. Update `.aws/task-definition.json` with your AWS account ID
2. Create required AWS resources (see [.aws/SETUP.md](.aws/SETUP.md))
3. Push to `main` branch to trigger deployment

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy-ecs.yml`):
1. Runs linting and build tests
2. Builds Docker image
3. Pushes to Amazon ECR
4. Deploys to ECS Fargate

## Project Structure

```
.
├── .aws/
│   ├── task-definition.json    # ECS task definition
│   └── SETUP.md                # AWS setup guide
├── .github/
│   └── workflows/
│       └── deploy-ecs.yml      # CI/CD pipeline
├── src/
│   ├── auth/
│   │   ├── guards/
│   │   │   └── base64-auth.guard.ts
│   │   └── auth.module.ts
│   ├── complaints/
│   │   ├── dto/
│   │   │   ├── create-complaint.dto.ts
│   │   │   ├── update-complaint.dto.ts
│   │   │   ├── filter-complaint.dto.ts
│   │   │   └── update-status.dto.ts
│   │   ├── entities/
│   │   │   ├── complaint.entity.ts
│   │   │   └── complaint-log.entity.ts
│   │   ├── enums/
│   │   │   └── complaint-status.enum.ts
│   │   ├── complaints.controller.ts
│   │   ├── complaints.module.ts
│   │   └── complaints.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env.example                # Environment template
├── Dockerfile                  # Docker build config
└── package.json
```
