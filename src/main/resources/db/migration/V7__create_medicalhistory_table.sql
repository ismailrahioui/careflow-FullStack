CREATE TABLE IF NOT EXISTS medical_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    patient_id BIGINT NOT NULL REFERENCES Patients (id) ON DELETE CASCADE,
    consultation_id BIGINT NOT NULL UNIQUE REFERENCES consultations (consultation_id) ON DELETE CASCADE,
    doctor_id BIGINT NOT NULL REFERENCES Users (id),
    diagnosis TEXT,
    symptoms TEXT,
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

