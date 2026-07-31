package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.cliente.ClienteRequest;
import com.sistemas.sistema_venta.dto.cliente.ClienteResponse;
import com.sistemas.sistema_venta.entity.Cliente;
import com.sistemas.sistema_venta.enums.TipoDocumento;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        return clienteRepository.findAllByOrderByRazonSocialAsc().stream().map(Mapper::toClienteResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> buscar(String q) {
        String termino = q == null ? "" : q.trim();
        if (termino.isEmpty()) {
            return listar();
        }
        return clienteRepository
                .findByRazonSocialContainingIgnoreCaseOrNumeroDocumentoContainingOrderByRazonSocialAsc(termino, termino)
                .stream().map(Mapper::toClienteResponse).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse obtener(Long id) {
        return Mapper.toClienteResponse(getCliente(id));
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        return Mapper.toClienteResponse(clienteRepository.save(toCliente(new Cliente(), request)));
    }

    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = getCliente(id);
        return Mapper.toClienteResponse(clienteRepository.save(toCliente(cliente, request)));
    }

    @Transactional(readOnly = true)
    public Optional<Cliente> buscarPorDocumento(TipoDocumento tipoDocumento, String numeroDocumento) {
        return clienteRepository.findByTipoDocumentoAndNumeroDocumento(tipoDocumento, numeroDocumento);
    }

    @Transactional
    public Cliente findOrCreate(ClienteRequest request) {
        return clienteRepository
                .findByTipoDocumentoAndNumeroDocumento(request.tipoDocumento(), request.numeroDocumento())
                .orElseGet(() -> clienteRepository.save(toCliente(new Cliente(), request)));
    }

    private Cliente toCliente(Cliente cliente, ClienteRequest request) {
        cliente.setTipoDocumento(request.tipoDocumento());
        cliente.setNumeroDocumento(request.numeroDocumento());
        cliente.setRazonSocial(request.razonSocial());
        cliente.setTelefono(request.telefono());
        cliente.setDireccion(request.direccion());
        cliente.setEmail(request.email());
        return cliente;
    }

    public Cliente getCliente(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado con id " + id));
    }
}
