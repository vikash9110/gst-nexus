export class Modal {
    constructor() {
        this.container = document.getElementById('modalContainer');
        this.isOpen = false;
        this.setupContainer();
    }

    setupContainer() {
        this.container.innerHTML = `
            <div class="modal-overlay" id="modalOverlay">
                <div class="modal-box">
                    <div class="modal-header">
                        <h3 id="modalTitle">Modal Title</h3>
                        <button class="modal-close-btn" id="modalCloseBtn">✕</button>
                    </div>
                    <div class="modal-body" id="modalBody">
                        Modal content
                    </div>
                    <div class="modal-footer" id="modalFooter">
                        <button class="btn btn-secondary" id="modalCancelBtn">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.close());
        document.getElementById('modalCancelBtn').addEventListener('click', () => this.close());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    show(title, content, footer = null) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        
        if (footer) {
            document.getElementById('modalFooter').innerHTML = footer;
        } else {
            document.getElementById('modalFooter').innerHTML = `
                <button class="btn btn-secondary" id="modalCancelBtn">Close</button>
            `;
            document.getElementById('modalCancelBtn').addEventListener('click', () => this.close());
        }

        document.getElementById('modalOverlay').classList.add('open');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    close() {
        document.getElementById('modalOverlay').classList.remove('open');
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    isOpen() {
        return this.isOpen;
    }

    // ✅ NEW: Show reference in modal
    showReference(refType, refId, refText) {
        // Look up the reference data
        const referenceData = this.findReference(refType, refId);
        
        if (referenceData) {
            this.show(
                `📎 ${refText}`,
                `
                    <div class="ref-content">
                        <div style="margin-bottom: 12px; padding: 8px 12px; background: var(--bg-primary); border-radius: var(--radius-sm);">
                            <strong>Type:</strong> ${refType === 'section' ? '📜 Section' : '📋 Rule'}
                            <span style="margin-left: 16px;"><strong>Reference:</strong> ${refText}</span>
                        </div>
                        <div style="font-size: 14px; line-height: 1.8;">
                            ${this.formatContent(referenceData.content)}
                        </div>
                        ${referenceData.heading ? `<div style="margin-top: 12px; font-size: 13px; color: var(--text-muted);">From: ${referenceData.heading}</div>` : ''}
                    </div>
                `,
                `
                    <button class="btn btn-primary" onclick="window.app.openFullReference('${refType}', '${refId}')">
                        📖 View Full ${refType === 'section' ? 'Section' : 'Rule'}
                    </button>
                    <button class="btn btn-secondary" id="modalCancelBtn">Close</button>
                `
            );
            // Re-bind close button
            document.getElementById('modalCancelBtn').addEventListener('click', () => this.close());
        } else {
            this.show(
                '❌ Reference Not Found',
                `
                    <div style="padding: 20px; text-align: center; color: var(--text-muted);">
                        <span style="font-size: 48px; display: block; margin-bottom: 16px;">🔍</span>
                        <p>Could not find reference: <strong>${refText}</strong></p>
                        <p style="font-size: 13px; margin-top: 8px;">Type: ${refType}, ID: ${refId}</p>
                    </div>
                `
            );
        }
    }

    // ✅ NEW: Find reference in loaded data
    findReference(refType, refId) {
        // Search through all loaded modules
        const modules = window.app ? window.app.modules : [];
        const moduleInstances = window.app ? window.app.moduleInstances : {};
        
        for (const [moduleId, instance] of Object.entries(moduleInstances)) {
            if (instance.data) {
                let items = [];
                if (moduleId === 'gst-act' || moduleId === 'igst-act') {
                    items = instance.data.sections || [];
                } else if (moduleId === 'gst-rules') {
                    items = instance.data.rules || [];
                } else if (moduleId === 'important') {
                    items = instance.data.items || [];
                }
                
                const found = items.find(item => item.id === refId);
                if (found) {
                    return {
                        content: found.content,
                        heading: found.heading || found.title,
                        number: found.number,
                        moduleId: moduleId
                    };
                }
            }
        }
        return null;
    }

    // ✅ NEW: Format content for modal display
    formatContent(content) {
        if (typeof content === 'string') {
            return content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
        }
        return content || 'No content available';
    }

    // ✅ NEW: Open full reference in main view
    openFullReference(refType, refId) {
        this.close();
        // Navigate to the module containing this reference
        if (window.app) {
            // Find which module contains this reference
            const moduleInstances = window.app.moduleInstances;
            for (const [moduleId, instance] of Object.entries(moduleInstances)) {
                if (instance.data) {
                    let items = [];
                    if (moduleId === 'gst-act' || moduleId === 'igst-act') {
                        items = instance.data.sections || [];
                    } else if (moduleId === 'gst-rules') {
                        items = instance.data.rules || [];
                    } else if (moduleId === 'important') {
                        items = instance.data.items || [];
                    }
                    
                    const found = items.find(item => item.id === refId);
                    if (found) {
                        window.app.openModule(moduleId);
                        // Scroll to the specific section after it loads
                        setTimeout(() => {
                            const element = document.getElementById(`${refType}-${refId}`);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                // Highlight the section
                                element.style.borderColor = '#ff6b35';
                                element.style.borderWidth = '2px';
                                setTimeout(() => {
                                    element.style.borderColor = 'var(--border-color)';
                                }, 3000);
                            }
                        }, 500);
                        return;
                    }
                }
            }
        }
    }
}
