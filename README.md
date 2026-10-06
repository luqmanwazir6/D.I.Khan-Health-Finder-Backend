# D.I. Khan Health Finder — Backend REST API

Production-grade, secure Node.js & Express REST API for **D.I. Khan Health Finder** (*"Find the Right Healthcare, Near You"*).

---

## 1. Features & Architectural Highlights

- **ES Modules & Clean Architecture**: Built with Node.js LTS, Express 4.x, and ECMAScript Modules (`"type": "module"`).
- **MongoDB & Mongoose**: Full schema-level enforcement, compound indexes, text indexes for search, and unique atomic partial indexes preventing appointment double-booking.
- **Strict Serialization**: Every resource is serialized with string `id` (never `_id`, never `__v`), passwords stripped, and strict camelCase naming.
- **Multi-Role Access Control (RBAC)**: Distinct permissions for `patient`, `doctor`, and `admin`.
- **Security Suite**:
  - `helmet` security headers.
  - Strict CORS allow-listing supporting comma-separated domains (`CLIENT_URL`).
  - NoSQL query injection sanitization.
  - Express rate limiting (global + stricter auth limiter on `/auth`).
  - Safe regex escaping for free-text search.
  - `bcryptjs` password hashing with configurable salt rounds.
  - Centralized error handler without stack trace leakage in production.
- **Interactive Documentation**: Swagger UI served natively at `http://localhost:5000/api/docs`.
- **In-Memory Testing**: Complete integration test suite powered by Jest, Supertest, and `mongodb-memory-server`.

---

## 2. Directory Structure

```
server/
├── .env
├── .env.example
├── package.json
├── README.md
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── constants.js
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── appointmentController.js
│   │   ├── authController.js
│   │   ├── clinicController.js
│   │   ├── doctorController.js
│   │   ├── emergencyController.js
│   │   ├── facilityControllerFactory.js
│   │   ├── hospitalController.js
│   │   ├── laboratoryController.js
│   │   ├── metaController.js
│   │   ├── pharmacyController.js
│   │   ├── reviewController.js
│   │   └── searchController.js
│   ├── docs/
│   │   └── openapi.json
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   ├── rateLimiters.js
│   │   ├── sanitize.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Appointment.js
│   │   ├── Clinic.js
│   │   ├── Doctor.js
│   │   ├── facilityBaseSchema.js
│   │   ├── Hospital.js
│   │   ├── Laboratory.js
│   │   ├── Pharmacy.js
│   │   ├── Review.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── clinicRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── emergencyRoutes.js
│   │   ├── healthRoutes.js
│   │   ├── hospitalRoutes.js
│   │   ├── index.js
│   │   ├── laboratoryRoutes.js
│   │   ├── metaRoutes.js
│   │   ├── pharmacyRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── searchRoutes.js
│   ├── seeds/
│   │   └── seed.js
│   ├── services/
│   │   ├── appointmentService.js
│   │   ├── ratingService.js
│   │   └── tokenService.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── apiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── escapeRegex.js
│   │   ├── queryBuilder.js
│   │   ├── schemaHelper.js
│   │   └── slugify.js
│   └── validators/
│       ├── adminValidators.js
│       ├── appointmentValidators.js
│       ├── authValidators.js
│       ├── doctorValidators.js
│       ├── facilityValidators.js
│       └── reviewValidators.js
└── tests/
    ├── admin.test.js
    ├── appointments.test.js
    ├── auth.test.js
    ├── doctors.test.js
    ├── facilities.test.js
    ├── health.test.js
    ├── reviews.test.js
    └── setup.js
```

---

## 3. Installation & Setup

### 3.1 Install Dependencies
```bash
cd server
npm install
```

### 3.2 Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure your MongoDB connection string is set:
```env
# Local MongoDB Community / MongoDB Compass
MONGODB_URI=mongodb://127.0.0.1:27017/dikhan-health-finder

# Or MongoDB Atlas Cloud
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/dikhan-health-finder?retryWrites=true&w=majority

PORT=5000
JWT_SECRET=super_secret_jwt_signing_key_dikhan_health_platform_2025_32chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173,http://localhost:3000
```

---

## 4. Database Seeding & Running

### 4.1 Seed Realistic D.I. Khan Healthcare Data
Populates administrators, doctors, clinics, DHQ & Mufti Mahmood teaching hospitals, pharmacies, laboratories, reviews, and appointments:
```bash
npm run seed
```
To purge/wipe all seeded data:
```bash
npm run seed:destroy
```

### 4.2 Start Server
- **Development Mode (with Nodemon auto-reload)**:
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

Server will start on:
* **API Root**: `http://localhost:5000/api/v1`
* **Health Check**: `http://localhost:5000/api/v1/health`
* **Interactive Swagger Documentation**: `http://localhost:5000/api/docs`

### 4.3 Run Automated Tests
Executes the full suite with an in-memory database (no real MongoDB instance required):
```bash
npm test
```

---

## 5. Connecting MongoDB Compass

1. Open **MongoDB Compass**.
2. In the "New Connection" field, enter:
   ```
   mongodb://127.0.0.1:27017
   ```
3. Click **Connect**.
4. You will see the database named `dikhan-health-finder` with all populated collections (`users`, `doctors`, `clinics`, `hospitals`, `pharmacies`, `laboratories`, `reviews`, `appointments`).

---

## 6. Example cURL Requests for Main User Flows

### 1. Register a Patient
```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hamza Ali",
    "email": "hamza@example.com",
    "phone": "03001234567",
    "password": "Password123!",
    "role": "patient"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hamza@example.com",
    "password": "Password123!"
  }'
```

### 3. Search Doctors with Filters
```bash
curl -X GET "http://localhost:5000/api/v1/doctors?specialty=Cardiology&area=Faridabad&minRating=4&page=1&limit=10"
```

### 4. Check Doctor Available Slots
```bash
curl -X GET "http://localhost:5000/api/v1/doctors/dr-farhan-khan/slots?date=2026-10-12"
```

### 5. Book an Appointment
```bash
curl -X POST http://localhost:5000/api/v1/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "doctorId": "<DOCTOR_OBJECT_ID>",
    "date": "2026-10-12",
    "startTime": "16:00",
    "reason": "Blood pressure and heart checkup"
  }'
```

### 6. Leave a Review
```bash
curl -X POST http://localhost:5000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "targetType": "doctor",
    "targetId": "<DOCTOR_OBJECT_ID>",
    "rating": 5,
    "comment": "Doctor was very professional and attentive."
  }'
```
