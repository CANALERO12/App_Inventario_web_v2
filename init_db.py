#!/usr/bin/env python
"""
Script para inicializar la base de datos con datos de prueba
Uso: python init_db.py
"""
import os
from app import create_app, db
from app.models import Empresa, Usuario, Inventario, Venta, VentaItem, Gasto, Deuda, Categoria
from datetime import datetime, timedelta


def init_database():
    """Inicializar BD con estructura y datos de prueba"""
    app = create_app(os.environ.get('FLASK_ENV', 'development'))
    
    with app.app_context():
        print("\n" + "="*70)
        print("🔧 INICIALIZANDO BASE DE DATOS DALU PRO")
        print("="*70)
        
        # Eliminar tablas existentes
        print("\n📋 Eliminando tablas existentes...")
        db.drop_all()
        print("✅ Tablas eliminadas")
        
        # Crear tablas
        print("\n📋 Creando tablas...")
        db.create_all()
        print("✅ Tablas creadas correctamente")
        
        # Crear empresa de ejemplo
        print("\n🏢 Creando empresa de ejemplo...")
        empresa = Empresa(
            nombre="Mi Empresa DALU",
            nit="900123456-7",
            direccion="Calle Principal 123, Piso 2",
            telefono="(1) 234-5678",
            email="info@miempresa.com"
        )
        db.session.add(empresa)
        db.session.commit()
        print(f"✅ Empresa creada: {empresa.nombre}")
        
        # Crear categorías
        print("\n📂 Creando categorías...")
        categorias_data = ['Electrónica', 'Accesorios', 'Periféricos', 'Otro']
        categorias = []
        for cat_nombre in categorias_data:
            categoria = Categoria(
                nombre=cat_nombre,
                empresa_id=empresa.id
            )
            db.session.add(categoria)
            categorias.append(categoria)
            print(f"  • {cat_nombre} ✅")
        db.session.commit()
        
        # Crear usuarios de prueba
        print("\n👤 Creando usuarios de prueba...")
        usuarios_data = [
            {
                'username': 'admin',
                'email': 'admin@dalu.local',
                'password': 'admin123',
                'rol': 'admin'
            },
            {
                'username': 'contador',
                'email': 'contador@dalu.local',
                'password': 'contador123',
                'rol': 'contador'
            },
            {
                'username': 'gerente',
                'email': 'gerente@dalu.local',
                'password': 'gerente123',
                'rol': 'gerente'
            },
        ]
        
        usuarios = []
        for user_data in usuarios_data:
            usuario = Usuario(
                username=user_data['username'],
                email=user_data['email'],
                empresa_id=empresa.id,
                rol=user_data['rol'],
                activo=True
            )
            usuario.set_password(user_data['password'])
            db.session.add(usuario)
            usuarios.append(usuario)
            print(f"  • {user_data['username']} ({user_data['rol']}) ✅")
        
        db.session.commit()
        
        # Crear productos de ejemplo
        print("\n📦 Creando productos de ejemplo...")
        productos_data = [
            {
                'nombre': 'Laptop Dell XPS 15',
                'sku': 'LAPTOP-001',
                'categoria': 'Electrónica',
                'categoria_id': categorias[0].id,
                'costo_unitario': 800.00,
                'precio_venta': 1200.00,
                'cantidad_disponible': 5,
                'proveedor': 'Dell Inc.',
                'fecha_compra': datetime.utcnow() - timedelta(days=30),
            },
            {
                'nombre': 'Mouse inalámbrico',
                'sku': 'MOUSE-001',
                'categoria': 'Accesorios',
                'categoria_id': categorias[1].id,
                'costo_unitario': 15.00,
                'precio_venta': 30.00,
                'cantidad_disponible': 50,
                'proveedor': 'Logitech',
                'fecha_compra': datetime.utcnow() - timedelta(days=15),
            },
            {
                'nombre': 'Teclado mecánico RGB',
                'sku': 'KEYB-001',
                'categoria': 'Accesorios',
                'categoria_id': categorias[1].id,
                'costo_unitario': 60.00,
                'precio_venta': 120.00,
                'cantidad_disponible': 20,
                'proveedor': 'Corsair',
                'fecha_compra': datetime.utcnow() - timedelta(days=20),
            },
            {
                'nombre': 'Monitor 27" 4K',
                'sku': 'MONITOR-001',
                'categoria': 'Periféricos',
                'categoria_id': categorias[2].id,
                'costo_unitario': 300.00,
                'precio_venta': 500.00,
                'cantidad_disponible': 10,
                'proveedor': 'LG',
                'fecha_compra': datetime.utcnow() - timedelta(days=25),
            },
            {
                'nombre': 'Audífonos Bose',
                'sku': 'AUDIO-001',
                'categoria': 'Accesorios',
                'categoria_id': categorias[1].id,
                'costo_unitario': 200.00,
                'precio_venta': 350.00,
                'cantidad_disponible': 15,
                'proveedor': 'Bose Corporation',
                'fecha_compra': datetime.utcnow() - timedelta(days=10),
            },
        ]
        
        inventarios = []
        for prod_data in productos_data:
            inventario = Inventario(
                empresa_id=empresa.id,
                nombre=prod_data['nombre'],
                sku=prod_data['sku'],
                categoria=prod_data['categoria'],
                categoria_id=prod_data['categoria_id'],
                costo_unitario=prod_data['costo_unitario'],
                precio_venta=prod_data['precio_venta'],
                cantidad_disponible=prod_data['cantidad_disponible'],
                cantidad_minima=3,
                proveedor=prod_data['proveedor'],
                fecha_compra=prod_data['fecha_compra'],
                descripcion=f"Producto: {prod_data['nombre']}"
            )
            db.session.add(inventario)
            inventarios.append(inventario)
            print(f"  • {prod_data['nombre']} (SKU: {prod_data['sku']}) ✅")
        
        db.session.commit()
        
        # Crear ventas de ejemplo
        print("\n💰 Creando ventas de ejemplo...")
        venta1 = Venta(
            empresa_id=empresa.id,
            usuario_id=usuarios[0].id,
            cliente_nombre="Cliente A",
            cliente_email="cliente-a@email.com",
            subtotal=1200.00,
            impuesto=200.00,
            total=1400.00,
            tipo_pago='contado',
            estado='completada'
        )
        venta1_item = VentaItem(
            venta=venta1,
            inventario_id=inventarios[0].id,
            cantidad=1,
            precio_unitario=1200.00,
            subtotal=1200.00
        )
        db.session.add(venta1)
        db.session.add(venta1_item)
        print("  • Venta 1: Laptop a Cliente A ✅")
        
        # Crear deuda de ejemplo
        deuda = Deuda(
            empresa_id=empresa.id,
            venta_id=None,
            cliente_nombre="Cliente B",
            monto_total=500.00,
            monto_pagado=200.00,
            monto_pendiente=300.00,
            estado='parcial',
            fecha_vencimiento=datetime.utcnow() + timedelta(days=30),
            descripcion="Deuda por 2 monitores"
        )
        db.session.add(deuda)
        print("  • Deuda de Cliente B ✅")
        
        # Crear gastos de ejemplo
        print("\n💸 Creando gastos de ejemplo...")
        gastos_data = [
            {'descripcion': 'Arriendo oficina', 'categoria': 'Arriendo', 'monto': 1000.00},
            {'descripcion': 'Servicios (luz, agua)', 'categoria': 'Servicios', 'monto': 200.00},
            {'descripcion': 'Salarios empleados', 'categoria': 'Salarios', 'monto': 3000.00},
        ]
        
        for gasto_data in gastos_data:
            gasto = Gasto(
                empresa_id=empresa.id,
                usuario_id=usuarios[0].id,
                descripcion=gasto_data['descripcion'],
                categoria=gasto_data['categoria'],
                monto=gasto_data['monto'],
            )
            db.session.add(gasto)
            print(f"  • {gasto_data['descripcion']}: ${gasto_data['monto']} ✅")
        
        db.session.commit()
        
        # Resumen
        print("\n" + "="*70)
        print("✅ BASE DE DATOS INICIALIZADA EXITOSAMENTE")
        print("="*70)
        print("\n📊 RESUMEN:")
        print(f"   • Empresas: {Empresa.query.count()}")
        print(f"   • Categorías: {Categoria.query.count()}")
        print(f"   • Usuarios: {Usuario.query.count()}")
        print(f"   • Productos: {Inventario.query.count()}")
        print(f"   • Ventas: {Venta.query.count()}")
        print(f"   • Deudas: {Deuda.query.count()}")
        print(f"   • Gastos: {Gasto.query.count()}")
        
        print("\n🔐 USUARIOS DE PRUEBA:")
        for user in usuarios_data:
            print(f"   • {user['username']}: {user['password']}")
        
        print("\n🌐 ACCEDE A: http://localhost:5000")
        print("="*70 + "\n")


if __name__ == '__main__':
    init_database()