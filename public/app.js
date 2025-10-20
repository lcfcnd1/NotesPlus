// Configuración de la aplicación
const API_BASE_URL = window.location.origin + '/api';
let currentUser = null;
let authToken = null;
let notes = [];
let currentNoteId = null;
let flags = [];
let availableFlags = [];

// Elementos del DOM
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    authScreen: document.getElementById('auth-screen'),
    notesScreen: document.getElementById('notes-screen'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    loginFormElement: document.getElementById('loginForm'),
    registerFormElement: document.getElementById('registerForm'),
    logoutBtn: document.getElementById('logoutBtn'),
    newNoteBtn: document.getElementById('newNoteBtn'),
    searchInput: document.getElementById('searchInput'),
    searchToggleBtn: document.getElementById('searchToggleBtn'),
    searchFloatingInput: document.getElementById('searchFloatingInput'),
    searchCloseBtn: document.getElementById('searchCloseBtn'),
    notesGrid: document.getElementById('notesGrid'),
    noteModal: document.getElementById('noteModal'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    noteTitle: document.getElementById('noteTitle'),
    noteContent: document.getElementById('noteContent'),
    cancelNote: document.getElementById('cancelNote'),
    saveNote: document.getElementById('saveNote'),
    notifications: document.getElementById('notifications')
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Inicializar la aplicación
function initializeApp() {
    // Verificar si hay un token guardado
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showNotesScreen();
        loadNotes();
    } else {
        showAuthScreen();
    }
    
    // Ocultar pantalla de carga después de un breve delay
    setTimeout(() => {
        elements.loadingScreen.classList.add('hidden');
    }, 1500);
}

// Configurar event listeners
function setupEventListeners() {
    // Autenticación
    if (elements.showRegister) {
        elements.showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }
    
    if (elements.showLogin) {
        elements.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    if (elements.loginFormElement) {
        elements.loginFormElement.addEventListener('submit', handleLogin);
    }
    
    if (elements.registerFormElement) {
        elements.registerFormElement.addEventListener('submit', handleRegister);
    }
    
    // Notas
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (elements.newNoteBtn) {
        elements.newNoteBtn.addEventListener('click', () => openNoteModal());
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearch);
    }
    
    // Búsqueda expandible
    if (elements.searchToggleBtn) {
        elements.searchToggleBtn.addEventListener('click', toggleSearchInput);
    }
    
    if (elements.searchCloseBtn) {
        elements.searchCloseBtn.addEventListener('click', closeSearchInput);
    }
    
    // Modal
    if (elements.closeModal) {
        elements.closeModal.addEventListener('click', closeNoteModal);
    }
    
    if (elements.cancelNote) {
        elements.cancelNote.addEventListener('click', closeNoteModal);
    }
    
    if (elements.saveNote) {
        elements.saveNote.addEventListener('click', handleSaveNote);
    }
    
    // Cerrar modal al hacer clic fuera
    if (elements.noteModal) {
        elements.noteModal.addEventListener('click', (e) => {
            if (e.target === elements.noteModal) {
                closeNoteModal();
            }
        });
    }
    
    // Configurar color picker
    setupColorPicker();
    
    // Configurar editor rico
    setupRichEditor();
    
    // Configurar nodos arrastrables
    setupDraggableNodes();
}

// Funciones de autenticación
function showAuthScreen() {
    elements.authScreen.classList.remove('hidden');
    elements.notesScreen.classList.add('hidden');
}

function showNotesScreen() {
    elements.authScreen.classList.add('hidden');
    elements.notesScreen.classList.remove('hidden');
    // userName ya no existe porque eliminamos el header
}

function showLoginForm() {
    elements.loginForm.classList.remove('hidden');
    elements.registerForm.classList.add('hidden');
}

function showRegisterForm() {
    elements.loginForm.classList.add('hidden');
    elements.registerForm.classList.remove('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            // Guardar en localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotesScreen();
            loadNotes();
            showNotification('Inicio de sesión exitoso', 'success');
        } else {
            showNotification(data.error || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            // Guardar en localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotesScreen();
            loadNotes();
            showNotification('Cuenta creada exitosamente', 'success');
        } else {
            if (data.errors) {
                data.errors.forEach(error => {
                    showNotification(error.msg, 'error');
                });
            } else {
                showNotification(data.error || 'Error al crear la cuenta', 'error');
            }
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    notes = [];
    
    // Limpiar localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Limpiar formularios
    elements.loginFormElement.reset();
    elements.registerFormElement.reset();
    
    showAuthScreen();
    showNotification('Sesión cerrada', 'info');
}

// Funciones de notas
async function loadNotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            notes = await response.json();
            await renderNotes();
        } else {
            showNotification('Error al cargar las notas', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

async function renderNotes(filteredNotes = null) {
    const notesToRender = filteredNotes || notes;
    elements.notesGrid.innerHTML = '';
    
    if (notesToRender.length === 0) {
        elements.notesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No hay notas</h3>
                <p>Crea tu primera nota haciendo clic en "Nueva Nota"</p>
            </div>
        `;
        return;
    }
    
    for (const note of notesToRender) {
        const noteElement = await createNoteElement(note);
        elements.notesGrid.appendChild(noteElement);
    }
}

async function createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-card';
    noteDiv.style.backgroundColor = note.color;
    
    const createdDate = new Date(note.created_at).toLocaleDateString('es-ES');
    const updatedDate = new Date(note.updated_at).toLocaleDateString('es-ES');
    
    // Crear contenido de la nota
    let noteContent = '';
    if (note.content_html) {
        // Si hay contenido HTML, crear una versión simplificada para la vista
        noteContent = await createSimplifiedNoteContent(note.content_html, note.id);
    } else {
        noteContent = escapeHtml(note.content);
    }
    
    noteDiv.innerHTML = `
        <div class="note-title">${escapeHtml(note.title)}</div>
        <div class="note-content">${noteContent}</div>
        <div class="note-meta">
            <span>Actualizada: ${updatedDate}</span>
            <div class="note-actions">
                <button class="note-action edit-btn" data-note-id="${note.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="note-action delete-btn" data-note-id="${note.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Agregar event listeners para los botones
    const editBtn = noteDiv.querySelector('.edit-btn');
    const deleteBtn = noteDiv.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => editNote(note.id));
    deleteBtn.addEventListener('click', () => deleteNote(note.id));
    
    return noteDiv;
}

async function createSimplifiedNoteContent(htmlContent, noteId) {
    // Crear un elemento temporal para procesar el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Obtener datos de los nodos desde la base de datos
    let nodeItems = [];
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${noteId}/items`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            nodeItems = await response.json();
        }
    } catch (error) {
        console.error('Error cargando elementos de nodos:', error);
    }
    
    // Procesar nodos y convertirlos a vista simplificada
    const nodes = tempDiv.querySelectorAll('.editor-node');
    nodes.forEach((node, nodeIndex) => {
        const nodeType = node.dataset.nodeType;
        
        if (nodeType === 'list') {
            // Filtrar elementos sin flag (lista simple)
            const listItems = nodeItems.filter(item => !item.flag_id);
            
            if (listItems.length > 0) {
                const simplifiedList = document.createElement('div');
                simplifiedList.className = 'simplified-list';
                simplifiedList.innerHTML = '<strong>📝 Lista:</strong>';
                
                const ul = document.createElement('ul');
                ul.style.margin = '0.25rem 0';
                ul.style.paddingLeft = '1rem';
                
                listItems.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item.content;
                    li.style.fontSize = '0.9rem';
                    li.style.marginBottom = '0.1rem';
                    ul.appendChild(li);
                });
                
                simplifiedList.appendChild(ul);
                node.parentNode.replaceChild(simplifiedList, node);
            } else {
                // Si no hay elementos, mostrar placeholder
                const simplifiedList = document.createElement('div');
                simplifiedList.className = 'simplified-list';
                simplifiedList.innerHTML = '<strong>📝 Lista:</strong> <em style="color: var(--text-secondary); font-size: 0.85rem;">(vacía)</em>';
                node.parentNode.replaceChild(simplifiedList, node);
            }
        } else if (nodeType === 'flag-list') {
            // Filtrar elementos con flag (lista con flags)
            const flagItems = nodeItems.filter(item => item.flag_id);
            
            if (flagItems.length > 0) {
                const simplifiedFlagList = document.createElement('div');
                simplifiedFlagList.className = 'simplified-flag-list';
                simplifiedFlagList.innerHTML = '<strong>🏷️ Lista con Flags:</strong>';
                
                flagItems.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.style.margin = '0.25rem 0';
                    itemDiv.style.fontSize = '0.9rem';
                    
                    let flagPill = '';
                    if (item.flag_id && item.flag_name) {
                        flagPill = ` <span class="flag-pill" style="background: ${item.flag_color || '#667eea'}; color: white; padding: 0.1rem 0.3rem; border-radius: 8px; font-size: 0.7rem;">${item.flag_name}</span>`;
                    }
                    
                    itemDiv.innerHTML = `• ${escapeHtml(item.content)}${flagPill}`;
                    simplifiedFlagList.appendChild(itemDiv);
                });
                
                node.parentNode.replaceChild(simplifiedFlagList, node);
            } else {
                // Si no hay elementos, mostrar placeholder
                const simplifiedFlagList = document.createElement('div');
                simplifiedFlagList.className = 'simplified-flag-list';
                simplifiedFlagList.innerHTML = '<strong>🏷️ Lista con Flags:</strong> <em style="color: var(--text-secondary); font-size: 0.85rem;">(vacía)</em>';
                node.parentNode.replaceChild(simplifiedFlagList, node);
            }
        } else if (nodeType === 'todo') {
            // Filtrar elementos de TODO
            const todoItems = nodeItems.filter(item => item.completed !== undefined);
            
            if (todoItems.length > 0) {
                const simplifiedTodoList = document.createElement('div');
                simplifiedTodoList.className = 'simplified-todo-list';
                simplifiedTodoList.innerHTML = '<strong>✅ TODOs:</strong>';
                
                todoItems.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.style.margin = '0.25rem 0';
                    itemDiv.style.fontSize = '0.9rem';
                    itemDiv.style.display = 'flex';
                    itemDiv.style.alignItems = 'center';
                    itemDiv.style.gap = '0.5rem';
                    
                    const checkbox = document.createElement('span');
                    checkbox.innerHTML = item.completed ? '✅' : '⏳';
                    checkbox.style.fontSize = '0.8rem';
                    
                    const text = document.createElement('span');
                    text.textContent = item.content;
                    if (item.completed) {
                        text.style.textDecoration = 'line-through';
                        text.style.opacity = '0.7';
                    }
                    
                    itemDiv.appendChild(checkbox);
                    itemDiv.appendChild(text);
                    simplifiedTodoList.appendChild(itemDiv);
                });
                
                node.parentNode.replaceChild(simplifiedTodoList, node);
            } else {
                // Si no hay elementos, mostrar placeholder
                const simplifiedTodoList = document.createElement('div');
                simplifiedTodoList.className = 'simplified-todo-list';
                simplifiedTodoList.innerHTML = '<strong>✅ TODOs:</strong> <em style="color: var(--text-secondary); font-size: 0.85rem;">(vacía)</em>';
                node.parentNode.replaceChild(simplifiedTodoList, node);
            }
        }
    });
    
    // Limpiar el contenido y mantener solo el texto y elementos simplificados
    let content = tempDiv.innerHTML;
    
    // Remover elementos de edición que no se deben mostrar
    content = content.replace(/<div class="format-toolbar[^"]*">.*?<\/div>/gs, '');
    content = content.replace(/<div class="nodes-panel[^"]*">.*?<\/div>/gs, '');
    
    return content;
}

function openNoteModal(note = null) {
    currentNoteId = note ? note.id : null;
    
    if (note) {
        elements.modalTitle.textContent = 'Editar Nota';
        elements.noteTitle.value = note.title;
        
        // Cargar contenido HTML si existe, sino usar contenido de texto plano
        if (note.content_html) {
            elements.noteContent.innerHTML = note.content_html;
        } else {
            elements.noteContent.textContent = note.content;
        }
        
        // Cargar datos de nodos si existen
        loadNodeDataForNote(note.id);
        
        // Seleccionar color actual
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === note.color) {
                option.classList.add('selected');
            }
        });
    } else {
        elements.modalTitle.textContent = 'Nueva Nota';
        elements.noteTitle.value = '';
        elements.noteContent.innerHTML = '';
        
        // Seleccionar color por defecto
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === '#ffffff') {
                option.classList.add('selected');
            }
        });
    }
    
    elements.noteModal.classList.remove('hidden');
    elements.noteTitle.focus();
    
    // Cargar flags disponibles
    loadFlags();
}

async function loadNodeDataForNote(noteId) {
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${noteId}/items`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const items = await response.json();
            
            // Reconstruir nodos con los datos guardados
            if (items.length > 0) {
                reconstructNodesFromData(items);
            }
        }
    } catch (error) {
        console.error('Error cargando datos de nodos:', error);
    }
}

function reconstructNodesFromData(items) {
    // Agrupar elementos por posición en el HTML
    const nodes = elements.noteContent.querySelectorAll('.editor-node');
    
    nodes.forEach((node, nodeIndex) => {
        const nodeType = node.dataset.nodeType;
        
        if (nodeType === 'list') {
            const listContainer = node.querySelector('.list-node');
            const existingItems = listContainer.querySelectorAll('.list-item');
            
            // Limpiar elementos existentes
            existingItems.forEach(item => item.remove());
            
            // Agregar elementos guardados
            items.forEach(item => {
                if (!item.flag_id) { // Solo elementos de lista simple
                    const newItem = document.createElement('div');
                    newItem.className = 'list-item';
                    newItem.innerHTML = `
                        <input type="text" placeholder="Elemento de la lista" class="list-input" value="${escapeHtml(item.content)}">
                        <div class="item-actions">
                            <button class="btn-small remove-item-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    
                    const addBtn = listContainer.querySelector('.add-item-btn');
                    listContainer.insertBefore(newItem, addBtn);
                    
                    // Configurar event listener
                    const removeBtn = newItem.querySelector('.remove-item-btn');
                    removeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        removeListItem(removeBtn);
                    });
                }
            });
        } else if (nodeType === 'flag-list') {
            const flagContainer = node.querySelector('.flag-list-node');
            const existingItems = flagContainer.querySelectorAll('.flag-item');
            
            // Limpiar elementos existentes
            existingItems.forEach(item => item.remove());
            
            // Agregar elementos guardados
            items.forEach(item => {
                if (item.flag_id) { // Solo elementos con flag
                    const newItem = document.createElement('div');
                    newItem.className = 'flag-item';
                    newItem.innerHTML = `
                        <input type="text" placeholder="Elemento de la lista" class="flag-input" value="${escapeHtml(item.content)}">
                        <select class="flag-select">
                            <option value="">Sin flag</option>
                        </select>
                        <div class="item-actions">
                            <button class="btn-small remove-flag-item-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    
                    const addBtn = flagContainer.querySelector('.add-flag-item-btn');
                    flagContainer.insertBefore(newItem, addBtn);
                    
                    // Cargar flags y seleccionar la correcta
                    loadFlagsForSelect(newItem.querySelector('.flag-select')).then(select => {
                        select.value = item.flag_id;
                    });
                    
                    // Configurar event listener
                    const removeBtn = newItem.querySelector('.remove-flag-item-btn');
                    removeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        removeFlagItem(removeBtn);
                    });
                }
            });
        } else if (nodeType === 'todo') {
            const todoContainer = node.querySelector('.todo-node');
            const existingItems = todoContainer.querySelectorAll('.todo-item');
            
            // Limpiar elementos existentes
            existingItems.forEach(item => item.remove());
            
            // Agregar elementos guardados
            items.forEach(item => {
                if (item.completed !== undefined) { // Solo elementos de TODO
                    const newItem = document.createElement('div');
                    newItem.className = 'todo-item';
                    newItem.innerHTML = `
                        <input type="checkbox" class="todo-checkbox" ${item.completed ? 'checked' : ''}>
                        <input type="text" placeholder="Tarea por hacer" class="todo-input" value="${escapeHtml(item.content)}">
                        <div class="item-actions">
                            <button class="btn-small remove-todo-item-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    
                    const addBtn = todoContainer.querySelector('.add-todo-item-btn');
                    todoContainer.insertBefore(newItem, addBtn);
                    
                    // Configurar event listeners
                    const removeBtn = newItem.querySelector('.remove-todo-item-btn');
                    const checkbox = newItem.querySelector('.todo-checkbox');
                    
                    removeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        removeTodoItem(removeBtn);
                    });
                    
                    checkbox.addEventListener('change', (e) => {
                        toggleTodoItem(checkbox);
                    });
                    
                    // Aplicar estilo si está completado
                    if (item.completed) {
                        toggleTodoItem(checkbox);
                    }
                }
            });
        }
    });
}

function closeNoteModal() {
    elements.noteModal.classList.add('hidden');
    currentNoteId = null;
}

function setupColorPicker() {
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

async function handleSaveNote() {
    const title = elements.noteTitle.value.trim();
    const contentHtml = elements.noteContent.innerHTML;
    const contentText = elements.noteContent.textContent.trim();
    const selectedColor = document.querySelector('.color-option.selected').dataset.color;
    
    if (!title || !contentText) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        // Extraer datos de los nodos
        const nodeData = extractNodeData();
        
        const url = currentNoteId ? `${API_BASE_URL}/notes/${currentNoteId}` : `${API_BASE_URL}/notes`;
        const method = currentNoteId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                title,
                content: contentText,
                content_html: contentHtml,
                color: selectedColor,
                node_data: nodeData
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeNoteModal();
            loadNotes();
            showNotification(
                currentNoteId ? 'Nota actualizada exitosamente' : 'Nota creada exitosamente',
                'success'
            );
        } else {
            showNotification(data.error || 'Error al guardar la nota', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

function extractNodeData() {
    const nodes = elements.noteContent.querySelectorAll('.editor-node');
    const nodeData = [];
    
    nodes.forEach((node, index) => {
        const nodeType = node.dataset.nodeType;
        const nodeInfo = {
            type: nodeType,
            position: index,
            data: {}
        };
        
        if (nodeType === 'list') {
            const listItems = node.querySelectorAll('.list-item input');
            nodeInfo.data.items = [];
            
            listItems.forEach(input => {
                if (input.value && input.value.trim()) {
                    nodeInfo.data.items.push({
                        content: input.value.trim(),
                        position: nodeInfo.data.items.length
                    });
                }
            });
        } else if (nodeType === 'flag-list') {
            const flagItems = node.querySelectorAll('.flag-item');
            nodeInfo.data.items = [];
            
            flagItems.forEach(item => {
                const input = item.querySelector('input');
                const select = item.querySelector('select');
                
                if (input.value && input.value.trim()) {
                    nodeInfo.data.items.push({
                        content: input.value.trim(),
                        flag_id: select.value || null,
                        position: nodeInfo.data.items.length
                    });
                }
            });
        } else if (nodeType === 'todo') {
            const todoItems = node.querySelectorAll('.todo-item');
            nodeInfo.data.items = [];
            
            todoItems.forEach(item => {
                const input = item.querySelector('input[type="text"]');
                const checkbox = item.querySelector('input[type="checkbox"]');
                
                if (input.value && input.value.trim()) {
                    nodeInfo.data.items.push({
                        content: input.value.trim(),
                        completed: checkbox.checked,
                        position: nodeInfo.data.items.length
                    });
                }
            });
        }
        
        nodeData.push(nodeInfo);
    });
    
    return nodeData;
}

function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        openNoteModal(note);
    }
}

async function deleteNote(noteId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loadNotes();
            showNotification('Nota eliminada exitosamente', 'success');
        } else {
            showNotification(data.error || 'Error al eliminar la nota', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

async function handleSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        await renderNotes();
        return;
    }
    
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm)
    );
    
    await renderNotes(filteredNotes);
}

function toggleSearchInput() {
    elements.searchFloatingInput.classList.remove('hidden');
    elements.searchInput.focus();
}

function closeSearchInput() {
    elements.searchFloatingInput.classList.add('hidden');
    elements.searchInput.value = '';
    handleSearch(); // Limpiar búsqueda
}

// Utilidades
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    elements.notifications.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Manejar errores de autenticación
window.addEventListener('beforeunload', () => {
    // Limpiar datos sensibles si es necesario
});

// Manejar errores de red
window.addEventListener('online', () => {
    showNotification('Conexión restaurada', 'success');
});

window.addEventListener('offline', () => {
    showNotification('Sin conexión a internet', 'error');
});

// ===== FUNCIONES DEL EDITOR RICO =====

function setupRichEditor() {
    const editor = elements.noteContent;
    
    // Configurar barra de herramientas de formato
    const formatBtns = document.querySelectorAll('.format-btn');
    formatBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            const value = btn.dataset.value;
            
            if (command === 'formatBlock') {
                document.execCommand(command, false, value);
            } else {
                document.execCommand(command, false, null);
            }
            
            updateFormatButtons();
        });
    });
    
    // Detectar cambios en el editor
    editor.addEventListener('input', () => {
        detectAndCreateLinks(editor);
        updateFormatButtons();
    });
    
    editor.addEventListener('keyup', () => {
        detectAndCreateLinks(editor);
        updateFormatButtons();
    });
    
    // Detectar selección de texto
    editor.addEventListener('mouseup', updateFormatButtons);
    editor.addEventListener('keyup', updateFormatButtons);
}

function updateFormatButtons() {
    const editor = elements.noteContent;
    const formatBtns = document.querySelectorAll('.format-btn');
    
    formatBtns.forEach(btn => {
        const command = btn.dataset.command;
        const value = btn.dataset.value;
        
        if (command === 'formatBlock') {
            const isActive = document.queryCommandValue(command) === value;
            btn.classList.toggle('active', isActive);
        } else {
            const isActive = document.queryCommandState(command);
            btn.classList.toggle('active', isActive);
        }
    });
}

function detectAndCreateLinks(editor) {
    const text = editor.textContent;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    
    if (matches) {
        matches.forEach(url => {
            // Verificar si el enlace ya existe
            const existingLinks = editor.querySelectorAll('a');
            let linkExists = false;
            
            existingLinks.forEach(link => {
                if (link.href === url) {
                    linkExists = true;
                }
            });
            
            if (!linkExists) {
                // Reemplazar texto plano con enlace
                const textContent = editor.innerHTML;
                const newContent = textContent.replace(
                    new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                    `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
                );
                editor.innerHTML = newContent;
            }
        });
    }
}

// ===== FUNCIONES DE NODOS ARRASTRABLES =====

function setupDraggableNodes() {
    const nodeItems = document.querySelectorAll('.node-item');
    const editor = elements.noteContent;
    
    nodeItems.forEach(nodeItem => {
        nodeItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', nodeItem.dataset.nodeType);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
    
    editor.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    editor.addEventListener('drop', (e) => {
        e.preventDefault();
        const nodeType = e.dataTransfer.getData('text/plain');
        
        // Verificar que el drop sea dentro del editor, no en el panel de nodos
        if (!editor.contains(e.target)) {
            return;
        }
        
        // Obtener posición del cursor
        const selection = window.getSelection();
        let range;
        
        if (selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
        } else {
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
        }
        
        // Crear nodo según el tipo
        const nodeElement = createNodeElement(nodeType);
        
        // Insertar nodo en la posición del cursor
        range.deleteContents();
        range.insertNode(nodeElement);
        
        // Limpiar selección
        selection.removeAllRanges();
        
        // Enfocar el editor
        editor.focus();
        
        // Scroll al nodo insertado
        nodeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

function createNodeElement(nodeType) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'editor-node';
    nodeDiv.dataset.nodeType = nodeType;
    
    if (nodeType === 'list') {
        nodeDiv.innerHTML = `
            <div class="node-header">
                <div class="node-title">Lista</div>
                <div class="node-actions">
                    <button class="node-action toggle-edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="node-action danger remove-node-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="list-node">
                <div class="list-item">
                    <input type="text" placeholder="Elemento de la lista" class="list-input">
                    <div class="item-actions">
                        <button class="btn-small remove-item-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <button class="add-item-btn">
                    <i class="fas fa-plus"></i> Agregar elemento
                </button>
            </div>
        `;
        
        // Agregar event listeners
        setupListNodeEvents(nodeDiv);
    } else if (nodeType === 'flag-list') {
        nodeDiv.innerHTML = `
            <div class="node-header">
                <div class="node-title">Lista con Flags</div>
                <div class="node-actions">
                    <button class="node-action toggle-edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="node-action danger remove-node-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="flag-list-node">
                <div class="flag-item">
                    <input type="text" placeholder="Elemento de la lista" class="flag-input">
                    <select class="flag-select">
                        <option value="">Sin flag</option>
                    </select>
                    <div class="item-actions">
                        <button class="btn-small remove-flag-item-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <button class="add-flag-item-btn">
                    <i class="fas fa-plus"></i> Agregar elemento
                </button>
            </div>
        `;
        
        // Cargar flags disponibles y agregar event listeners
        loadFlagsForNode(nodeDiv);
        setupFlagListNodeEvents(nodeDiv);
    } else if (nodeType === 'todo') {
        nodeDiv.innerHTML = `
            <div class="node-header">
                <div class="node-title">TODOs</div>
                <div class="node-actions">
                    <button class="node-action toggle-edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="node-action danger remove-node-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="todo-node">
                <div class="todo-item">
                    <input type="checkbox" class="todo-checkbox">
                    <input type="text" placeholder="Tarea por hacer" class="todo-input">
                    <div class="item-actions">
                        <button class="btn-small remove-todo-item-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <button class="add-todo-item-btn">
                    <i class="fas fa-plus"></i> Agregar tarea
                </button>
            </div>
        `;
        
        // Agregar event listeners
        setupTodoNodeEvents(nodeDiv);
    }
    
    return nodeDiv;
}

// ===== FUNCIONES DE CONFIGURACIÓN DE EVENTOS =====

function setupListNodeEvents(nodeDiv) {
    const toggleBtn = nodeDiv.querySelector('.toggle-edit-btn');
    const removeBtn = nodeDiv.querySelector('.remove-node-btn');
    const addBtn = nodeDiv.querySelector('.add-item-btn');
    
    toggleBtn.addEventListener('click', () => toggleNodeEdit(toggleBtn));
    removeBtn.addEventListener('click', () => removeNode(removeBtn));
    addBtn.addEventListener('click', () => addListItem(addBtn));
    
    // Event listeners para elementos de lista existentes
    setupListItemEvents(nodeDiv);
}

function setupFlagListNodeEvents(nodeDiv) {
    const toggleBtn = nodeDiv.querySelector('.toggle-edit-btn');
    const removeBtn = nodeDiv.querySelector('.remove-node-btn');
    const addBtn = nodeDiv.querySelector('.add-flag-item-btn');
    
    toggleBtn.addEventListener('click', () => toggleNodeEdit(toggleBtn));
    removeBtn.addEventListener('click', () => removeNode(removeBtn));
    addBtn.addEventListener('click', () => addFlagItem(addBtn));
    
    // Event listeners para elementos de flag existentes
    setupFlagItemEvents(nodeDiv);
}

function setupListItemEvents(nodeDiv) {
    const removeBtns = nodeDiv.querySelectorAll('.remove-item-btn');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', () => removeListItem(btn));
    });
}

function setupFlagItemEvents(nodeDiv) {
    const removeBtns = nodeDiv.querySelectorAll('.remove-flag-item-btn');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', () => removeFlagItem(btn));
    });
}

function setupTodoNodeEvents(nodeDiv) {
    const toggleBtn = nodeDiv.querySelector('.toggle-edit-btn');
    const removeBtn = nodeDiv.querySelector('.remove-node-btn');
    const addBtn = nodeDiv.querySelector('.add-todo-item-btn');
    
    toggleBtn.addEventListener('click', () => toggleNodeEdit(toggleBtn));
    removeBtn.addEventListener('click', () => removeNode(removeBtn));
    addBtn.addEventListener('click', () => addTodoItem(addBtn));
    
    // Event listeners para elementos de TODO existentes
    setupTodoItemEvents(nodeDiv);
}

function setupTodoItemEvents(nodeDiv) {
    const removeBtns = nodeDiv.querySelectorAll('.remove-todo-item-btn');
    const checkboxes = nodeDiv.querySelectorAll('.todo-checkbox');
    
    removeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            removeTodoItem(btn);
        });
    });
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            toggleTodoItem(checkbox);
        });
    });
}

