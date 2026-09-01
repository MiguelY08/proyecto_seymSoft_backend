# Manual tecnico: seguridad y requerimientos minimos

## Seguridad

El backend de SeymSoft implementa mecanismos de seguridad enfocados en autenticacion, autorizacion, proteccion de credenciales, manejo de tokens, validacion de entradas y configuracion mediante variables de entorno.

### Figura: Algoritmo de Encriptacion

El sistema no guarda contrasenas en texto plano. Para proteger las credenciales de los usuarios se utiliza `bcrypt`, implementado en `src/shared/utils/hashPassword.js`.

Funcionamiento:

1. El usuario registra o actualiza una contrasena.
2. El sistema valida que la contrasena cumpla reglas minimas.
3. La contrasena se procesa con `bcrypt`.
4. `bcrypt` genera una sal y crea un hash.
5. El hash resultante se almacena en la base de datos.
6. En el inicio de sesion, la contrasena digitada se compara contra el hash almacenado.

Datos tecnicos:

- Libreria: `bcrypt`.
- Rondas de sal: `12`.
- Archivo principal: `src/shared/utils/hashPassword.js`.
- Funciones: `hashPassword` y `comparePassword`.

Texto sugerido para la figura:

```txt
Contrasena ingresada
        |
        v
Validacion de formato
        |
        v
bcrypt.genSalt(12)
        |
        v
bcrypt.hash(contrasena, salt)
        |
        v
Hash almacenado en base de datos
```

### Figura: Manejo de Tokens

El sistema utiliza JWT para manejar sesiones autenticadas. Se usan dos tipos de tokens:

- Access token: permite acceder a rutas protegidas.
- Refresh token: permite renovar el access token cuando este vence.

Funcionamiento:

1. El usuario inicia sesion con email y contrasena.
2. El sistema valida usuario, estado activo y contrasena.
3. Si las credenciales son correctas, genera un access token y un refresh token.
4. El frontend guarda la sesion en `localStorage`, dentro de la clave `session`.
5. La sesion contiene datos como usuario, rol, permisos, cliente, `accessToken` y `refreshToken`.
6. El frontend envia el access token al backend usando el header `Authorization`.
7. En cada ruta protegida, el middleware valida el token enviado.
8. Si una peticion responde `401`, el frontend intenta renovar la sesion usando el refresh token.
9. Si la renovacion falla, se limpia la sesion y se redirige al usuario a `/login`.

Datos tecnicos:

- Libreria: `jsonwebtoken`.
- Access token por defecto: `15m`.
- Refresh token por defecto: `7d`.
- Archivo de tokens: `src/config/jwt.js`.
- Middleware de autenticacion: `src/shared/middlewares/authMiddleware.js`.
- Archivo frontend de almacenamiento: `src/Features/access/helpers/authStorage.js`.
- Archivo frontend de interceptor Axios: `src/setting/apiClient.js`.
- Variables requeridas: `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`.

Texto sugerido para la figura:

```txt
Login correcto
     |
     v
Generar access token JWT
     |
     v
Generar refresh token JWT
     |
     v
Guardar sesion en localStorage: session
     |
     v
Cliente consume API con Authorization: Bearer token
     |
     v
authMiddleware valida firma, expiracion, usuario activo y token_version
     |
     +-- Token valido -> permite acceso
     |
     +-- Token vencido -> frontend llama POST /auth/refresh
                         |
                         +-- Refresh valido -> actualiza tokens y reintenta
                         |
                         +-- Refresh invalido -> limpia sesion y redirige a /login
```

### Figura: Inicio de sesion a traves del protocolo OAuth 2

El backend permite autenticacion mediante Google OAuth 2 usando Passport.

Funcionamiento:

1. El usuario selecciona iniciar sesion con Google.
2. El frontend redirige al backend en `VITE_API_BASE_URL/auth/google`.
3. Google solicita autorizacion al usuario.
4. Google devuelve el perfil al callback configurado.
5. El backend obtiene email, nombre y `googleId`.
6. Si el usuario no existe, se crea una cuenta nueva.
7. Si el usuario existe pero no tiene Google vinculado, se actualiza el registro.
8. El frontend recibe el callback en `/auth/callback`.
9. El frontend lee `accessToken` y `refreshToken` desde los query params.
10. El frontend guarda temporalmente los tokens, consulta `/auth/me`, guarda la sesion completa y redirige al usuario segun su perfil.

