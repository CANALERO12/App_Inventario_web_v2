<<<<<<  < HEAD
# App_Inventario_web_v2
App para Gestion de Inventario Mejorada 
=======
# 🚀 DALU PRO - Aplicación de Gestión de Inventario y Contabilidad

Aplicación web profesional para gestión de inventario, ventas, gastos y deudas. Desarrollada con **Flask**, **PostgreSQL**, **Docker** y preparada para despliegue en **AWS**.

## ✨ Características

- 🔐 **Autenticación JWT** - Tokens seguros con roles
- 📦 **Gestión de Inventario** - Control de stock y productos
- 💰 **Registro de Ventas** - Tracking de ventas y clientes
- 💸 **Gestión de Gastos** - Categorización de gastos
- 📋 **Control de Deudas** - Seguimiento de deudas pendientes
- 📊 **Dashboard y Reportes** - Resúmenes y balance
- 🏢 **Multi-empresa** - Soporte para múltiples negocios
- 🐳 **Dockerizado** - Listo para producción
- ☁️ **AWS Ready** - Preparado para EC2/RDS/AppRunner

## 🔧 Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|------------|---------|
| **Backend** | Flask | 3.0.0 |
| **BD** | PostgreSQL | 15 |
| **ORM** | SQLAlchemy | 2.0.23 |
| **Auth** | Flask-JWT-Extended | 4.5.3 |
| **Cache** | Redis | 7 |
| **Container** | Docker | Latest |
| **Server** | Gunicorn | 21.2.0 |

## 📋 Prerequisitos

- Docker y Docker Compose
- Python 3.11+ (para desarrollo local sin Docker)
- Git

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/dalu-pro.git
cd dalu-pro
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```bash
FLASK_ENV=development
DATABASE_URL=postgresql://dalu_user:dalu_pass@db:5432/dalu_db
SECRET_KEY=tu-clave-super-segura
JWT_SECRET_KEY=jwt-clave-super-segura
```

### 3. Ejecutar con Docker

```bash
# Construir imagen
docker-compose build

# Iniciar servicios (BD, Redis, App)
docker-compose up

# En otra terminal, inicializar BD
docker-compose exec web python init_db.py
```

### 4. Acceder a la Aplicación

```
http://localhost:5000
```

**Credenciales de prueba:**
- Usuario: `admin` / `contador` / `gerente`
- Contraseña: `admin123` / `contador123` / `gerente123`

## 📚 API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/registro` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Login y obtener token |
| GET | `/api/auth/me` | Datos del usuario actual |
| POST | `/api/auth/cambiar-password` | Cambiar contraseña |

### Inventario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/inventario/` | Listar productos |
| POST | `/api/inventario/` | Crear producto |
| GET | `/api/inventario/{id}` | Obtener producto |
| PUT | `/api/inventario/{id}` | Actualizar producto |
| DELETE | `/api/inventario/{id}` | Eliminar producto |

### Ventas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ventas/` | Listar ventas |
| POST | `/api/ventas/` | Crear venta |

### Gastos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/gastos/` | Listar gastos |
| POST | `/api/gastos/` | Crear gasto |

### Deudas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/deudas/` | Listar deudas |
| POST | `/api/deudas/` | Crear deuda |

### Balance

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/balance/resumen` | Resumen balance empresa |

## 🏗️ Estructura del Proyecto

```
App_Inventario_Web_V2/
├── app/
│   ├── __init__.py           # Factory pattern Flask
│   ├── models.py             # Modelos SQLAlchemy
│   ├── auth/
│   │   ├── __init__.py
│   │   └── routes.py         # Rutas de autenticación
│   ├── inventario/
│   │   ├── __init__.py
│   │   └── routes.py         # CRUD de productos
│   ├── ventas/
│   │   ├── __init__.py
│   │   └── routes.py         # Gestión de ventas
│   ├── gastos/
│   │   ├── __init__.py
│   │   └── routes.py         # Registro de gastos
│   ├── deudas/
│   │   ├── __init__.py
│   │   └── routes.py         # Control de deudas
│   └── balance/
│       ├── __init__.py
│       └── routes.py         # Reportes y balance
├── migrations/               # Migraciones de BD (Alembic)
├── config.py                 # Configuración centralizada
├── wsgi.py                   # Entry point para Gunicorn
├── init_db.py               # Inicialización de BD
├── Dockerfile               # Imagen Docker
├── docker-compose.yml       # Orquestación local
├── requirements.txt         # Dependencias Python
├── .env.example             # Variables de entorno
└── README.md                # Este archivo
```

## 🔑 Comandos Útiles

### Desarrollo Local

```bash
# Ver logs en tiempo real
docker-compose logs -f web

# Entrar a la terminal de la app
docker-compose exec web bash

# Conectar a BD PostgreSQL
docker-compose exec db psql -U dalu_user -d dalu_db

# Ejecutar tests
docker-compose exec web pytest

# Parar servicios
docker-compose down
```

### Base de Datos

```bash
# Recrear BD (elimina datos)
docker-compose exec web python init_db.py

# Entrar a Flask shell
docker-compose exec web flask shell
>>> from app.models import Usuario
>>> Usuario.query.all()

# Crear migraciones (cuando cambies modelos)
docker-compose exec web flask db migrate -m "Descripción del cambio"
docker-compose exec web flask db upgrade
```

## 🚢 Despliegue en AWS

### Opción 1: AWS AppRunner (RECOMENDADO)

1. Conectar repositorio GitHub a AppRunner
2. Configurar variables de entorno
3. AppRunner deploya automáticamente en cada push

```bash
git push origin main
# → AppRunner construye y deploya automáticamente
```

### Opción 2: EC2 + RDS

1. Crear RDS PostgreSQL (db.t3.micro free tier)
2. Crear EC2 instance (t3.micro free tier)
3. Instalar Docker en EC2
4. Clonar repo y ejecutar

```bash
ssh -i key.pem ubuntu@IP
git clone https://github.com/tu-usuario/dalu-pro.git
cd dalu-pro
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de Producción

```bash
FLASK_ENV=production
DATABASE_URL=postgresql://admin:PASSWORD@dalu-rds.xxxxx.rds.amazonaws.com/dalu_db
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
```

## 🔒 Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ JWT tokens seguros
- ✅ CORS configurado
- ✅ Validación de entrada
- ✅ Sin secretos hardcodeados
- ✅ Variables de entorno

**Antes de producción:**
- [ ] Cambiar SECRET_KEY
- [ ] Cambiar JWT_SECRET_KEY
- [ ] Configurar HTTPS/SSL
- [ ] Habilitar backups RDS
- [ ] Configurar monitoreo (CloudWatch)

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| `connection refused` | Verificar que BD está corriendo: `docker-compose logs db` |
| `ModuleNotFoundError` | Instalar dependencias: `pip install -r requirements.txt` |
| `database does not exist` | Ejecutar: `docker-compose exec web python init_db.py` |
| `port 5000 already in use` | Liberar puerto: `lsof -i :5000` |

## 📞 Soporte

Para dudas o problemas:

1. Revisar logs: `docker-compose logs`
2. Conectar a BD: `docker-compose exec db psql -U dalu_user`
3. Ejecutar tests: `docker-compose exec web pytest`
4. Revisar documentación: [docs/](./docs/)

## 📄 Licencia

MIT License - Ver LICENSE.txt

---

**¡Disfruta de DALU PRO! 🚀**
>>>>>>> 52c8161 (Initial commit - DALU App v1.0 with inventory, sales, debts and balance)
