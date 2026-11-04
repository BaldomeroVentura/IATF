# IATF — Dashboard V27, compartido y editable

**Estado: pendiente de autorización de Google Apps Script por el propietario.** GitHub contiene el código y las 143 tareas iniciales. El enlace de GitHub Pages solo abrirá el dashboard operativo después de completar la configuración de Google.

## Acceso de los usuarios

- **Estándar:** contraseña común; puede consultar y modificar cualquier tarea y marcar **Hecho**. No puede verificar.
- **Administrador:** segunda contraseña; puede modificar todo, marcar **Verificado por mí**, añadir tareas y consultar Control de Versiones / Logs.
- La fecha de verificación se registra automáticamente. Editar una tarea verificada retira esa verificación.
- Cada cambio se guarda en una hoja de Google compartida, no en el navegador. No hay opción de importar o subir archivos.
- El registro identifica el rol, no a la persona, porque la contraseña estándar es compartida.

## Activación (una vez, con tu propia cuenta Google)

1. Abre [Google Apps Script](https://script.google.com/home/projects/create). Crea un proyecto llamado `IATF Checklist`.
2. En el archivo `Código.gs`, pega íntegramente el contenido de [Code.gs](Code.gs).
3. Crea otro archivo de código llamado `SeedData` y pega íntegramente [SeedData.gs](SeedData.gs). Ese archivo contiene las 143 tareas.
4. Crea un **archivo HTML** llamado exactamente `Index` y pega el contenido de [Index.html](Index.html).
5. Ve a **Configuración del proyecto → Propiedades del script**. Añade:
   - `STANDARD_PASSWORD`: contraseña común que elegirás para los responsables (8 caracteres o más).
   - `ADMIN_PASSWORD`: contraseña diferente que solo tú conoces (8 caracteres o más).
   
   **No publiques ni introduzcas las contraseñas en GitHub.** La contraseña `197212` usada en versiones anteriores no es adecuada como contraseña de acceso a una web pública.
6. En el editor Apps Script selecciona la función `configurarInicial` y pulsa **Ejecutar**. Autoriza el acceso a Google Sheets. Se creará automáticamente una hoja privada con pestañas `Tareas`, `Logs` y `Versiones`. **Ejecuta la inicialización solo una vez.**
7. Pulsa **Implementar → Nueva implementación → Aplicación web**. Selecciona **Ejecutar como: Yo**. Selecciona quién tiene acceso, preferiblemente tu dominio corporativo cuando sea viable; si no, `Cualquier persona` y usar contraseñas robustas. Pulsa **Implementar**. Copia la URL que termina en `/exec`.
8. Abre la URL `/exec` y prueba entrar con contraseña estándar y con contraseña admin. Marca una tarea como **Hecho**, comprueba que otro navegador la ve, y verifica como administrador.
9. En GitHub edita el archivo [index.html](index.html) y sustituye `PENDIENTE_URL_APPS_SCRIPT` por la URL `/exec`. Guarda el cambio.
10. En **GitHub → Settings → Pages** habilita **Deploy from a branch**, rama `main`, carpeta `/(root)`. Acceso final: **https://baldomeroventura.github.io/IATF/**

## Archivos

- `index.html`: página de acceso GitHub Pages que redirige a la aplicación Google.
- `Index.html`: interfaz y gráficos del dashboard que se ejecutan dentro de Apps Script.
- `Code.gs`: servidor con permisos, guardado, inicialización y logs.
- `SeedData.gs`: 143 tareas iniciales; **son visibles públicamente en este repositorio**.
- `README.md`: estas instrucciones.

## Limitaciones y seguridad

GitHub Pages por sí solo no guarda datos compartidos. **Google Apps Script es imprescindible en esta arquitectura.** El backend valida la contraseña y el rol en el servidor. La hoja no necesita compartirse con los demás usuarios, porque el script se ejecuta como el propietario. La aplicación puede estar sujeta a límites de uso de Google Apps Script. Con contraseñas compartidas no hay trazabilidad personal individual.

**No introducir contraseñas ni identificadores secretos en GitHub.** Para cambios posteriores en el servidor Apps Script, hay que actualizar la implementación web; modificar solo el repositorio no actualiza automáticamente la implementación.

## Historial de versiones

| Versión | Fecha | Autor | Cambio |
|---|---|---|---|
| V27 | 04/11/2026 | B. Ventura · Calidad | Checklist editable compartido, dos niveles de acceso, verificación exclusiva, métricas, exportaciones y logs |
| V25 | 04/11/2026 | B. Ventura · Calidad | CSV actualizado con 143 tareas y fechas límite |
