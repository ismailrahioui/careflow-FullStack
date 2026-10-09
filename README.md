# CareFlow — Clinic Management Platform

**CareFlow** is a full-stack clinic management application built with **Java, Spring Boot, React, and PostgreSQL**. It brings essential clinic workflows together, including patient management, appointment scheduling, consultations, medical records, prescriptions, billing, and payments.

The project focuses on backend business logic, REST API development, authentication and authorization, database management, and clinic-level data isolation.

## Overview

Managing a clinic involves coordinating patient information, appointments, consultations, prescriptions, and financial operations. CareFlow aims to centralize these workflows in one application with a React frontend and a Spring Boot backend.

The application follows a client-server architecture: the frontend communicates with the backend through REST APIs, while the backend handles business rules, security, and database persistence.

## Features

- **Authentication:** JWT-based authentication and BCrypt password hashing.
- **Role-Based Access Control:** Different access permissions for doctors, nurses, and receptionists.
- **Clinic Data Isolation:** Tenant-aware security checks for clinic-scoped resources.
- **Patient Management:** Manage patient records and related information.
- **Appointment Management:** Handle appointments and their lifecycle.
- **Consultations:** Record symptoms, diagnoses, treatments, and consultation notes.
- **Medical History:** Associate medical history records with patients and clinical workflows.
- **Prescriptions:** Manage prescriptions and medication instructions.
- **Billing and Invoices:** Track invoices, amounts paid, and outstanding balances.
- **Payments:** Record payments using supported payment methods and recalculate invoice status.
- **Reminders:** Process scheduled reminders, with email delivery implemented.
- **Notifications:** Application notification functionality with backend realtime support.
- **Audit Logging:** Track important operations for improved traceability.
- **Dashboard and Reports:** Display clinic activity and financial indicators.

## Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Java 21 | Programming language |
| Spring Boot | Backend application framework |
| Spring MVC | REST API development |
| Spring Data JPA | Database persistence |
| Spring Security | Authentication and authorization |
| JJWT | JWT handling |
| BCrypt | Password hashing |
| PostgreSQL | Relational database |
| Flyway | Database schema migrations |
| Bean Validation | Input validation |
| Spring Mail | Email delivery |
| Spring Actuator | Application monitoring |
| Maven | Build and dependency management |

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | User interface |
| Vite | Development server and build tooling |
| React Router | Client-side routing |
| Axios | HTTP communication with the backend |
| React Context API | Shared application state |
| Lucide React | Icons |
| CSS | Styling |

## Architecture

CareFlow separates the frontend, backend, and database responsibilities.

```text
┌─────────────────────────────┐
│       React Frontend        │
│                             │
│ Login, Dashboard, Patients  │
│ Appointments, Consultations │
│ Payments, Reports, Settings│
└──────────────┬──────────────┘
               │
          HTTP / REST
               │
               ▼
┌─────────────────────────────┐
│       Spring Boot API       │
│                             │
│ Controllers                 │
│ Services                    │
│ Repositories                │
│ Security and Validation     │
│ Tenant Isolation            │
│ Audit Logging               │
└──────────────┬──────────────┘
               │
          Spring Data JPA
               │
               ▼
┌─────────────────────────────┐
│          PostgreSQL         │
│                             │
│ Clinics, Users, Patients    │
│ Appointments, Consultations │
│ Prescriptions, Invoices     │
│ Payments, Reminders, Logs   │
└─────────────────────────────┘
```

### Backend design

The backend uses a layered architecture:

1. **Controllers** handle HTTP requests and API responses.
2. **Services** implement business rules and coordinate operations.
3. **Repositories** provide database access through Spring Data JPA.
4. **Entities** represent persistent domain data.
5. **Security components** authenticate requests and enforce authorization and clinic-level access rules.

### Frontend design

The React application communicates with the backend through Axios. An Axios interceptor attaches the JWT to authenticated requests. React Context is used for authentication, language, and notification state, while protected routes control access to frontend pages.

## Security