// ===== FUNCIONES DE GESTIÓN DE NODOS =====

function toggleNodeEdit(button) {
    const node = button.closest('.editor-node');
    const isEditing = node.classList.contains('editing');
    
    if (isEditing) {
        node.classList.remove('editing');
        button.innerHTML = '<i class="fas fa-edit"></i>';
        // Convertir a modo visual
        convertNodeToVisual(node);
    } else {
        node.classList.add('editing');
        button.innerHTML = '<i class="fas fa-eye"></i>';
        // Convertir a modo edición
        convertNodeToEdit(node);
    }
}

function convertNodeToVisual(node) {
    const nodeType = node.dataset.nodeType;
    
    if (nodeType === 'list') {
        const inputs = node.querySelectorAll('.list-item input');
        const listContainer = node.querySelector('.list-node');
        
        // Crear lista visual
        const visualList = document.createElement('ul');
        visualList.style.listStyle = 'none';
        visualList.style.padding = '0';
        
        inputs.forEach(input => {
            if (input.value.trim()) {
                const li = document.createElement('li');
                li.style.padding = '0.25rem 0';
                li.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                li.textContent = input.value;
                visualList.appendChild(li);
            }
        });
        
        // Reemplazar contenido
        listContainer.innerHTML = '';
        listContainer.appendChild(visualList);
    } else if (nodeType === 'flag-list') {
        const items = node.querySelectorAll('.flag-item');
        const listContainer = node.querySelector('.flag-list-node');
        
        // Crear lista visual con flags
        const visualList = document.createElement('div');
        
        items.forEach(item => {
            const input = item.querySelector('input');
            const select = item.querySelector('select');
            
            if (input.value.trim()) {
                const itemDiv = document.createElement('div');
                itemDiv.style.padding = '0.5rem';
                itemDiv.style.margin = '0.25rem 0';
                itemDiv.style.background = 'rgba(255,255,255,0.05)';
                itemDiv.style.borderRadius = '8px';
                itemDiv.style.display = 'flex';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.gap = '0.5rem';
                
                itemDiv.innerHTML = `
                    <span>${input.value}</span>
                    ${select.value ? `<span class="flag-pill"><span class="flag-color" style="background: ${getFlagColor(select.value)}"></span>${select.options[select.selectedIndex].text}</span>` : ''}
                `;
                
                visualList.appendChild(itemDiv);
            }
        });
        
        // Reemplazar contenido
        listContainer.innerHTML = '';
        listContainer.appendChild(visualList);
    } else if (nodeType === 'todo') {
        const items = node.querySelectorAll('.todo-item');
        const todoContainer = node.querySelector('.todo-node');
        
        // Crear lista visual de TODOs
        const visualList = document.createElement('div');
        
        items.forEach(item => {
            const input = item.querySelector('input[type="text"]');
            const checkbox = item.querySelector('input[type="checkbox"]');
            
            if (input.value.trim()) {
                const itemDiv = document.createElement('div');
                itemDiv.style.padding = '0.5rem';
                itemDiv.style.margin = '0.25rem 0';
                itemDiv.style.background = 'rgba(255,255,255,0.05)';
                itemDiv.style.borderRadius = '8px';
                itemDiv.style.display = 'flex';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.gap = '0.5rem';
                
                const statusIcon = checkbox.checked ? '✅' : '⏳';
                const textStyle = checkbox.checked ? 'text-decoration: line-through; opacity: 0.7;' : '';
                
                itemDiv.innerHTML = `
                    <span style="font-size: 0.9rem;">${statusIcon}</span>
                    <span style="${textStyle}">${input.value}</span>
                `;
                
                visualList.appendChild(itemDiv);
            }
        });
        
        // Reemplazar contenido
        todoContainer.innerHTML = '';
        todoContainer.appendChild(visualList);
    }
}

