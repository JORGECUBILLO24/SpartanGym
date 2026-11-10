# Revisión de documentación y contratos de SpartanGym

Revisión del 8 de noviembre de 2026. El documento `Tests_Postman_QA.docx`
contiene nueve secciones de pruebas y ocho capturas de Postman. Se revisaron
todos sus párrafos y las ocho imágenes incrustadas, los dos README, el esquema
SQL raíz completo, el workflow de CI y los controladores, DTO y servicios
relacionados. Esta revisión comprueba contenidos y contratos; no certifica la
maquetación de las páginas de Word ni sustituye una ejecución completa de QA.

Las capturas conservan valor como evidencia histórica, pero ya no son una guía
reproducible de la API actual: cambió la ruta para registrar personal y falta el
flujo de renovación. Las diferencias se detallan aquí sin modificar las
capturas originales ni presentar resultados históricos como pruebas nuevas.

## Revisión de las nueve secciones del documento

| Sección | Contraste con el código actual | Ajuste necesario |
| --- | --- | --- |
| Registrar un Socio | `POST /api/auth/register` y los cinco campos mostrados siguen vigentes. `AuthResponse` ahora incluye también `id`. El correo debe ser único. | Documentar `id` en la respuesta y usar un correo nuevo por ejecución. Un duplicado responde 409. |
| Login | `POST /api/auth/login` sigue vigente; el token debe obtenerse de esta ejecución, no copiarse de la imagen. La respuesta actual incluye `id`, `token`, `email` y `rol`. | Guardar el token como variable de entorno Postman y documentar 400 ante credenciales incorrectas. |
| Registrar entrenador | La captura usa `/api/auth/register-personal`, que no existe en `AuthController`. La ruta actual es `POST /api/personal/registrar`, protegida para ADMIN o SUPERADMIN en `PersonalController`. | Iniciar sesión con administrador y enviar su Bearer token; usar la ruta actual. `rol: ROLE_ENTRENADOR` puede declararse explícitamente (el servicio también lo adopta por defecto). |
| Crear Grupo Muscular | La captura crea `Pecho`. El esquema raíz ya siembra ese nombre y `grupos_musculares.nombre` es UNIQUE. En una base preparada siguiendo README, repetir la captura produce conflicto. | Usar un nombre de prueba único o consultar el grupo existente; distinguir creación 200 de duplicado 409. |
| Listar grupos musculares | `GET /api/catalogo/grupos-musculares` sigue vigente. La imagen presenta un solo grupo; el esquema actual siembra nueve. | Validar campos y presencia del grupo objetivo; no esperar exactamente un elemento ni fijar un ID sin consultarlo. |
| Crear ejercicio | Ruta y forma `{nombre, grupoMuscular: {id}}` siguen vigentes. La referencia debe existir. Ya hay un `Press banca` sembrado; no hay restricción UNIQUE por nombre para ejercicios. | Obtener el ID de grupo del GET anterior y usar un nombre de prueba distinto. No asumir rechazo de nombres duplicados. |
| Listar ejercicios | Ruta vigente. La respuesta histórica contiene un ejercicio, mientras el esquema actual siembra diez. | Validar estructura y ejercicio creado; no exigir cardinalidad ni orden históricos. |
| Comprar membresía | `POST /api/membresias/comprar` conserva los dos campos. El socio se obtiene del token; un administrador no tiene por qué tener perfil de socio. Si ya existe una membresía Activa, `MembresiaService` devuelve conflicto. | Usar token de socio y un tipo obtenido de `/api/membresias/tipos`. No fijar fechas ni UUID de la imagen. Diferenciar primera compra de renovación. |
| Renovar membresía | Solo hay un encabezado: no incluye captura, solicitud, respuesta ni resultado. | Completar con las dos rutas actuales descritas debajo y casos de membresía activa y vencida. No considerar esta sección una prueba aprobada. |

## Contrato actual para renovar

El socio usa `POST /api/pagos/mi-membresia` con su token y este cuerpo:

```json
{"tipoMembresiaId": 1, "metodoPago": "Efectivo"}
```

El personal con rol SUPERADMIN, ADMIN o RECEPCIONISTA usa
`POST /api/pagos/renovar`. Su cuerpo usa nombres diferentes:

```json
{"idSocio": "UUID_DEL_SOCIO", "idTipoMembresia": 1, "metodoPago": "Efectivo"}
```

En ambos ejemplos, el ID del plan debe obtenerse del catálogo real.
`PagoController` devuelve `FacturaMembresiaResponse`. `PagoService` marca una
membresía activa anterior como Renovada antes de insertar la nueva, respetando
el índice SQL que solo permite una Activa por socio. No debe usarse el endpoint
de primera compra para probar este comportamiento.

## Errores y discrepancias confirmados

