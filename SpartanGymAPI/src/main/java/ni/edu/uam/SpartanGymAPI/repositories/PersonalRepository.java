package ni.edu.uam.spartangym.repositories;

import ni.edu.uam.spartangym.models.Personal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface PersonalRepository extends JpaRepository<Personal, UUID> {
}