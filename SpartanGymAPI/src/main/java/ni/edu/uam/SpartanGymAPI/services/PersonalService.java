package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.ActualizarPerfilRequest;
import ni.edu.uam.SpartanGymAPI.dto.AuthResponse;
import ni.edu.uam.SpartanGymAPI.dto.PersonalResponse;
import ni.edu.uam.SpartanGymAPI.dto.RegisterPersonalRequest;
import ni.edu.uam.SpartanGymAPI.models.Personal;
import ni.edu.uam.SpartanGymAPI.models.Rol;
import ni.edu.uam.SpartanGymAPI.models.Sucursal;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.PersonalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RolRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SucursalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import ni.edu.uam.SpartanGymAPI.security.JwtService;
import ni.edu.uam.SpartanGymAPI.security.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PersonalService {

    private static final Set<String> ROLES_PERSONAL = Set.of(
            "ROLE_ADMIN",
            "ROLE_RECEPCIONISTA",
            "ROLE_ENTRENADOR"
    );

    private final UsuarioRepository usuarioRepository;
    private final PersonalRepository personalRepository;
    private final SucursalRepository sucursalRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public List<PersonalResponse> listarPersonal() {
        return personalRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PersonalResponse actualizarRol(UUID usuarioId, String rol) {
        String rolSolicitado = normalizarRol(rol);
        Rol nuevoRol = rolRepository.findByNombre(rolSolicitado)
                .orElseThrow(() -> new RuntimeException("Rol " + rolSolicitado + " no configurado"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setRol(nuevoRol);
        usuarioRepository.save(usuario);

        Personal personal = personalRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Personal no encontrado"));

        return toResponse(personal);
    }

    @Transactional
    public PersonalResponse desactivarPersonal(UUID usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Personal personal = personalRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Personal no encontrado"));

        usuario.setActivo(false);
        usuarioRepository.save(usuario);

        return toResponse(personal);
    }

    @Transactional
    public AuthResponse registrarPersonal(RegisterPersonalRequest request) {
        String rolSolicitado = normalizarRol(request.getRol());
        Rol rol = rolRepository.findByNombre(rolSolicitado)
                .orElseThrow(() -> new RuntimeException("Rol " + rolSolicitado + " no configurado"));

        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario = usuarioRepository.save(usuario);

        Personal personal = new Personal();
        personal.setUsuario(usuario);
        personal.setNombres(request.getNombres());
        personal.setApellidos(request.getApellidos());
        personal.setTelefono(request.getTelefono());
        personal.setEspecialidad(request.getEspecialidad());
        personal.setSucursal(obtenerSucursalOpcional(request.getSucursalId()));

        personalRepository.save(personal);

        UserDetailsImpl userDetails = new UserDetailsImpl(usuario);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .id(usuario.getId().toString())
                .token(token)
                .email(usuario.getEmail())
                .rol(rol.getNombre())
                .build();
    }

    @Transactional
    public PersonalResponse actualizarPerfilActual(Authentication auth, ActualizarPerfilRequest request) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Usuario no autenticado");
        }

        Usuario usuario = usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Personal personal = personalRepository.findById(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Perfil de personal no encontrado"));

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            usuario.setEmail(request.getEmail().trim());
        }
        if (request.getNombres() != null && !request.getNombres().isBlank()) {
            personal.setNombres(request.getNombres().trim());
        }
        if (request.getApellidos() != null && !request.getApellidos().isBlank()) {
            personal.setApellidos(request.getApellidos().trim());
        }
        if (request.getTelefono() != null) {
            personal.setTelefono(request.getTelefono().trim());
        }
        if (request.getEspecialidad() != null) {
            personal.setEspecialidad(request.getEspecialidad().trim());
        }
        if (request.getSucursalId() != null) {
            personal.setSucursal(obtenerSucursalOpcional(request.getSucursalId()));
        }

        usuarioRepository.save(usuario);
        return toResponse(personalRepository.save(personal));
    }

    private String normalizarRol(String rol) {
        String rolNormalizado = rol == null || rol.isBlank()
                ? "ROLE_ENTRENADOR"
                : rol.trim().toUpperCase();

        if (!rolNormalizado.startsWith("ROLE_")) {
            rolNormalizado = "ROLE_" + rolNormalizado;
        }

        if (!ROLES_PERSONAL.contains(rolNormalizado)) {
            throw new RuntimeException("Rol de personal no permitido: " + rolNormalizado);
        }

        return rolNormalizado;
    }

    private Sucursal obtenerSucursalOpcional(UUID sucursalId) {
        if (sucursalId == null) {
            return null;
        }

        return sucursalRepository.findById(sucursalId)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));
    }

    private PersonalResponse toResponse(Personal personal) {
        Usuario usuario = personal.getUsuario();

        return PersonalResponse.builder()
                .id(personal.getUsuarioId())
                .nombres(personal.getNombres())
                .apellidos(personal.getApellidos())
                .email(usuario.getEmail())
                .telefono(personal.getTelefono())
                .rol(usuario.getRol().getNombre())
                .especialidad(personal.getEspecialidad())
                .sucursalId(personal.getSucursal() != null ? personal.getSucursal().getId() : null)
                .sucursal(personal.getSucursal() != null ? personal.getSucursal().getNombre() : null)
                .activo(usuario.getActivo())
                .build();
    }
}
