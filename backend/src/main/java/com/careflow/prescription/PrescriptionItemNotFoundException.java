package com.careflow.prescription;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class PrescriptionItemNotFoundException extends RuntimeException {
    public PrescriptionItemNotFoundException(String message) {
        super(message);
    }
}
