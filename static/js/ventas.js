console.log('✅ ventas.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM listo');
    loadProductos();
    loadVentas();
    
    const form = document.getElementById('ventasForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Carrito listener
    const cantidadInput = document.getElementById('cantidad');
    if (cantidadInput) {
        cantidadInput.addEventListener('change', updateCarritoPreview);
    }
});

function handlePaymentType() {
    const tipoPago = document.getElementById('tipo_pago').value;
    const subOptions = document.getElementById('subPaymentOptions');
    
    if (subOptions) {
        if (tipoPago === 'transferencia') {
            subOptions.classList.add('show');
        } else {
            subOptions.classList.remove('show');
        }
    }
}

function loadProductos() {
    const token = localStorage.getItem('access_token');
    const select = document.getElementById('inventario_id');
    
    fetch('/api/inventario', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        const productos = data.productos || [];
        select.innerHTML = '<option value="">-- Selecciona producto --</option>';
        
        if (productos.length === 0) {
            return;
        }
        
        productos.forEach(p => {
            const stock = p.cantidad_disponible || 0;
            const stockText = stock === 0 ? ' (⛔ SIN STOCK)' : ` (Stock: ${stock})`;
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.nombre} - $${parseFloat(p.precio_venta).toFixed(2)}${stockText}`;
            option.dataset.stock = stock;
            option.dataset.nombre = p.nombre;
            option.dataset.precio = p.precio_venta;
            option.disabled = stock === 0;
            select.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error cargando productos:', error);
        select.innerHTML = '<option value="">Error cargando productos</option>';
    });
}

function updateCarritoPreview() {
    const select = document.getElementById('inventario_id');
    const cantidad = parseInt(document.getElementById('cantidad').value) || 0;
    
    if (!select || select.selectedIndex === -1) return;
    
    const option = select.options[select.selectedIndex];
    const precio = parseFloat(option.dataset.precio || 0);
    const total = (precio * cantidad).toFixed(2);
    
    // Actualizar preview si existe
    const previewElem = document.getElementById('carritoPreview');
    if (previewElem) {
        previewElem.textContent = `Total: $${total}`;
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const inventario_id = document.getElementById('inventario_id').value;
    const cantidad = parseInt(document.getElementById('cantidad').value);
    const cliente_nombre = document.getElementById('cliente_nombre').value.trim();
    const cliente_email = document.getElementById('cliente_email').value.trim();
    const tipo_pago = document.getElementById('tipo_pago').value;
    
    if (!inventario_id || !cantidad || !cliente_nombre || !tipo_pago) {
        showAlert('Completa todos los campos requeridos', 'error');
        return;
    }
    
    // Validar stock
    const select = document.getElementById('inventario_id');
    const stockDisponible = parseInt(select.options[select.selectedIndex].dataset.stock || 0);
    
    if (cantidad > stockDisponible) {
        showAlert(`Stock insuficiente. Disponible: ${stockDisponible}`, 'error');
        return;
    }
    
    const token = localStorage.getItem('access_token');
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Procesando...';
    btn.disabled = true;
    
    fetch('/api/ventas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            inventario_id: parseInt(inventario_id),
            cantidad,
            cliente_nombre,
            cliente_email,
            tipo_pago
        })
    })
    .then(response => response.json())
    .then(data => {
        btn.textContent = originalText;
        btn.disabled = false;
        
        console.log('Respuesta venta:', data);
        
        if (data.message && (data.message.includes('exitosamente') || data.message.includes('registrada'))) {
            const ganancia = parseFloat(data.ganancia || 0).toFixed(2);
            showAlert(`✅ Venta registrada. Ganancia: $${ganancia}`, 'success');
            document.getElementById('ventasForm').reset();
            handlePaymentType();
            loadProductos();
            loadVentas();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        } else {
            showAlert('✅ Venta registrada correctamente', 'success');
            document.getElementById('ventasForm').reset();
            handlePaymentType();
            loadProductos();
            loadVentas();
        }
    })
    .catch(error => {
        btn.textContent = originalText;
        btn.disabled = false;
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function loadVentas() {
    const token = localStorage.getItem('access_token');
    const tbody = document.getElementById('ventasTableBody');
    
    fetch('/api/ventas', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        const ventas = data.ventas || [];
        console.log('Ventas data:', data);
        
        if (ventas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">📭 No hay ventas registradas</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        ventas.forEach(venta => {
            const fecha = new Date(venta.fecha).toLocaleDateString('es-CO');
            const total = parseFloat(venta.total).toFixed(2);
            
            const row = `
                <tr>
                    <td>${venta.id}</td>
                    <td>${venta.nombre_producto || 'Producto'}</td>
                    <td>${venta.cantidad}</td>
                    <td>$${total}</td>
                    <td>${venta.cliente_nombre}</td>
                    <td>${venta.tipo_pago}</td>
                    <td>${fecha}</td>
                    <td style="text-align: center;">
                        <button onclick="eliminarVenta(${venta.id})" class="btn-sm btn-danger" style="padding: 4px 8px; font-size: 0.8rem;">🗑️</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    })
    .catch(error => {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Error cargando ventas</td></tr>';
    });
}

function eliminarVenta(ventaId) {
    if (!confirm('¿Eliminar esta venta?')) return;
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/ventas/${ventaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        showAlert('✅ Venta eliminada', 'success');
        loadVentas();
        loadProductos();
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    });
}