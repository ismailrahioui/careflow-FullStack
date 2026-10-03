package com.careflow.billing;

public enum InvoiceStatus {

    UNPAID("Non Payé"),
    PARTIALLY_PAID("partiellement payé"),
    PAID("Payé"),
    CANCELLED("Annuler");

    private final String displayName;

    InvoiceStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
