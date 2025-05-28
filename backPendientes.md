# 🔧 Backend - Funcionalidades Pendientes

## 🔴 CRÍTICO (Para funcionamiento completo)

### 1. **Google Gemini API Integration**
- ❌ **Actualmente simulado** en `ai_analysis/views.py`
- Necesita implementación real de Gemini 2.5 Flash
- Manejo de rate limits y costos
- Compresión de imágenes para optimizar tokens

### 2. **Email Verification**
- ❌ **Configurado pero no implementado**
- SMTP settings
- Templates de email
- Endpoint de verificación

### 3. **Rate Limiting**
- ❌ **Falta implementar** django-ratelimit
- Límites por usuario para análisis IA
- Protección contra spam en registro

## 🟡 IMPORTANTE (Para producción)

### 4. **Error Handling Mejorado**
- Logging estructurado
- Sentry integration (opcional)
- Error responses consistentes

### 5. **Validaciones Mejoradas**
- Validación de imágenes más robusta
- Sanitización de inputs
- Validación de tipos de archivo

### 6. **Caching**
- Redis para búsquedas frecuentes
- Cache de cálculos nutricionales
- Cache de análisis IA duplicados

## 🔵 NICE TO HAVE (Futuro)

### 7. **Notificaciones Push**
- Firebase integration
- Recordatorios diarios
- Notificaciones de metas

### 8. **Analytics Avanzados**
- Tracking de uso
- Métricas de engagement
- Costos de IA por usuario

## 📋 DETALLES ESPECÍFICOS

### Gemini API Integration
```python
# ai_analysis/gemini_client.py
import google.generativeai as genai
from django.conf import settings

class GeminiClient:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def analyze_food_image(self, image_data):
        # Implementación real
        pass
```

### Rate Limiting
```python
# middleware/rate_limiting.py
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user', rate='60/h', method='POST')
def analyze_food_image(request):
    # Límite de 60 análisis por hora por usuario
    pass
```

### Email Verification
```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
```