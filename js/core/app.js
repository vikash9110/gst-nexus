import { State } from './state.js';
import { Router } from './router.js';
import { Modal } from '../plugins/modal.js';
import { Search } from '../plugins/search.js';
import { GSTAct } from '../modules/gst-act.js';
import { GSTRules } from '../modules/gst-rules.js';
import { IGSTAct } from '../modules/igst-act.js';
import { ImportantModule } from '../modules/important.js';
import { FUTModule } from '../modules/fut.js';

export class App {
    constructor() {
        this.state = new State();
        this.router = new Router(this);
        this.modal = new Modal();
        this.search = new Search(this);
        this.modules = [];
        this._accordionHandler = null; // Store handler reference
        this.moduleInstances = {
            'gst-act': new GSTAct(this),
            'gst-rules': new GSTRules(this),
            'igst-act': new IGSTAct(this),
            'important': new ImportantModule(this),
            'fut': new FUTModule(this)
        };
    }

    async init() {
        await this.loadModules();
        this.renderDashboard();
        this.setupEventListeners();
        this.loadPins();
        this.setupTheme();
        this.updateLastUpdated();
        this.setupKeyboardShortcuts();
    }

    async loadModules() {
        try {
            const response = await fetch('config/modules.json');
            const config = await response.json();
            this.modules = Object.values(config.modules);
        } catch (error) {
            console.error('Failed to load modules:', error);
            this.modules = [
                { id: 'gst-act', title: 'GST Act, 2017', icon: '📜', badge: 20, color: '#1a3a5c' },
                { id: 'gst-rules', title: 'GST Rules, 2017', icon: '📋', badge: 15, color: '#2e7d32' },
                { id: 'igst-act', title: 'IGST Act, 2017', icon: '🏛️', badge: 10, color: '#c62828' },
                { id: 'important', title: 'Important Sections & Rules', icon: '⭐', badge: 8, color: '#f9a825' },
                { id: 'fut', title: 'Frequently Used Tools', icon: '🛠️', badge: 5, color: '#ff6b35' }
            ];
        }
    }

