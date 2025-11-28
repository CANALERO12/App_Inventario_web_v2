// api-helper.js - Funciones auxiliares para API calls con autenticación

/**
 * Obtener el token del localStorage
 */
function getToken() {
    return localStorage.getItem('access_token');
}

/**
 * Verificar si el usuario está autenticado
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Hacer fetch con autenticación automática
 */
function apiFetch(url, options = {}) {
    const token = getToken();
    
    // Preparar headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Agregar token si existe
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Combinar opciones
    const finalOptions = {
        ...options,
        headers
    };
    
    return fetch(url, finalOptions)
        .then(response => {
            // Si retorna 401, token expiró
            if (response.status === 401) {
                console.warn('⚠️ Token expirado o no válido');
                localStorage.removeItem('access_token');
                localStorage.removeItem('usuario');
                localStorage.removeItem('empresa_id');
                window.location.href = '/login';
                return Promise.reject(new Error('Token expirado'));
            }
            return response.json();
        })
        .then(data => {
            if (data.success === false) {
                throw new Error(data.message || 'Error en la API');
            }
            return data;
        });
}

/**
 * GET - Obtener datos
 */
function apiGet(url) {
    return apiFetch(url, {
        method: 'GET'
    });
}

/**
 * POST - Crear datos
 */
function apiPost(url, body) {
    return apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

/**
 * PUT - Actualizar datos
 */
function apiPut(url, body) {
    return apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

/**
 * DELETE - Eliminar datos
 */
function apiDelete(url) {
    return apiFetch(url, {
        method: 'DELETE'
    });
}

/**
 * Logout
 */
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('empresa_id');
    window.location.href = '/login';
}

/**
 * Obtener datos del usuario actual
 */
function getCurrentUser() {
    const usuarioJson = localStorage.getItem('usuario');
    return usuarioJson ? JSON.parse(usuarioJson) : null;
}

/**
 * Verificar autenticación al cargar la página
 * Si no tiene token, redirigir a login
 */
function checkAuth() {
    if (!isAuthenticated()) {
        console.warn('No autenticado, redirigiendo a login...');
        window.location.href = '/login';
    }
}
