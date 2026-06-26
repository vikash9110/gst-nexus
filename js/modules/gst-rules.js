export class GSTRules {
    constructor(app) {
        this.app = app;
        this.data = null;
    }

    async render() {
        try {
            const response = await fetch('data/rules/gst-rules-2017.json');
            this.data = await response.json();
            return this.buildHTML();
        } catch (error) {
            console.error('Failed to load GST Rules:', error);
            return this.getFallbackHTML();
        }
    }

    buildHTML() {
        const rules = this.data.rules || [];
        return `
            <div class="accordion-container">
                ${rules.map((rule, index) => `
                    <div class="accordion-band" id="rule-${rule.id || index}">
                        <div class="band-header" data-target="content-${rule.id || index}">
                            <div>
                                <span class="band-number">Rule ${rule.number || index + 1}</span>
                                <span class="band-title">${rule.heading || 'Rule'}</span>
                            </div>
                            <span class="chevron">▼</span>
                        </div>
                        <div class="band-content" id="content-${rule.id || index}">
                            <div class="section-text">
                                ${this.formatContent(rule.content || 'No content available')}
                                ${this.renderReferences(rule.references || [])}
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
                    <span class="reference-link" 
                          data-ref-type="${ref.type}" 
                          data-ref-id="${ref.id}"
                          onclick="window.app.modal.showReference('${ref.type}', '${ref.id}', '${ref.text}')">
                        ${ref.text} <span class="ref-icon">🔗</span>
                    </span>
                `).join(' ')}
            </div>
        `;
    }

    getSearchData() {
        if (!this.data) return [];
        return this.data.rules.map(r => ({
            title: `Rule ${r.number || ''}. ${r.heading || ''}`,
            content: r.content || '',
            id: r.id
        }));
    }

    getFallbackHTML() {
        return `
            <div class="accordion-container">
                <div class="accordion-band">
                    <div class="band-header">
                        <span class="band-title">Sample Rule 1: Definitions</span>
                        <span class="chevron">▼</span>
                    </div>
                    <div class="band-content open">
                        <div class="section-text">
                            <p>This is a sample rule. Please load the actual data from JSON.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

