document.addEventListener('DOMContentLoaded', () => {
    function isLoginPage() {
        const path = window.location.pathname;
        return path.endsWith('/index2.html') || path.endsWith('/index2.htm');
    }

    function isBirthdayPortalPage() {
        const path = window.location.pathname;
        return path.endsWith('/homepage.html') || path.endsWith('/homepage.htm');
    }

    // --- LOGIN & REGISTER PAGE LOGIC ---
    if (isLoginPage()) {
        const loginForm = document.getElementById('loginForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginMessage = document.getElementById('loginMessage');
        const registerForm = document.getElementById('registerForm');
        const newUsernameInput = document.getElementById('newUsername');
        const newPasswordInput = document.getElementById('newPassword');
        const registerMessage = document.getElementById('registerMessage');

        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newUsername = newUsernameInput.value.trim();
                const newPassword = newPasswordInput.value.trim();
                registerMessage.style.display = 'none';

                if (!newUsername || !newPassword) {
                    registerMessage.textContent = 'Username and password cannot be empty.';
                    registerMessage.style.display = 'block';
                    return;
                }

                try {
                    const response = await fetch('api/register.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: newUsername, password: newPassword })
                    });
                    const result = await response.json();

                    if (result.success) {
                        window.location.href = 'homepage.html';
                    } else {
                        registerMessage.textContent = result.message;
                        registerMessage.style.display = 'block';
                    }
                } catch (error) {
                    registerMessage.textContent = 'An error occurred. Please try again.';
                    registerMessage.style.display = 'block';
                }
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = usernameInput.value.trim();
                const password = passwordInput.value.trim();
                loginMessage.style.display = 'none';

                try {
                    const response = await fetch('api/login.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: username, password: password })
                    });
                    const result = await response.json();

                    if (result.success) {
                        window.location.href = 'homepage.html';
                    } else {
                        loginMessage.textContent = result.message;
                        loginMessage.style.display = 'block';
                    }
                } catch (error) {
                    loginMessage.textContent = 'An error occurred. Please try again.';
                    loginMessage.style.display = 'block';
                }
            });
        }
    }

    // --- BIRTHDAY PORTAL PAGE LOGIC ---
    if (isBirthdayPortalPage()) {
        const addBirthdayBtn = document.getElementById('addBirthdayBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const birthdayModal = document.getElementById('birthdayModal');
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        const closeButtons = document.querySelectorAll('.close-button');
        const birthdayForm = document.getElementById('birthdayForm');
        const personNameInput = document.getElementById('personName');
        const birthDateInput = document.getElementById('birthDate');
        const profilePictureInput = document.getElementById('profilePicture');
        const notesInput = document.getElementById('notes');
        const birthdayIdInput = document.getElementById('birthdayId');
        const modalTitle = document.getElementById('modalTitle');
        const upcomingBirthdaysGrid = document.getElementById('upcomingBirthdaysGrid');
        const noBirthdaysMessage = document.querySelector('.no-birthdays-message');
        const todayTomorrowSection = document.querySelector('.today-tomorrow-section');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYearHeader = document.getElementById('monthYearHeader');
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        const themeToggleBtn = document.getElementById('themeToggleBtn');

        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        let birthdays = [];
        let birthdayToDeleteId = null;

        // --- THEME TOGGLE ---
        const setTheme = (theme) => {
            if (theme === 'light') {
                document.body.classList.add('light-mode');
                if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.remove('light-mode');
                if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('theme', 'dark');
            }
        };

        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                const currentTheme = localStorage.getItem('theme') || 'dark';
                setTheme(currentTheme === 'dark' ? 'light' : 'dark');
            });
        }
        
        // --- DATA HANDLING ---
        async function loadAndRenderBirthdays() {
            try {
                const response = await fetch('api/birthdays.php', { method: 'GET' });
                const result = await response.json();

                if (result.success) {
                    // Align property names from PHP (snake_case) to JS (camelCase)
                    birthdays = result.data.map(b => ({
                        id: b.id,
                        name: b.name,
                        birthDate: b.birth_date,
                        profilePicture: b.profile_picture,
                        notes: b.notes
                    })); 
                    renderBirthdays();
                    generateCalendar(currentMonth, currentYear);
                } else {
                    if (result.message === "User not logged in") {
                        window.location.href = 'index2.html';
                    }
                }
            } catch (error) {
                console.error('Failed to load birthdays:', error);
            }
        }

        // --- UI & DOM MANIPULATION ---
        function calculateAge(birthDate) {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        }

        function getDaysUntilNextBirthday(birthDateStr) {
            const parts = birthDateStr.split('-');
            const birthMonth = parseInt(parts[1], 10) - 1;
            const birthDay = parseInt(parts[2], 10);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
            nextBirthday.setHours(0, 0, 0, 0);
            if (nextBirthday < today) {
                nextBirthday.setFullYear(today.getFullYear() + 1);
            }
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const diffTime = nextBirthday - today;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            return {
                days: diffDays,
                isToday: nextBirthday.getTime() === today.getTime(),
                isTomorrow: nextBirthday.getTime() === tomorrow.getTime()
            };
        }

        function getInitials(name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }

        function createBirthdayCard(birthday) {
            const { days, isToday, isTomorrow } = getDaysUntilNextBirthday(birthday.birthDate);
            const nextAge = calculateAge(birthday.birthDate) + 1;
            const card = document.createElement('div');
            card.className = 'birthday-card';
            card.dataset.id = birthday.id;
            const profilePicUrl = birthday.profilePicture || '';
            let profilePicHtml = profilePicUrl 
                ? `<img src="${profilePicUrl}" alt="${birthday.name}" class="profile-pic" onerror="this.parentElement.innerHTML = '<div class=\\'profile-pic default-avatar\\'>${getInitials(birthday.name)}</div>'">`
                : `<div class="profile-pic default-avatar">${getInitials(birthday.name)}</div>`;

            let daysLeftText = `${days} day${days !== 1 ? 's' : ''} left`;
            let daysLeftClass = 'days-left';
            if (isToday) { daysLeftText = 'Today!'; daysLeftClass += ' today'; }
            if (isTomorrow) { daysLeftText = 'Tomorrow!'; daysLeftClass += ' tomorrow'; }

            card.innerHTML = `
                <div class="profile-pic-container">${profilePicHtml}</div>
                <h3>${birthday.name}</h3>
                <p>Turns ${nextAge} on ${new Date(birthday.birthDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                <span class="${daysLeftClass}">${daysLeftText}</span>
                <div class="actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>
            `;
            card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(birthday.id));
            card.querySelector('.delete-btn').addEventListener('click', () => openDeleteConfirmModal(birthday.id));
            return card;
        }

        function renderTodayTomorrowSection() {
            if (!todayTomorrowSection) return;
            todayTomorrowSection.innerHTML = '';
            const todayBirthdays = birthdays.filter(b => getDaysUntilNextBirthday(b.birthDate).isToday).map(b => b.name);
            const tomorrowBirthdays = birthdays.filter(b => getDaysUntilNextBirthday(b.birthDate).isTomorrow).map(b => b.name);

            const todayCard = document.createElement('div');
            todayCard.className = 'today-card' + (todayBirthdays.length === 0 ? ' no-birthday' : '');
            todayCard.innerHTML = `<h3>Today's Birthday!</h3><p>${todayBirthdays.length > 0 ? todayBirthdays.join(', ') : 'No birthdays today.'}</p>`;
            
            const tomorrowCard = document.createElement('div');
            tomorrowCard.className = 'tomorrow-card' + (tomorrowBirthdays.length === 0 ? ' no-birthday' : '');
            tomorrowCard.innerHTML = `<h3>Tomorrow's Birthday!</h3><p>${tomorrowBirthdays.length > 0 ? tomorrowBirthdays.join(', ') : 'No birthdays tomorrow.'}</p>`;
            
            todayTomorrowSection.appendChild(todayCard);
            todayTomorrowSection.appendChild(tomorrowCard);
        }

        function renderBirthdays() {
            if (!upcomingBirthdaysGrid) return;
            upcomingBirthdaysGrid.innerHTML = '';
            if (birthdays.length === 0) {
                if (noBirthdaysMessage) noBirthdaysMessage.style.display = 'block';
            } else {
                if (noBirthdaysMessage) noBirthdaysMessage.style.display = 'none';
                const sortedBirthdays = [...birthdays].sort((a, b) => getDaysUntilNextBirthday(a.birthDate).days - getDaysUntilNextBirthday(b.birthDate).days);
                sortedBirthdays.forEach((birthday, index) => {
                    const card = createBirthdayCard(birthday);
                    card.style.animationDelay = `${index * 70}ms`;
                    card.classList.add('pop-in');
                    upcomingBirthdaysGrid.appendChild(card);
                });
            }
            renderTodayTomorrowSection();
        }

        function generateCalendar(month, year) {
            if (!calendarGrid || !monthYearHeader) return;
            calendarGrid.innerHTML = '';
            monthYearHeader.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthBirthdays = birthdays
                .map(b => new Date(b.birthDate).getMonth() === month ? new Date(b.birthDate).getDate() : null)
                .filter(day => day !== null);
            
            for (let i = 0; i < firstDay; i++) { calendarGrid.insertAdjacentHTML('beforeend', '<div></div>'); }
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDiv = document.createElement('div');
                dayDiv.textContent = day;
                if (monthBirthdays.includes(day)) {
                    dayDiv.classList.add('has-birthday');
                }
                calendarGrid.appendChild(dayDiv);
            }
        }

        // --- MODAL HANDLING ---
        function openModal(modal) { if (modal) modal.style.display = 'flex'; }
        function closeModal(modal) {
            if (modal) modal.style.display = 'none';
            if (modal && modal.id === 'birthdayModal') { birthdayForm.reset(); birthdayIdInput.value = ''; }
        }
        function openAddModal() { if (modalTitle) modalTitle.textContent = 'Add New Birthday'; openModal(birthdayModal); }
        function openEditModal(id) {
            const birthday = birthdays.find(b => b.id === id);
            if (birthday && modalTitle) {
                modalTitle.textContent = 'Edit Birthday';
                personNameInput.value = birthday.name;
                birthDateInput.value = birthday.birthDate;
                profilePictureInput.value = birthday.profilePicture || '';
                notesInput.value = birthday.notes || '';
                birthdayIdInput.value = birthday.id;
                openModal(birthdayModal);
            }
        }
        function openDeleteConfirmModal(id) { birthdayToDeleteId = id; openModal(deleteConfirmModal); }

        // --- EVENT LISTENERS ---
        if (sidebarToggle) { sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open')); }
        if (prevMonthBtn) { prevMonthBtn.addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } generateCalendar(currentMonth, currentYear); }); }
        if (nextMonthBtn) { nextMonthBtn.addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } generateCalendar(currentMonth, currentYear); }); }
        if (addBirthdayBtn) { addBirthdayBtn.addEventListener('click', openAddModal); }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await fetch('api/logout.php');
                window.location.href = 'index2.html';
            });
        }
        
        closeButtons.forEach(button => button.addEventListener('click', (e) => closeModal(e.target.closest('.modal'))));
        window.addEventListener('click', (e) => {
            if (e.target === birthdayModal) closeModal(birthdayModal);
            if (e.target === deleteConfirmModal) closeModal(deleteConfirmModal);
        });

        if (birthdayForm) {
            birthdayForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const birthdayData = {
                    id: birthdayIdInput.value || null,
                    name: personNameInput.value.trim(),
                    birthDate: birthDateInput.value,
                    profilePicture: profilePictureInput.value.trim(),
                    notes: notesInput.value.trim()
                };

                if (!birthdayData.name || !birthdayData.birthDate) {
                    alert('Name and Birth Date are required!');
                    return;
                }

                try {
                    const response = await fetch('api/birthdays.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(birthdayData)
                    });
                    const result = await response.json();
                    if (result.success) {
                        loadAndRenderBirthdays();
                        closeModal(birthdayModal);
                    } else { alert('Error saving birthday: ' + result.message); }
                } catch (error) { alert('An error occurred. Please try again.'); }
            });
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async () => {
                if (birthdayToDeleteId) {
                    try {
                        const response = await fetch(`api/birthdays.php?id=${birthdayToDeleteId}`, { method: 'DELETE' });
                        const result = await response.json();
                        if (result.success) {
                            loadAndRenderBirthdays();
                            closeModal(deleteConfirmModal);
                            birthdayToDeleteId = null;
                        } else { alert('Error deleting birthday: ' + result.message); }
                    } catch (error) { alert('An error occurred. Please try again.'); }
                }
            });
        }
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => closeModal(deleteConfirmModal));
        }

        // --- INITIAL PAGE LOAD ---
        loadAndRenderBirthdays();
    }
});