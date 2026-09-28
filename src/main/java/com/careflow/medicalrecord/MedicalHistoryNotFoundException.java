package com.careflow.medicalrecord;

public class MedicalHistoryNotFoundException extends RuntimeException {
    public MedicalHistoryNotFoundException(String message) {
        super(message);
    }

}