    renderDashboard() {
        const grid = document.getElementById('dashboardGrid');
        grid.innerHTML = this.modules.map(module => `
            <div class="module-card" data-module="${module.id}" style="--card-color: ${module.color}">
                <span class="card-icon">${module.icon}</span>
                <h3>${module.title}</h3>
                ${module.badge ? `<span class="badge">${module.badge}</span>` : ''}
                <p class="card-description">${module.description || 'Click to explore'}</p>
                ${module.external ? `
                    <a href="${module.external}" target="_blank" class="external-link">🔗 Open External</a>
                ` : ''}
            </div>
        `).join('');

        grid.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.external-link')) return;
                const moduleId = card.dataset.module;
                const module = this.modules.find(m => m.id === moduleId);
                if (module && module.external) {
                    window.open(module.external, '_blank');
                } else {
                    this.openModule(moduleId);
                }
            });
        });
    }

    async openModule(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;

        this.state.set('currentModule', moduleId);
        this.state.set('currentView', 'module');

        document.getElementById('dashboardGrid').style.display = 'none';
        document.getElementById('moduleView').style.display = 'block';
        document.getElementById('moduleTitle').textContent = module.title;

        const content = document.getElementById('moduleContent');
        content.innerHTML = '<div class="empty-state"><span class="empty-icon">⏳</span><h3>Loading...</h3></div>';

        try {
            const instance = this.moduleInstances[moduleId];
            if (instance) {
                const html = await instance.render();
                content.innerHTML = html;
                
                // ✅ Setup accordion handlers
                this.setupAccordionHandlers();
                
                if (instance.getSearchData) {
                    this.search.indexModule(moduleId, instance.getSearchData());
                }
            } else {
                content.innerHTML = '<div class="empty-state"><span class="empty-icon">🚧</span><h3>Module under construction</h3></div>';
            }
        } catch (error) {
            console.error('Error loading module:', error);
            content.innerHTML = '<div class="empty-state"><span class="empty-icon">❌</span><h3>Failed to load module</h3></div>';
        }
    }

    // ✅ NEW METHOD: Setup accordion click handlers
    setupAccordionHandlers() {
        const headers = document.querySelectorAll('.band-header');
        
        headers.forEach(header => {
            // Remove existing listener if any
            if (this._accordionHandler) {
                header.removeEventListener('click', this._accordionHandler);
            }
            
            // Add new listener
            header.addEventListener('click', this._accordionHandler = (e) => {
                const targetId = header.dataset.target;
                const content = document.getElementById(targetId);
                
                if (!content) return;
                
                // Toggle active state
                header.classList.toggle('active');
                content.classList.toggle('open');
            });
        });
    }

    goBackToDashboard() {
        this.state.set('currentView', 'dashboard');
        this.state.set('currentModule', null);
        document.getElementById('dashboardGrid').style.display = 'grid';
        document.getElementById('moduleView').style.display = 'none';
        document.getElementById('moduleContent').innerHTML = '';
        document.getElementById('moduleSearch').value = '';
        this.search.clearHighlights();
    }

    setupEventListeners() {
        document.getElementById('backToDashboard').addEventListener('click', () => {
            this.goBackToDashboard();
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('pinToggle').addEventListener('click', () => {
            this.togglePinboard();
        });

        document.getElementById('addPinBtn').addEventListener('click', () => {
            this.showAddPinDialog();
        });

        document.getElementById('moduleSearch').addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                const moduleId = this.state.get('currentModule');
                this.search.searchInModule(moduleId, query);
            } else {
                this.search.clearHighlights();
            }
        });

        document.getElementById('globalSearch').addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                this.search.globalSearch(query);
            } else {
                this.search.clearHighlights();
            }
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportCurrentModule();
        });

        document.getElementById('printBtn').addEventListener('click', () => {
            window.print();
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('gst-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('gst-theme', next);
        this.updateThemeIcon(next);
        this.showToast(`Switched to ${next} mode`);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    loadPins() {
        const pins = this.state.getPins();
        const pinsList = document.getElementById('pinsList');
        if (pins.length === 0) {
            pinsList.innerHTML = '<span style="color: var(--text-muted); font-size: 13px;">No pins yet</span>';
            return;
        }
        pinsList.innerHTML = pins.map(pin => `
            <span class="pin-item" data-pin="${pin.id}">
                <span>${pin.icon} ${pin.title}</span>
                <button class="remove-pin" data-pin-id="${pin.id}">✕</button>
            </span>
        `).join('');

        pinsList.querySelectorAll('.pin-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.remove-pin')) return;
                const pinId = item.dataset.pin;
                const module = this.modules.find(m => m.id === pinId);
                if (module) {
                    this.openModule(pinId);
                }
            });
        });

        pinsList.querySelectorAll('.remove-pin').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pinId = btn.dataset.pinId;
                this.removePin(pinId);
            });
        });
    }

    addPin(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;
        this.state.addPin(moduleId, module.title, module.icon);
        this.loadPins();
        this.showToast(`📌 Pinned: ${module.title}`);
    }

    removePin(moduleId) {
        this.state.removePin(moduleId);
        this.loadPins();
        this.showToast(`Removed pin`);
    }

    showAddPinDialog() {
        const currentModule = this.state.get('currentModule');
        if (currentModule) {
            this.addPin(currentModule);
        } else {
            const modules = this.modules.filter(m => !this.state.isPinned(m.id));
            if (modules.length === 0) {
                this.showToast('All modules are already pinned!');
                return;
            }
            const content = modules.map(m => 
                `<button onclick="window.app.addPin('${m.id}')" style="display:block;width:100%;padding:10px;margin:4px 0;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-sm);cursor:pointer;font-family:var(--font-secondary);text-align:left;">
                    ${m.icon} ${m.title}
                </button>`
            ).join('');
            
            this.modal.show('📌 Add Pin', content, 'Select a module to pin');
        }
    }

    togglePinboard() {
        const pins = document.querySelector('.quick-pins');
        pins.style.display = pins.style.display === 'none' ? 'block' : 'none';
        this.showToast(pins.style.display === 'none' ? 'Pinboard hidden' : 'Pinboard shown');
    }

    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('globalSearch').focus();
            }
            if (e.key === 'Escape') {
                if (this.modal.isOpen()) {
                    this.modal.close();
                } else if (this.state.get('currentView') === 'module') {
                    this.goBackToDashboard();
                }
            }
        });
    }

    exportCurrentModule() {
        const moduleId = this.state.get('currentModule');
        if (!moduleId) return;
        
        const content = document.getElementById('moduleContent');
        const html = content.innerHTML;
        const title = document.getElementById('moduleTitle').textContent;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head><title>${title} - Export</title>
            <style>
                body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #1a3a5c; border-bottom: 2px solid #e0e0e8; padding-bottom: 12px; }
                .band-content { padding: 12px 0; }
                .reference-link { color: #1a3a5c; text-decoration: underline; }
                @media print { body { padding: 20px; } }
            </style>
            </head>
            <body>
                <h1>${title}</h1>
                ${html}
                <p style="margin-top: 40px; color: #8a8a9e; font-size: 12px;">Exported from GST Command Center</p>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
        this.showToast('📥 Exporting... Check print preview');
    }

    showToast(message) {
        const container = document.querySelector('.toast-container') || (() => {
            const div = document.createElement('div');
            div.className = 'toast-container';
            document.body.appendChild(div);
            return div;
        })();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

window.app = null;