Datos tecnicos:

- Librerias: `passport` y `passport-google-oauth20`.
- Archivo principal: `src/config/google.js`.
- Archivos frontend: `LoginForm.jsx` y `AuthCallback.jsx`.
- Variables requeridas:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL`
  - `VITE_API_BASE_URL`

Texto sugerido para la figura:

```txt
Usuario
  |
  v
Login con Google
  |
  v
Frontend redirige a /auth/google del backend
  |
  v
Google OAuth 2
  |
  v
Callback del backend
  |
  v
Buscar usuario por email
  |
  +-- No existe -> crear usuario con id_google
  |
  +-- Existe -> vincular cuenta si falta id_google
  |
  v
Frontend recibe /auth/callback con tokens
  |
  v
Consultar /auth/me
  |
  +-- Usuario con rol -> /admin
  |
  +-- Cliente -> /
```

### Figura: CSP

CSP significa Content Security Policy. Es una politica de seguridad que ayuda a controlar desde que origen se pueden cargar scripts, estilos, imagenes, fuentes y conexiones.

Estado actual del backend:

- No se encontro configuracion explicita de CSP.
- No se encontro uso de `helmet`.
- Si existe configuracion CORS en `src/app.js`.

Estado actual del frontend:

- No se encontro CSP configurada.
- `vercel.json` solo define headers de `Cache-Control` y rewrites hacia `index.html`.
- `index.html` no tiene meta tag `Content-Security-Policy`.

Interpretacion tecnica:

En el sistema actual, la proteccion relacionada con origenes se maneja principalmente mediante CORS en el backend. Sin embargo, CSP normalmente se configura en el frontend, en el hosting, en un proxy, en el servidor web o mediante middleware como `helmet` en Express.

Recomendacion para el manual:

Documentar CSP como una medida recomendada para produccion. Si se desea implementarla, se debe configurar una politica acorde al frontend, API, Supabase, Google OAuth, imagenes, estilos y servicios externos usados por el sistema.

Texto sugerido para la figura:

```txt
Navegador
   |
   v
Respuesta HTTP con Content-Security-Policy
   |
   v
Permitir recursos confiables
   |
   +-- Scripts autorizados
   +-- Imagenes autorizadas
   +-- APIs autorizadas
   +-- Estilos autorizados
   |
   v
Bloquear recursos no permitidos
```

Ejemplo conceptual de politica CSP:

```txt
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://api.midominio.com;
```

### Figura: Evitar la Inyeccion de codigo

El proyecto aplica validaciones de entrada tanto en frontend como en backend para reducir riesgos de datos maliciosos o inesperados.

Medidas observadas en backend:

- Validacion de esquemas con `zod`.
- Rechazo de campos inesperados con `.strict()`.
- Validacion de email, telefono, nombres, ids y fechas.
- Rechazo de etiquetas HTML en registro.
- Validacion de formatos por expresiones regulares.
- Uso de Prisma ORM para consultas, lo que reduce el riesgo de SQL injection al evitar SQL crudo en la mayoria de operaciones.

Medidas observadas en frontend:

- Validadores propios con funciones y expresiones regulares.
- Validacion en tiempo real y antes de enviar formularios.
- Normalizacion de datos como email, telefono y nombre.
- React escapa por defecto el texto renderizado con `{valor}`.

Archivos relevantes:

- `src/modules/auth/validators/authValidators.js`.
- `src/modules/purchases/supplierPurchases/validators/supplierPurchasesValidator.js`.
- `src/modules/purchases/purchase-returns/validators/create.validator.js`.
- `src/modules/sales/vendings/validators/create.validator.js`.
- `src/shared/utils/textNormalizer.js`.
- Frontend: `authValidators.js`, `usersValidators.jsx` y validaciones inline en formularios.

Observacion de riesgo:

En frontend existe un punto que debe manejarse con cuidado: `AlertItem.jsx` usa `dangerouslySetInnerHTML` cuando una alerta recibe la propiedad `html`. No se encontro uso explicito de `DOMPurify` u otra libreria de sanitizacion HTML. Para produccion, se recomienda sanitizar cualquier HTML antes de renderizarlo o evitar HTML dinamico cuando no sea indispensable.

Texto sugerido para la figura:

```txt
Datos enviados por el cliente
        |
        v
