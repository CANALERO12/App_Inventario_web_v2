console.log('✅ gastos.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM listo');
    loadGastos();
    
    const form = document.getElementById('gastosForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('✅ Formulario listo');
    }
});

function handleFormSubmit(event) {
    event.preventDefault();
    
    const descripcion = document.getElementById('descripcion').value.trim();
    const monto = parseFloat(document.getElementById('monto').value);
    
    if (!descripcion || isNaN(monto) || monto <= 0) {
        showAlert('Completa todos los campos correctamente', 'error');
        return;
    }
    
    const token = localStorage.getItem('access_token');
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Guardando...';
    btn.disabled = true;
    
    fetch('/api/gastos/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            descripcion, 
            monto,
            categoria: 'general'
        })
    })
    .then(response => {
        console.log('Respuesta:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Data recibida:', data);
        btn.textContent = originalText;
        btn.disabled = false;
        
        if (data.message && data.message.includes('exitosamente')) {
            showAlert('✅ Gasto registrado correctamente', 'success');
            document.getElementById('gastosForm').reset();
            loadGastos();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        } else {
            showAlert('❌ Respuesta inesperada', 'error');
        }
    })
    .catch(error => {
        console.error('Error en fetch:', error);
        btn.textContent = originalText;
        btn.disabled = false;
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function loadGastos() {
    const token = localStorage.getItem('access_token');
    const tbody = document.getElementById('gastosTableBody');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 2rem;">
                <div>⏳ Cargando...</div>
            </td>
        </tr>
    `;
    
    fetch('/api/gastos/', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Datos de gastos:', data);
        
        // IMPORTANTE: leer data.gastos, no data directamente
        const gastos = data.gastos || [];
        
        if (!gastos || gastos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>No hay gastos registrados</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = gastos.map(g => `
            <tr>
                <td><span class="badge">${g.id}</span></td>
                <td>${g.descripcion}</td>
                <td>$${parseFloat(g.monto).toFixed(2)}</td>
                <td>${new Date(g.fecha_gasto).toLocaleDateString()}</td>
                <td style="text-align: center; gap: 0.5rem; display: flex;">
                    <button class="btn-sm" style="background: #4db8c6; color: white; flex: 1;" onclick="editGasto(${g.id}, '${g.descripcion}', ${g.monto})">✏️ Editar</button>
                    <button class="btn-sm" style="background: #ef4444; color: white; flex: 1;" onclick="deleteGasto(${g.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');
    })
    .catch(error => {
        console.error('Error cargando gastos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: red; padding: 2rem;">
                    Error cargando datos
                </td>
            </tr>
        `;
    });
}

function editGasto(id, descripcion, monto) {
    const newDesc = prompt('📝 Descripción:', descripcion);
    if (newDesc === null) return;
    
    const newMonto = prompt('💰 Monto:', monto);
    if (newMonto === null) return;
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/gastos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            descripcion: newDesc, 
            monto: parseFloat(newMonto) 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && data.message.includes('exitosamente')) {
            showAlert('✅ Gasto actualizado correctamente', 'success');
            loadGastos();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function deleteGasto(id) {
    if (!confirm('⚠️ ¿Estás seguro que quieres eliminar este gasto?')) return;
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/gastos/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && data.message.includes('exitosamente')) {
            showAlert('✅ Gasto eliminado correctamente', 'success');
            loadGastos();
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

console.log('✅ gastos.js inicializado correctamente');
