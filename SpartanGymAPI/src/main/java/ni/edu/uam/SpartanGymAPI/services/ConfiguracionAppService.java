package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ni.edu.uam.SpartanGymAPI.models.ConfiguracionApp;
import ni.edu.uam.SpartanGymAPI.repositories.ConfiguracionAppRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConfiguracionAppService {

    private static final int CONFIG_ID = 1;

    private final ConfiguracionAppRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Map<String, Object> obtener() {
        return repository.findById(CONFIG_ID)
                .map(ConfiguracionApp::getConfiguracionJson)
                .map(this::leerJson)
                .orElseGet(LinkedHashMap::new);
    }

    @Transactional
    public Map<String, Object> guardar(Map<String, Object> configuracion) {
        Map<String, Object> normalizada = configuracion == null
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(configuracion);

        ConfiguracionApp entidad = repository.findById(CONFIG_ID).orElseGet(ConfiguracionApp::new);
        entidad.setId(CONFIG_ID);
        entidad.setConfiguracionJson(escribirJson(normalizada));
        repository.save(entidad);

        return normalizada;
    }

    private Map<String, Object> leerJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            // Antes esto quedaba en total silencio: la config guardada (nombre del gym, logo)
            // se perdía sin dejar ningún rastro de por qué. Ahora al menos queda en el log.
            log.warn("No se pudo leer la configuracion guardada, se usan los valores por defecto: {}",
                    e.getMessage(), e);
            return new LinkedHashMap<>();
        }
    }

    private String escribirJson(Map<String, Object> configuracion) {
        try {
            return objectMapper.writeValueAsString(configuracion);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo serializar la configuracion", e);
        }
    }
}
