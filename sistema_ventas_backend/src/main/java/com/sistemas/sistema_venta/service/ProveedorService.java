package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.proveedor.ProveedorRequest;
import com.sistemas.sistema_venta.dto.proveedor.ProveedorResponse;
import com.sistemas.sistema_venta.entity.Proveedor;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.ProveedorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listar() {
        return proveedorRepository.findAllByOrderByRazonSocialAsc().stream().map(Mapper::toProveedorResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProveedorResponse obtener(Long id) {
        return Mapper.toProveedorResponse(getProveedor(id));
    }

    @Transactional
    public ProveedorResponse crear(ProveedorRequest request) {
        if (request.ruc() != null && !request.ruc().isBlank() && proveedorRepository.existsByRuc(request.ruc())) {
            throw new BusinessException("Ya existe un proveedor con ese RUC");
        }
        return Mapper.toProveedorResponse(proveedorRepository.save(toProveedor(new Proveedor(), request)));
    }

    @Transactional
    public ProveedorResponse actualizar(Long id, ProveedorRequest request) {
        Proveedor proveedor = getProveedor(id);
        if (request.ruc() != null && !request.ruc().isBlank()
                && proveedorRepository.existsByRuc(request.ruc())
                && !proveedor.getRuc().equals(request.ruc())) {
            throw new BusinessException("Ya existe un proveedor con ese RUC");
        }
        return Mapper.toProveedorResponse(proveedorRepository.save(toProveedor(proveedor, request)));
    }

    private Proveedor toProveedor(Proveedor proveedor, ProveedorRequest request) {
        proveedor.setRazonSocial(request.razonSocial());
        proveedor.setRuc(request.ruc());
        proveedor.setTelefono(request.telefono());
        proveedor.setDireccion(request.direccion());
        proveedor.setEmail(request.email());
        return proveedor;
    }

    public Proveedor getProveedor(Long id) {
        return proveedorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Proveedor no encontrado con id " + id));
    }
}