function convertNodeToEdit(node) {
    const nodeType = node.dataset.nodeType;
    
    if (nodeType === 'list') {
        // Restaurar modo edición para lista
        const listContainer = node.querySelector('.list-node');
        listContainer.innerHTML = `
            <div class="list-item">
                <input type="text" placeholder="Elemento de la lista" class="list-input">
                <div class="item-actions">
                    <button class="btn-small remove-item-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <button class="add-item-btn">
                <i class="fas fa-plus"></i> Agregar elemento
            </button>
        `;
        
        // Reconfigurar event listeners
        setupListItemEvents(node);
        const addBtn = node.querySelector('.add-item-btn');
        addBtn.addEventListener('click', () => addListItem(addBtn));
    } else if (nodeType === 'flag-list') {
        // Restaurar modo edición para lista con flags
        const listContainer = node.querySelector('.flag-list-node');
        listContainer.innerHTML = `
            <div class="flag-item">
                <input type="text" placeholder="Elemento de la lista" class="flag-input">
                <select class="flag-select">
                    <option value="">Sin flag</option>
                </select>
                <div class="item-actions">
                    <button class="btn-small remove-flag-item-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <button class="add-flag-item-btn">
                <i class="fas fa-plus"></i> Agregar elemento
            </button>
        `;
        
        // Cargar flags disponibles
        loadFlagsForNode(node);
        
        // Reconfigurar event listeners
        setupFlagItemEvents(node);
        const addBtn = node.querySelector('.add-flag-item-btn');
        addBtn.addEventListener('click', () => addFlagItem(addBtn));
    } else if (nodeType === 'todo') {
        // Restaurar modo edición para TODO
        const todoContainer = node.querySelector('.todo-node');
        todoContainer.innerHTML = `
            <div class="todo-item">
                <input type="checkbox" class="todo-checkbox">
                <input type="text" placeholder="Tarea por hacer" class="todo-input">
                <div class="item-actions">
                    <button class="btn-small remove-todo-item-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <button class="add-todo-item-btn">
                <i class="fas fa-plus"></i> Agregar tarea
            </button>
        `;
        
        // Reconfigurar event listeners
        setupTodoItemEvents(node);
        const addBtn = node.querySelector('.add-todo-item-btn');
        addBtn.addEventListener('click', () => addTodoItem(addBtn));
    }
}

