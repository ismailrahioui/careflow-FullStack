package com.careflow.clinic;

public enum ClinicType {
    GENERAL_PRACTICE("Médecine Générale"),
    DENTAL("Dentaire"),
    PEDIATRICS("Pédiatrie"),
    CARDIOLOGY("Cardiologie"),
    NEUROLOGY("Neurologie"),
    ORTHOPEDICS("Orthopédie"),
    PSYCHIATRY("Psychiatrie"),
    PHYSIOTHERAPY("Kinésithérapie"),
    DERMATOLOGY("Dermatologie"),
    GYNECOLOGY("Gynécologie"),
    ENT("ORL"),
    OPHTHALMOLOGY("Ophtalmologie"),
    OTHER("Autre");

    private final String displayName;

    ClinicType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
