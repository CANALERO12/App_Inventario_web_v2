console.log('✅ inventario.js cargado');

let inventoryGlobal = [];
let categoryFilter = 'todas';
let categoriesGlobal = [
    { id: 1, nombre: 'Ropa' },
    { id: 2, nombre: 'Accesorios' },
    { id: 3, nombre: 'Deportivo' },
    { id: 4, nombre: 'Otro' }
];

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM listo');
    loadCategories();
    loadInventory();
    
    const form = document.getElementById('inventoryForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('✅ Formulario listo');
    }
    
    // Cargar categorías y agregar event listener
    const categorySelect = document.getElementById('filterCategory');
    if (categorySelect) {
        categorySelect.addEventListener('change', function(e) {
            categoryFilter = e.target.value;
            filterInventory();
        });
    }
});

function loadCategories() {
    const token = localStorage.getItem('access_token');
    
    // Intentar cargar del servidor, pero si falla usar las locales
    fetch('/api/categorias', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error 404');
        return response.json();
    })
    .then(data => {
        const categorias = data.categorias || [];
        if (categorias.length > 0) {
            categoriesGlobal = categorias;
        }
        fillCategorySelects();
        console.log('Categorías cargadas del servidor:', categoriesGlobal);
    })
    .catch(error => {
        console.warn('No se pudo cargar categorías del servidor, usando locales:', error);
        fillCategorySelects();
    });
}

