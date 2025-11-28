"""Routes de Deudas - CRUD completo"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Deuda, Usuario
from datetime import datetime

deudas_bp = Blueprint('deudas', __name__)

@deudas_bp.route('/', methods=['GET'])
@jwt_required()
def listar_deudas():
    """Listar todas las deudas de la empresa"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        deudas = Deuda.query.filter_by(empresa_id=usuario.empresa_id).all()
        
        # Calcular totales
        total_pendiente = sum(d.monto_pendiente for d in deudas if d.estado == 'pendiente')
        total_pagadas = sum(d.monto_total for d in deudas if d.estado == 'pagada')
        
        return {
            'deudas': [d.to_dict() for d in deudas],
            'total': len(deudas),
            'total_pendiente': total_pendiente,
            'total_pagadas': total_pagadas
        }, 200
    except Exception as e:
        return {'error': str(e)}, 500

@deudas_bp.route('/', methods=['POST'])
@jwt_required()
def crear_deuda():
    """Crear nueva deuda manualmente"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        data = request.get_json()
        
        # Validaciones
        cliente_nombre = data.get('cliente_nombre')
        monto_total = data.get('monto_total')
        
        if not cliente_nombre or monto_total is None:
            return {'error': 'Faltan campos requeridos'}, 400
        
        if monto_total <= 0:
            return {'error': 'El monto debe ser mayor a 0'}, 400
        
        deuda = Deuda(
            empresa_id=usuario.empresa_id,
            cliente_nombre=cliente_nombre,
            cliente_email=data.get('cliente_email'),
            monto_total=monto_total,
            monto_pagado=data.get('monto_pagado', 0),
            monto_pendiente=monto_total - data.get('monto_pagado', 0),
            estado=data.get('estado', 'pendiente'),
            descripcion=data.get('descripcion'),
        )
        
        db.session.add(deuda)
        db.session.commit()
        
        return {
            'message': 'Deuda creada exitosamente',
            'deuda': deuda.to_dict()
        }, 201
        
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500

@deudas_bp.route('/<int:deuda_id>', methods=['GET'])
@jwt_required()
def obtener_deuda(deuda_id):
    """Obtener detalles de una deuda"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        deuda = Deuda.query.filter_by(
            id=deuda_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not deuda:
            return {'error': 'Deuda no encontrada'}, 404
        
        return {'deuda': deuda.to_dict()}, 200
    except Exception as e:
        return {'error': str(e)}, 500

@deudas_bp.route('/<int:deuda_id>', methods=['PUT'])
@jwt_required()
def actualizar_deuda(deuda_id):
    """Actualizar una deuda (registrar pagos, cambiar estado)"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        data = request.get_json()
        
        deuda = Deuda.query.filter_by(
            id=deuda_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not deuda:
            return {'error': 'Deuda no encontrada'}, 404
        
        # Actualizar campos permitidos
        if 'cliente_nombre' in data:
            deuda.cliente_nombre = data['cliente_nombre']
        
        if 'cliente_email' in data:
            deuda.cliente_email = data['cliente_email']
        
        # Procesar pago
        if 'monto_pagado' in data:
            monto_pagado = data['monto_pagado']
            if monto_pagado < 0:
                return {'error': 'El monto pagado no puede ser negativo'}, 400
            if monto_pagado > deuda.monto_total:
                return {'error': f'El monto pagado no puede exceder el total ({deuda.monto_total})'}, 400
            
            deuda.monto_pagado = monto_pagado
            deuda.monto_pendiente = deuda.monto_total - monto_pagado
            
            # Actualizar estado automáticamente
            if deuda.monto_pendiente <= 0:
                deuda.estado = 'pagada'
                deuda.monto_pendiente = 0
            elif deuda.estado == 'pagada':
                deuda.estado = 'pendiente'
        
        if 'estado' in data:
            estado = data['estado']
            if estado not in ['pendiente', 'pagada', 'vencida']:
                return {'error': 'Estado inválido. Usa: pendiente, pagada o vencida'}, 400
            deuda.estado = estado
        
        if 'descripcion' in data:
            deuda.descripcion = data['descripcion']
        
        db.session.commit()
        
        return {
            'message': 'Deuda actualizada exitosamente',
            'deuda': deuda.to_dict()
        }, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500

@deudas_bp.route('/<int:deuda_id>', methods=['DELETE'])
@jwt_required()
def eliminar_deuda(deuda_id):
    """Eliminar una deuda"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        deuda = Deuda.query.filter_by(
            id=deuda_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not deuda:
            return {'error': 'Deuda no encontrada'}, 404
        
        db.session.delete(deuda)
        db.session.commit()
        
        return {'message': 'Deuda eliminada exitosamente'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500
