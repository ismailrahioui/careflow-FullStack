CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    patient_id BIGINT NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    consultation_id BIGINT UNIQUE REFERENCES consultations (consultation_id) ON DELETE CASCADE,
    doctor_id BIGINT NOT NULL REFERENCES Users (id),
    created_by BIGINT REFERENCES Users (id),
    prescription_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescription_item (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prescription_id BIGINT NOT NULL REFERENCES prescriptions (id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT
);