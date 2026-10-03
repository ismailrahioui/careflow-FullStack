package com.careflow;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.careflow.appointment.AppointmentNotFoundException;
import com.careflow.audit.AuditLogNotFoundException;
import com.careflow.billing.InvoiceNotFoundException;
import com.careflow.billing.PaymentNotFoundException;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.consultation.ConsultationNotFoundException;
import com.careflow.medicalrecord.MedicalHistoryNotFoundException;
import com.careflow.notification.ReminderNotFoundException;
import com.careflow.patient.PatientNotFoundException;
import com.careflow.prescription.PrescriptionItemNotFoundException;
import com.careflow.prescription.PrescriptionNotFoundException;
import com.careflow.user.UserNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({
            ClinicNotFoundException.class,
            PatientNotFoundException.class,
            AppointmentNotFoundException.class,
            ConsultationNotFoundException.class,
            InvoiceNotFoundException.class,
            PaymentNotFoundException.class,
            ReminderNotFoundException.class,
            AuditLogNotFoundException.class,
            UserNotFoundException.class,
            PrescriptionNotFoundException.class,
            PrescriptionItemNotFoundException.class,
            MedicalHistoryNotFoundException.class
    })
    public ResponseEntity<ApiError> handleNotFound(RuntimeException e) {
        ApiError err = new ApiError();
        err.setStatus(HttpStatus.NOT_FOUND.value());
        err.setMessage(e.getMessage());
        err.setTimestamp(Instant.now());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationErrors(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        ApiError apiError = new ApiError();
        apiError.setStatus(HttpStatus.BAD_REQUEST.value());
        apiError.setMessage("Validation failed");
        apiError.setTimestamp(Instant.now());
        apiError.setErrors(errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(AuthenticationException e) {
        ApiError apiError = new ApiError();
        apiError.setStatus(HttpStatus.UNAUTHORIZED.value());
        apiError.setMessage("Invalid username or password");
        apiError.setTimestamp(Instant.now());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiError);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(AccessDeniedException e) {
        ApiError apiError = new ApiError();
        apiError.setStatus(HttpStatus.FORBIDDEN.value());
        apiError.setMessage("Access denied: You do not have permission to perform this action.");
        apiError.setTimestamp(Instant.now());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(apiError);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(IllegalArgumentException e) {
        ApiError apiError = new ApiError();
        apiError.setStatus(HttpStatus.BAD_REQUEST.value());
        apiError.setMessage(e.getMessage());
        apiError.setTimestamp(Instant.now());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalStateException(IllegalStateException e) {
        ApiError apiError = new ApiError();
        apiError.setStatus(HttpStatus.CONFLICT.value());
        apiError.setMessage(e.getMessage());
        apiError.setTimestamp(Instant.now());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiError);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneralException(Exception e) {
        log.error("Unhandled exception occurred: ", e);
        ApiError apiError = new ApiError();
        apiError.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        apiError.setMessage("An unexpected error occurred. Please try again later.");
        apiError.setTimestamp(Instant.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiError);
    }
}
