package com.careflow.prescription;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;
import com.careflow.consultation.Consultation;
import com.careflow.consultation.ConsultationNotFoundException;
import com.careflow.consultation.ConsultationRepository;
import com.careflow.patient.Patient;
import com.careflow.patient.PatientNotFoundException;
import com.careflow.patient.PatientRepository;
import com.careflow.user.User;
import com.careflow.user.UserNotFoundException;
import com.careflow.user.UserRepository;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final ClinicRepository clinicRepository;
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;
    private final UserRepository userRepository;

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            PrescriptionItemRepository prescriptionItemRepository,
            ClinicRepository clinicRepository,
            PatientRepository patientRepository,
            ConsultationRepository consultationRepository,
            UserRepository userRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionItemRepository = prescriptionItemRepository;
        this.clinicRepository = clinicRepository;
        this.patientRepository = patientRepository;
        this.consultationRepository = consultationRepository;
        this.userRepository = userRepository;
    }

    public PrescriptionResponse toResponse(Prescription prescription) {
        PrescriptionResponse response = new PrescriptionResponse();
        response.setId(prescription.getId());
        response.setClinicId(prescription.getClinic().getId());
        response.setPatientId(prescription.getPatient().getId());
        response.setConsultationId(prescription.getConsultation().getId());
        if (prescription.getDoctor() != null) {
            response.setDoctorId(prescription.getDoctor().getId());
        }
        if (prescription.getCreated_by() != null) {
            response.setCreatedBy(prescription.getCreated_by().getUsername());
        }
        response.setPrescriptionDate(prescription.getPrescription_date());
        response.setNotes(prescription.getNotes());
        response.setCreatedAt(prescription.getCreatedAt());
        return response;
    }

    public PrescriptionItemResponse toItemResponse(PrescriptionItem item) {
        PrescriptionItemResponse response = new PrescriptionItemResponse();
        response.setId(item.getId());
        response.setPrescriptionId(item.getPrescription().getId());
        response.setMedicationName(item.getMedication_name());
        response.setDosage(item.getDosage());
        response.setFrequency(item.getFrequency());
        response.setDuration(item.getDuration());
        response.setInstructions(item.getInstructions());
        return response;
    }

    @Transactional
    public PrescriptionResponse createPrescription(Long clinicId, PrescriptionCreateRequest request) {
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ClinicNotFoundException("Clinic Not Found"));

        Patient patient = patientRepository.findByIdAndClinicId(request.getPatientId(), clinicId)
                .orElseThrow(() -> new PatientNotFoundException("Patient Not Found"));

        Consultation consultation = consultationRepository.findByIdAndClinicId(request.getConsultationId(), clinicId)
                .orElseThrow(() -> new ConsultationNotFoundException("Consultation Not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User docUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!docUser.getClinic().getId().equals(clinic.getId())) {
            throw new AccessDeniedException("You are not Allowed");
        }

        if (!consultation.getPatient().getId().equals(patient.getId())) {
            throw new IllegalArgumentException("Consultation does not belong to the specified patient");
        }

        if (!consultation.getDoctor().getId().equals(docUser.getId())) {
            throw new AccessDeniedException(
                    "You are not allowed to create a prescription for a consultation that belongs to another doctor");
        }

        Prescription prescription = new Prescription();
        prescription.setClinic(clinic);
        prescription.setPatient(patient);
        prescription.setConsultation(consultation);
        prescription.setDoctor(docUser);
        prescription.setCreated_by(docUser);
        prescription.setPrescription_date(request.getPrescriptionDate());
        prescription.setNotes(request.getNotes());

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        return toResponse(savedPrescription);
    }

    public PrescriptionResponse getPrescriptionById(Long id, Long clinicId) {
        Prescription prescription = prescriptionRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new PrescriptionNotFoundException("Prescription Not Found"));
        return toResponse(prescription);
    }

    public List<PrescriptionResponse> getAllPrescriptions(Long clinicId) {
        List<Prescription> prescriptions = prescriptionRepository.findAllByClinicId(clinicId);
        return prescriptions.stream().map(this::toResponse).toList();
    }

    @Transactional
    public PrescriptionResponse updatePrescription(Long id, Long clinicId, PrescriptionUpdateRequest request) {
        Prescription existingPrescription = prescriptionRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new PrescriptionNotFoundException("Prescription Not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User docUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!docUser.getId().equals(existingPrescription.getDoctor().getId())) {
            throw new AccessDeniedException("You are not allowed to update this prescription");
        }

        existingPrescription.setNotes(request.getNotes());
        Prescription updatedPrescription = prescriptionRepository.save(existingPrescription);
        return toResponse(updatedPrescription);
    }

    @Transactional
    public PrescriptionResponse deletePrescription(Long id, Long clinicId) {
        Prescription existingPrescription = prescriptionRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new PrescriptionNotFoundException("Prescription Not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User docUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!docUser.getId().equals(existingPrescription.getDoctor().getId())) {
            throw new AccessDeniedException("You are not allowed to delete this prescription");
        }

        prescriptionRepository.delete(existingPrescription);
        return toResponse(existingPrescription);
    }

    @Transactional
    public PrescriptionItemResponse addPrescriptionItem(Long prescriptionId, Long clinicId,
            PrescriptionItemRequest request) {
        Prescription prescription = prescriptionRepository.findByIdAndClinicId(prescriptionId, clinicId)
                .orElseThrow(() -> new PrescriptionNotFoundException("Prescription Not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User docUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!docUser.getId().equals(prescription.getDoctor().getId())) {
            throw new AccessDeniedException("You are not allowed to add items to this prescription");
        }

        PrescriptionItem item = new PrescriptionItem();
        item.setPrescription(prescription);
        item.setMedication_name(request.getMedicationName());
        item.setDosage(request.getDosage());
        item.setFrequency(request.getFrequency());
        item.setDuration(request.getDuration());
        item.setInstructions(request.getInstructions());

        PrescriptionItem saved = prescriptionItemRepository.save(item);
        return toItemResponse(saved);
    }

    public List<PrescriptionItemResponse> getPrescriptionItems(Long prescriptionId, Long clinicId) {
        List<PrescriptionItem> items = prescriptionItemRepository
                .findByPrescriptionIdAndPrescriptionClinicId(prescriptionId, clinicId);
        return items.stream().map(this::toItemResponse).toList();
    }

    @Transactional
    public PrescriptionItemResponse deletePrescriptionItem(Long prescriptionId, Long itemId, Long clinicId) {
        Prescription prescription = prescriptionRepository.findByIdAndClinicId(prescriptionId, clinicId)
                .orElseThrow(() -> new PrescriptionNotFoundException("Prescription Not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User docUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!docUser.getId().equals(prescription.getDoctor().getId())) {
            throw new AccessDeniedException("You are not allowed to delete items from this prescription");
        }
        PrescriptionItem item = prescriptionItemRepository.findById(itemId)
                .orElseThrow(() -> new PrescriptionItemNotFoundException("Prescription Item Not Found"));

        if (!item.getPrescription().getId().equals(prescriptionId)) {
            throw new IllegalArgumentException("Item does not belong to this prescription");
        }

        prescriptionItemRepository.delete(item);
        return toItemResponse(item);
    }
}