function removeNode(button) {
    if (confirm('¿Estás seguro de que quieres eliminar este nodo?')) {
        button.closest('.editor-node').remove();
    }
}

// ===== FUNCIONES DE LISTAS =====

function addListItem(button) {
    const listNode = button.closest('.list-node');
    const newItem = document.createElement('div');
    newItem.className = 'list-item';
    newItem.innerHTML = `
        <input type="text" placeholder="Elemento de la lista" class="list-input">
        <div class="item-actions">
            <button class="btn-small remove-item-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    button.parentNode.insertBefore(newItem, button);
    
    // Configurar event listener para el botón de eliminar
    const removeBtn = newItem.querySelector('.remove-item-btn');
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        removeListItem(removeBtn);
    });
    
    // Enfocar el input del nuevo elemento
    const input = newItem.querySelector('input');
    input.focus();
    
    // Scroll al nuevo elemento
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function removeListItem(button) {
    button.closest('.list-item').remove();
}

function addFlagItem(button) {
    const flagListNode = button.closest('.flag-list-node');
    const newItem = document.createElement('div');
    newItem.className = 'flag-item';
    newItem.innerHTML = `
        <input type="text" placeholder="Elemento de la lista" class="flag-input">
        <select class="flag-select">
            <option value="">Sin flag</option>
        </select>
        <div class="item-actions">
            <button class="btn-small remove-flag-item-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    button.parentNode.insertBefore(newItem, button);
    
    // Cargar flags en el nuevo select
    loadFlagsForSelect(newItem.querySelector('.flag-select'));
    
    // Configurar event listener para el botón de eliminar
    const removeBtn = newItem.querySelector('.remove-flag-item-btn');
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        removeFlagItem(removeBtn);
    });
    
    // Enfocar el input del nuevo elemento
    const input = newItem.querySelector('input');
    input.focus();
    
    // Scroll al nuevo elemento
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function removeFlagItem(button) {
    button.closest('.flag-item').remove();
}

