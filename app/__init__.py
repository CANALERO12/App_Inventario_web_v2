from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='development'):
    # ===== RUTAS ABSOLUTAS - CRÍTICO PARA DOCKER =====
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
    STATIC_DIR = os.path.join(BASE_DIR, 'static')
    
    print(f"\n🗂️  BASE_DIR: {BASE_DIR}")
    print(f"📄 TEMPLATE_DIR: {TEMPLATE_DIR}")
    print(f"✅ Templates exist: {os.path.exists(TEMPLATE_DIR)}")
    print(f"📁 Templates files: {os.listdir(TEMPLATE_DIR) if os.path.exists(TEMPLATE_DIR) else 'NO EXISTE'}\n")
    
    app = Flask(__name__, 
                template_folder=TEMPLATE_DIR,
                static_folder=STATIC_DIR,
                static_url_path='/static')

    
    # ===== CONFIG =====
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://dalu_user:dalu_pass@db:5432/dalu_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-dev-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400
    
    # ===== INICIALIZAR EXTENSIONES =====
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # ===== RUTAS FRONTEND - SERVE HTML PAGES =====
    @app.route('/', methods=['GET'])
    def index():
        """Carga la página de login"""
        return render_template('login.html')
    
    @app.route('/login', methods=['GET'])
    def login_page():
        """Carga la página de login (ruta alternativa)"""
        return render_template('login.html')
    
    @app.route('/registro', methods=['GET'])
    def registro_page():
        """Carga la página de registro"""
        return render_template('registro.html')
    
    @app.route('/inventario', methods=['GET'])
    def inventario_page():
        """Carga la página de inventario"""
        return render_template('inventario.html')
    
    @app.route('/ventas', methods=['GET'])
    def ventas_page():
        """Carga la página de ventas"""
        return render_template('ventas.html')
    
    @app.route('/gastos', methods=['GET'])
    def gastos_page():
        """Carga la página de gastos"""
        return render_template('gastos.html')
    
    @app.route('/deudas', methods=['GET'])
    def deudas_page():
        """Carga la página de deudas"""
        return render_template('deudas.html')
    
    @app.route('/balance', methods=['GET'])
    def balance_page():
        """Carga la página de balance"""
        return render_template('balance.html')
    
    # ===== HEALTH CHECK =====
    @app.route('/api/health', methods=['GET'])
    def health():
        """Verificar que la API está activa"""
        return {"status": "ok"}, 200
    
    # ===== REGISTRAR BLUEPRINTS =====
    from app.auth.routes import auth_bp
    from app.inventario.routes import inventario_bp
    from app.ventas.routes import ventas_bp
    from app.gastos.routes import gastos_bp
    from app.deudas.routes import deudas_bp
    from app.balance.routes import balance_bp
    from app.balance.routes import balance_bp
    
    # Registrar con prefijos URL
    app.register_blueprint(auth_bp)  # Ya tiene url_prefix='/api/auth' en su definición
    app.register_blueprint(inventario_bp, url_prefix='/api/inventario')
    app.register_blueprint(ventas_bp, url_prefix='/api/ventas')
    app.register_blueprint(gastos_bp, url_prefix='/api/gastos')
    app.register_blueprint(deudas_bp, url_prefix='/api/deudas')
    app.register_blueprint(balance_bp, url_prefix='/api/balance')
    
    
    # ===== CREAR TABLAS =====
    with app.app_context():
        db.create_all()
    
    return app
