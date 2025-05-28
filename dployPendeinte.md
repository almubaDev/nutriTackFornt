# 🚀 Deployment - Checklist Completo

## 🔴 CRÍTICO (Antes de producción)

### 1. **Variables de Entorno**
- ❌ `.env.example` falta crear
- ❌ Configuración de Railway/Fly.io
- ❌ Secrets management

### 2. **Database Migration**
- ❌ PostgreSQL setup para producción
- ❌ Migration scripts
- ❌ Database seeding

### 3. **Static Files**
- ❌ WhiteNoise configuration
- ❌ STATIC_ROOT setup
- ❌ Collectstatic en pipeline

### 4. **Security Settings**
- ❌ DEBUG=False en producción
- ❌ ALLOWED_HOSTS configurado
- ❌ SECURE_SSL_REDIRECT
- ❌ CORS settings para frontend

## 🟡 IMPORTANTE (Para estabilidad)

### 5. **Health Checks**
- ❌ `/health/` endpoint implementado
- ❌ Database connectivity check
- ❌ External services check

### 6. **Logging**
- ❌ Structured logging
- ❌ Log rotation
- ❌ Error tracking

### 7. **Monitoring**
- ❌ Performance monitoring
- ❌ Database query optimization
- ❌ Memory usage tracking

## 📋 ARCHIVOS NECESARIOS

### Railway Deployment
```toml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Environment Variables
```bash
# .env.example
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Email (opcional)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Google OAuth (opcional)
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret
```

### Requirements Files
```txt
# requirements/base.txt - Ya existe parcialmente
# requirements/production.txt - FALTA
# requirements/development.txt - FALTA
```

## 🔧 CONFIGURACIONES ESPECÍFICAS

### Production Settings
```python
# core/settings/production.py - FALTA CREAR
import os
from .base import *

DEBUG = False
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Database
DATABASES = {
    'default': dj_database_url.parse(os.getenv('DATABASE_URL'))
}

# Security
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000
```

### Health Check Endpoint
```python
# core/views.py - FALTA CREAR
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({'status': 'healthy'})
    except Exception as e:
        return JsonResponse({'status': 'unhealthy'}, status=503)
```