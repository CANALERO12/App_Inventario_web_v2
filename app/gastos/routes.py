"""Routes de Gastos"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Gasto, Usuario
from datetime import datetime

gastos_bp = Blueprint('gastos', __name__)

@gastos_bp.route('/', methods=['GET'])
@jwt_required()
def listar_gastos():
    """Listar gastos de la empresa"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        gastos = Gasto.query.filter_by(empresa_id=usuario.empresa_id).all()
        return {
            'gastos': [g.to_dict() for g in gastos],
            'total': len(gastos)
        }, 200
    except Exception as e:
        return {'error': str(e)}, 500

@gastos_bp.route('/', methods=['POST'])
@jwt_required()
def crear_gasto():
    """Crear nuevo gasto"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        data = request.get_json()

        # Validaciones básicas
        descripcion = data.get('descripcion')
        monto = data.get('monto')

        if not descripcion:
            return {'error': 'La descripción es requerida'}, 400
        if monto is None:
            return {'error': 'El monto es requerido'}, 400

        gasto = Gasto(
            empresa_id=usuario.empresa_id,
            usuario_id=usuario_id,
            descripcion=descripcion,
            categoria=data.get('categoria'),
            monto=monto,
            comprobante=data.get('comprobante'),
        )

        db.session.add(gasto)
        db.session.commit()

        return {
            'message': 'Gasto creado exitosamente',
            'gasto': gasto.to_dict()
        }, 201

    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500

@gastos_bp.route('/<int:gasto_id>', methods=['GET'])
@jwt_required()
def obtener_gasto(gasto_id):
    """Obtener un gasto específico"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        gasto = Gasto.query.filter_by(
            id=gasto_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not gasto:
            return {'error': 'Gasto no encontrado'}, 404
        
        return {'gasto': gasto.to_dict()}, 200
    except Exception as e:
        return {'error': str(e)}, 500

@gastos_bp.route('/<int:gasto_id>', methods=['PUT'])
@jwt_required()
def actualizar_gasto(gasto_id):
    """Actualizar un gasto"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        data = request.get_json()
        
        gasto = Gasto.query.filter_by(
            id=gasto_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not gasto:
            return {'error': 'Gasto no encontrado'}, 404
        
        if 'descripcion' in data:
            gasto.descripcion = data['descripcion']
        if 'categoria' in data:
            gasto.categoria = data['categoria']
        if 'monto' in data:
            gasto.monto = data['monto']
        if 'comprobante' in data:
            gasto.comprobante = data['comprobante']
        
        db.session.commit()
        
        return {
            'message': 'Gasto actualizado exitosamente',
            'gasto': gasto.to_dict()
        }, 200
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500

@gastos_bp.route('/<int:gasto_id>', methods=['DELETE'])
@jwt_required()
def eliminar_gasto(gasto_id):
    """Eliminar un gasto"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        gasto = Gasto.query.filter_by(
            id=gasto_id,
            empresa_id=usuario.empresa_id
        ).first()
        
        if not gasto:
            return {'error': 'Gasto no encontrado'}, 404
        
        db.session.delete(gasto)
        db.session.commit()
        
        return {'message': 'Gasto eliminado exitosamente'}, 200
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500
