console.log('✅ deudas.js cargado');

// ✨ INICIALIZAR vistaActual GLOBALMENTE
window.vistaActual = 'activas';

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM listo');
    loadDeudas();
    
    const form = document.getElementById('deudasForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Eventos de pestañas
    const btnActivas = document.getElementById('btnActivas');
    const btnHistorial = document.getElementById('btnHistorial');
    
    if (btnActivas) {
        btnActivas.addEventListener('click', () => {
            console.log('📋 Cambiando a vista: activas');
            cambiarVista('activas');
        });
    }
    
    if (btnHistorial) {
        btnHistorial.addEventListener('click', () => {
            console.log('✅ Cambiando a vista: historial');
            cambiarVista('historial');
        });
    }
});

function cambiarVista(vista) {
    console.log(`🔄 Cambiar vista a: ${vista}`);
    window.vistaActual = vista;
    
    const btnActivas = document.getElementById('btnActivas');
    const btnHistorial = document.getElementById('btnHistorial');
    
    if (btnActivas && btnHistorial) {
        btnActivas.classList.toggle('active', vista === 'activas');
        btnHistorial.classList.toggle('active', vista === 'historial');
    }
    
    // Mostrar/ocultar formulario
    const formCard = document.getElementById('formCard');
    if (formCard) {
        formCard.style.display = vista === 'activas' ? 'block' : 'none';
    }
    
    loadDeudas();
}

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
    
    if (!tbody) {
        console.error('❌ No se encontró tbody');
        return;
    }
    
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;"><div>Cargando deudas...</div></td></tr>`;
    
    // Parámetro dinámico según vista
    const estadoParam = window.vistaActual === 'activas' ? 'activas' : 'pagadas';
    
    console.log(`📊 Cargando deudas con filtro: ${estadoParam}`);
    
    // ✨ PASO 1: Cargar deudas FILTRADAS para la tabla
    fetch(`/api/deudas/?estado=${estadoParam}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log(`📡 Response status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log(`📊 Datos de deudas (${estadoParam}):`, data);
        
        const deudas = data.deudas || [];
        
        // ✨ ACTUALIZAR TABLA (solo con deudas filtradas)
        if (!deudas || deudas.length === 0) {
            const mensaje = window.vistaActual === 'activas' 
                ? '✅ ¡No hay deudas pendientes! Todas están pagadas.'
                : '📋 No hay deudas pagadas aún';
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="text-align: center; padding: 2rem;">${mensaje}</td></tr>`;
        } else {
            tbody.innerHTML = deudas.map(d => {
                let badgeClass = 'badge-pendiente';
                if (d.estado === 'pagada') {
                    badgeClass = 'badge-pagada';
                } else if (d.estado === 'vencida') {
                    badgeClass = 'badge-vencida';
                } else if (d.estado === 'parcial') {
                    badgeClass = 'badge-parcial';
                }
                
                const descripcion = d.descripcion && d.descripcion.substring(0, 30) + (d.descripcion.length > 30 ? '...' : '');
                
                // Botones diferentes según vista
                let botonesHTML = '';
                if (window.vistaActual === 'activas') {
                    botonesHTML = `
                        <button class="btn-sm" style="background: #4db8c6; color: white; flex: 1;" onclick="editDeuda(${d.id}, '${d.cliente_nombre.replace(/'/g, "\\'")}', '${d.cliente_email || ''}', ${d.monto_pagado}, ${d.monto_total}, '${d.estado}')">Abono</button>
                        <button class="btn-sm" style="background: #ef4444; color: white; flex: 1;" onclick="deleteDeuda(${d.id})">Eliminar</button>
                    `;
                } else {
                    botonesHTML = `
                        <button class="btn-sm" style="background: #6b7280; color: white; flex: 1;" onclick="deleteDeuda(${d.id})">Eliminar</button>
                    `;
                }
                
                return `<tr>
                    <td><span class="badge badge-pendiente">${d.id}</span></td>
                    <td><strong>${d.cliente_nombre}</strong></td>
                    <td>$${parseFloat(d.monto_total).toFixed(2)}</td>
                    <td>$${parseFloat(d.monto_pagado).toFixed(2)}</td>
                    <td><strong style="color: #ef4444;">$${parseFloat(d.monto_pendiente).toFixed(2)}</strong></td>
                    <td><span class="badge ${badgeClass}">${d.estado === 'pendiente' ? 'Pendiente' : d.estado === 'pagada' ? 'Pagada' : d.estado === 'parcial' ? 'Parcial' : 'Vencida'}</span></td>
                    <td><small>${descripcion || '-'}</small></td>
                    <td style="text-align: center; display: flex; gap: 0.5rem;">
                        ${botonesHTML}
                    </td>
                </tr>`;
            }).join('');
        }
        
        // ✨ PASO 2: Cargar TODAS las deudas para calcular estadísticas GLOBALES
        console.log('📊 Cargando TODAS las deudas para estadísticas...');
        
        return fetch('/api/deudas/?estado=todas', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    })
    .then(response => response.json())
    .then(allData => {
        console.log('📊 TODAS las deudas:', allData);
        
        // ✨ CALCULAR ESTADÍSTICAS GLOBALES (sin filtro) - ARREGLADO
        const todasLasDeudas = allData.deudas || [];
        
        // ✨ FIX: Usar .includes() en lugar de 'in' para arrays
        const deudasActivas = todasLasDeudas.filter(d => ['pendiente', 'parcial', 'vencida'].includes(d.estado));
        const deudasPagadas = todasLasDeudas.filter(d => d.estado === 'pagada');
        
        // ✨ FIX: Sumar correctamente desde deudasActivas
        const totalPendiente = deudasActivas.reduce((sum, d) => sum + (parseFloat(d.monto_pendiente) || 0), 0);
        
        // ✨ FIX: Sumar correctamente desde deudasPagadas
        const totalPagadas = deudasPagadas.reduce((sum, d) => sum + (parseFloat(d.monto_pagado) || 0), 0);
        
        console.log(`💰 GLOBAL - Activas: ${deudasActivas.length} | Pendiente: $${totalPendiente} | Pagado: $${totalPagadas}`);
        
        // ✨ ACTUALIZAR ESTADÍSTICAS (con valores GLOBALES)
        const elemTotalPendiente = document.getElementById('totalPendiente');
        const elemTotalPagado = document.getElementById('totalPagado');
        const elemTotalDeudas = document.getElementById('totalDeudas');
        
        if (elemTotalPendiente) elemTotalPendiente.textContent = '$' + totalPendiente.toFixed(2);
        if (elemTotalPagado) elemTotalPagado.textContent = '$' + totalPagadas.toFixed(2);
        if (elemTotalDeudas) elemTotalDeudas.textContent = deudasActivas.length;
        
        console.log('✅ Estadísticas actualizadas');
    })
    .catch(error => {
        console.error('❌ Error cargando deudas:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red; padding: 2rem;">Error cargando deudas</td></tr>`;
    });
}

