package ni.edu.uam.SpartanGymAPI.security;

import ni.edu.uam.SpartanGymAPI.models.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserDetailsImpl implements UserDetails {

    private final Usuario usuario;

    public UserDetailsImpl(Usuario usuario) {
        this.usuario = usuario;
    }

    // --- ¡ESTE ES EL MÉTODO QUE FALTABA! ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Traducimos tu tabla "Rol" a la autoridad que entiende Spring
        return List.of(new SimpleGrantedAuthority(usuario.getRol().getNombre()));
    }
    // ----------------------------------------

    @Override
    public String getPassword() {
        return usuario.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return usuario.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return usuario.getActivo();
    }

    // Método extra por si necesitamos el UUID original después
    public Usuario getUsuario() {
        return usuario;
    }
}