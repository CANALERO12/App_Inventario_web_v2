const DALU = {
    api: { baseURL: '/api' },

    getToken() {
        return localStorage.getItem('access_token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    showAlert(message, type = 'success') {
        const successMsg = document.getElementById('successMsg');
        const errorMsg = document.getElementById('errorMsg');
        
        if (type === 'success' && successMsg) {
            successMsg.textContent = message;
            successMsg.classList.add('show');
            setTimeout(() => successMsg.classList.remove('show'), 3000);
        } else if (type === 'error' && errorMsg) {
            errorMsg.textContent = message;
            errorMsg.classList.add('show');
            setTimeout(() => errorMsg.classList.remove('show'), 3000);
        }
    },

    async fetch(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.api.baseURL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
            return null;
        }

        return response.json();
    },

    inventario: {
        async cargar() {
            return await DALU.fetch('/inventario') || [];
        },

        async agregar(nombre, costo, precio_venta, cantidad) {
            return await DALU.fetch('/inventario', {
                method: 'POST',
                body: JSON.stringify({ nombre, costo, precio_venta, cantidad })
            });
        },

        renderTabla(productos) {
            const tbody = document.getElementById('inventoryTableBody');
            if (!tbody) return;

            if (!productos || productos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div style="font-size: 2rem;">📭</div><p>No hay productos</p></td></tr>';
                return;
            }

            tbody.innerHTML = productos.map(p => `
                <tr>
                    <td><span class="badge">${p.id}</span></td>
                    <td><strong>${p.nombre}</strong></td>
                    <td>$${parseFloat(p.costo).toFixed(2)}</td>
                    <td>$${parseFloat(p.precio_venta).toFixed(2)}</td>
                    <td><strong>${p.cantidad}</strong></td>
                    <td>$${(parseFloat(p.precio_venta) - parseFloat(p.costo)).toFixed(2)}/u</td>
                </tr>
            `).join('');
        },

        inicializar() {
            const form = document.getElementById('inventoryForm');
            if (!form) return;

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const nombre = document.getElementById('nombre')?.value.trim();
                const costo = parseFloat(document.getElementById('costo')?.value);
                const precio_venta = parseFloat(document.getElementById('precio_venta')?.value);
                const cantidad = parseInt(document.getElementById('cantidad')?.value);

                if (!nombre || isNaN(costo) || isNaN(precio_venta) || isNaN(cantidad)) {
                    DALU.showAlert('⚠️ Por favor completa todos los campos', 'error');
                    return;
                }

                const data = await this.agregar(nombre, costo, precio_venta, cantidad);
                if (data?.success) {
                    DALU.showAlert('✅ Producto agregado exitosamente', 'success');
                    form.reset();
                    const productos = await this.cargar();
                    this.renderTabla(productos);
                } else {
                    DALU.showAlert('❌ Error: ' + (data?.message || 'No se pudo agregar'), 'error');
                }
            });

            this.cargar().then(productos => this.renderTabla(productos));
        }
    },

    ventas: {
        async cargar() {
            return await DALU.fetch('/ventas') || [];
        },

        async agregar(producto_id, cantidad, nombre_cliente, tipo_pago) {
            return await DALU.fetch('/ventas', {
                method: 'POST',
                body: JSON.stringify({ producto_id, cantidad, nombre_cliente, tipo_pago })
            });
        },

        renderTabla(ventas) {
            const tbody = document.getElementById('ventasTableBody');
            if (!tbody) return;

            if (!ventas || ventas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><div style="font-size: 2rem;">📭</div><p>No hay ventas</p></td></tr>';
                return;
            }

            tbody.innerHTML = ventas.map(v => `
                <tr>
                    <td><span class="badge">${v.id}</span></td>
                    <td>${v.producto_nombre}</td>
                    <td>${v.cantidad}</td>
                    <td>$${parseFloat(v.total).toFixed(2)}</td>
                    <td>$${parseFloat(v.ganancia).toFixed(2)}</td>
                    <td>${new Date(v.fecha).toLocaleDateString('es-CO')}</td>
                    <td>${v.cliente}</td>
                    <td><span class="badge">${v.tipo_pago}</span></td>
                </tr>
            `).join('');
        },

        inicializar() {
            const form = document.getElementById('ventasForm');
            if (!form) return;

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const producto = document.getElementById('producto')?.value;
                const cantidad = parseInt(document.getElementById('cantidad')?.value);
                const nombre_cliente = document.getElementById('nombre_cliente')?.value.trim();
                const tipo_pago = document.getElementById('tipo_pago')?.value;

                if (!producto || !cantidad || !nombre_cliente) {
                    DALU.showAlert('⚠️ Completa todos los campos', 'error');
                    return;
                }

                const data = await this.agregar(producto, cantidad, nombre_cliente, tipo_pago);
                if (data?.success) {
                    DALU.showAlert('✅ Venta registrada', 'success');
                    form.reset();
                    const ventas = await this.cargar();
                    this.renderTabla(ventas);
                } else {
                    DALU.showAlert('❌ Error: ' + (data?.message || 'Error'), 'error');
                }
            });

            this.cargar().then(ventas => this.renderTabla(ventas));
        }
    },

    gastos: {
        async cargar() {
            return await DALU.fetch('/gastos') || [];
        },

        async agregar(descripcion, monto) {
            return await DALU.fetch('/gastos', {
                method: 'POST',
                body: JSON.stringify({ descripcion, monto })
            });
        },

        renderTabla(gastos) {
            const tbody = document.getElementById('gastosTableBody');
            if (!tbody) return;

            if (!gastos || gastos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><div style="font-size: 2rem;">📭</div><p>No hay gastos</p></td></tr>';
                return;
            }

            tbody.innerHTML = gastos.map(g => `
                <tr>
                    <td><span class="badge">${g.id}</span></td>
                    <td>${g.descripcion}</td>
                    <td>$${parseFloat(g.monto).toFixed(2)}</td>
                    <td>${new Date(g.fecha).toLocaleDateString('es-CO')}</td>
                </tr>
            `).join('');
        },

        inicializar() {
            const form = document.getElementById('gastosForm');
            if (!form) return;

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const descripcion = document.getElementById('descripcion')?.value.trim();
                const monto = parseFloat(document.getElementById('monto')?.value);

                if (!descripcion || isNaN(monto)) {
                    DALU.showAlert('⚠️ Completa todos los campos', 'error');
                    return;
                }

                const data = await this.agregar(descripcion, monto);
                if (data?.success) {
                    DALU.showAlert('✅ Gasto registrado', 'success');
                    form.reset();
                    const gastos = await this.cargar();
                    this.renderTabla(gastos);
                } else {
                    DALU.showAlert('❌ Error: ' + (data?.message || 'Error'), 'error');
                }
            });

            this.cargar().then(gastos => this.renderTabla(gastos));
        }
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('empresa_id');
        window.location.href = '/';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');
    
    switch(page) {
        case 'inventario':
            DALU.inventario.inicializar();
            break;
        case 'ventas':
            DALU.ventas.inicializar();
            break;
        case 'gastos':
            DALU.gastos.inicializar();
            break;
    }
});