function editDeuda(id, clientenombre, clienteemail, montopagado, montototal, estado) {
    // Calcular máximo abono permitido
    const maxAbono = montototal;
    const abonoPendiente = montototal - montopagado;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    
    modalContent.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 1rem;">💳 Registrar Abono</h3>
        <div style="margin: 1rem 0; padding: 1rem; background: #f0f9ff; border-radius: 6px;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">📋 Cliente: ${clientenombre}</label>
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">💰 Monto Total: $${parseFloat(montototal).toFixed(2)}</label>
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">✅ Pagado: $${parseFloat(montopagado).toFixed(2)}</label>
            <label style="display: block; font-weight: 600; margin-bottom: 0; color: #ef4444;">⏳ Pendiente: $${parseFloat(abonoPendiente).toFixed(2)}</label>
        </div>
        <div style="margin: 1rem 0;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Nuevo Abono ($)</label>
            <input type="number" id="montoPagadoInput" value="${montopagado}" min="0" max="${maxAbono}" step="0.01" style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; box-sizing: border-box;">
            <small style="color: #6b7280; margin-top: 0.5rem; display: block;">Máximo permitido: $${maxAbono.toFixed(2)}</small>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <button onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" style="flex: 1; padding: 0.75rem; background: #ccc; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Cancelar</button>
            <button onclick="confirmarAbono(${id}, '${clientenombre.replace(/'/g, "\\'")}', ${montototal})" style="flex: 1; padding: 0.75rem; background: #4db8c6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Guardar</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Focus en el input
    setTimeout(() => {
        document.getElementById('montoPagadoInput').focus();
        document.getElementById('montoPagadoInput').select();
    }, 100);
}

function confirmarAbono(id, clientenombre, montototal) {
    const inputElement = document.getElementById('montoPagadoInput');
    
    if (!inputElement) {
        console.error('❌ No se encuentra el input');
        return;
    }
    
    const montoPagadoNuevo = parseFloat(inputElement.value);
    
    console.log(`📊 Input value: ${inputElement.value}`);
    console.log(`📊 Parsed value: ${montoPagadoNuevo}`);
    
    if (isNaN(montoPagadoNuevo) || montoPagadoNuevo < 0) {
        console.error('❌ Monto inválido');
        showAlert('Ingresa un monto válido', 'error');
        return;
    }
    
    // ✨ VALIDACIÓN: No permitir abono mayor a la deuda
    if (montoPagadoNuevo > montototal) {
        console.error('❌ Abono mayor a la deuda');
        showAlert(`❌ El abono no puede ser mayor a $${montototal.toFixed(2)}`, 'error');
        return;
    }
    
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        console.error('❌ No hay token');
        showAlert('❌ Sesión expirada', 'error');
        return;
    }
    
    console.log(`💳 Registrando abono: Deuda #${id} | ${clientenombre} | Nuevo pago: $${montoPagadoNuevo}`);
    
    const btn = document.querySelector('button[onclick*="confirmarAbono"]');
    if (btn) btn.disabled = true;
    
    fetch(`/api/deudas/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            monto_pagado: montoPagadoNuevo
        })
    })
    .then(response => {
        console.log(`📡 Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('📦 Response:', data);
        
        if (data.message) {
            console.log('✅ Abono exitoso');
            showAlert('✅ Abono registrado correctamente', 'success');
            
            // Cerrar modal
            const modals = document.querySelectorAll('div[style*="position: fixed"]');
            modals.forEach(modal => modal.remove());
            
            setTimeout(() => {
                loadDeudas();
            }, 500);
        } else if (data.error) {
            console.error('❌ Error del servidor:', data.error);
            showAlert('❌ ' + data.error, 'error');
        }
        
        if (btn) btn.disabled = false;
    })
    .catch(error => {
        console.error('❌ Error en fetch:', error);
        showAlert('❌ Error de conexión: ' + error.message, 'error');
        if (btn) btn.disabled = false;
    });
}

function deleteDeuda(id) {
    if (!confirm('¿Estás seguro que quieres eliminar esta deuda?')) {
        return;
    }
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/deudas/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && data.message.includes('eliminada')) {
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
