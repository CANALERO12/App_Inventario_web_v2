console.log('✅ deudas.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM listo');
    loadDeudas();
    
    const form = document.getElementById('deudasForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

function handleFormSubmit(event) {
    event.preventDefault();
    
    const cliente_nombre = document.getElementById('cliente_nombre').value.trim();
    const cliente_email = document.getElementById('cliente_email').value.trim();
    const monto_total = parseFloat(document.getElementById('monto_total').value);
    const estado = document.getElementById('estado').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    
    if (!cliente_nombre || isNaN(monto_total) || monto_total <= 0) {
        showAlert('Completa todos los campos correctamente', 'error');
        return;
    }
    
    const token = localStorage.getItem('access_token');
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Guardando...';
    btn.disabled = true;
    
    fetch('/api/deudas/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            cliente_nombre,
            cliente_email,
            monto_total,
            estado,
            descripcion
        })
    })
    .then(response => response.json())
    .then(data => {
        btn.textContent = originalText;
        btn.disabled = false;
        
        if (data.message && data.message.includes('exitosamente')) {
            showAlert('✅ Deuda registrada correctamente', 'success');
            document.getElementById('deudasForm').reset();
            loadDeudas();
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

function loadDeudas() {
    const token = localStorage.getItem('access_token');
    const tbody = document.getElementById('deudasTableBody');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 2rem;">
                <div>⏳ Cargando deudas...</div>
            </td>
        </tr>
    `;
    
    fetch('/api/deudas/', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Datos de deudas:', data);
        
        const deudas = data.deudas || [];
        
        // Actualizar estadísticas
        document.getElementById('totalPendiente').textContent = `$${parseFloat(data.total_pendiente || 0).toFixed(2)}`;
        document.getElementById('totalPagado').textContent = `$${parseFloat(data.total_pagadas || 0).toFixed(2)}`;
        document.getElementById('totalDeudas').textContent = data.total || 0;
        
        if (!deudas || deudas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        📭 No hay deudas registradas
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = deudas.map(d => {
            let badgeClass = 'badge-pendiente';
            if (d.estado === 'pagada') badgeClass = 'badge-pagada';
            else if (d.estado === 'vencida') badgeClass = 'badge-vencida';
            
            const descripcion = (d.descripcion || '').substring(0, 30) + (d.descripcion && d.descripcion.length > 30 ? '...' : '');
            const fechaCreacion = new Date(d.created_at).toLocaleDateString('es-CO');
            
            return `
                <tr>
                    <td><span class="badge badge-pendiente">${d.id}</span></td>
                    <td><strong>${d.cliente_nombre}</strong></td>
                    <td>$${parseFloat(d.monto_total).toFixed(2)}</td>
                    <td>$${parseFloat(d.monto_pagado).toFixed(2)}</td>
                    <td><strong>$${parseFloat(d.monto_pendiente).toFixed(2)}</strong></td>
                    <td><span class="badge ${badgeClass}">${d.estado === 'pendiente' ? '⏳ Pendiente' : d.estado === 'pagada' ? '✅ Pagada' : '⚠️ Vencida'}</span></td>
                    <td><small>${descripcion}</small></td>
                    <td>${fechaCreacion}</td>
                    <td style="text-align: center; display: flex; gap: 0.5rem;">
                        <button class="btn-sm" style="background: #4db8c6; color: white; flex: 1;" onclick="editDeuda(${d.id}, '${d.cliente_nombre.replace(/'/g, "\\'")}', '${d.cliente_email || ''}', ${d.monto_pagado}, '${d.estado}')">✏️ Editar</button>
                        <button class="btn-sm" style="background: #ef4444; color: white; flex: 1;" onclick="deleteDeuda(${d.id})">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    })
    .catch(error => {
        console.error('Error cargando deudas:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: red; padding: 2rem;">
                    ❌ Error cargando deudas
                </td>
            </tr>
        `;
    });
}

function editDeuda(id, cliente_nombre, cliente_email, monto_pagado, estado) {
    const newCliente = prompt('👤 Nombre del cliente:', cliente_nombre);
    if (newCliente === null) return;
    
    const newEmail = prompt('📧 Email del cliente:', cliente_email || '');
    if (newEmail === null) return;
    
    const newMontoPagado = prompt('✅ Monto pagado:', monto_pagado);
    if (newMontoPagado === null) return;
    
    const newEstado = prompt('📌 Estado (pendiente/pagada/vencida):', estado);
    if (newEstado === null) return;
    
    // Validaciones
    const montoPagadoNum = parseFloat(newMontoPagado);
    if (isNaN(montoPagadoNum) || montoPagadoNum < 0) {
        showAlert('❌ El monto pagado debe ser un número válido y positivo', 'error');
        return;
    }
    
    if (!['pendiente', 'pagada', 'vencida'].includes(newEstado)) {
        showAlert('❌ Estado inválido. Usa: pendiente, pagada o vencida', 'error');
        return;
    }
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/deudas/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            cliente_nombre: newCliente,
            cliente_email: newEmail,
            monto_pagado: montoPagadoNum,
            estado: newEstado
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && data.message.includes('exitosamente')) {
            showAlert('✅ Deuda actualizada correctamente', 'success');
            loadDeudas();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function deleteDeuda(id) {
    if (!confirm('⚠️ ¿Estás seguro que quieres eliminar esta deuda?')) return;
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/deudas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && data.message.includes('exitosamente')) {
            showAlert('✅ Deuda eliminada correctamente', 'success');
            loadDeudas();
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

console.log('✅ deudas.js inicializado correctamente');
