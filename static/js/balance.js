/**
 * 💰 BALANCE.JS - Dashboard Financiero
 * Carga y actualiza el balance en tiempo real
 */

console.log('✅ balance.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM ready - Cargando balance...');
    loadBalance();
    
    // 🔄 Recargar cada 30 segundos
    setInterval(loadBalance, 30000);
});


/**
 * 📊 Cargar balance desde API
 */
function loadBalance() {
    console.log('⏳ Fetching balance...');
    
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        console.error('❌ No token found');
        showAlert('❌ Token no encontrado. Por favor inicia sesión.', 'error');
        window.location.href = '/login';
        return;
    }
    
    fetch('/api/balance/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('📡 Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('✅ Balance data recibido:', data);
        
        if (data.error) {
            console.error('❌ Error en respuesta:', data.error);
            showAlert('❌ Error: ' + data.error, 'error');
            return;
        }
        
        // ✅ Parsear valores
        const balanceNeto = parseFloat(data.balance_neto);
        const totalIngresos = parseFloat(data.total_ingresos);
        const totalEgresos = parseFloat(data.total_egresos);
        const deudasPendientes = parseFloat(data.deudas_pendientes);
        const flujoDisponible = parseFloat(data.flujo_disponible);
        
        // 💵 Actualizar valores formateados
        document.getElementById('balanceNeto').textContent = formatMoney(balanceNeto);
        document.getElementById('totalIngresos').textContent = formatMoney(totalIngresos);
        document.getElementById('totalEgresos').textContent = formatMoney(totalEgresos);
        document.getElementById('deudasPendientes').textContent = formatMoney(deudasPendientes);
        document.getElementById('flujoDisponible').textContent = formatMoney(flujoDisponible);
        
        // 📝 Actualizar subtextos (cantidad de registros)
        document.getElementById('cantVentas').textContent = `${data.cantidad_ventas} ventas`;
        document.getElementById('cantGastos').textContent = `${data.cantidad_gastos} gastos`;
        document.getElementById('cantDeudas').textContent = `${data.cantidad_deudas_pendientes} pendientes`;
        
        // 🎨 Actualizar estado y color del balance
        updateBalanceCard(balanceNeto);
        
        console.log('✅ Balance actualizado correctamente');
    })
    .catch(error => {
        console.error('❌ Error en fetch:', error);
        showAlert('❌ Error cargando balance: ' + error.message, 'error');
    });
}


/**
 * 🎨 Actualizar tarjeta de balance con color según estado
 */
function updateBalanceCard(balanceNeto) {
    const balanceCard = document.getElementById('balanceCard');
    const balanceState = document.getElementById('balanceState');
    
    // Resetear clases
    balanceCard.classList.remove('negative', 'positive');
    
    if (balanceNeto > 0) {
        balanceCard.classList.add('positive');
        balanceState.textContent = '✅ Ganancia';
    } else if (balanceNeto < 0) {
        balanceCard.classList.add('negative');
        balanceState.textContent = '⚠️ Pérdida';
    } else {
        balanceState.textContent = '⚪ Equilibrio';
    }
}


/**
 * 💵 Formatear número como moneda COP
 */
function formatMoney(value) {
    try {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    } catch (error) {
        console.error('Error formateando moneda:', error);
        return `$${Math.round(value).toLocaleString('es-CO')}`;
    }
}


/**
 * 🔔 Mostrar alert
 */
function showAlert(message, type) {
    const alertId = type === 'success' ? 'successMsg' : 'errorMsg';
    const alertElement = document.getElementById(alertId);
    
    if (!alertElement) {
        console.warn('Alert element no encontrado:', alertId);
        alert(message);
        return;
    }
    
    alertElement.textContent = message;
    alertElement.classList.add('show');
    
    // Auto-hide después de 5 segundos
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 5000);
}


console.log('✅ balance.js inicializado correctamente');
