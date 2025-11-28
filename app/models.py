"""
Modelos SQLAlchemy para la aplicación DALU
Define la estructura de todas las tablas de la BD
"""
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import func


class Empresa(db.Model):
    """Modelo para empresas/negocios"""
    __tablename__ = 'empresa'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), nullable=False, unique=True)
    nit = db.Column(db.String(20), nullable=False, unique=True)
    direccion = db.Column(db.String(255))
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    usuarios = db.relationship('Usuario', backref='empresa', lazy=True, cascade='all, delete-orphan')
    inventarios = db.relationship('Inventario', backref='empresa', lazy=True, cascade='all, delete-orphan')
    ventas = db.relationship('Venta', backref='empresa', lazy=True, cascade='all, delete-orphan')
    gastos = db.relationship('Gasto', backref='empresa', lazy=True, cascade='all, delete-orphan')
    deudas = db.relationship('Deuda', backref='empresa', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'nit': self.nit,
            'direccion': self.direccion,
            'telefono': self.telefono,
            'email': self.email,
        }


class Usuario(db.Model):
    """Modelo para usuarios del sistema"""
    __tablename__ = 'usuario'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresa.id'), nullable=False)
    rol = db.Column(db.String(50), default='usuario')  # admin, contador, gerente, usuario
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        """Encriptar y guardar contraseña"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verificar contraseña"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'empresa_id': self.empresa_id,
            'rol': self.rol,
            'activo': self.activo,
        }


class Inventario(db.Model):
    """Modelo para productos en inventario"""
    __tablename__ = 'inventario'
    
    id = db.Column(db.Integer, primary_key=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresa.id'), nullable=False)
    nombre = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.Text)
    sku = db.Column(db.String(100), nullable=False, unique=True)
    categoria = db.Column(db.String(100))
    costo_unitario = db.Column(db.Float, nullable=False)
    precio_venta = db.Column(db.Float, nullable=False)
    cantidad_disponible = db.Column(db.Integer, default=0)
    cantidad_minima = db.Column(db.Integer, default=5)
    
    # ✨ NUEVOS CAMPOS:
    categoria_id = db.Column(db.Integer, db.ForeignKey('categoria.id'))
    proveedor = db.Column(db.String(255))
    fecha_compra = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    ventas_items = db.relationship('VentaItem', backref='inventario', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'sku': self.sku,
            'categoria': self.categoria,
            'costo_unitario': self.costo_unitario,
            'precio_venta': self.precio_venta,
            'cantidad_disponible': self.cantidad_disponible,
            'ganancia_unitaria': self.precio_venta - self.costo_unitario,
            'categoria_id': self.categoria_id if hasattr(self, 'categoria_id') else None,
            'proveedor': self.proveedor if hasattr(self, 'proveedor') else None,
            'fecha_compra': self.fecha_compra.isoformat() if (hasattr(self, 'fecha_compra') and self.fecha_compra) else None,
        }


class Venta(db.Model):
    """Modelo para ventas"""
    __tablename__ = 'venta'
    
    id = db.Column(db.Integer, primary_key=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresa.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    cliente_nombre = db.Column(db.String(255))
    cliente_email = db.Column(db.String(120))
    cliente_telefono = db.Column(db.String(20))
    subtotal = db.Column(db.Float, default=0)
    impuesto = db.Column(db.Float, default=0)
    total = db.Column(db.Float, nullable=False)
    tipo_pago = db.Column(db.String(50), default='contado')  # contado, credito, transferencia
    estado = db.Column(db.String(50), default='completada')  # completada, pendiente, cancelada
    notas = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    usuario = db.relationship('Usuario', backref='ventas')
    items = db.relationship('VentaItem', backref='venta', lazy=True, cascade='all, delete-orphan')
    deuda = db.relationship('Deuda', backref='venta', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_nombre': self.cliente_nombre,
            'cliente_email': self.cliente_email,
            'total': self.total,
            'tipo_pago': self.tipo_pago,
            'estado': self.estado,
            'created_at': self.created_at.isoformat(),
            'items': [item.to_dict() for item in self.items],
        }


class VentaItem(db.Model):
    """Modelo para items individuales de una venta"""
    __tablename__ = 'venta_item'
    
    id = db.Column(db.Integer, primary_key=True)
    venta_id = db.Column(db.Integer, db.ForeignKey('venta.id'), nullable=False)
    inventario_id = db.Column(db.Integer, db.ForeignKey('inventario.id'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'producto_nombre': self.inventario.nombre,
            'cantidad': self.cantidad,
            'precio_unitario': self.precio_unitario,
            'subtotal': self.subtotal,
        }


class Gasto(db.Model):
    """Modelo para gastos"""
    __tablename__ = 'gasto'
    
    id = db.Column(db.Integer, primary_key=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresa.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    descripcion = db.Column(db.String(255), nullable=False)
    categoria = db.Column(db.String(100))  # salarios, servicios, mantenimiento, etc.
    monto = db.Column(db.Float, nullable=False)
    comprobante = db.Column(db.String(100))  # número de factura o recibo
    fecha_gasto = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    usuario = db.relationship('Usuario', backref='gastos')
    
    def to_dict(self):
        return {
            'id': self.id,
            'descripcion': self.descripcion,
            'categoria': self.categoria,
            'monto': self.monto,
            'comprobante': self.comprobante,
            'fecha_gasto': self.fecha_gasto.isoformat(),
        }


class Deuda(db.Model):
    """Modelo para deudas de clientes"""
    __tablename__ = 'deuda'
    
    id = db.Column(db.Integer, primary_key=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresa.id'), nullable=False)
    venta_id = db.Column(db.Integer, db.ForeignKey('venta.id'), nullable=True)
    cliente_nombre = db.Column(db.String(255), nullable=False)
    cliente_email = db.Column(db.String(120))
    monto_total = db.Column(db.Float, nullable=False)
    monto_pagado = db.Column(db.Float, default=0)
    monto_pendiente = db.Column(db.Float, nullable=False)
    estado = db.Column(db.String(50), default='pendiente')  # pendiente, parcial, pagada
    fecha_vencimiento = db.Column(db.DateTime)
    descripcion = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_nombre': self.cliente_nombre,
            'monto_total': self.monto_total,
            'monto_pagado': self.monto_pagado,
            'monto_pendiente': self.monto_pendiente,
            'estado': self.estado,
            'dias_vencimiento': (self.fecha_vencimiento - datetime.utcnow()).days if self.fecha_vencimiento else None,
        }


class Categoria(db.Model):
    """Modelo para categorías de productos"""
    __tablename__ = 'categoria'
    
    id = db.Column(db.Integer, primary_key=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresa.id'))
    nombre = db.Column(db.String(100), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre
        }
