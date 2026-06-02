package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.AuthResponse;
import ni.edu.uam.SpartanGymAPI.dto.LoginRequest;
import ni.edu.uam.SpartanGymAPI.dto.RegisterRequest;
import ni.edu.uam.SpartanGymAPI.models.Rol;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
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
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional // Asegura que si falla la creación del socio, se cancele también la del usuario
    public AuthResponse register(RegisterRequest request) {

        // 1. Buscamos el rol por defecto para los registros públicos
        Rol rolSocio = rolRepository.findByNombre("ROLE_SOCIO")
                .orElseThrow(() -> new RuntimeException("Error: Rol ROLE_SOCIO no encontrado en BD."));

        // 2. Creamos la entidad principal del Usuario
        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rolSocio);
        usuario.setActivo(true);

        // Guardamos para generar su UUID en PostgreSQL
        usuario = usuarioRepository.save(usuario);

        // 3. Creamos el perfil específico del Socio
        Socio socio = new Socio();
        socio.setUsuario(usuario);
        socio.setNombres(request.getNombres());
        socio.setApellidos(request.getApellidos());
        socio.setTelefono(request.getTelefono());
        socio.setEstadoAcceso("Activo");

        socioRepository.save(socio);

        // 4. Generamos el Token JWT usando la clase que creamos antes
        UserDetailsImpl userDetails = new UserDetailsImpl(usuario);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .rol(rolSocio.getNombre())
                .build();
    }

    public AuthResponse login(LoginRequest request) {

        // 1. Spring Security valida el email y la contraseña automáticamente
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Si las credenciales son correctas, obtenemos el usuario
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado tras autenticación."));

        // 3. Le generamos un nuevo token de acceso
        UserDetailsImpl userDetails = new UserDetailsImpl(usuario);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .rol(usuario.getRol().getNombre())
                .build();
    }
}