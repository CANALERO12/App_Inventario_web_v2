import os
from datetime import timedelta

class Config:
    """Configuración base para todas las versiones"""
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-change-me'
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-change-me'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    # SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # CORS
    JSON_SORT_KEYS = False

class DevelopmentConfig(Config):
    """Configuración para desarrollo local con Docker"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    # Usa la variable de ambiente DATABASE_URL que viene de docker-compose
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://dalu_user:dalu_pass@localhost:5432/dalu_db_dev'

class ProductionConfig(Config):
    """Configuración para producción en AWS"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError("DATABASE_URL environment variable not set in production")

class TestingConfig(Config):
    """Configuración para tests"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    WTF_CSRF_ENABLED = False

# Diccionario de configuraciones
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(env=None):
    """Obtener configuración según el ambiente"""
    if env is None:
        env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
