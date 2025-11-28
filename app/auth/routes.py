from flask import Blueprint, request, jsonify, redirect, url_for
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from app.models import Usuario, Empresa
from app import db
from datetime import timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login endpoint - Retorna formato compatible con frontend"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"success": False, "message": "Usuario y contraseña requeridos"}), 400
        
        usuario = Usuario.query.filter_by(username=username).first()
        
        if not usuario or not check_password_hash(usuario.password_hash, password):
            return jsonify({"success": False, "message": "Credenciales inválidas"}), 401
        
        if not usuario.activo:
            return jsonify({"success": False, "message": "Usuario inactivo"}), 401
        
        # Generar JWT token
        access_token = create_access_token(identity=usuario.id, expires_delta=timedelta(hours=24))
        
        return jsonify({
            "success": True,
            "message": "Login exitoso",
            "access_token": access_token,
            "usuario": {
                "id": usuario.id,
                "username": usuario.username,
                "email": usuario.email,
                "rol": usuario.rol
            },
            "empresa_id": usuario.empresa_id
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout endpoint - Solo limpia el token en el cliente"""
    return jsonify({"success": True, "message": "Logout exitoso"}), 200


@auth_bp.route('/registro', methods=['POST'])
def registro():
    """Registro de nuevo usuario"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        empresa_nombre = data.get('empresa_nombre', 'Mi Empresa')
        
        # Validaciones
        if not username or not email or not password:
            return jsonify({"success": False, "message": "Todos los campos son requeridos"}), 400
        
        if Usuario.query.filter_by(username=username).first():
            return jsonify({"success": False, "message": "El usuario ya existe"}), 409
        
        if Usuario.query.filter_by(email=email).first():
            return jsonify({"success": False, "message": "El email ya existe"}), 409
        
        # Crear empresa
        empresa = Empresa(nombre=empresa_nombre, nit='0')
        db.session.add(empresa)
        db.session.flush()
        
        # Crear usuario
        usuario = Usuario(
            username=username,
            email=email,
            empresa_id=empresa.id,
            rol='admin'
        )
        usuario.set_password(password)
        
        db.session.add(usuario)
        db.session.commit()
        
        # Generar token automático
        access_token = create_access_token(identity=usuario.id, expires_delta=timedelta(hours=24))
        
        return jsonify({
            "success": True,
            "message": "Usuario registrado exitosamente",
            "access_token": access_token,
            "usuario": usuario.to_dict(),
            "empresa_id": usuario.empresa_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify():
    """Verificar que el token es válido"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return jsonify({"success": False, "message": "Usuario no encontrado"}), 404
        
        return jsonify({
            "success": True,
            "usuario": usuario.to_dict(),
            "empresa_id": usuario.empresa_id
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500