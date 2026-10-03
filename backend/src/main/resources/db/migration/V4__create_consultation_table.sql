CREATE TABLE IF NOT EXISTS consultations (
    consultation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    appointment_id BIGINT NOT NULL REFERENCES appointments (id),
    patient_id BIGINT NOT NULL REFERENCES patients (id),
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
