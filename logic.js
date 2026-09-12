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
