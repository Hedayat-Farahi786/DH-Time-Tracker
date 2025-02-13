// ===============================
// State Management
// ===============================
let projects = JSON.parse(localStorage.getItem('projects')) || [];
let activeTimers = JSON.parse(localStorage.getItem('activeTimers')) || [];
let timeHistory = JSON.parse(localStorage.getItem('timeHistory')) || [];

// ===============================
// DOM Elements
// ===============================
const newTimerBtn = document.getElementById('newTimerBtn');
const addProjectBtn = document.getElementById('addProjectBtn');
const newTimerModal = document.getElementById('newTimerModal');
const addProjectModal = document.getElementById('addProjectModal');
const projectsList = document.getElementById('projectsList');
const activeTimersList = document.getElementById('activeTimers');
const historyTableBody = document.getElementById('historyTableBody');
const toast = document.getElementById('toast');

// ===============================
// Utility Functions
// ===============================
function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor(ms / 1000 / 60 / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleModal(modal) {
    modal.classList.toggle('active');
}

function showToast(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function saveActiveTimers() {
    localStorage.setItem('activeTimers', JSON.stringify(activeTimers));
}

// ===============================
// Project Management Functions
// ===============================
function addProject(project) {
    project.id = Date.now();
    projects.push(project);
    localStorage.setItem('projects', JSON.stringify(projects));
    updateProjectsUI();
    updateProjectSelect();
}

function updateProjectsUI() {
    projectsList.innerHTML = projects.map(project => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center">
                <i class="fas fa-briefcase text-gray-400 mr-2"></i>
                <span>${project.name}</span>
            </div>
        </div>
    `).join('');
}

function updateProjectSelect() {
    const select = document.getElementById('projectSelect');
    select.innerHTML = '<option value="">Select a project...</option>' +
        projects.map(project => `
            <option value="${project.id}">${project.name}</option>
        `).join('');
}

// ===============================
// Timer Core Functions
// ===============================
function startTimer(timerData) {
    const timer = {
        id: Date.now(),
        ...timerData,
        startTime: new Date().toISOString(),
        pausedTime: 0,
        totalPausedTime: 0,
        elapsed: 0,
        isRunning: true
    };
    activeTimers.push(timer);
    saveActiveTimers();
    updateTimersUI();
    startTimerInterval(timer.id);
}

function toggleTimer(timerId) {
    const timer = activeTimers.find(t => t.id === timerId);
    if (timer) {
        const buttonElement = document.querySelector(`button[onclick="toggleTimer(${timerId})"]`);
        const iconElement = buttonElement.querySelector('i');

        if (timer.isRunning) {
            timer.isRunning = false;
            timer.pausedTime = new Date().toISOString();
            iconElement.classList.remove('fa-pause');
            iconElement.classList.add('fa-play');
        } else {
            if (timer.pausedTime) {
                timer.totalPausedTime += new Date() - new Date(timer.pausedTime);
                timer.pausedTime = null;
            }
            timer.isRunning = true;
            iconElement.classList.remove('fa-play');
            iconElement.classList.add('fa-pause');
        }
        saveActiveTimers();
    }
}

function stopTimer(timerId) {
    const timer = activeTimers.find(t => t.id === timerId);
    if (timer) {
        const project = projects.find(p => p.id === parseInt(timer.projectId));
        const timeEntry = {
            id: Date.now(),
            projectName: project ? project.name : 'Unknown Project',
            description: timer.description,
            type: timer.type,
            duration: timer.elapsed,
            date: new Date().toISOString(),
        };

        timeHistory.unshift(timeEntry);
        localStorage.setItem('timeHistory', JSON.stringify(timeHistory));
        
        activeTimers = activeTimers.filter(t => t.id !== timerId);
        saveActiveTimers();
        
        updateTimersUI();
        updateHistoryTable();
        showToast('Timer stopped and logged');
    }
}

function startTimerInterval(timerId) {
    setInterval(() => {
        const timer = activeTimers.find(t => t.id === timerId);
        if (timer && timer.isRunning) {
            const currentTime = new Date();
            const startTime = new Date(timer.startTime);
            const elapsedTime = currentTime - startTime - timer.totalPausedTime;
            const display = document.getElementById(`timer-${timerId}`);
            if (display) {
                display.textContent = formatTime(elapsedTime);
                timer.elapsed = elapsedTime;
                saveActiveTimers();
            }
        }
    }, 1000);
}

// ===============================
// UI Update Functions
// ===============================
function updateTimersUI() {
    activeTimers.forEach(timer => {
        const existingCard = document.getElementById(`timer-card-${timer.id}`);
        if (!existingCard) {
            const project = projects.find(p => p.id === parseInt(timer.projectId));
            const timerCard = document.createElement('div');
            timerCard.id = `timer-card-${timer.id}`;
            timerCard.className = 'timer-card bg-white rounded-lg shadow p-6';
            timerCard.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="font-medium">${timer.description}</h3>
                        <span class="text-sm text-gray-500">${timer.type}</span>
                    </div>
                    <span class="text-sm bg-gray-100 px-2 py-1 rounded">
                        ${project ? project.name : 'Unknown Project'}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <div class="text-2xl font-mono" id="timer-${timer.id}">00:00:00</div>
                    <div class="space-x-2">
                        <button onclick="toggleTimer(${timer.id})" class="p-2 rounded-lg hover:bg-gray-100">
                            <i class="fas ${timer.isRunning ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button onclick="stopTimer(${timer.id})" class="p-2 rounded-lg hover:bg-gray-100 text-red-500">
                            <i class="fas fa-stop"></i>
                        </button>
                    </div>
                </div>
            `;
            activeTimersList.appendChild(timerCard);
        }
    });

    const timerCards = activeTimersList.querySelectorAll('.timer-card');
    timerCards.forEach(card => {
        const cardId = parseInt(card.id.replace('timer-card-', ''));
        if (!activeTimers.some(timer => timer.id === cardId)) {
            card.remove();
        }
    });
}