Validacion en frontend
        |
        v
Normalizacion de datos
        |
        v
Validacion con Zod
        |
        +-- Rechazar campos inesperados
        +-- Rechazar formatos invalidos
        +-- Rechazar etiquetas HTML
        +-- Convertir tipos de datos
        |
        v
Use-case recibe datos validados
        |
        v
Prisma ejecuta operaciones parametrizadas
        |
        v
React renderiza texto escapado por defecto
```

### Control de rutas y permisos

El sistema separa rutas publicas, rutas autenticadas y rutas protegidas por permisos.

Rutas publicas principales:

- `/`
- `/shop`
- Detalle de producto
- `/login`
- Registro
- Recuperacion de contrasena
- `/auth/callback`

Rutas autenticadas:

- `/perfil/editar` requiere sesion, pero no rol administrativo.
- `/admin/*` requiere usuario autenticado con rol.

Rutas y acciones con permisos:

- Algunas rutas especificas usan `PermissionGuard`, por ejemplo crear o editar productos y devoluciones de compras.
- Muchas acciones internas tambien se protegen visualmente con el componente `Permission`, por ejemplo botones de roles, pagos, pedidos y banners.
- En backend existen middlewares como `authMiddleware` y `requirePermission` para validar autenticacion y permisos.

Texto sugerido para la figura:

```txt
Usuario solicita ruta
        |
        v
Ruta publica?
   | si
   v
Permitir acceso

Ruta privada?
   |
   v
Validar session/accessToken
   |
   +-- No valido -> /login
   |
   +-- Valido -> revisar rol/permisos
                  |
                  +-- Tiene permiso -> permite accion
                  |
                  +-- No tiene permiso -> bloquea acceso
```

## Requerimientos Minimos

Los requerimientos se estiman con base en la arquitectura observada: backend Node.js con Express, Prisma, PostgreSQL, manejo de imagenes con Sharp/Supabase, autenticacion JWT/OAuth y despliegue configurado en Render.

### Figura: Requerimiento minimo de Hardware

Para ambiente de desarrollo:

| Recurso | Minimo recomendado |
|---|---:|
| Procesador | 2 nucleos |
| Memoria RAM | 4 GB |
| Almacenamiento | 2 GB libres |
| Conexion | Internet estable |

Para ambiente de produccion pequeno:

| Recurso | Minimo recomendado |
|---|---:|
| Procesador | 1 a 2 vCPU |
| Memoria RAM | 512 MB a 1 GB |
| Almacenamiento | Segun proveedor de base de datos y archivos |
| Conexion | HTTPS disponible |

Observacion:

El archivo `render.yaml` usa plan `free`, por lo que el backend puede ejecutarse en una instancia pequena. Sin embargo, para produccion real se recomienda aumentar recursos si crecen usuarios, imagenes, consultas o procesos programados.

Texto sugerido para la figura:

```txt
Cliente web
   |
   v
Servidor backend Node.js
   |
   +-- CPU: 1-2 vCPU
   +-- RAM: 512 MB - 1 GB
   +-- Red: HTTPS
   |
   v
Base de datos PostgreSQL
   |
   v
Almacenamiento externo de imagenes
```

### Figura: Requerimiento de Software

Software requerido:

| Componente | Requerimiento |
|---|---|
| Node.js | Version 20 o superior |
| npm | Incluido con Node.js |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Framework backend | Express |
| Autenticacion | JWT, bcrypt, Passport Google OAuth 2 |
| Variables de entorno | Archivo `.env` o configuracion del proveedor |
| Almacenamiento de imagenes | Supabase |
| Correo | Nodemailer o Resend |
| Sistema operativo | Windows, Linux o macOS |

Variables de entorno principales:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES`
- `JWT_REFRESH_EXPIRES`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `RESEND_API_KEY`

Comandos principales:

```bash
npm install
npm run prisma:generate
npm run migrate:deploy
npm run seed
npm start
```

Texto sugerido para la figura:

```txt
Sistema operativo
      |
      v
Node.js >= 20 + npm
      |
      v
Backend Express
      |
      +-- Prisma ORM
      +-- JWT / bcrypt
      +-- Passport Google OAuth 2
      +-- Zod validators
      |
      v
PostgreSQL + Supabase + Servicio de correo
```
