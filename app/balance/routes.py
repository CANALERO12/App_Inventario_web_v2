"""Routes de Balance - Dashboard Financiero
Endpoint para calcular y devolver el balance completo
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Venta, Gasto, Deuda, Usuario
from sqlalchemy import func

balance_bp = Blueprint('balance', __name__)


@balance_bp.route('/', methods=['GET'])
@jwt_required()
def obtener_balance():
    """Obtener balance financiero completo"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        empresa_id = usuario.empresa_id
        
        # ✅ Calcular total ingresos (suma de TODAS las ventas)
        total_ingresos = db.session.query(func.sum(Venta.total)) \
            .filter_by(empresa_id=empresa_id).scalar() or 0
        
        # ✅ Calcular total egresos (suma de TODOS los gastos)
        total_egresos = db.session.query(func.sum(Gasto.monto)) \
            .filter_by(empresa_id=empresa_id).scalar() or 0
        
        # ✅ Calcular deudas pendientes (solo las que NO están pagadas)
        deudas_pendientes = db.session.query(func.sum(Deuda.monto_pendiente)) \
            .filter(
                Deuda.empresa_id == empresa_id,
                Deuda.estado.in_(['pendiente', 'vencida'])
            ).scalar() or 0
        
        # ✅ Calcular balance neto = ingresos - egresos
        balance_neto = float(total_ingresos) - float(total_egresos)
        
        # ✅ Calcular flujo disponible = balance neto - deudas pendientes
        flujo_disponible = balance_neto - float(deudas_pendientes)
        
        # ✅ Contar registros para contexto
        cantidad_ventas = Venta.query.filter_by(empresa_id=empresa_id).count()
        cantidad_gastos = Gasto.query.filter_by(empresa_id=empresa_id).count()
        cantidad_deudas_pendientes = Deuda.query.filter(
            Deuda.empresa_id == empresa_id,
            Deuda.estado.in_(['pendiente', 'vencida'])
        ).count()
        
        response = {
            'total_ingresos': float(total_ingresos),
            'total_egresos': float(total_egresos),
            'balance_neto': balance_neto,
            'deudas_pendientes': float(deudas_pendientes),
            'flujo_disponible': flujo_disponible,
            'cantidad_ventas': cantidad_ventas,
            'cantidad_gastos': cantidad_gastos,
            'cantidad_deudas_pendientes': cantidad_deudas_pendientes
        }
        
        print(f"✅ Balance calculado para empresa {empresa_id}: {response}")
        return response, 200
        
    except Exception as e:
        print(f"❌ Error en obtener_balance: {str(e)}")
        return {'error': str(e)}, 500