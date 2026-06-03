package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.AuthResponse;
import ni.edu.uam.SpartanGymAPI.dto.LoginRequest;
import ni.edu.uam.SpartanGymAPI.dto.RegisterPersonalRequest;
import ni.edu.uam.SpartanGymAPI.dto.RegisterRequest;
import ni.edu.uam.SpartanGymAPI.models.Personal;
import ni.edu.uam.SpartanGymAPI.models.Rol;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.PersonalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RolRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import ni.edu.uam.SpartanGymAPI.security.JwtService;
import ni.edu.uam.SpartanGymAPI.security.UserDetailsImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;
    private final PersonalRepository personalRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    private final NotificacionService notificacionService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Rol rolSocio = rolRepository.findByNombre("ROLE_SOCIO")
                .orElseThrow(() -> new RuntimeException("Error: Rol ROLE_SOCIO no encontrado en BD."));

        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rolSocio);
        usuario.setActivo(true);

        usuario = usuarioRepository.save(usuario);

        Socio socio = new Socio();
        socio.setUsuario(usuario);
        socio.setNombres(request.getNombres());
        socio.setApellidos(request.getApellidos());
        socio.setTelefono(request.getTelefono());
        socio.setEstadoAcceso("Activo");

        socioRepository.save(socio);

        // Generamos el Token JWT
        UserDetailsImpl userDetails = new UserDetailsImpl(usuario);
        String token = jwtService.generateToken(userDetails);

        // Enviamos el correo en segundo plano
        notificacionService.enviarCorreoBienvenida(usuario.getEmail(), request.getNombres());

        // Hacemos el ÚNICO return correcto al final
        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .rol(rolSocio.getNombre())
                .build();
    }

    @Transactional
    public AuthResponse registerPersonal(RegisterPersonalRequest request) {
        Rol rolPersonal = rolRepository.findByNombre("ROLE_ENTRENADOR")
                .orElseThrow(() -> new RuntimeException("Error: Rol ROLE_ENTRENADOR no encontrado en BD."));

        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rolPersonal);
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
                .token(token)
                .email(usuario.getEmail())
                .rol(rolPersonal.getNombre())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado tras autenticación."));

        UserDetailsImpl userDetails = new UserDetailsImpl(usuario);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .rol(usuario.getRol().getNombre())
                .build();
    }
}