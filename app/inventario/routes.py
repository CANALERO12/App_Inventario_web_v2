"""
Blueprint de Inventario
Maneja: CRUD de productos, control de stock
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Inventario, Usuario
from datetime import datetime


inventario_bp = Blueprint('inventario', __name__)


@inventario_bp.route('/', methods=['GET'])
@jwt_required()
def listar_productos():
    """Listar todos los productos de la empresa"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        productos = Inventario.query.filter_by(empresa_id=usuario.empresa_id).all()
        
        print(f"✅ Productos cargados: {len(productos)}")
        
        return {
            'total': len(productos),
            'productos': [p.to_dict() for p in productos]
        }, 200
        
    except Exception as e:
        print(f"❌ Error en listar_productos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'error': str(e)}, 500


@inventario_bp.route('/', methods=['POST'])
@jwt_required()
def crear_producto():
    """Crear nuevo producto"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        data = request.get_json()
        
        print(f"📝 Datos recibidos: {data}")
        
        # Validaciones
        if not data.get('nombre') or not data.get('sku'):
            return {'error': 'Nombre y SKU son requeridos'}, 400
        
        # Verificar SKU único
        if Inventario.query.filter_by(sku=data['sku']).first():
            return {'error': 'El SKU ya existe'}, 409
        
        # Convertir fecha_compra si existe
        fecha_compra = None
        if data.get('fecha_compra'):
            try:
                fecha_compra = datetime.strptime(data['fecha_compra'], '%Y-%m-%d')
                print(f"✅ Fecha convertida: {fecha_compra}")
            except Exception as e:
                print(f"⚠️ Error convirtiendo fecha: {e}")
                fecha_compra = None
        
        producto = Inventario(
            empresa_id=usuario.empresa_id,
            nombre=data['nombre'],
            descripcion=data.get('descripcion'),
            sku=data['sku'],
            categoria=data.get('categoria'),
            categoria_id=data.get('categoria_id'),
            costo_unitario=float(data.get('costo_unitario', 0)),
            precio_venta=float(data.get('precio_venta', 0)),
            cantidad_disponible=int(data.get('cantidad_disponible', 0)),
            cantidad_minima=int(data.get('cantidad_minima', 5)),
            proveedor=data.get('proveedor'),
            fecha_compra=fecha_compra,
        )
        
        db.session.add(producto)
        db.session.commit()
        
        print(f"✅ Producto creado: {producto.id}")
        
        return {
            'message': 'Producto creado exitosamente',
            'producto': producto.to_dict()
        }, 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en crear_producto: {str(e)}")
        import traceback
        traceback.print_exc()
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
        print(f"❌ Error en obtener_producto: {str(e)}")
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
            producto.precio_venta = float(data['precio_venta'])
        if 'costo_unitario' in data:
            producto.costo_unitario = float(data['costo_unitario'])
        if 'cantidad_disponible' in data:
            producto.cantidad_disponible = int(data['cantidad_disponible'])
        if 'categoria' in data:
            producto.categoria = data['categoria']
        if 'categoria_id' in data:
            producto.categoria_id = data['categoria_id']
        if 'proveedor' in data:
            producto.proveedor = data['proveedor']
        if 'fecha_compra' in data:
            if data['fecha_compra']:
                try:
                    producto.fecha_compra = datetime.strptime(data['fecha_compra'], '%Y-%m-%d')
                except:
                    pass
        
        db.session.commit()
        
        print(f"✅ Producto {producto_id} actualizado")
        
        return {
            'message': 'Producto actualizado',
            'producto': producto.to_dict()
        }, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en actualizar_producto: {str(e)}")
        import traceback
        traceback.print_exc()
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
        
        print(f"✅ Producto {producto_id} eliminado")
        
        return {'message': 'Producto eliminado'}, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en eliminar_producto: {str(e)}")
        return {'error': str(e)}, 500