// ===== FUNCIONES DE TODOs =====

function addTodoItem(button) {
    const todoNode = button.closest('.todo-node');
    const newItem = document.createElement('div');
    newItem.className = 'todo-item';
    newItem.innerHTML = `
        <input type="checkbox" class="todo-checkbox">
        <input type="text" placeholder="Tarea por hacer" class="todo-input">
        <div class="item-actions">
            <button class="btn-small remove-todo-item-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    button.parentNode.insertBefore(newItem, button);
    
    // Configurar event listeners
    const removeBtn = newItem.querySelector('.remove-todo-item-btn');
    const checkbox = newItem.querySelector('.todo-checkbox');
    
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        removeTodoItem(removeBtn);
    });
    
    checkbox.addEventListener('change', (e) => {
        toggleTodoItem(checkbox);
    });
    
    // Enfocar el input del nuevo elemento
    const input = newItem.querySelector('input[type="text"]');
    input.focus();
    
    // Scroll al nuevo elemento
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function removeTodoItem(button) {
    button.closest('.todo-item').remove();
}

function toggleTodoItem(checkbox) {
    const todoItem = checkbox.closest('.todo-item');
    const input = todoItem.querySelector('.todo-input');
    
    if (checkbox.checked) {
        todoItem.classList.add('completed');
        input.style.textDecoration = 'line-through';
        input.style.opacity = '0.7';
    } else {
        todoItem.classList.remove('completed');
        input.style.textDecoration = 'none';
        input.style.opacity = '1';
    }
}

// ===== FUNCIONES DE FLAGS =====

async function loadFlags() {
    try {
        const response = await fetch(`${API_BASE_URL}/flags`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            flags = await response.json();
            availableFlags = flags;
        }
    } catch (error) {
        console.error('Error cargando flags:', error);
    }
}

function loadFlagsForNode(node) {
    const selects = node.querySelectorAll('.flag-select');
    selects.forEach(select => {
        loadFlagsForSelect(select);
    });
}

function loadFlagsForSelect(select) {
    return new Promise((resolve) => {
        // Limpiar opciones existentes (excepto "Sin flag")
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Remover event listeners existentes
        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);
        select = newSelect;
        
        // Agregar flags disponibles
        flags.forEach(flag => {
            const option = document.createElement('option');
            option.value = flag.id;
            option.textContent = flag.name;
            option.style.color = flag.color;
            select.appendChild(option);
        });
        
        // Agregar opción para crear nueva flag
        const createOption = document.createElement('option');
        createOption.value = 'create_new';
        createOption.textContent = '+ Crear nueva flag';
        createOption.style.color = '#f093fb';
        createOption.style.fontWeight = 'bold';
        select.appendChild(createOption);
        
        // Agregar event listener para detectar cuando se selecciona "crear nueva"
        select.addEventListener('change', (e) => {
            if (e.target.value === 'create_new') {
                createNewFlag(select);
            }
        });
        
        resolve(select);
    });
}

function createNewFlag(select) {
    const flagName = prompt('Ingresa el nombre de la nueva flag:');
    if (!flagName || !flagName.trim()) {
        select.value = '';
        return;
    }
    
    // Verificar si la flag ya existe
    const existingFlag = flags.find(flag => flag.name.toLowerCase() === flagName.toLowerCase());
    if (existingFlag) {
        alert('Ya existe una flag con ese nombre');
        select.value = '';
        return;
    }
    
    // Crear la nueva flag
    createFlag(flagName.trim()).then(newFlag => {
        if (newFlag) {
            // Agregar la nueva flag a la lista local
            flags.push(newFlag);
            
            // Recargar el select
            loadFlagsForSelect(select);
            
            // Seleccionar la nueva flag
            select.value = newFlag.id;
            
            showNotification(`Flag "${newFlag.name}" creada exitosamente`, 'success');
        }
    }).catch(error => {
        console.error('Error creando flag:', error);
        showNotification('Error al crear la flag', 'error');
        select.value = '';
    });
}

async function createFlag(name) {
    try {
        const response = await fetch(`${API_BASE_URL}/flags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name: name,
                color: getRandomFlagColor()
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return data.flag;
        } else {
            throw new Error(data.error || 'Error al crear la flag');
        }
    } catch (error) {
        console.error('Error creando flag:', error);
        throw error;
    }
}

function getRandomFlagColor() {
    const colors = [
        '#f44336', '#e91e63', '#9c27b0', '#673ab7',
        '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
        '#009688', '#4caf50', '#8bc34a', '#cddc39',
        '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getFlagColor(flagId) {
    const flag = flags.find(f => f.id == flagId);
    return flag ? flag.color : '#667eea';
}

function saveNodeData(element) {
    // Esta función se puede usar para guardar datos del nodo si es necesario
    console.log('Guardando datos del nodo:', element.value);
}
