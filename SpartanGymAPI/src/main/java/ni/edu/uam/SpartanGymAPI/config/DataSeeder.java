package ni.edu.uam.SpartanGymAPI.config;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.models.Rol;
import ni.edu.uam.SpartanGymAPI.repositories.RolRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RolRepository rolRepository;

    @Override
    public void run(String... args) throws Exception {
        String[] rolesDefecto = {"ROLE_ADMIN", "ROLE_RECEPCIONISTA", "ROLE_ENTRENADOR", "ROLE_SOCIO"};

        for (String nombreRol : rolesDefecto) {
            if (rolRepository.findByNombre(nombreRol).isEmpty()) {
                Rol nuevoRol = new Rol();
                nuevoRol.setNombre(nombreRol);
                rolRepository.save(nuevoRol);
            }
        }
        System.out.println("✅ Roles sembrados exitosamente respetando el script original.");
    }
}