Security is an important part of CareFlow.

- JWT-based authentication.
- BCrypt password hashing.
- Stateless Spring Security configuration.
- A JWT authentication filter for Bearer tokens.
- Method-level authorization for role-based access control.
- Tenant security checks for clinic-scoped resources.

The clinic isolation model is intended to prevent users from accessing resources belonging to another clinic without authorization.

## Database Management

CareFlow uses PostgreSQL for relational data storage and Flyway for versioned database migrations.

The existing migration history covers the creation and evolution of the clinic, patient, appointment, consultation, user, medical history, prescription, invoice, payment, reminder, and audit-log structures.

Hibernate is configured to validate the database schema rather than generate it automatically. Flyway migrations therefore manage schema changes.

## Business Workflows

### Appointment and consultation

Appointments support the following statuses:

`SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, and `NO_SHOW`.

Consultations connect patients, appointments, clinics, and doctors. Creating a consultation marks the associated appointment as completed.

### Billing and payments

Invoices track their total amount, paid amount, and payment status. Supported invoice statuses include `UNPAID`, `PARTIALLY_PAID`, `PAID`, and `CANCELLED`.

Supported payment methods include `CASH`, `CARD`, and `BANK_TRANSFER`. Payment changes trigger recalculation of the associated invoice's paid amount and status.

### Reminders

The reminder scheduler checks for due reminders every 60 seconds. Email delivery is implemented through Spring Mail. SMS and WhatsApp are represented as supported reminder channels in the domain model, but external provider integrations are not currently implemented.

## Frontend Pages

The existing frontend includes:

- Login
- Dashboard
- Patients
- Appointments
- Consultations
- Payments
- Reports
- Settings

## Testing

The project includes targeted automated tests, including:

- `CareFlowApplicationTests`
- `ReminderServiceTest`
- `TenantSecurityIntegrationTest`

These tests cover selected application behavior. They should not be interpreted as exhaustive test coverage.

## Getting Started

### Prerequisites

Install the following tools:

- Java 21
- Maven
- Node.js and npm
- PostgreSQL

Verify the installations:

```bash
java -version
mvn -version
node -v
npm -v
```

### 1. Clone the repository

```bash
git clone https://github.com/ismailrahioui/careflow-FullStack.git
cd careflow-FullStack
```

### 2. Configure PostgreSQL

Create a database for the application and configure the backend's database connection using the configuration supported by the project.

Ensure that the configured database user has the required permissions for Flyway migrations.

### 3. Configure the backend

Configure the required database credentials, JWT-related settings, and mail settings using the application's supported configuration mechanism.

Do not commit passwords, JWT secrets, SMTP credentials, or other private configuration values to GitHub.

### 4. Start the backend

From the repository root:

```bash
cd backend
mvn spring-boot:run
```

### 5. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Use the frontend URL displayed in the terminal. Ensure that the frontend's API configuration matches the backend address.

> **Note:** Exact environment variable names and configuration requirements should be taken from the current application configuration files. A default administrator account should not be assumed unless one is explicitly configured by the project.

## Current Limitations

- SMS and WhatsApp provider integrations are not implemented.
- Automated test coverage is limited to selected areas.
- Production deployment requires appropriate secret management, HTTPS, database configuration, CORS configuration, monitoring, and security review.
- Deployment automation and containerization should be added if required by the target environment.

## Future Improvements

Potential improvements include:

- Additional service, controller, and integration tests.
- Docker and Docker Compose support.
- Continuous integration with GitHub Actions.
- API documentation with OpenAPI/Swagger.
- Production deployment and monitoring.
- External SMS and WhatsApp integrations.
- More granular authorization and additional security hardening.
- Expanded reporting and appointment scheduling capabilities.

## Author

**Ismail Rahioui**

- GitHub: https://github.com/ismailrahioui
- Repository: https://github.com/ismailrahioui/careflow-FullStack

## License

No license is specified here. Add a license file if you intend to grant others explicit permission to use, modify, and distribute the project.
