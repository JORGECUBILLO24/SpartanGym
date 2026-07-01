package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

@Data
public class SucursalRequest {
    private String nombre;
    private String ubicacion;
    private String telefono;
    private Integer capacidad;
    private String horarioApertura;
    private String horarioCierre;
    private String estado;
}
