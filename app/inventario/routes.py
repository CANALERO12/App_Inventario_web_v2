"""
Blueprint de Inventario
Maneja: CRUD de productos, control de stock
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Inventario, Usuario

inventario_bp = Blueprint('inventario', __name__)

@inventario_bp.route('/', methods=['GET'])
@jwt_required()
def listar_productos():
    """Listar todos los productos de la empresa"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        productos = Inventario.query.filter_by(empresa_id=usuario.empresa_id).all()
        
        return {
            'total': len(productos),
            'productos': [p.to_dict() for p in productos]
        }, 200
        
    except Exception as e:
        return {'error': str(e)}, 500

@inventario_bp.route('/', methods=['POST'])
@jwt_required()
def crear_producto():
    """Crear nuevo producto"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        data = request.get_json()
        
        # Validaciones
        if not data.get('nombre') or not data.get('sku'):
            return {'error': 'Nombre y SKU son requeridos'}, 400
        
        # Verificar SKU único
        if Inventario.query.filter_by(sku=data['sku']).first():
            return {'error': 'El SKU ya existe'}, 409
        
        producto = Inventario(
            empresa_id=usuario.empresa_id,
            nombre=data['nombre'],
            descripcion=data.get('descripcion'),
            sku=data['sku'],
            categoria=data.get('categoria'),
            costo_unitario=data.get('costo_unitario', 0),
            precio_venta=data.get('precio_venta', 0),
            cantidad_disponible=data.get('cantidad_disponible', 0),
            cantidad_minima=data.get('cantidad_minima', 5),
        )
        
        db.session.add(producto)
        db.session.commit()
        
        return {
            'message': 'Producto creado exitosamente',
            'producto': producto.to_dict()
        }, 201
        
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500

@inventario_bp.route('/<int:producto_id>', methods=['GET'])
@jwt_required()
def obtener_producto(producto_id):
    """Obtener detalles de un producto"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        producto = Inventario.query.filter_by(
            id=producto_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not producto:
            return {'error': 'Producto no encontrado'}, 404
        
        return {'producto': producto.to_dict()}, 200
        
    except Exception as e:
        return {'error': str(e)}, 500

@inventario_bp.route('/<int:producto_id>', methods=['PUT'])
@jwt_required()
def actualizar_producto(producto_id):
    """Actualizar un producto"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        data = request.get_json()
        
        producto = Inventario.query.filter_by(
            id=producto_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not producto:
            return {'error': 'Producto no encontrado'}, 404
        
        # Actualizar campos
        if 'nombre' in data:
            producto.nombre = data['nombre']
        if 'descripcion' in data:
            producto.descripcion = data['descripcion']
        if 'precio_venta' in data:
            producto.precio_venta = data['precio_venta']
        if 'costo_unitario' in data:
            producto.costo_unitario = data['costo_unitario']
        if 'cantidad_disponible' in data:
            producto.cantidad_disponible = data['cantidad_disponible']
        if 'categoria' in data:
            producto.categoria = data['categoria']
        
        db.session.commit()
        
        return {
            'message': 'Producto actualizado',
            'producto': producto.to_dict()
        }, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500

@inventario_bp.route('/<int:producto_id>', methods=['DELETE'])
@jwt_required()
def eliminar_producto(producto_id):
    """Eliminar un producto"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        producto = Inventario.query.filter_by(
            id=producto_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not producto:
            return {'error': 'Producto no encontrado'}, 404
        
        db.session.delete(producto)
        db.session.commit()
        
        return {'message': 'Producto eliminado'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500
