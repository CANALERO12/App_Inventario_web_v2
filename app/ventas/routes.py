"""Routes de Ventas - CRUD completo con relación a Inventario y Deudas"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Venta, VentaItem, Inventario, Usuario, Deuda
from datetime import datetime

ventas_bp = Blueprint('ventas', __name__)

@ventas_bp.route('/', methods=['GET'])
@jwt_required()
def listar_ventas():
    """Listar todas las ventas de la empresa"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        ventas = Venta.query.filter_by(empresa_id=usuario.empresa_id).all()
        
        resultado = []
        for venta in ventas:
            # Convertir items a dict
            items_list = []
            if hasattr(venta, 'items') and venta.items:
                for item in venta.items:
                    items_list.append({
                        'id': item.id,
                        'venta_id': item.venta_id,
                        'inventario_id': item.inventario_id,
                        'producto_nombre': item.inventario.nombre if item.inventario else 'N/A',
                        'cantidad': item.cantidad,
                        'precio_unitario': float(item.precio_unitario),
                        'subtotal': float(item.subtotal)
                    })
            
            venta_dict = {
                'id': venta.id,
                'cliente_nombre': venta.cliente_nombre,
                'cliente_email': venta.cliente_email or '',
                'cliente_telefono': getattr(venta, 'cliente_telefono', '') or '',
                'subtotal': float(venta.subtotal) if venta.subtotal else 0,
                'total': float(venta.total),
                'tipo_pago': venta.tipo_pago,
                'estado': venta.estado,
                'created_at': venta.created_at.isoformat() if venta.created_at else '',
                'items': items_list
            }
            resultado.append(venta_dict)
        
        return {
            'ventas': resultado,
            'total': len(resultado)
        }, 200
        
    except Exception as e:
        print(f"❌ Error en listar_ventas: {str(e)}")
        return {'error': str(e)}, 500

@ventas_bp.route('/', methods=['POST'])
@jwt_required()
def crear_venta():
    """Crear una nueva venta con validación de stock"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        data = request.get_json()
        
        # Validaciones
        inventario_id = data.get('inventario_id')
        cantidad = data.get('cantidad')
        cliente_nombre = data.get('cliente_nombre')
        tipo_pago = data.get('tipo_pago', 'contado')
        
        if not inventario_id or not cantidad or not cliente_nombre:
            return {'error': 'Faltan campos requeridos'}, 400
        
        # Verificar producto y stock
        producto = Inventario.query.filter_by(
            id=inventario_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not producto:
            return {'error': 'Producto no encontrado'}, 404
        
        cantidad = int(cantidad)
        if producto.cantidad_disponible < cantidad:
            return {'error': f'Stock insuficiente. Disponible: {producto.cantidad_disponible}'}, 400
        
        # Calcular totales
        subtotal = producto.precio_venta * cantidad
        ganancia = (producto.precio_venta - producto.costo_unitario) * cantidad
        
        # Crear venta
        venta = Venta(
            empresa_id=usuario.empresa_id,
            usuario_id=usuario_id,
            cliente_nombre=cliente_nombre,
            cliente_email=data.get('cliente_email', ''),
            cliente_telefono=data.get('cliente_telefono', ''),
            subtotal=subtotal,
            total=subtotal,
            tipo_pago=tipo_pago,
            estado='completada',
        )
        
        db.session.add(venta)
        db.session.flush()  # Para obtener el ID de la venta
        
        # Crear item de venta
        venta_item = VentaItem(
            venta_id=venta.id,
            inventario_id=inventario_id,
            cantidad=cantidad,
            precio_unitario=producto.precio_venta,
            subtotal=subtotal,
        )
        
        db.session.add(venta_item)
        
        # Descontar del inventario
        producto.cantidad_disponible -= cantidad
        
        # Si es crédito, crear deuda automáticamente
        if tipo_pago == 'credito':
            deuda = Deuda(
                empresa_id=usuario.empresa_id,
                venta_id=venta.id,
                cliente_nombre=cliente_nombre,
                cliente_email=data.get('cliente_email', ''),
                monto_total=subtotal,
                monto_pagado=0,
                monto_pendiente=subtotal,
                estado='pendiente',
                descripcion=f'Venta de {cantidad} x {producto.nombre}',
            )
            db.session.add(deuda)
        
        db.session.commit()
        
        return {
            'message': 'Venta creada exitosamente',
            'venta': {
                'id': venta.id,
                'cliente_nombre': venta.cliente_nombre,
                'total': float(venta.total),
                'tipo_pago': venta.tipo_pago
            },
            'ganancia': float(ganancia)
        }, 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en crear_venta: {str(e)}")
        return {'error': str(e)}, 500

@ventas_bp.route('/<int:venta_id>', methods=['GET'])
@jwt_required()
def obtener_venta(venta_id):
    """Obtener detalles de una venta"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        venta = Venta.query.filter_by(
            id=venta_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not venta:
            return {'error': 'Venta no encontrada'}, 404
        
        return {'venta': venta.to_dict()}, 200
        
    except Exception as e:
        print(f"❌ Error en obtener_venta: {str(e)}")
        return {'error': str(e)}, 500

@ventas_bp.route('/<int:venta_id>', methods=['PUT'])
@jwt_required()
def actualizar_venta(venta_id):
    """Actualizar una venta"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        data = request.get_json()
        
        venta = Venta.query.filter_by(
            id=venta_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not venta:
            return {'error': 'Venta no encontrada'}, 404
        
        if 'cliente_nombre' in data:
            venta.cliente_nombre = data['cliente_nombre']
        if 'cliente_email' in data:
            venta.cliente_email = data['cliente_email']
        if 'cliente_telefono' in data:
            venta.cliente_telefono = data['cliente_telefono']
        if 'tipo_pago' in data:
            venta.tipo_pago = data['tipo_pago']
        if 'estado' in data:
            venta.estado = data['estado']
        
        db.session.commit()
        
        return {
            'message': 'Venta actualizada exitosamente',
            'venta': venta.to_dict()
        }, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en actualizar_venta: {str(e)}")
        return {'error': str(e)}, 500

@ventas_bp.route('/<int:venta_id>', methods=['DELETE'])
@jwt_required()
def eliminar_venta(venta_id):
    """Eliminar una venta y revertir stock"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        venta = Venta.query.filter_by(
            id=venta_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not venta:
            return {'error': 'Venta no encontrada'}, 404
        
        # Revertir stock de todos los items
        for item in venta.items:
            producto = Inventario.query.get(item.inventario_id)
            if producto:
                producto.cantidad_disponible += item.cantidad
                db.session.add(producto)
        
        # Eliminar deuda asociada si existe
        deuda = Deuda.query.filter_by(venta_id=venta_id).first()
        if deuda:
            db.session.delete(deuda)
        
        # Eliminar venta
        db.session.delete(venta)
        db.session.commit()
        
        return {'message': 'Venta eliminada y stock revertido'}, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en eliminar_venta: {str(e)}")
        return {'error': str(e)}, 500