function updateHistoryTable() {
    historyTableBody.innerHTML = timeHistory.map(entry => `
        <tr>
            <td class="font-medium">${entry.projectName}</td>
            <td>${entry.description}</td>
            <td><span class="px-2 py-1 bg-gray-100 rounded text-sm">${entry.type}</span></td>
            <td>${formatTime(entry.duration)}</td>
            <td class="text-gray-500">${new Date(entry.date).toLocaleDateString()}</td>
            <td class="text-right">
                <button onclick="editTimeEntry(${entry.id})" class="p-1 text-blue-600 hover:text-blue-800">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="confirmDeleteEntry(${entry.id})" class="p-1 text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===============================
// Alert and Modal Functions
// ===============================
function showAlert(title, message, type = 'warning') {
    return new Promise((resolve) => {
        const alert = document.getElementById('customAlert');
        const alertTitle = document.getElementById('alertTitle');
        const alertMessage = document.getElementById('alertMessage');
        const alertIcon = document.getElementById('alertIcon');
        const confirmBtn = document.getElementById('alertConfirm');
        const cancelBtn = document.getElementById('alertCancel');

        alertTitle.textContent = title;
        alertMessage.textContent = message;
        alertIcon.className = `alert-icon ${type}`;
        alert.style.display = 'block';

        const handleConfirm = () => {
            alert.style.display = 'none';
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            alert.style.display = 'none';
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    });
}

// ===============================
// Time Entry Management Functions
// ===============================
async function confirmDeleteEntry(entryId) {
    const confirmed = await showAlert(
        'Delete Time Entry',
        'Are you sure you want to delete this time entry? This action cannot be undone.',
        'warning'
    );

    if (confirmed) {
        timeHistory = timeHistory.filter(entry => entry.id !== entryId);
        localStorage.setItem('timeHistory', JSON.stringify(timeHistory));
        updateHistoryTable();
        showToast('Time entry deleted successfully');
    }
}

function editTimeEntry(entryId) {
    const entry = timeHistory.find(e => e.id === entryId);
    if (!entry) return;

    const editModal = document.getElementById('editEntryModal');
    const editForm = document.getElementById('editEntryForm');
    const projectSelect = document.getElementById('editProjectSelect');
    const description = document.getElementById('editDescription');
    const taskType = document.getElementById('editTaskType');
    const entryIdInput = document.getElementById('editEntryId');

    projectSelect.innerHTML = '<option value="">Select a project...</option>' +
        projects.map(project => `
            <option value="${project.id}" ${project.name === entry.projectName ? 'selected' : ''}>
                ${project.name}
            </option>
        `).join('');

    entryIdInput.value = entry.id;
    description.value = entry.description;
    taskType.value = entry.type;

    editModal.classList.add('active');

    editForm.onsubmit = async (e) => {
        e.preventDefault();

        const confirmed = await showAlert(
            'Save Changes',
            'Are you sure you want to save these changes?',
            'success'
        );

        if (confirmed) {
            const selectedProject = projects.find(p => p.id === parseInt(projectSelect.value));
            const updatedEntry = {
                ...entry,
                projectName: selectedProject ? selectedProject.name : 'Unknown Project',
                description: description.value,
                type: taskType.value
            };

            timeHistory = timeHistory.map(e =>
                e.id === entry.id ? updatedEntry : e
            );

            localStorage.setItem('timeHistory', JSON.stringify(timeHistory));
            updateHistoryTable();
            editModal.classList.remove('active');
            showToast('Time entry updated successfully');
        }
    };
}

// ===============================
// Event Listeners
// ===============================
newTimerBtn.addEventListener('click', () => toggleModal(newTimerModal));
addProjectBtn.addEventListener('click', () => toggleModal(addProjectModal));

document.querySelectorAll('.cancel-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        newTimerModal.classList.remove('active');
        addProjectModal.classList.remove('active');
        editEntryModal.classList.remove('active');
    });
});

document.getElementById('addProjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('projectName').value;
    addProject({ name });
    toggleModal(addProjectModal);
    showToast('Project added successfully');
    e.target.reset();
});

document.getElementById('newTimerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const projectId = document.getElementById('projectSelect').value;
    const description = document.getElementById('description').value;
    const type = document.getElementById('taskType').value;
    startTimer({ projectId, description, type });
    toggleModal(newTimerModal);
    showToast('Timer started successfully');
    e.target.reset();
});

// ===============================
// Initialization Functions
// ===============================
function initializeTimers() {
    const storedTimers = JSON.parse(localStorage.getItem('activeTimers')) || [];
    activeTimers = storedTimers.map(timer => ({
        ...timer,
        startTime: timer.startTime,
        pausedTime: timer.pausedTime,
        totalPausedTime: timer.totalPausedTime || 0
    }));
    
    updateTimersUI();
    activeTimers.forEach(timer => {
        startTimerInterval(timer.id);
    });
}

// ===============================
// Initialize Application
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    initializeTimers();
    updateProjectsUI();
    updateProjectSelect();
    updateHistoryTable();
});