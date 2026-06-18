package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.AuthResponse;
import ni.edu.uam.SpartanGymAPI.dto.RegisterPersonalRequest;
import ni.edu.uam.SpartanGymAPI.models.Personal;
import ni.edu.uam.SpartanGymAPI.models.Rol;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.PersonalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RolRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import ni.edu.uam.SpartanGymAPI.security.JwtService;
import ni.edu.uam.SpartanGymAPI.security.UserDetailsImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ni.edu.uam.SpartanGymAPI.dto.PersonalResponse;

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
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public List<PersonalResponse> listarPersonal() {
        return personalRepository.findAll().stream()
                .map(personal -> PersonalResponse.builder()
                        .id(personal.getUsuarioId())
                        .nombres(personal.getNombres())
                        .apellidos(personal.getApellidos())
                        .email(personal.getUsuario().getEmail())
                        .rol(personal.getUsuario().getRol().getNombre())
                        .especialidad(personal.getEspecialidad())
                        .activo(personal.getUsuario().getActivo())
                        .build())
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

        return PersonalResponse.builder()
                .id(personal.getUsuarioId())
                .nombres(personal.getNombres())
                .apellidos(personal.getApellidos())
                .email(usuario.getEmail())
                .rol(nuevoRol.getNombre())
                .especialidad(personal.getEspecialidad())
                .activo(usuario.getActivo())
                .build();
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
        personal.setEspecialidad(request.getEspecialidad());

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
}
