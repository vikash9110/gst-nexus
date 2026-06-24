export class Router {
    constructor(app) {
        this.app = app;
        this.routes = {
            '/': 'dashboard',
            '/act/:id': 'gst-act',
            '/rules/:id': 'gst-rules',
            '/tools/:id': 'fut'
        };
        this.init();
    }

    init() {
        window.addEventListener('popstate', () => this.handleRoute());
        // Handle initial route
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const hash = window.location.hash.slice(1);
        
        if (hash) {
            // Handle hash-based routing
            const [module, id] = hash.split('/');
            if (module && this.app.modules.find(m => m.id === module)) {
                this.app.openModule(module);
                if (id) {
                    // Scroll to specific section
                    setTimeout(() => {
                        const el = document.getElementById(id);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 500);
                }
            }
        } else if (path === '/' || path === '') {
            // Dashboard
            if (this.app.state.get('currentView') !== 'dashboard') {
                this.app.goBackToDashboard();
            }
        }
    }

    navigate(moduleId, sectionId = null) {
        let url = `/#${moduleId}`;
        if (sectionId) {
            url += `/${sectionId}`;
        }
        window.location.hash = url;
    }
}
