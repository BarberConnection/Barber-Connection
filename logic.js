(function () {
    const USERS_KEY = 'barberConnectionUsers';
    const CURRENT_USER_KEY = 'barberConnectionCurrentUser';

    function getUsers() {
        try {
            const stored = localStorage.getItem(USERS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('No se pudieron leer los usuarios', error);
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function normalizeEmail(email) {
        return email.trim().toLowerCase();
    }

    function registerUser({ name, email, password }) {
        const trimmedName = (name || '').trim();
        const normalizedEmail = normalizeEmail(email || '');

        if (!trimmedName || !normalizedEmail || !password) {
            return { ok: false, message: 'Completa todos los campos.' };
        }

        if (password.length < 6) {
            return { ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
        }

        const users = getUsers();
        const alreadyExists = users.some((user) => user.email === normalizedEmail);

        if (alreadyExists) {
            return { ok: false, message: 'Este correo ya está registrado.' };
        }

        const newUser = {
            id: Date.now().toString(),
            name: trimmedName,
            email: normalizedEmail,
            password
        };

        users.push(newUser);
        saveUsers(users);

        return { ok: true, message: 'Cuenta creada correctamente.' };
    }

    function loginUser(email, password) {
        const normalizedEmail = normalizeEmail(email || '');
        const users = getUsers();
        const user = users.find((item) => item.email === normalizedEmail && item.password === password);

        if (!user) {
            return { ok: false, message: 'Correo o contraseña incorrectos.' };
        }

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
        }));

        return { ok: true, message: 'Inicio de sesión correcto.', user };
    }

    function logoutUser() {
        localStorage.removeItem(CURRENT_USER_KEY);
        return { ok: true, message: 'Sesión cerrada.' };
    }

    function getCurrentUser() {
        try {
            const stored = localStorage.getItem(CURRENT_USER_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('No se pudo leer el usuario actual', error);
            return null;
        }
    }

    function isAuthenticated() {
        return Boolean(getCurrentUser());
    }

    window.BarberAuth = {
        registerUser,
        loginUser,
        logoutUser,
        getCurrentUser,
        isAuthenticated
    };
})();

(function () {
    function setFormMessage(element, result) {
        element.textContent = result.message;
        element.className = result.ok ? 'form-message success' : 'form-message error';
    }

    function initializeLandingPage() {
        const authStatus = document.getElementById('authStatus');
        const navAuthLink = document.getElementById('navAuthLink');
        if (!authStatus) {
            return;
        }

        function renderAuthStatus() {
            const currentUser = window.BarberAuth.getCurrentUser();
            if (!currentUser) {
                authStatus.innerHTML = '¿Ya tienes cuenta? <a href="login.html">Inicia sesión</a>';
                if (navAuthLink) {
                    navAuthLink.textContent = 'Iniciar sesión';
                    navAuthLink.href = 'login.html';
                    navAuthLink.onclick = null;
                }
                return;
            }

            authStatus.innerHTML = `Hola, ${currentUser.name}. <button type="button" id="logoutButton">Cerrar sesión</button>`;
            if (navAuthLink) {
                navAuthLink.textContent = 'Cerrar sesión';
                navAuthLink.href = '#';
                navAuthLink.onclick = function (event) {
                    event.preventDefault();
                    window.BarberAuth.logoutUser();
                    renderAuthStatus();
                };
            }

            document.getElementById('logoutButton').addEventListener('click', () => {
                window.BarberAuth.logoutUser();
                renderAuthStatus();
            });
        }

        renderAuthStatus();
    }

    function initializeLoginPage() {
        const form = document.getElementById('loginForm');
        if (!form) {
            return;
        }

        const message = document.getElementById('formMessage');
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const result = window.BarberAuth.loginUser(form.email.value, form.password.value);
            setFormMessage(message, result);

            if (result.ok) {
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 700);
            }
        });
    }

    function initializeSignupPage() {
        const signupForm = document.getElementById('signupForm');
        if (!signupForm) {
            return;
        }

        const formMessage = document.getElementById('formMessage');
        signupForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const { name, email, password, confirmPassword } = signupForm;
            if (password.value !== confirmPassword.value) {
                formMessage.textContent = 'Las contraseñas no coinciden.';
                formMessage.className = 'form-message error';
                return;
            }

            const result = window.BarberAuth.registerUser({
                name: name.value,
                email: email.value,
                password: password.value
            });
            setFormMessage(formMessage, result);

            if (result.ok) {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 900);
            }
        });
    }

    function initializeDashboardPage() {
        const servicesView = document.getElementById('servicesView');
        if (!servicesView) {
            return;
        }

        const servicesKey = 'barberConnectionServices';
        const catalogKey = 'barberConnectionServiceCatalog';
        const barbersKey = 'barberConnectionBarbers';
        const clientsKey = 'barberConnectionClients';
        const modal = document.getElementById('serviceModal');
        const openButton = document.getElementById('openServiceModal');
        const closeButton = document.getElementById('closeServiceModal');
        const cancelButton = document.getElementById('cancelServiceModal');
        const serviceForm = document.getElementById('serviceForm');
        const servicesTableBody = document.getElementById('servicesTableBody');
        const serviceCount = document.getElementById('serviceCount');
        const lastServiceTime = document.getElementById('lastServiceTime');
        const userName = document.getElementById('userName');
        const serviceSelect = document.getElementById('serviceSelect');
        const servicePrice = document.getElementById('servicePrice');
        const clientSelect = document.getElementById('clientSelect');
        const serviceSubmitButton = document.getElementById('serviceSubmitButton');
        const catalogForm = document.getElementById('catalogForm');
        const catalogTableBody = document.getElementById('catalogTableBody');
        const catalogMessage = document.getElementById('catalogMessage');
        const catalogSubmitButton = document.getElementById('catalogSubmitButton');
        const catalogCancelButton = document.getElementById('catalogCancelButton');
        const administrationView = document.getElementById('administrationView');
        const administrationNav = document.getElementById('administrationNav');
        const barbersView = document.getElementById('barbersView');
        const servicesNav = document.querySelector('.nav-item.active');
        const barbersNav = document.getElementById('barbersNav');
        const barberForm = document.getElementById('barberForm');
        const barberMessage = document.getElementById('barberMessage');
        const barbersTableBody = document.getElementById('barbersTableBody');
        const barberSelect = document.getElementById('barberSelect');
        const barberSubmitButton = document.getElementById('barberSubmitButton');
        const barberCancelButton = document.getElementById('barberCancelButton');
        let editingCatalogId = null;
        let editingBarberId = null;
        let editingServiceId = null;
        const clientsView = document.getElementById('clientsView');
        const clientsNav = document.getElementById('clientsNav');
        const clientForm = document.getElementById('clientForm');
        const clientMessage = document.getElementById('clientMessage');
        const clientsTableBody = document.getElementById('clientsTableBody');
        const clientSubmitButton = document.getElementById('clientSubmitButton');
        const clientCancelButton = document.getElementById('clientCancelButton');
        let editingClientId = null;

        const currentUser = window.BarberAuth?.getCurrentUser?.();
        if (userName) {
            userName.textContent = currentUser?.name || 'Invitado';
        }

        function readStorage(key, errorMessage) {
            try {
                return JSON.parse(localStorage.getItem(key)) || [];
            } catch (error) {
                console.error(errorMessage, error);
                return [];
            }
        }

        function writeStorage(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        }

        function getServices() {
            return readStorage(servicesKey, 'No se pudieron leer los servicios');
        }

        function getCatalog() {
            return readStorage(catalogKey, 'No se pudo leer el catálogo de servicios');
        }

        function getBarbers() {
            return readStorage(barbersKey, 'No se pudo leer el registro de barberos');
        }

        function getClients() {
            return readStorage(clientsKey, 'No se pudo leer el registro de clientes');
        }

        function formatPrice(value) {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
            }).format(Number(value));
        }

        function formatDateTime(value) {
            return new Date(value).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function renderCatalog() {
            const catalog = getCatalog();
            catalogTableBody.innerHTML = '';
            if (!catalog.length) {
                catalogTableBody.innerHTML = '<tr><td colspan="3" class="empty-state">Aún no hay servicios en el catálogo.</td></tr>';
            } else {
                catalog.forEach((item) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${item.name}</td><td>${formatPrice(item.price)}</td><td><button type="button" class="secondary-btn catalog-edit" data-id="${item.id}">Editar</button> <button type="button" class="secondary-btn catalog-delete" data-id="${item.id}">Eliminar</button></td>`;
                    catalogTableBody.appendChild(row);
                });
            }

            serviceSelect.innerHTML = '<option value="">Selecciona un servicio</option>';
            catalog.forEach((item) => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                serviceSelect.appendChild(option);
            });
        }

        function renderBarbers() {
            const barbers = getBarbers();
            barbersTableBody.innerHTML = '';
            if (!barbers.length) {
                barbersTableBody.innerHTML = '<tr><td colspan="8" class="empty-state">Aún no hay barberos registrados.</td></tr>';
            } else {
                barbers.forEach((barber) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${barber.fullName}</td><td>${barber.identityNumber}</td><td>${barber.username}</td><td>${barber.birthDate}</td><td>${barber.phone}</td><td>${barber.email}</td><td>${barber.commission}%</td><td><button type="button" class="secondary-btn barber-edit" data-id="${barber.id}">Editar</button> <button type="button" class="secondary-btn barber-delete" data-id="${barber.id}">Eliminar</button></td>`;
                    barbersTableBody.appendChild(row);
                });
            }

            barberSelect.innerHTML = '<option value="">Selecciona un barbero</option>';
            barbers.forEach((barber) => {
                const option = document.createElement('option');
                option.value = barber.fullName;
                option.textContent = barber.fullName;
                barberSelect.appendChild(option);
            });
        }

        function renderClients() {
            const clients = getClients();
            clientsTableBody.innerHTML = '';
            if (!clients.length) {
                clientsTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Aún no hay clientes registrados.</td></tr>';
            } else {
                clients.forEach((client) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${client.fullName}</td><td>${client.identityNumber}</td><td>${client.phone}</td><td>${client.birthDate}</td><td>${client.email}</td><td><button type="button" class="secondary-btn client-edit" data-id="${client.id}">Editar</button> <button type="button" class="secondary-btn client-delete" data-id="${client.id}">Eliminar</button></td>`;
                    clientsTableBody.appendChild(row);
                });
            }

            clientSelect.innerHTML = '<option value="">Selecciona un cliente</option>';
            clients.forEach((client) => {
                const option = document.createElement('option');
                option.value = client.fullName;
                option.textContent = client.fullName;
                clientSelect.appendChild(option);
            });
        }

        function renderServices() {
            const services = getServices();
            serviceCount.textContent = services.length;
            lastServiceTime.textContent = services.length ? formatDateTime(services[0].registeredAt) : '--:--';
            servicesTableBody.innerHTML = '';
            if (!services.length) {
                servicesTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Aún no hay servicios registrados.</td></tr>';
                return;
            }

            services.forEach((service) => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${service.name}</td><td>${service.client}</td><td>${service.barber}</td><td>${formatPrice(service.price)}</td><td>${formatDateTime(service.registeredAt)}</td><td><button type="button" class="secondary-btn service-edit" data-id="${service.id || service.registeredAt}">Editar</button></td>`;
                servicesTableBody.appendChild(row);
            });
        }

        function closeModal() {
            modal.style.display = 'none';
            serviceForm.reset();
            servicePrice.value = '';
            editingServiceId = null;
            serviceSubmitButton.textContent = 'Guardar servicio';
        }

        function showAdministration() {
            servicesView.hidden = true;
            clientsView.hidden = true;
            barbersView.hidden = true;
            administrationView.hidden = false;
            servicesNav.classList.remove('active');
            barbersNav.classList.remove('active');
            clientsNav.classList.remove('active');
            administrationNav.classList.add('active');
            renderCatalog();
        }

        function showBarbers() {
            servicesView.hidden = true;
            clientsView.hidden = true;
            administrationView.hidden = true;
            barbersView.hidden = false;
            servicesNav.classList.remove('active');
            clientsNav.classList.remove('active');
            administrationNav.classList.remove('active');
            barbersNav.classList.add('active');
            renderBarbers();
        }

        function showClients() {
            servicesView.hidden = true;
            barbersView.hidden = true;
            administrationView.hidden = true;
            clientsView.hidden = false;
            servicesNav.classList.remove('active');
            barbersNav.classList.remove('active');
            administrationNav.classList.remove('active');
            clientsNav.classList.add('active');
            renderClients();
        }

        function showServices() {
            servicesView.hidden = false;
            clientsView.hidden = true;
            barbersView.hidden = true;
            administrationView.hidden = true;
            servicesNav.classList.add('active');
            barbersNav.classList.remove('active');
            clientsNav.classList.remove('active');
            administrationNav.classList.remove('active');
        }

        openButton.addEventListener('click', () => {
            modal.style.display = 'grid';
        });
        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        serviceSelect.addEventListener('change', () => {
            const selectedItem = getCatalog().find((item) => item.name === serviceSelect.value);
            servicePrice.value = selectedItem ? selectedItem.price : '';
        });
        barbersNav.addEventListener('click', (event) => {
            event.preventDefault();
            showBarbers();
        });
        clientsNav.addEventListener('click', (event) => {
            event.preventDefault();
            showClients();
        });
        administrationNav.addEventListener('click', (event) => {
            event.preventDefault();
            showAdministration();
        });
        servicesNav.addEventListener('click', (event) => {
            event.preventDefault();
            showServices();
        });
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        barberForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const barber = Object.fromEntries(new FormData(barberForm).entries());
            const barbers = getBarbers();
            const identityNumber = barber.identityNumber.trim();
            const username = barber.username.trim().toLowerCase();
            const email = barber.email.trim().toLowerCase();

            if (barbers.some((item) => item.id !== editingBarberId && item.identityNumber === identityNumber)) {
                setFormMessage(barberMessage, { ok: false, message: 'La cédula ya está registrada.' });
                return;
            }
            if (barbers.some((item) => item.id !== editingBarberId && item.username.toLowerCase() === username)) {
                setFormMessage(barberMessage, { ok: false, message: 'El nombre de usuario ya está registrado.' });
                return;
            }
            if (barbers.some((item) => item.id !== editingBarberId && item.email.toLowerCase() === email)) {
                setFormMessage(barberMessage, { ok: false, message: 'El correo electrónico ya está registrado.' });
                return;
            }

            const updatedBarber = { ...barber, identityNumber, username, email, commission: Number(barber.commission) };
            if (editingBarberId) {
                const barberIndex = barbers.findIndex((item) => item.id === editingBarberId);
                barbers[barberIndex] = { ...barbers[barberIndex], ...updatedBarber };
                editingBarberId = null;
                barberSubmitButton.textContent = '+ Agregar barbero';
                barberCancelButton.hidden = true;
                setFormMessage(barberMessage, { ok: true, message: 'Barbero actualizado correctamente.' });
            } else {
                barbers.push({ ...updatedBarber, id: Date.now().toString() });
                setFormMessage(barberMessage, { ok: true, message: 'Barbero agregado correctamente.' });
            }
            writeStorage(barbersKey, barbers);
            barberForm.reset();
            renderBarbers();
        });

        clientForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const client = Object.fromEntries(new FormData(clientForm).entries());
            const clients = getClients();
            const identityNumber = client.identityNumber.trim();
            const email = client.email.trim().toLowerCase();

            if (clients.some((item) => item.id !== editingClientId && item.identityNumber === identityNumber)) {
                setFormMessage(clientMessage, { ok: false, message: 'La cédula ya está registrada.' });
                return;
            }
            if (clients.some((item) => item.id !== editingClientId && item.email.toLowerCase() === email)) {
                setFormMessage(clientMessage, { ok: false, message: 'El correo electrónico ya está registrado.' });
                return;
            }

            const updatedClient = { ...client, identityNumber, email };
            if (editingClientId) {
                const clientIndex = clients.findIndex((item) => item.id === editingClientId);
                clients[clientIndex] = { ...clients[clientIndex], ...updatedClient };
                editingClientId = null;
                clientSubmitButton.textContent = '+ Agregar cliente';
                clientCancelButton.hidden = true;
                setFormMessage(clientMessage, { ok: true, message: 'Cliente actualizado correctamente.' });
            } else {
                clients.push({ ...updatedClient, id: Date.now().toString() });
                setFormMessage(clientMessage, { ok: true, message: 'Cliente agregado correctamente.' });
            }
            writeStorage(clientsKey, clients);
            clientForm.reset();
            renderClients();
        });

        clientsTableBody.addEventListener('click', (event) => {
            const editButton = event.target.closest('.client-edit');
            if (editButton) {
                const client = getClients().find((item) => item.id === editButton.dataset.id);
                if (!client) {
                    return;
                }
                Object.entries(client).forEach(([field, value]) => {
                    if (clientForm.elements[field]) {
                        clientForm.elements[field].value = value;
                    }
                });
                editingClientId = client.id;
                clientSubmitButton.textContent = 'Guardar cambios';
                clientCancelButton.hidden = false;
                clientMessage.textContent = `Editando: ${client.fullName}`;
                clientMessage.className = 'form-message';
                clientForm.elements.fullName.focus();
                return;
            }

            const deleteButton = event.target.closest('.client-delete');
            if (!deleteButton) {
                return;
            }
            if (editingClientId === deleteButton.dataset.id) {
                editingClientId = null;
                clientForm.reset();
                clientSubmitButton.textContent = '+ Agregar cliente';
                clientCancelButton.hidden = true;
            }
            writeStorage(clientsKey, getClients().filter((client) => client.id !== deleteButton.dataset.id));
            renderClients();
        });

        clientCancelButton.addEventListener('click', () => {
            editingClientId = null;
            clientForm.reset();
            clientSubmitButton.textContent = '+ Agregar cliente';
            clientCancelButton.hidden = true;
            clientMessage.textContent = '';
            clientMessage.className = 'form-message';
        });

        barbersTableBody.addEventListener('click', (event) => {
            const editButton = event.target.closest('.barber-edit');
            if (editButton) {
                const barber = getBarbers().find((item) => item.id === editButton.dataset.id);
                if (!barber) {
                    return;
                }
                Object.entries(barber).forEach(([field, value]) => {
                    if (barberForm.elements[field]) {
                        barberForm.elements[field].value = value;
                    }
                });
                editingBarberId = barber.id;
                barberSubmitButton.textContent = 'Guardar cambios';
                barberCancelButton.hidden = false;
                barberMessage.textContent = `Editando: ${barber.fullName}`;
                barberMessage.className = 'form-message';
                barberForm.elements.fullName.focus();
                return;
            }

            const deleteButton = event.target.closest('.barber-delete');
            if (!deleteButton) {
                return;
            }
            if (editingBarberId === deleteButton.dataset.id) {
                editingBarberId = null;
                barberForm.reset();
                barberSubmitButton.textContent = '+ Agregar barbero';
                barberCancelButton.hidden = true;
            }
            writeStorage(barbersKey, getBarbers().filter((barber) => barber.id !== deleteButton.dataset.id));
            renderBarbers();
        });

        barberCancelButton.addEventListener('click', () => {
            editingBarberId = null;
            barberForm.reset();
            barberSubmitButton.textContent = '+ Agregar barbero';
            barberCancelButton.hidden = true;
            barberMessage.textContent = '';
            barberMessage.className = 'form-message';
        });

        catalogForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(catalogForm);
            const name = formData.get('name').trim();
            const price = Number(formData.get('price'));
            const catalog = getCatalog();
            if (catalog.some((item) => item.id !== editingCatalogId && item.name.toLowerCase() === name.toLowerCase())) {
                setFormMessage(catalogMessage, { ok: false, message: 'Ese servicio ya existe en el catálogo.' });
                return;
            }

            if (editingCatalogId) {
                const item = catalog.find((catalogItem) => catalogItem.id === editingCatalogId);
                item.name = name;
                item.price = price;
                editingCatalogId = null;
                catalogSubmitButton.textContent = '+ Agregar al catálogo';
                catalogCancelButton.hidden = true;
                setFormMessage(catalogMessage, { ok: true, message: 'Servicio actualizado correctamente.' });
            } else {
                catalog.push({ id: Date.now().toString(), name, price });
                setFormMessage(catalogMessage, { ok: true, message: 'Servicio agregado al catálogo.' });
            }

            writeStorage(catalogKey, catalog);
            catalogForm.reset();
            renderCatalog();
        });

        catalogTableBody.addEventListener('click', (event) => {
            const editButton = event.target.closest('.catalog-edit');
            if (editButton) {
                const item = getCatalog().find((catalogItem) => catalogItem.id === editButton.dataset.id);
                if (!item) {
                    return;
                }
                catalogForm.elements.name.value = item.name;
                catalogForm.elements.price.value = item.price;
                editingCatalogId = item.id;
                catalogSubmitButton.textContent = 'Guardar cambios';
                catalogCancelButton.hidden = false;
                catalogMessage.textContent = `Editando: ${item.name}`;
                catalogMessage.className = 'form-message';
                catalogForm.elements.name.focus();
                return;
            }

            const deleteButton = event.target.closest('.catalog-delete');
            if (!deleteButton) {
                return;
            }
            if (editingCatalogId === deleteButton.dataset.id) {
                editingCatalogId = null;
                catalogForm.reset();
                catalogSubmitButton.textContent = '+ Agregar al catálogo';
                catalogCancelButton.hidden = true;
            }
            writeStorage(catalogKey, getCatalog().filter((item) => item.id !== deleteButton.dataset.id));
            renderCatalog();
        });

        catalogCancelButton.addEventListener('click', () => {
            editingCatalogId = null;
            catalogForm.reset();
            catalogSubmitButton.textContent = '+ Agregar al catálogo';
            catalogCancelButton.hidden = true;
            catalogMessage.textContent = '';
            catalogMessage.className = 'form-message';
        });

        serviceForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const service = Object.fromEntries(new FormData(serviceForm).entries());
            const services = getServices();
            if (editingServiceId) {
                const serviceIndex = services.findIndex((item) => item.id === editingServiceId || item.registeredAt === editingServiceId);
                services[serviceIndex] = {
                    ...services[serviceIndex],
                    ...service,
                    price: Number(service.price),
                    id: services[serviceIndex].id || editingServiceId
                };
            } else {
                services.unshift({ ...service, price: Number(service.price), registeredAt: new Date().toISOString(), id: Date.now().toString() });
            }
            writeStorage(servicesKey, services);
            renderServices();
            closeModal();
        });

        servicesTableBody.addEventListener('click', (event) => {
            const editButton = event.target.closest('.service-edit');
            if (!editButton) {
                return;
            }

            const service = getServices().find((item) => item.id === editButton.dataset.id || item.registeredAt === editButton.dataset.id);
            if (!service) {
                return;
            }

            renderCatalog();
            renderBarbers();
            if (!Array.from(serviceSelect.options).some((option) => option.value === service.name)) {
                const option = document.createElement('option');
                option.value = service.name;
                option.textContent = service.name;
                serviceSelect.appendChild(option);
            }
            if (!Array.from(barberSelect.options).some((option) => option.value === service.barber)) {
                const option = document.createElement('option');
                option.value = service.barber;
                option.textContent = service.barber;
                barberSelect.appendChild(option);
            }
            if (!Array.from(clientSelect.options).some((option) => option.value === service.client)) {
                const option = document.createElement('option');
                option.value = service.client;
                option.textContent = service.client;
                clientSelect.appendChild(option);
            }

            serviceSelect.value = service.name;
            barberSelect.value = service.barber;
            clientSelect.value = service.client;
            servicePrice.value = service.price;
            editingServiceId = service.id || service.registeredAt;
            serviceSubmitButton.textContent = 'Guardar cambios';
            modal.style.display = 'grid';
        });

        renderServices();
        renderCatalog();
        renderBarbers();
        renderClients();
    }

    initializeLandingPage();
    initializeLoginPage();
    initializeSignupPage();
    initializeDashboardPage();
})();
