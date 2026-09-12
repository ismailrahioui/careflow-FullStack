package com.careflow.appointment;

public enum AppointmentStatus {

    SCHEDULED("Médecine Générale"),
    CONFIRMED(""),
    COMPLETED(""),
    CANCELLED(""),
    NO_SHOW("zz");

    private final String displayName;

    AppointmentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

}
