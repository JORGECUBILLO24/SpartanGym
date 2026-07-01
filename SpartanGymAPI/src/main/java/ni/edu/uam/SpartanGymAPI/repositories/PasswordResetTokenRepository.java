package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByTokenHashAndUsadoFalse(String tokenHash);

    List<PasswordResetToken> findByUsuarioIdAndUsadoFalse(UUID usuarioId);
}
