import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppointmentDialog } from './AppointmentDialog';
import './index.css';

interface WidgetOptions {
  containerId?: string;
  autoOpen?: boolean;
  postalCode?: string;
}

class AppointmentWidget {
  private root: any = null;
  private container: HTMLElement | null = null;
  private options: WidgetOptions;

  constructor(options: WidgetOptions = {}) {
    this.options = {
      containerId: 'appointment-widget-root',
      autoOpen: false,
      ...options
    };
  }

  mount() {
    // Créer le container s'il n'existe pas
    this.container = document.getElementById(this.options.containerId!);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = this.options.containerId!;
      document.body.appendChild(this.container);
    }

    // Monter le composant React
    this.root = createRoot(this.container);
    this.root.render(
      <React.StrictMode>
        <AppointmentDialog 
          open={this.options.autoOpen || false} 
          onOpenChange={(open) => {
            if (!open) this.unmount();
          }} 
        />
      </React.StrictMode>
    );
  }

  unmount() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  open() {
    this.mount();
  }
}

// Exposer globalement
(window as any).AppointmentWidget = AppointmentWidget;

// Auto-init si data-auto-open
if (document.currentScript?.hasAttribute('data-auto-open')) {
  const widget = new AppointmentWidget({ autoOpen: true });
  widget.mount();
}

export default AppointmentWidget;