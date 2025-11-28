console.log('✅ ventas.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM listo');
    loadProductos();
    loadVentas();
    
    const form = document.getElementById('ventasForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

function handlePaymentType() {
    const tipoPago = document.getElementById('tipo_pago').value;
    const subOptions = document.getElementById('subPaymentOptions');
    
    if (tipoPago === 'transferencia') {
        subOptions.classList.add('show');
    } else {
        subOptions.classList.remove('show');
    }
}

function loadProductos() {
    const token = localStorage.getItem('access_token');
    const select = document.getElementById('inventario_id');
    
    fetch('/api/inventario/', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        const productos = data.productos || [];
        
        select.innerHTML = '<option value="">Selecciona un producto</option>';
        
        if (productos.length === 0) {
            select.innerHTML += '<option disabled>No hay productos disponibles</option>';
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
            option.disabled = stock === 0;
            
            select.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error cargando productos:', error);
        select.innerHTML = '<option value="">Error cargando productos</option>';
    });
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
    
    fetch('/api/ventas/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            inventario_id,
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
        
        if (data.message && data.message.includes('exitosamente')) {
            const ganancia = parseFloat(data.ganancia || 0).toFixed(2);
            showAlert(`✅ Venta registrada. Ganancia: $${ganancia}`, 'success');
            document.getElementById('ventasForm').reset();
            handlePaymentType(); // Reset sub-options
            loadProductos();
            loadVentas();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
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
    
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 2rem;">
                <div>⏳ Cargando ventas...</div>
            </td>
        </tr>
    `;
    
    fetch('/api/ventas/', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Ventas data:', data);
        const ventas = data.ventas || [];
        
        if (!ventas || ventas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        📭 No hay ventas registradas
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = ventas.map(v => {
            // Obtener nombre del primer item
            const productName = (v.items && v.items.length > 0) 
                ? v.items[0].producto_nombre 
                : '📦 Producto';
            
            // Sumar cantidades
            const totalCantidad = (v.items || []).reduce((sum, item) => sum + (item.cantidad || 0), 0);
            
            // Formatear tipo de pago
            let tipoPagoEmoji = '💵';
            if (v.tipo_pago === 'credito') tipoPagoEmoji = '📋';
            else if (v.tipo_pago === 'transferencia') tipoPagoEmoji = '🏦';
            
            const fechaVenta = new Date(v.created_at).toLocaleDateString('es-CO');
            
            return `
                <tr>
                    <td><span class="badge">${v.id}</span></td>
                    <td><strong>${productName}</strong></td>
                    <td>${totalCantidad}</td>
                    <td><strong>$${parseFloat(v.total).toFixed(2)}</strong></td>
                    <td>${v.cliente_nombre}</td>
                    <td>${tipoPagoEmoji} ${v.tipo_pago === 'credito' ? 'Crédito' : v.tipo_pago === 'transferencia' ? 'Transferencia' : 'Contado'}</td>
                    <td>${fechaVenta}</td>
                    <td style="text-align: center; display: flex; gap: 0.5rem;">
                        <button class="btn-sm" style="background: #4db8c6; color: white; flex: 1;" onclick="editVenta(${v.id}, '${v.cliente_nombre.replace(/'/g, "\\'")}', '${v.cliente_email || ''}', '${v.tipo_pago}')">✏️ Editar</button>
                        <button class="btn-sm" style="background: #ef4444; color: white; flex: 1;" onclick="deleteVenta(${v.id})">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    })
    .catch(error => {
        console.error('Error cargando ventas:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    ❌ Error cargando ventas
                </td>
            </tr>
        `;
    });
}

function editVenta(id, cliente_nombre, cliente_email, tipo_pago) {
    const newCliente = prompt('👤 Nombre del cliente:', cliente_nombre);
    if (newCliente === null) return;
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/ventas/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            cliente_nombre: newCliente,
            cliente_email,
            tipo_pago
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && data.message.includes('exitosamente')) {
            showAlert('✅ Venta actualizada correctamente', 'success');
            loadVentas();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function deleteVenta(id) {
    if (!confirm('⚠️ ¿Eliminar esta venta? Se revertirá el stock automáticamente.')) return;
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/ventas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && data.message.includes('exitosamente')) {
            showAlert('✅ Venta eliminada y stock revertido', 'success');
            loadProductos();
            loadVentas();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function showAlert(message, type) {
    const alertElement = type === 'success' 
        ? document.getElementById('successMsg')
        : document.getElementById('errorMsg');
    
    if (!alertElement) {
        alert(message);
        return;
    }
    
    alertElement.textContent = message;
    alertElement.classList.add('show');
    
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 5000);
}

console.log('✅ ventas.js inicializado correctamente');
