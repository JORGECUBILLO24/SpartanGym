package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.RegisterPersonalRequest;
import ni.edu.uam.SpartanGymAPI.models.*;
import ni.edu.uam.SpartanGymAPI.repositories.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PersonalService {

    private final UsuarioRepository usuarioRepository;
    private final PersonalRepository personalRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void registrarEntrenador(RegisterPersonalRequest request) {
        // 1. Buscar rol de entrenador
        Rol rol = rolRepository.findByNombre("ROLE_ENTRENADOR")
                .orElseThrow(() -> new RuntimeException("Rol ROLE_ENTRENADOR no configurado"));

        // 2. Crear usuario
        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario = usuarioRepository.save(usuario);

        // 3. Crear perfil de personal
        Personal personal = new Personal();
        personal.setUsuario(usuario);
        personal.setNombres(request.getNombres());
        personal.setApellidos(request.getApellidos());
        personal.setEspecialidad(request.getEspecialidad());

        personalRepository.save(personal);
    }
}