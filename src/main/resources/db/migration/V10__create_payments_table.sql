CREATE TABLE IF NOT EXISTS payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reference VARCHAR(100),
    created_by BIGINT NOT NULL REFERENCES Users (id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Reminder (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id INT REFERENCES appointment (id_appointment) ON DELETE CASCADE,
    send_time TIMESTAMP,
    status VARCHAR(20) CHECK (
        status IN ('QUEUED', 'SENT', 'FAILED')
    ),
    channel VARCHAR(20) CHECK (
        channel IN ('SMS', 'WHATSAPP')
    )
);