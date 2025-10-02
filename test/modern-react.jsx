import React, { useState, useEffect, useRef } from 'react';

// Modern React component with modern web features
const ModernReactComponent = ({ title = 'Modern React Component' }) => {
  const [selectedColor, setSelectedColor] = useState('#007acc');
  const [progress, setProgress] = useState(50);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef(null);
  const containerRef = useRef(null);

  // Modern JavaScript APIs
  useEffect(() => {
    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          console.log('Component is visible');
        }
      });
    }, { threshold: 0.1 });

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        console.log('Element resized:', entry.contentRect);
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
      resizeObserver.observe(containerRef.current);
    }

    // Modern Web APIs
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
    }

    // Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('React component mounted!');
    }

    return () => {
      observer?.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);

  // Modern async/await with fetch
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'react-data' })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data?.results ?? [];
    } catch (error) {
      console.error('Fetch failed:', error);
    }
  };

  // Modern JavaScript syntax with optional chaining
  const handleColorChange = (event) => {
    const newColor = event.target?.value ?? '#007acc';
    setSelectedColor(newColor);
    
    // Use modern CSS custom properties
    document.documentElement?.style?.setProperty('--theme-color', newColor);
  };

  const showModal = () => {
    modalRef.current?.showModal?.();
  };

  const closeModal = () => {
    modalRef.current?.close?.();
  };

  // Modern event handlers with destructuring
  const handleProgressChange = ({ target: { value } }) => {
    setProgress(Number(value));
  };

  return (
    <main 
      ref={containerRef}
      className="app"
      style={{
        '--primary-color': selectedColor,
        '--progress': `${progress}%`
      }}
    >
      {/* Modern HTML dialog element */}
      <dialog ref={modalRef} className="modal">
        <form method="dialog">
          <header>
            <h3>Settings</h3>
            <button type="button" onClick={closeModal}>×</button>
          </header>
          
          <div className="form-content">
            <label>
              Color:
              <input 
                type="color" 
                value={selectedColor}
                onChange={handleColorChange}
              />
            </label>
            
            <label>
              Progress:
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress}
                onChange={handleProgressChange}
              />
              <output>{progress}%</output>
            </label>
            
            <label>
              Date:
              <input type="date" />
            </label>
            
            <label>
              Time:
              <input type="time" />
            </label>
          </div>
          
          <footer>
            <button type="submit">Save</button>
            <button type="button" onClick={closeModal}>Cancel</button>
          </footer>
        </form>
      </dialog>

      <section className="container">
        <article className={`card ${isVisible ? 'visible' : ''}`}>
          <header>
            <h2>{title}</h2>
            <button onClick={showModal}>Settings</button>
          </header>
          
          {/* Modern HTML details element */}
          <details>
            <summary>Component Details</summary>
            <p>This React component demonstrates modern web features</p>
          </details>
          
          <div className="content">
            {/* Modern picture element with WebP support */}
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
                alt="Responsive image" 
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
          
          {/* Modern progress element */}
          <progress value={progress} max="100">{progress}%</progress>
        </article>
      </section>
    </main>
  );
};

export default ModernReactComponent;