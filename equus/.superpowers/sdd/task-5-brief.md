### Task 5: Add `metadata` namespace to `messages/es.json`

**Files:**
- Modify: `messages/es.json`

- [ ] **Step 1: Add Spanish metadata translations before closing brace**

Read `messages/es.json`, find the last key, and append the metadata block before the closing `}`. All 27 keys, with Spanish values.

The metadata block:

```json
"metadata": {
    "home": { "title": "Equus — Red Ecuestre y de Caballos", "description": "Conecta con dueños de caballos, establos, criadores y profesionales ecuestres. Encuentra caballos, servicios y construye tu red ecuestre.", "keywords": "caballos, ecuestre, establos, criadores, red equina, equus" },
    "homeDashboard": { "title": "Inicio | Equus", "description": "Tu panel de Equus — gestiona caballos, establos y conexiones.", "keywords": "" },
    "horses": { "title": "Caballos | Equus", "description": "Explora caballos en la red Equus. Encuentra caballos por raza, disciplina y ubicación.", "keywords": "caballos en venta, listado de caballos, ecuestre, razas de caballos" },
    "stables": { "title": "Establos | Equus", "description": "Encuentra establos e instalaciones de hospedaje en la red Equus.", "keywords": "establos para caballos, hospedaje, instalaciones ecuestres" },
    "breeders": { "title": "Criadores | Equus", "description": "Encuentra criadores de caballos y programas de cría en la red Equus.", "keywords": "criadores de caballos, cría, potros, ecuestre" },
    "transport": { "title": "Transporte Equino | Equus", "description": "Encuentra servicios de transporte de caballos en la red Equus.", "keywords": "transporte de caballos, envío equino, remolques para caballos" },
    "trainers": { "title": "Entrenadores de Caballos | Equus", "description": "Encuentra entrenadores profesionales de caballos en la red Equus.", "keywords": "entrenadores de caballos, entrenamiento ecuestre, doma, salto" },
    "groomers": { "title": "Peluqueros Equinos | Equus", "description": "Encuentra servicios profesionales de peluquería equina en la red Equus.", "keywords": "peluquería equina, cuidado de caballos, servicios de aseo" },
    "riders": { "title": "Jinetes | Equus", "description": "Conecta con jinetes en la red Equus.", "keywords": "jinetes ecuestres, equitación, comunidad ecuestre" },
    "coaches": { "title": "Instructores Ecuestres | Equus", "description": "Encuentra instructores y entrenadores ecuestres en la red Equus.", "keywords": "instructor ecuestre, clases de equitación, lecciones de montar" },
    "farriers": { "title": "Herradores | Equus", "description": "Encuentra herradores profesionales y especialistas en cuidado de cascos en la red Equus.", "keywords": "herrador, cuidado de cascos, herraje de caballos, casco equino" },
    "veterinaries": { "title": "Veterinarios Equinos | Equus", "description": "Encuentra veterinarios equinos y servicios veterinarios en la red Equus.", "keywords": "veterinario equino, veterinario de caballos, servicios veterinarios" },
    "ridingClubs": { "title": "Clubes de Equitación | Equus", "description": "Encuentra clubes de equitación y organizaciones ecuestres en la red Equus.", "keywords": "club de equitación, club ecuestre, grupo de equitación" },
    "workplaces": { "title": "Lugares de Trabajo | Equus", "description": "Gestiona tus conexiones laborales en Equus.", "keywords": "" },
    "relationships": { "title": "Relaciones | Equus", "description": "Gestiona tus solicitudes de relación y conexiones en Equus.", "keywords": "" },
    "ownershipTransfers": { "title": "Transferencias de Propiedad | Equus", "description": "Gestiona las transferencias de propiedad de caballos en Equus.", "keywords": "" },
    "users": { "title": "Perfil de Usuario | Equus", "description": "Perfil de miembro de Equus — conectado a través de caballos y servicios.", "keywords": "" },
    "signin": { "title": "Iniciar Sesión | Equus", "description": "Inicia sesión en tu cuenta de Equus.", "keywords": "" },
    "signup": { "title": "Crear una Cuenta | Equus", "description": "Crea tu cuenta de Equus para conectar con la comunidad ecuestre.", "keywords": "" },
    "forgotPassword": { "title": "Olvidé mi Contraseña | Equus", "description": "Restablece la contraseña de tu cuenta de Equus.", "keywords": "" },
    "resetPassword": { "title": "Restablecer Contraseña | Equus", "description": "Ingresa tu nueva contraseña para Equus.", "keywords": "" },
    "confirmEmail": { "title": "Confirmar Correo | Equus", "description": "Confirma tu dirección de correo electrónico para Equus.", "keywords": "" },
    "resendConfirmation": { "title": "Reenviar Confirmación | Equus", "description": "Reenvía tu confirmación de correo electrónico para Equus.", "keywords": "" },
    "profile": { "title": "Perfil | Equus", "description": "Gestiona tu perfil y preferencias de Equus.", "keywords": "" },
    "notifications": { "title": "Notificaciones | Equus", "description": "Tus notificaciones de Equus.", "keywords": "" },
    "notFound": { "title": "Página No Encontrada | Equus", "description": "La página que buscas no existe o ha sido movida.", "keywords": "404, página no encontrada, equus" },
    "notAllowed": { "title": "Acceso Denegado | Equus", "description": "No tienes permiso para acceder a esta página.", "keywords": "" }
}
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/es.json','utf8'))"
```

- [ ] **Step 3: Commit**

```bash
git add messages/es.json
git commit -m "feat(seo): add Spanish metadata translations"
```
