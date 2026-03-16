// Homework Tracker App
// Part 1 + Part 2: To-Do, Homework, Calendar, Dashboard with Priorities

// Data Storage
const store = {
    todos: [],
    homework: []
};

// Priority order for sorting
const priorityOrder = { high: 3, medium: 2, low: 1 };

// Load data from localStorage
function loadData() {
    const savedTodos = localStorage.getItem('homeworkTracker_todos');
    const savedHomework = localStorage.getItem('homeworkTracker_homework');
    
    if (savedTodos) {
        store.todos = JSON.parse(savedTodos);
    }
    if (savedHomework) {
        store.homework = JSON.parse(savedHomework);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('homeworkTracker_todos', JSON.stringify(store.todos));
    localStorage.setItem('homeworkTracker_homework', JSON.stringify(store.homework));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== Dashboard Functions ====================

function updateDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalTasks = store.todos.length + store.homework.length;
    const completedTasks = store.todos.filter(t => t.completed).length + 
                          store.homework.filter(h => h.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    // Count overdue
    let overdueCount = 0;
    store.homework.forEach(hw => {
        const dueDate = new Date(hw.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today && !hw.completed) {
            overdueCount++;
        }
    });
    
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('pending-tasks').textContent = pendingTasks;
    document.getElementById('overdue-tasks').textContent = overdueCount;
    
    // Upcoming tasks (next 7 days)
    const upcomingList = document.getElementById('upcoming-list');
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcoming = [...store.homework]
        .filter(hw => {
            const due = new Date(hw.dueDate);
            due.setHours(0, 0, 0, 0);
            return due >= today && due <= nextWeek && !hw.completed;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        upcomingList.innerHTML = '<div class="empty-message">No upcoming tasks! 🎉</div>';
    } else {
        upcomingList.innerHTML = upcoming.map(hw => `
            <li class="task-item priority-${hw.priority}">
                <span class="task-text">${escapeHtml(hw.title)}</span>
                <div class="task-meta">
                    <span class="subject-tag subject-${hw.subject}">${hw.subject}</span>
                    <span class="due-date">${formatDate(hw.dueDate)}</span>
                </div>
            </li>
        `).join('');
    }
    
    // Overdue tasks
    const overdueList = document.getElementById('overdue-list');
    const overdue = store.homework
        .filter(hw => {
            const due = new Date(hw.dueDate);
            due.setHours(0, 0, 0, 0);
            return due < today && !hw.completed;
        })
        .slice(0, 5);
    
    if (overdue.length === 0) {
        overdueList.innerHTML = '<div class="empty-message">No overdue tasks! ✅</div>';
    } else {
        overdueList.innerHTML = overdue.map(hw => `
            <li class="task-item priority-${hw.priority}">
                <span class="task-text">${escapeHtml(hw.title)}</span>
                <div class="task-meta">
                    <span class="subject-tag subject-${hw.subject}">${hw.subject}</span>
                    <span class="due-date overdue">${formatDate(hw.dueDate)}</span>
                </div>
            </li>
        `).join('');
    }
}

// ==================== To-Do List Functions ====================

function addTodo(text, priority = 'medium') {
    if (!text.trim()) return;
    
    const todo = {
        id: generateId(),
        text: text.trim(),
        completed: false,
        priority: priority,
        createdAt: new Date().toISOString()
    };
    
    store.todos.push(todo);
    saveData();
    renderTodos();
    updateDashboard();
}

function toggleTodo(id) {
    const todo = store.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveData();
        renderTodos();
        updateDashboard();
    }
}

function deleteTodo(id) {
    store.todos = store.todos.filter(t => t.id !== id);
    saveData();
    renderTodos();
    updateDashboard();
}

function renderTodos(filterPriority = '', sortByPriority = false) {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    
    let filtered = [...store.todos];
    if (filterPriority) {
        filtered = filtered.filter(t => t.priority === filterPriority);
    }
    
    // Sort
    if (sortByPriority) {
        filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    } else {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-message">No tasks yet. Add one above! 📝</div>';
        return;
    }
    
    filtered.forEach(todo => {
        const li = document.createElement('li');
        li.className = `task-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="task-text">${escapeHtml(todo.text)}</span>
            <div class="task-meta">
                <span class="priority-tag priority-${todo.priority}">${todo.priority}</span>
            </div>
            <button class="delete-btn" data-id="${todo.id}">Delete</button>
        `;
        
        li.querySelector('.task-checkbox').addEventListener('change', () => toggleTodo(todo.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
        
        list.appendChild(li);
    });
}

// ==================== Homework Functions ====================

function addHomework(title, subject, dueDate, priority = 'medium') {
    if (!title.trim() || !subject || !dueDate) {
        alert('Please fill in all fields for homework');
        return;
    }
    
    const homework = {
        id: generateId(),
        title: title.trim(),
        subject: subject,
        dueDate: dueDate,
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    store.homework.push(homework);
    saveData();
    renderHomework();
    updateDashboard();
}

function toggleHomework(id) {
    const homework = store.homework.find(h => h.id === id);
    if (homework) {
        homework.completed = !homework.completed;
        saveData();
        renderHomework();
        updateDashboard();
    }
}

function deleteHomework(id) {
    store.homework = store.homework.filter(h => h.id !== id);
    saveData();
    renderHomework();
    updateDashboard();
}

function renderHomework(filterSubject = '', filterPriority = '') {
    const list = document.getElementById('homework-list');
    list.innerHTML = '';
    
    let filtered = [...store.homework];
    if (filterSubject) {
        filtered = filtered.filter(h => h.subject === filterSubject);
    }
    if (filterPriority) {
        filtered = filtered.filter(h => h.priority === filterPriority);
    }
    
    // Sort by due date, then priority
    filtered.sort((a, b) => {
        const dateDiff = new Date(a.dueDate) - new Date(b.dueDate);
        if (dateDiff !== 0) return dateDiff;
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-message">No homework assignments. Add one above! 📚</div>';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered.forEach(hw => {
        const dueDate = new Date(hw.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today && !hw.completed;
        
        const li = document.createElement('li');
        li.className = `task-item priority-${hw.priority} ${hw.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${hw.completed ? 'checked' : ''}>
            <span class="task-text">${escapeHtml(hw.title)}</span>
            <div class="task-meta">
                <span class="subject-tag subject-${hw.subject}">${hw.subject}</span>
                <span class="priority-tag priority-${hw.priority}">${hw.priority}</span>
                <span class="due-date ${isOverdue ? 'overdue' : ''}">${formatDate(hw.dueDate)}</span>
            </div>
            <button class="delete-btn" data-id="${hw.id}">Delete</button>
        `;
        
        li.querySelector('.task-checkbox').addEventListener('change', () => toggleHomework(hw.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteHomework(hw.id));
        
        list.appendChild(li);
    });
}

// ==================== Calendar Functions ====================

let currentDate = new Date();

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('current-month');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    grid.innerHTML = '';
    
    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-day header';
        div.textContent = day;
        grid.appendChild(div);
    });
    
    // First day of month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        grid.appendChild(div);
    }
    
    // Days of month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        
        const tasksForDay = getTasksForDate(date);
        
        const div = document.createElement('div');
        div.className = 'calendar-day';
        
        if (date.getTime() === today.getTime()) {
            div.classList.add('today');
        }
        
        if (tasksForDay.length > 0) {
            div.classList.add('has-tasks');
        }
        
        div.innerHTML = `
            <div class="day-number">${day}</div>
            ${tasksForDay.length > 0 ? `<div class="task-count">${tasksForDay.length} task${tasksForDay.length > 1 ? 's' : ''}</div>` : ''}
        `;
        
        grid.appendChild(div);
    }
}

function getTasksForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const tasks = [];
    
    store.todos.forEach(todo => {
        const created = new Date(todo.createdAt).toISOString().split('T')[0];
        if (created === dateStr) {
            tasks.push({ type: 'todo', title: todo.text });
        }
    });
    
    store.homework.forEach(hw => {
        if (hw.dueDate === dateStr) {
            tasks.push({ type: 'homework', title: hw.title, subject: hw.subject });
        }
    });
    
    return tasks;
}

// ==================== Utility Functions ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ==================== Tab Navigation ====================

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tab}-section`).classList.add('active');
            
            if (tab === 'calendar') {
                renderCalendar();
            } else if (tab === 'dashboard') {
                updateDashboard();
            }
        });
    });
}

// ==================== Event Listeners ====================

function setupEventListeners() {
    // Todo input
    document.getElementById('add-todo-btn').addEventListener('click', () => {
        const input = document.getElementById('todo-input');
        const priority = document.getElementById('priority-select').value;
        addTodo(input.value, priority);
        input.value = '';
    });
    
    document.getElementById('todo-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const input = e.target;
            const priority = document.getElementById('priority-select').value;
            addTodo(input.value, priority);
            input.value = '';
        }
    });
    
    // Todo filters
    document.getElementById('priority-filter').addEventListener('change', (e) => {
        const sortByPriority = document.getElementById('sort-by-priority').checked;
        renderTodos(e.target.value, sortByPriority);
    });
    
    document.getElementById('sort-by-priority').addEventListener('change', (e) => {
        const filterPriority = document.getElementById('priority-filter').value;
        renderTodos(filterPriority, e.target.checked);
    });
    
    // Homework input
    document.getElementById('add-homework-btn').addEventListener('click', () => {
        const title = document.getElementById('homework-title').value;
        const subject = document.getElementById('subject-select').value;
        const dueDate = document.getElementById('homework-due').value;
        const priority = document.getElementById('homework-priority').value;
        
        addHomework(title, subject, dueDate, priority);
        
        document.getElementById('homework-title').value = '';
        document.getElementById('subject-select').value = '';
        document.getElementById('homework-due').value = '';
    });
    
    // Homework filters
    document.getElementById('subject-filter').addEventListener('change', (e) => {
        const priorityFilter = document.getElementById('homework-priority-filter').value;
        renderHomework(e.target.value, priorityFilter);
    });
    
    document.getElementById('homework-priority-filter').addEventListener('change', (e) => {
        const subjectFilter = document.getElementById('subject-filter').value;
        renderHomework(subjectFilter, e.target.value);
    });
    
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}

// ==================== Initialize App ====================

function init() {
    loadData();
    setupTabs();
    setupEventListeners();
    updateDashboard();
    renderTodos();
    renderHomework();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
