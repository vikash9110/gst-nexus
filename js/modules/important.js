export class ImportantModule {
    constructor(app) {
        this.app = app;
        this.data = null;
    }

    async render() {
        try {
            const response = await fetch('data/important-sections.json');
            this.data = await response.json();
            return this.buildHTML();
        } catch (error) {
            console.error('Failed to load important sections:', error);
            return this.getFallbackHTML();
        }
    }

    buildHTML() {
        const items = this.data.items || [];
        return `
            <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-primary); border-radius: var(--radius-sm);">
                <p style="font-size: 14px; color: var(--text-secondary);">
                    ⭐ Most frequently used sections and rules for quick reference
                </p>
            </div>
            <div class="accordion-container">
                ${items.map((item, index) => `
                    <div class="accordion-band" id="important-${item.id || index}" style="border-left: 4px solid #f9a825;">
                        <div class="band-header" data-target="content-${item.id || index}">
                            <div>
                                <span class="band-number">${item.type === 'section' ? '§' : '📋'} ${item.number || index + 1}</span>
                                <span class="band-title">${item.heading || 'Item'}</span>
                                <span style="font-size: 12px; background: #f9a825; color: white; padding: 2px 8px; border-radius: 12px; margin-left: 8px;">
                                    ${item.type || 'General'}
                                </span>
                            </div>
                            <span class="chevron">▼</span>
                        </div>
                        <div class="band-content" id="content-${item.id || index}">
                            <div class="section-text">
                                ${this.formatContent(item.content || 'No content available')}
                                ${item.notes ? `<div style="margin-top: 12px; padding: 8px 12px; background: #fff3cd; border-radius: var(--radius-sm); border-left: 3px solid #f9a825;">
                                    <strong>💡 Note:</strong> ${item.notes}
                                </div>` : ''}
                                ${this.renderReferences(item.references || [])}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatContent(content) {
        if (typeof content === 'string') {
            return content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
        }
        return content;
    }

    renderReferences(references) {
        if (!references || references.length === 0) return '';
        return `
            <div style="margin-top: 12px; padding: 12px; background: var(--bg-primary); border-radius: var(--radius-sm);">
                <strong style="font-size: 13px; color: var(--text-muted);">References:</strong>
                ${references.map(ref => `
                    <span class="reference-link" data-ref-type="${ref.type}" data-ref-id="${ref.id}" 
                          onclick="window.app.modal.show('${ref.text}', '<div class=\\'ref-content\\'>Loading reference...</div>')">
                        ${ref.text} <span class="ref-icon">🔗</span>
                    </span>
                `).join(' ')}
            </div>
        `;
    }

    getSearchData() {
        if (!this.data) return [];
        return this.data.items.map(item => ({
            title: `${item.number || ''}. ${item.heading || ''}`,
            content: item.content || '',
            id: item.id
        }));
    }

    getFallbackHTML() {
        return `
            <div class="accordion-container">
                <div class="accordion-band" style="border-left: 4px solid #f9a825;">
                    <div class="band-header">
                        <span class="band-title">Section 2: Definitions (Important)</span>
                        <span class="chevron">▼</span>
                    </div>
                    <div class="band-content open">
                        <div class="section-text">
                            <p>Key definitions frequently used in GST compliance.</p>
                        </div>
                    </div>
                </div>
                <div class="accordion-band" style="border-left: 4px solid #f9a825;">
                    <div class="band-header">
                        <span class="band-title">Rule 2(a): Business Definition</span>
                        <span class="chevron">▼</span>
                    </div>
                    <div class="band-content open">
                        <div class="section-text">
                            <p>Important rule for determining what constitutes business activity.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
