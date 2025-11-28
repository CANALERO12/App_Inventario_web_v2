"""
Blueprint de Deudas - VERSIÓN COMPLETA CON VALIDACIONES
Maneja: CRUD de deudas, pagos, abonos, historial
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Deuda, Usuario
from datetime import datetime


deudas_bp = Blueprint('deudas', __name__)


@deudas_bp.route('/', methods=['GET'])
@jwt_required()
def listar_deudas():
    """Listar deudas (filtrables por estado)"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        # Parámetro para filtrar por estado
        estado_filtro = request.args.get('estado', 'activas')  # 'activas', 'pagadas', 'todas'
        
        deudas = Deuda.query.filter_by(empresa_id=usuario.empresa_id).all()
        
        # Filtrar según parámetro
        if estado_filtro == 'activas':
            deudas_filtradas = [d for d in deudas if d.estado in ['pendiente', 'parcial', 'vencida']]
        elif estado_filtro == 'pagadas':
            deudas_filtradas = [d for d in deudas if d.estado == 'pagada']
        else:
            deudas_filtradas = deudas
        
        # Calcular totales
        total_pendiente = sum(d.monto_pendiente for d in deudas_filtradas if d.monto_pendiente > 0)
        total_pagadas = sum(d.monto_pagado for d in deudas_filtradas if d.estado == 'pagada')
        
        print(f"✅ Deudas cargadas: {len(deudas_filtradas)} (filtro: {estado_filtro})")
        
        return {
            'total': len(deudas_filtradas),
            'deudas': [d.to_dict() for d in deudas_filtradas],
            'total_pendiente': total_pendiente,
            'total_pagadas': total_pagadas
        }, 200
        
    except Exception as e:
        print(f"❌ Error en listar_deudas: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'error': str(e)}, 500


@deudas_bp.route('/', methods=['POST'])
@jwt_required()
def crear_deuda():
    """Crear nueva deuda"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        data = request.get_json()
        
        print(f"📝 Datos recibidos: {data}")
        
        # Validaciones
        if not data.get('cliente_nombre') or not data.get('monto_total'):
            return {'error': 'Cliente y monto son requeridos'}, 400
        
        monto_total = float(data['monto_total'])
        monto_pagado = float(data.get('monto_pagado', 0))
        
        if monto_total <= 0:
            return {'error': 'El monto debe ser mayor a 0'}, 400
        
        if monto_pagado < 0 or monto_pagado > monto_total:
            return {'error': 'Monto pagado no válido'}, 400
        
        # Convertir fecha_vencimiento si existe
        fecha_vencimiento = None
        if data.get('fecha_vencimiento'):
            try:
                fecha_vencimiento = datetime.strptime(data['fecha_vencimiento'], '%Y-%m-%d')
            except:
                fecha_vencimiento = None
        
        # Determinar estado
        if monto_pagado >= monto_total:
            estado = 'pagada'
        elif monto_pagado > 0:
            estado = 'parcial'
        else:
            estado = 'pendiente'
        
        monto_pendiente = monto_total - monto_pagado
        
        deuda = Deuda(
            empresa_id=usuario.empresa_id,
            cliente_nombre=data['cliente_nombre'],
            cliente_email=data.get('cliente_email'),
            monto_total=monto_total,
            monto_pagado=monto_pagado,
            monto_pendiente=monto_pendiente,
            estado=estado,
            fecha_vencimiento=fecha_vencimiento,
            descripcion=data.get('descripcion'),
        )
        
        db.session.add(deuda)
        db.session.commit()
        
        print(f"✅ Deuda creada: {deuda.id} | Estado: {estado}")
        
        return {
            'message': 'Deuda registrada exitosamente',
            'deuda': deuda.to_dict()
        }, 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en crear_deuda: {str(e)}")
        import traceback
        traceback.print_exc()
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
        print(f"❌ Error en obtener_deuda: {str(e)}")
        return {'error': str(e)}, 500


@deudas_bp.route('/<int:deuda_id>', methods=['PUT'])
@jwt_required()
def actualizar_deuda(deuda_id):
    """Actualizar una deuda (registrar abono)"""
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
        
        print(f"📝 Actualizando deuda {deuda_id}: {data}")
        
        # ✨ VALIDACIÓN: Actualizar campos
        if 'cliente_nombre' in data:
            deuda.cliente_nombre = data['cliente_nombre']
        
        if 'cliente_email' in data:
            deuda.cliente_email = data['cliente_email']
        
        if 'monto_pagado' in data:
            monto_pagado_nuevo = float(data['monto_pagado'])
            
            # ✨ VALIDACIÓN: No permitir abono mayor a la deuda
            if monto_pagado_nuevo > deuda.monto_total:
                return {
                    'error': f'El abono no puede ser mayor a ${deuda.monto_total}. Máximo permitido: ${deuda.monto_total - deuda.monto_pagado}'
                }, 400
            
            if monto_pagado_nuevo < 0:
                return {'error': 'El monto pagado no puede ser negativo'}, 400
            
            deuda.monto_pagado = monto_pagado_nuevo
            
            # ✨ RECALCULAR automáticamente monto_pendiente
            deuda.monto_pendiente = max(0, deuda.monto_total - monto_pagado_nuevo)
            
            # ✨ CAMBIAR ESTADO automáticamente
            if deuda.monto_pagado >= deuda.monto_total:
                deuda.estado = 'pagada'
            elif deuda.monto_pagado > 0:
                deuda.estado = 'parcial'
            else:
                deuda.estado = 'pendiente'
            
            print(f"✅ Monto actualizado: ${monto_pagado_nuevo} | Pendiente: ${deuda.monto_pendiente} | Estado: {deuda.estado}")
        
        if 'estado' in data:
            deuda.estado = data['estado']
        
        if 'fecha_vencimiento' in data:
            if data['fecha_vencimiento']:
                try:
                    deuda.fecha_vencimiento = datetime.strptime(data['fecha_vencimiento'], '%Y-%m-%d')
                except:
                    pass
        
        if 'descripcion' in data:
            deuda.descripcion = data['descripcion']
        
        db.session.commit()
        
        print(f"✅ Deuda {deuda_id} actualizada correctamente")
        
        return {
            'message': 'Deuda actualizada correctamente',
            'deuda': deuda.to_dict()
        }, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en actualizar_deuda: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'error': str(e)}, 500


@deudas_bp.route('/<int:deuda_id>', methods=['DELETE'])
@jwt_required()
def eliminar_deuda(deuda_id):
    """Eliminar una deuda (NO elimina realmente, solo cambia estado)"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        deuda = Deuda.query.filter_by(
            id=deuda_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not deuda:
            return {'error': 'Deuda no encontrada'}, 404
        
        # ✨ NO ELIMINAR: Solo marcar como eliminada
        deuda.estado = 'eliminada'
        db.session.commit()
        
        print(f"✅ Deuda {deuda_id} marcada como eliminada")
        
        return {'message': 'Deuda eliminada'}, 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en eliminar_deuda: {str(e)}")
        return {'error': str(e)}, 500
