package com.sistemas.sistema_venta.exception;

import java.time.LocalDateTime;
import java.util.Map;

public record ApiError(
        int status,
        String message,
        LocalDateTime timestamp,
        Map<String, String> errors) {

    public static ApiError of(int status, String message, Map<String, String> errors) {
        return new ApiError(status, message, LocalDateTime.now(), errors);
    }

    public static ApiError of(int status, String message) {
        return new ApiError(status, message, LocalDateTime.now(), null);
    }
}