function fillCategorySelects() {
    // Llenar select de formulario
    const selectForm = document.getElementById('categoria');
    if (selectForm) {
        selectForm.innerHTML = '<option value="">-- Selecciona categoría --</option>';
        categoriesGlobal.forEach(cat => {
            selectForm.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
        });
    }
    
    // Llenar select de filtro
    const selectFilter = document.getElementById('filterCategory');
    if (selectFilter) {
        selectFilter.innerHTML = '<option value="todas">📂 Todas las Categorías</option>';
        categoriesGlobal.forEach(cat => {
            selectFilter.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
        });
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const costo = parseFloat(document.getElementById('costo').value);
    
    // Buscar por ID alternativo
    let precio_venta = document.getElementById('precio_venta');
    if (!precio_venta) precio_venta = document.getElementById('precioventa');
    const precio = parseFloat(precio_venta.value);
    
    const cantidad = parseInt(document.getElementById('cantidad').value);
    const categoria = document.getElementById('categoria');
    const categoria_id = categoria ? categoria.value : '';
    
    // NUEVOS CAMPOS
    const proveedor = document.getElementById('proveedor') ? document.getElementById('proveedor').value.trim() : '';
    const fecha_compra = document.getElementById('fecha_compra') ? document.getElementById('fecha_compra').value : '';
    
    if (!nombre || isNaN(costo) || isNaN(precio) || isNaN(cantidad)) {
        showAlert('Completa todos los campos correctamente', 'error');
        return;
    }
    
    if (!categoria_id) {
        showAlert('Selecciona una categoría', 'error');
        return;
    }
    
    // GENERACIÓN DE SKU ÚNICO CON TIMESTAMP
    const timestamp = Date.now();
    const sku = nombre.toLowerCase().replace(/\s+/g, '-') + '-' + timestamp;
    
    const token = localStorage.getItem('access_token');
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Guardando...';
    btn.disabled = true;
    
    console.log('Enviando producto:', { 
        nombre, 
        sku, 
        costo, 
        precio, 
        cantidad, 
        categoria_id,
        proveedor,
        fecha_compra
    });
    
    const payload = { 
        nombre, 
        sku, 
        costo_unitario: costo, 
        precio_venta: precio, 
        cantidad_disponible: cantidad,
        categoria_id: parseInt(categoria_id)
    };
    
    // Agregar campos opcionales si existen
    if (proveedor) payload.proveedor = proveedor;
    if (fecha_compra) payload.fecha_compra = fecha_compra;
    
    fetch('/api/inventario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        btn.textContent = originalText;
        btn.disabled = false;
        console.log('Respuesta:', data);
        
        if (data.message && (data.message.includes('exitosamente') || data.message.includes('creado'))) {
            showAlert('✅ Producto agregado correctamente', 'success');
            document.getElementById('inventoryForm').reset();
            loadInventory();
        } else if (data.error) {
            showAlert('❌ Error: ' + data.error, 'error');
        } else {
            showAlert('✅ Producto agregado correctamente', 'success');
            document.getElementById('inventoryForm').reset();
            loadInventory();
        }
    })
    .catch(error => {
        btn.textContent = originalText;
        btn.disabled = false;
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function loadInventory() {
    const token = localStorage.getItem('access_token');
    const tbody = document.getElementById('inventoryTableBody');
    
    fetch('/api/inventario', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        const productos = data.productos || [];
        inventoryGlobal = productos;
        
        console.log('Productos cargados:', productos);
        
        if (productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: #999;">📭 No hay productos en el inventario</td></tr>';
            updateInventoryCount(0);
            return;
        }
        
        filterInventory();
    })
    .catch(error => {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">Error cargando inventario</td></tr>';
    });
}

function filterInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    let filtered = inventoryGlobal;
    
    if (categoryFilter !== 'todas') {
        filtered = inventoryGlobal.filter(p => p.categoria_id == categoryFilter);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: #999;">📭 No hay productos en esta categoría</td></tr>';
        updateInventoryCount(0);
        return;
    }
    
    tbody.innerHTML = '';
    filtered.forEach(producto => {
        const ganancia = (parseFloat(producto.precio_venta) || 0) - (parseFloat(producto.costo_unitario) || 0);
        const porcentaje = producto.costo_unitario > 0 
            ? ((ganancia / producto.costo_unitario) * 100).toFixed(1)
            : 0;
        
        // Obtener nombre de categoría
        const categoria = categoriesGlobal.find(c => c.id == producto.categoria_id);
        const nombreCategoria = categoria ? categoria.nombre : 'Sin categoría';
        
        // Formatear fecha
        const fecha_compra = producto.fecha_compra ? new Date(producto.fecha_compra).toLocaleDateString('es-CO') : '-';
        const proveedor = producto.proveedor || '-';
        
        const row = `
            <tr>
                <td>${producto.id}</td>
                <td><strong>${producto.nombre}</strong></td>
                <td>$${formatMoney(producto.costo_unitario)}</td>
                <td>$${formatMoney(producto.precio_venta)}</td>
                <td>${producto.cantidad_disponible || 0}</td>
                <td><span style="background: rgba(77, 184, 198, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">${nombreCategoria}</span></td>
                <td>${proveedor}</td>
                <td>${fecha_compra}</td>
                <td>$${formatMoney(ganancia)} (${porcentaje}%)</td>
                <td style="text-align: center; position: relative; white-space: nowrap;">
                    <button class="btn-menu-acciones" onclick="toggleMenuAcciones(event, ${producto.id})" style="cursor: pointer; background: none; border: none; font-size: 1.2rem; padding: 0; width: 30px; height: 30px;">⋮</button>
                    <div class="menu-acciones" id="menu-${producto.id}" style="display:none; position: fixed; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 1000;">
                        <button onclick="editarProducto(${producto.id})" class="menu-item" style="display: block; width: 100%; padding: 10px 16px; text-align: left; background: none; border: none; cursor: pointer; font-size: 0.9rem; white-space: nowrap; color: #333;">✏️ Editar</button>
                        <button onclick="eliminarProducto(${producto.id})" class="menu-item" style="display: block; width: 100%; padding: 10px 16px; text-align: left; background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #dc2626; white-space: nowrap; border-top: 1px solid #eee;">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    updateInventoryCount(filtered.length);
}

function updateInventoryCount(count) {
    const countElem = document.getElementById('inventoryCount');
    if (countElem) {
        countElem.textContent = `Mostrando: ${count} productos`;
    }
}

function formatMoney(num) {
    if (!num || isNaN(num)) return '0.00';
    const numFloat = parseFloat(num);
    return numFloat.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toggleMenuAcciones(event, productoId) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${productoId}`);
    
    if (!menu) return;
    
    // Cerrar todos los demás menús
    document.querySelectorAll('.menu-acciones').forEach(m => {
        if (m !== menu) m.style.display = 'none';
    });
    
    // Posicionar el menú correctamente
    const button = event.target.closest('button');
    if (button && menu.style.display === 'none') {
        const rect = button.getBoundingClientRect();
        menu.style.display = 'block';
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = (rect.left - 100) + 'px';
    } else {
        menu.style.display = 'none';
    }
}

document.addEventListener('click', function(e) {
    // Cerrar menús si se hace click fuera
    if (!e.target.closest('.btn-menu-acciones')) {
        document.querySelectorAll('.menu-acciones').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

function editarProducto(productoId) {
    const producto = inventoryGlobal.find(p => p.id === productoId);
    if (!producto) {
        showAlert('Producto no encontrado', 'error');
        return;
    }
    
    const newCosto = prompt(`Nuevo costo unitario (actual: $${formatMoney(producto.costo_unitario)}):`, producto.costo_unitario);
    if (newCosto === null) return;
    
    const newPrecio = prompt(`Nuevo precio de venta (actual: $${formatMoney(producto.precio_venta)}):`, producto.precio_venta);
    if (newPrecio === null) return;
    
    const newCantidad = prompt(`Nueva cantidad (actual: ${producto.cantidad_disponible}):`, producto.cantidad_disponible);
    if (newCantidad === null) return;
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/inventario/${productoId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            costo_unitario: parseFloat(newCosto),
            precio_venta: parseFloat(newPrecio),
            cantidad_disponible: parseInt(newCantidad)
        })
    })
    .then(response => response.json())
    .then(data => {
        showAlert('✅ Producto actualizado', 'success');
        loadInventory();
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    });
}

function eliminarProducto(productoId) {
    if (!confirm('¿Eliminar este producto?')) return;
    
    const token = localStorage.getItem('access_token');
    
    fetch(`/api/inventario/${productoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        showAlert('✅ Producto eliminado', 'success');
        loadInventory();
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    });
}