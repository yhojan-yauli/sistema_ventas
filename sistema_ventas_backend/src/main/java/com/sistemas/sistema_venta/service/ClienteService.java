package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.cliente.ClienteConsultaResponse;
import com.sistemas.sistema_venta.dto.cliente.ClienteRequest;
import com.sistemas.sistema_venta.dto.cliente.ClienteResponse;
import com.sistemas.sistema_venta.entity.Cliente;
import com.sistemas.sistema_venta.enums.TipoDocumento;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final RestClient restClient = RestClient.create();
    private final String apisperuUrl;
    private final String apisperuToken;

    public ClienteService(ClienteRepository clienteRepository,
                          @Value("${apisperu.url}") String apisperuUrl,
                          @Value("${apisperu.token}") String apisperuToken) {
        this.clienteRepository = clienteRepository;
        this.apisperuUrl = apisperuUrl;
        this.apisperuToken = apisperuToken;
    }

    @Transactional(readOnly = true)
    public ClienteConsultaResponse buscarConsulta(TipoDocumento tipo, String numero) {
        String n = numero == null ? "" : numero.replaceAll("\\D", "");
        if (tipo == TipoDocumento.DNI && n.length() != 8) {
            throw new BusinessException("El DNI debe tener 8 dígitos");
        }
        if (tipo == TipoDocumento.RUC && n.length() != 11) {
            throw new BusinessException("El RUC debe tener 11 dígitos");
        }

        Optional<Cliente> local = clienteRepository.findByTipoDocumentoAndNumeroDocumento(tipo, n);
        if (local.isPresent()) {
            Cliente c = local.get();
            return new ClienteConsultaResponse(tipo.name(), n, c.getRazonSocial(),
                    c.getTelefono(), c.getDireccion(), c.getEmail(), true);
        }

        JsonNode body = consultarApi(tipo, n);
        if (body.has("success") && !body.get("success").asBoolean()) {
            String msg = body.path("message").asText("No se encontraron resultados");
            throw new BusinessException(msg);
        }
        if (tipo == TipoDocumento.DNI) {
            String nombres = body.path("nombres").asText("");
            String paterno = body.path("apellidoPaterno").asText("");
            String materno = body.path("apellidoMaterno").asText("");
            String nombre = (nombres + " " + paterno + " " + materno).replaceAll("\\s+", " ").trim();
            if (nombre.isEmpty()) {
                throw new BusinessException("No se encontraron datos para el DNI " + n);
            }
            return new ClienteConsultaResponse(tipo.name(), n, nombre, null, null, null, false);
        }
        String razonSocial = body.path("razonSocial").asText("");
        String direccion = body.path("direccion").asText("");
        if (razonSocial.isEmpty()) {
            throw new BusinessException("No se encontraron datos para el RUC " + n);
        }
        return new ClienteConsultaResponse(tipo.name(), n, razonSocial, null, direccion, null, false);
    }

    private JsonNode consultarApi(TipoDocumento tipo, String numero) {
        String url = apisperuUrl + "/" + tipo.name().toLowerCase() + "/" + numero + "?token=" + apisperuToken;
        try {
            return restClient.get().uri(url).retrieve().body(JsonNode.class);
        } catch (HttpClientErrorException e) {
            throw new BusinessException("No se encontraron resultados para el " + tipo.name() + " " + numero);
        }
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
