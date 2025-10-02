<script>
  import { onMount, createEventDispatcher } from 'svelte'
  
  // Modern JavaScript features
  export let title = 'Modern Svelte Component'
  export let items = []
  
  let selectedColor = '#007acc'
  let progress = 50
  let modal
  let isVisible = false
  
  const dispatch = createEventDispatcher()
  
  // Modern JavaScript APIs
  let observer
  let resizeObserver
  
  // Modern async/await with fetch
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'data' })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      items = data?.results ?? []
    } catch (error) {
      console.error('Fetch failed:', error)
    }
  }
  
  // Modern JavaScript syntax with optional chaining
  $: safeTitle = items?.[0]?.title ?? 'Default Title'
  $: cardStyles = `--primary-color: ${selectedColor}; --progress: ${progress}%`
  
  onMount(() => {
    // Modern Web APIs
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'))
    }
    
    // Intersection Observer
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting
        if (isVisible) {
          dispatch('visible', { element: entry.target })
        }
      })
    }, { threshold: 0.1 })
    
    // Resize Observer
    resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        console.log('Element resized:', entry.contentRect)
      })
    })
    
    // Observe elements
    if (modal) {
      observer.observe(modal)
      resizeObserver.observe(modal)
    }
    
    // Modern Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Component mounted!')
    }
    
    return () => {
      observer?.disconnect()
      resizeObserver?.disconnect()
    }
  })
  
  // Modern event handlers
  const handleColorChange = (event) => {
    selectedColor = event.target.value
    // Use modern CSS custom properties
    document.documentElement.style.setProperty('--theme-color', selectedColor)
  }
  
  const showModal = () => {
    modal?.showModal?.()
  }
</script>

<!-- Modern HTML Elements and Attributes -->
<main class="app" style={cardStyles}>
  <dialog bind:this={modal} class="modal">
    <form method="dialog">
      <header>
        <h3>Settings</h3>
        <button type="button" on:click={() => modal.close()}>×</button>
      </header>
      
      <div class="form-content">
        <label>
          Color:
          <input 
            type="color" 
            bind:value={selectedColor}
            on:change={handleColorChange}
          />
        </label>
        
        <label>
          Progress:
          <input 
            type="range" 
            min="0" 
            max="100" 
            bind:value={progress}
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
        <button type="button" on:click={() => modal.close()}>Cancel</button>
      </footer>
    </form>
  </dialog>

  <section class="container">
    <article class="card" class:visible={isVisible}>
      <header>
        <h2>{title}</h2>
        <button on:click={showModal}>Settings</button>
      </header>
      
      <details>
        <summary>Component Details</summary>
        <p>This component demonstrates modern web features</p>
      </details>
      
      <div class="content">
        <picture>
          <source 
            media="(min-width: 800px)" 
            srcset="large.avif" 
            type="image/avif"
          />
          <source 
            media="(min-width: 800px)" 
            srcset="large.webp" 
            type="image/webp"
          />
          <source 
            media="(min-width: 400px)" 
            srcset="medium.webp" 
            type="image/webp"
          />
          <img 
            src="fallback.jpg" 
            alt="Responsive image" 
            loading="lazy"
            decoding="async"
          />
        </picture>
        
        {#each items as item, index}
          <div class="item" data-index={index}>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
          </div>
        {/each}
      </div>
      
      <progress value={progress} max="100">{progress}%</progress>
    </article>
  </section>
</main>

<style>
  /* Modern CSS Features */
  .app {
    container-type: inline-size;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: clamp(1rem, 4vw, 2rem);
    padding: max(1rem, 2vw);
  }

  /* Container Queries */
  @container (min-width: 400px) {
    .card {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 1rem;
    }
  }

  /* Modern Selectors */
  .card:has(.content) {
    border: 2px solid var(--primary-color, #007acc);
    border-radius: 8px;
  }

  .card:is(.active, .focused, .visible) {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  /* CSS Grid with Subgrid */
  .container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .card {
    display: subgrid;
    grid-column: span 2;
  }

  /* Modern Functions */
  .content {
    width: clamp(200px, 50%, 600px);
    height: min(300px, 50vh);
    padding: max(1rem, 2vw);
  }

  /* Logical Properties */
  .card {
    margin-inline: auto;
    padding-block: 1rem;
    border-inline-width: 2px;
  }

  /* Modern Color Functions */
  .modal {
    background: oklch(0.95 0.02 180);
    border: 1px solid hwb(220 80% 10%);
    backdrop-filter: blur(10px);
  }

  /* CSS Nesting */
  .card {
    background: white;
    transition: transform 0.2s ease;
    
    & header {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      & h2 {
        margin: 0;
        color: var(--primary-color, #007acc);
      }
    }
    
    & .content {
      padding: 1rem;
      
      & .item {
        margin-block-end: 1rem;
        padding: 0.5rem;
        border-radius: 4px;
        background: color-mix(in srgb, var(--primary-color) 10%, white);
      }
    }
  }

  /* Modern Pseudo-classes */
  input:user-invalid {
    border-color: red;
    outline-color: red;
  }

  button:focus-visible {
    outline: 2px solid var(--primary-color, blue);
    outline-offset: 2px;
  }

  /* Modern At-rules */
  @supports (backdrop-filter: blur(10px)) {
    .modal {
      backdrop-filter: blur(10px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none;
    }
  }

  @media (prefers-color-scheme: dark) {
    .card {
      background: #1a1a1a;
      color: white;
    }
  }

  /* Modern Properties */
  progress {
    accent-color: var(--primary-color, #007acc);
    width: 100%;
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>