| Prioridad | Evidencia | Efecto y estado |
| --- | --- | --- |
| Alta | `models/Usuario.java` exponía `passwordHash` como propiedad serializable; `MembresiaController` devuelve entidades con `socio.usuario` anidado. | Corregido con `@JsonIgnore`. Una prueba de serialización de una membresía comprueba que se conserva el email y no aparecen el nombre ni el valor del hash. No se alteró el hash guardado ni la autenticación. |
| Alta | El ejemplo anterior de `JWT_SECRET` en README contenía guiones; `security/JwtService.java` usa `Decoders.BASE64.decode` y HS256. | Corregido el README: genera 32 bytes aleatorios y los codifica en Base64 estándar. Una cadena textual arbitraria puede fallar al firmar tokens aunque la API arranque. |
| Media | `.env.example` web apunta a Render; la base recién preparada está en localhost. | La configuración local `.env` fue corregida a `http://localhost:8080/api` durante esta intervención y el agente principal confirmó login local SUPERADMIN. La plantilla de despliegue puede seguir usando Render. |
| Media | README afirmaba que todos los errores eran estructurados. `exceptions/RespuestaError.java` solo produce problem JSON con `Accept: application/problem+json`; de lo contrario usa texto. | Corregido README. Postman debe enviar el encabezado para comprobar `codigo`, `status`, `detail` e `instance`. |
| Media | README solo pedía Java 17+; `gradle/gradle-daemon-jvm.properties` exige Java 21 para Android y `app/build.gradle.kts` declara SDK 36 con minorApiLevel 1. | Corregidos requisitos README. Java 17 sigue siendo el nivel de compilación de la API. |
| Media | `.github/workflows/ci.yml` instala explícitamente `platforms;android-36` y Java 17 para Android; la app pide SDK 36.1 y daemon Java 21. | Diferencia de aprovisionamiento pendiente de comprobar en CI: Gradle puede descargar componentes adicionales, pero el workflow no los declara explícitamente. Alinear SDK y Java con el proyecto para evitar depender de descargas implícitas. |
| Media | La copia `SpartanGymApp/app/src/main/java/com/example/spartangymapp/resources/database/scrips.txt` no incluye `password_reset_tokens`, `ejercicios_completados` ni los campos semanales actuales, y contiene caracteres mal codificados. | Usar exclusivamente `spartan_gym_schema.sql` raíz. La copia Android debe retirarse o convertirse en una referencia al esquema canónico, sin ejecutar ambos scripts. |
| Baja | README usaba `npm install`, aunque hay un lockfile y CI usa `npm ci`. Las dependencias instaladas Vite y ESLint requieren versiones concretas de Node. | README raíz actualizado a `npm ci` y Node 22.13+ (recomendado 24). |

## Observaciones del esquema y de las reglas de negocio

- `socios.estado_acceso` tiene valor SQL por defecto Inactivo, pero el modelo y
  `AuthService.register` asignan Activo. Es una discrepancia entre inserción SQL
  directa y registro por API. Hace falta decidir cuál representa la intención
  del producto antes de unificarla; no se cambió la regla de acceso del gimnasio.
- El esquema incluye `CREATE IF NOT EXISTS` y operaciones de actualización,
  pero también reactiva y restaura el rol de la cuenta inicial de administración
  al ejecutarlo otra vez. Debe tratarse como preparación/actualización controlada,
  no como una migración sin efectos sobre datos existentes.
- La numeración de secciones SQL regresa de 7 a 5 en “Progreso semanal”. Es un
  error editorial sin efecto en la ejecución SQL.

## Cobertura que falta en la evidencia Postman

Las ocho capturas muestran caminos exitosos, sin entorno exportado, colección
ejecutable, fecha de ejecución vinculada a un commit ni aserciones visibles.
No hay resultados que prueben errores de autenticación, roles insuficientes,
datos duplicados, referencias inexistentes, membresía ya activa, renovación,
QR, inventario, ventas, informes ni recuperación de contraseña.

Para una próxima ronda reproducible: usar variables `baseUrl`, `tokenAdmin`,
`tokenSocio`, `socioId` y `tipoMembresiaId`; obtener IDs de respuestas; registrar
versión/commit; documentar precondiciones y resultado esperado; agregar
aserciones de estado y campos. Los tokens históricos visibles en las capturas
no deben usarse como datos de prueba actuales.

## Validación realizada para la corrección de serialización

Desde `SpartanGymAPI`, `mvnw.cmd -B -Dtest=UsuarioJsonTest test` compiló las
fuentes y ejecutó una prueba: 1 aprobada, 0 fallos, 0 errores. La prueba construye
el grafo real MembresiaSocio → Socio → Usuario y lo serializa con Jackson 3.
No se hicieron compras, renovaciones ni cambios de credenciales para esta
revisión documental.
