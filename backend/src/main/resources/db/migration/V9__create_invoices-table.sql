CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    patient_id BIGINT NOT NULL REFERENCES patients (id),
    appointment_id BIGINT NOT NULL REFERENCES appointments (id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    created_by BIGINT NOT NULL REFERENCES Users (id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

