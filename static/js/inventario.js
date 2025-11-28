console.log('✅ inventario.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM listo');
    loadInventory();
    
    const form = document.getElementById('inventoryForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('✅ Formulario listo');
    }
});

function handleFormSubmit(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const costo = parseFloat(document.getElementById('costo').value);
    const precio_venta = parseFloat(document.getElementById('precio_venta').value);
    const cantidad = parseInt(document.getElementById('cantidad').value);
    const sku = nombre.toLowerCase().replace(/\s+/g, '-');
    
    if (!nombre || isNaN(costo) || isNaN(precio_venta) || isNaN(cantidad)) {
        showAlert('Completa todos los campos correctamente', 'error');
        return;
    }
    
    const token = localStorage.getItem('access_token');
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Guardando...';
    btn.disabled = true;
    
    // RUTA CORRECTA: /api/inventario/
    fetch('/api/inventario/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            nombre, 
            sku,
            costo_unitario: costo,
            precio_venta, 
            cantidad_disponible: cantidad
        })
    })
    .then(response => response.json())
    .then(data => {
        btn.textContent = originalText;
        btn.disabled = false;
        
        if (data.message && (data.message.includes('exitosamente') || data.message.includes('creado'))) {
            showAlert('✅ Producto agregado correctamente', 'success');
            document.getElementById('inventoryForm').reset();
            loadInventory();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        btn.textContent = originalText;
        btn.disabled = false;
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function loadInventory() {
    const token = localStorage.getItem('access_token');
    const tbody = document.getElementById('inventoryTableBody');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 2rem;">
                <div style="font-size: 1.5rem;">⏳ Cargando...</div>
            </td>
        </tr>
    `;
    
    // RUTA CORRECTA: /api/inventario/
    fetch('/api/inventario/', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Datos recibidos:', data);
        
        let productos = data.productos || [];
        
        if (!productos || productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>No hay productos en el inventario</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = productos.map(p => `
            <tr>
                <td><span class="badge">${p.id}</span></td>
                <td><strong>${p.nombre}</strong></td>
                <td>$${parseFloat(p.costo_unitario).toFixed(2)}</td>
                <td>$${parseFloat(p.precio_venta).toFixed(2)}</td>
                <td><strong>${p.cantidad_disponible}</strong></td>
                <td>$${(parseFloat(p.precio_venta) - parseFloat(p.costo_unitario)).toFixed(2)}/u</td>
                <td style="text-align: center; gap: 0.5rem; display: flex;">
                    <button class="btn btn-sm" style="background: #4db8c6; color: white; flex: 1;" onclick="openEditModal(${p.id}, '${p.nombre}', ${p.costo_unitario}, ${p.precio_venta}, ${p.cantidad_disponible})">✏️ Editar</button>
                    <button class="btn btn-sm" style="background: #ef4444; color: white; flex: 1;" onclick="deleteProduct(${p.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');
    })
    .catch(error => {
        console.error('Error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: red; padding: 2rem;">
                    Error cargando datos
                </td>
            </tr>
        `;
    });
}

function openEditModal(id, nombre, costo, precio_venta, cantidad) {
    const newNombre = prompt('📌 Nombre del producto:', nombre);
    if (newNombre === null) return;
    
    const newCosto = prompt('💰 Costo unitario:', costo);
    if (newCosto === null) return;
    
    const newPrecio = prompt('💵 Precio de venta:', precio_venta);
    if (newPrecio === null) return;
    
    const newCantidad = prompt('📦 Cantidad:', cantidad);
    if (newCantidad === null) return;
    
    const token = localStorage.getItem('access_token');
    const sku = newNombre.toLowerCase().replace(/\s+/g, '-');
    
    // RUTA CORRECTA: /api/inventario/<id>
    fetch(`/api/inventario/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            nombre: newNombre,
            sku: sku,
            costo_unitario: parseFloat(newCosto),
            precio_venta: parseFloat(newPrecio),
            cantidad_disponible: parseInt(newCantidad)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && (data.message.includes('actualizado') || data.message.includes('Producto'))) {
            showAlert('✅ Producto actualizado correctamente', 'success');
            loadInventory();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function deleteProduct(id) {
    if (!confirm('⚠️ ¿Estás seguro que quieres eliminar este producto?')) return;
    
    const token = localStorage.getItem('access_token');
    
    // RUTA CORRECTA: /api/inventario/<id>
    fetch(`/api/inventario/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && (data.message.includes('eliminado') || data.message.includes('Producto'))) {
            showAlert('✅ Producto eliminado correctamente', 'success');
            loadInventory();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
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
    }, 4000);
}

console.log('✅ inventario.js inicializado con rutas correctas');
