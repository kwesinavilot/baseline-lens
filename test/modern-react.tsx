import React, { useState, useEffect, useRef, FC, ChangeEvent } from 'react';

// TypeScript interfaces for modern web features
interface ComponentProps {
  title?: string;
  onVisibilityChange?: (isVisible: boolean) => void;
}

interface FetchResponse {
  results?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  status: 'success' | 'error';
}

interface ObserverEntry {
  target: Element;
  isIntersecting: boolean;
  contentRect: DOMRectReadOnly;
}

// Modern React TypeScript component with modern web features
const ModernReactTSComponent: FC<ComponentProps> = ({ 
  title = 'Modern React TypeScript Component',
  onVisibilityChange 
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('#007acc');
  const [progress, setProgress] = useState<number>(50);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [items, setItems] = useState<FetchResponse['results']>([]);
  
  const modalRef = useRef<HTMLDialogElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  // Modern JavaScript APIs with TypeScript
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // Intersection Observer with proper typing
    observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        onVisibilityChange?.(visible);
        
        if (visible) {
          console.log('TypeScript component is visible');
        }
      });
    }, { 
      threshold: 0.1,
      rootMargin: '10px'
    });

    // Resize Observer with proper typing
    resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      entries.forEach((entry: ResizeObserverEntry) => {
        console.log('Element resized:', entry.contentRect);
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
      resizeObserver.observe(containerRef.current);
    }

    // Modern Web APIs with error handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration: ServiceWorkerRegistration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error: Error) => {
          console.log('SW registration failed:', error.message);
        });
    }

    // Notification API with permission check
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('TypeScript React component mounted!');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission: NotificationPermission) => {
          if (permission === 'granted') {
            new Notification('Permission granted!');
          }
        });
      }
    }

    return () => {
      observer?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [onVisibilityChange]);

  // Modern async/await with proper TypeScript typing
  const fetchData = async (): Promise<FetchResponse['results']> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/typescript-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          query: 'typescript-react-data',
          timestamp: Date.now()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FetchResponse = await response.json();
      setItems(data.results ?? []);
      return data.results ?? [];
    } catch (error) {
      if (error instanceof Error) {
        console.error('Fetch failed:', error.message);
      }
      return [];
    }
  };

  // Modern JavaScript syntax with proper TypeScript typing
  const handleColorChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newColor = event.target?.value ?? '#007acc';
    setSelectedColor(newColor);
    
    // Use modern CSS custom properties with null safety
    document.documentElement?.style?.setProperty('--theme-color', newColor);
  };

  const showModal = (): void => {
    modalRef.current?.showModal?.();
  };

  const closeModal = (): void => {
    modalRef.current?.close?.();
  };

  // Modern event handlers with destructuring and TypeScript
  const handleProgressChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>): void => {
    setProgress(Number(value));
  };

  // Modern array methods with TypeScript
  const filteredItems = items?.filter(item => item.title.length > 0) ?? [];
  const hasItems = filteredItems.length > 0;

  return (
    <main 
      ref={containerRef}
      className="app"
      style={{
        '--primary-color': selectedColor,
        '--progress': `${progress}%`
      } as React.CSSProperties}
    >
      {/* Modern HTML dialog element */}
      <dialog ref={modalRef} className="modal">
        <form method="dialog">
          <header>
            <h3>TypeScript Settings</h3>
            <button type="button" onClick={closeModal} aria-label="Close">×</button>
          </header>
          
          <div className="form-content">
            <label>
              Color:
              <input 
                type="color" 
                value={selectedColor}
                onChange={handleColorChange}
                aria-describedby="color-help"
              />
              <small id="color-help">Choose your theme color</small>
            </label>
            
            <label>
              Progress:
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress}
                onChange={handleProgressChange}
                aria-describedby="progress-help"
              />
              <output htmlFor="progress">{progress}%</output>
              <small id="progress-help">Adjust the progress value</small>
            </label>
            
            <label>
              Date:
              <input type="date" aria-label="Select date" />
            </label>
            
            <label>
              Time:
              <input type="time" aria-label="Select time" />
            </label>

            <label>
              Email:
              <input type="email" placeholder="user@example.com" />
            </label>

            <label>
              URL:
              <input type="url" placeholder="https://example.com" />
            </label>
          </div>
          
          <footer>
            <button type="submit">Save Settings</button>
            <button type="button" onClick={closeModal}>Cancel</button>
            <button type="button" onClick={fetchData}>Load Data</button>
          </footer>
        </form>
      </dialog>

      <section className="container">
        <article className={`card ${isVisible ? 'visible' : ''}`}>
          <header>
            <h2>{title}</h2>
            <button onClick={showModal}>Open Settings</button>
          </header>
          
          {/* Modern HTML details element */}
          <details>
            <summary>TypeScript Component Details</summary>
            <p>This React TypeScript component demonstrates modern web features with type safety</p>
            <ul>
              <li>IntersectionObserver API</li>
              <li>ResizeObserver API</li>
              <li>Service Worker registration</li>
              <li>Notification API</li>
              <li>Modern fetch with AbortController</li>
            </ul>
          </details>
          
          <div className="content">
            {/* Modern picture element with WebP and AVIF support */}
            <picture>
              <source 
                media="(min-width: 800px)" 
                srcSet="large.avif" 
                type="image/avif"
              />
              <source 
                media="(min-width: 800px)" 
                srcSet="large.webp" 
                type="image/webp"
              />
              <source 
                media="(min-width: 400px)" 
                srcSet="medium.webp" 
                type="image/webp"
              />
              <img 
                src="fallback.jpg" 
                alt="Responsive TypeScript component image" 
                loading="lazy"
                decoding="async"
                width="400"
                height="300"
              />
            </picture>

            {/* Conditional rendering with modern syntax */}
            {hasItems && (
              <div className="items-list">
                <h4>Loaded Items ({filteredItems.length})</h4>
                {filteredItems.map((item, index) => (
                  <div key={item.id} className="item" data-index={index}>
                    <h5>{item.title}</h5>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Modern progress element with accessibility */}
          <progress 
            value={progress} 
            max="100"
            aria-label={`Progress: ${progress} percent`}
          >
            {progress}%
          </progress>
        </article>
      </section>
    </main>
  );
};

export default ModernReactTSComponent;