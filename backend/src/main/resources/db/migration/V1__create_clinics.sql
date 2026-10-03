CREATE TABLE IF NOT EXISTS clinics (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    clinic_type VARCHAR(100) NOT NULL CHECK (
        clinic_type IN (
            'GENERAL_PRACTICE',
            'DENTAL',
            'PEDIATRICS',
            'CARDIOLOGY',
            'NEUROLOGY',
            'ORTHOPEDICS',
            'PSYCHIATRY',
            'PHYSIOTHERAPY',
            'DERMATOLOGY',
            'GYNECOLOGY',
            'ENT',
            'OPHTHALMOLOGY',
            'OTHER'
        )
    ),
    address TEXT NOT NULL,
    phone VARCHAR(14) NOT NULL,
    email VARCHAR(150),
    logo_url VARCHAR(500),
    registration_number VARCHAR(200) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)