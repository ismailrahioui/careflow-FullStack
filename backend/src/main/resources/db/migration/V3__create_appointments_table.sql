CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    patient_id BIGINT NOT NULL REFERENCES patients (id),
    appointment_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (
        status IN (
            'SCHEDULED',
            'CONFIRMED',
            'COMPLETED',
            'CANCELLED',
            'NO_SHOW'
        )
    ),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);