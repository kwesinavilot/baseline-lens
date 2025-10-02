<template>
  <!-- Modern HTML Elements -->
  <main class="app">
    <dialog ref="modal" class="modal">
      <form method="dialog">
        <input type="color" v-model="selectedColor" />
        <input type="date" v-model="selectedDate" />
        <input type="range" min="0" max="100" v-model="progress" />
        <button type="submit">Close</button>
      </form>
    </dialog>

    <!-- Container with modern CSS -->
    <section class="container">
      <article class="card" :style="cardStyles">
        <header>
          <h2>{{ title }}</h2>
          <details>
            <summary>More info</summary>
            <p>Additional content here</p>
          </details>
        </header>
        
        <div class="content">
          <picture>
            <source media="(min-width: 800px)" srcset="large.webp" type="image/webp">
            <source media="(min-width: 400px)" srcset="medium.webp" type="image/webp">
            <img src="fallback.jpg" alt="Responsive image" loading="lazy">
          </picture>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Modern JavaScript features
const selectedColor = ref('#007acc')
const selectedDate = ref('')
const progress = ref(50)
const title = ref('Modern Vue Component')
const modal = ref(null)

// Modern JavaScript APIs
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.log('Element is visible')
    }
  })
})

// Modern async/await with fetch
const fetchData = async () => {
  try {
    const response = await fetch('/api/data')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Fetch failed:', error)
  }
}

// Modern JavaScript syntax
const cardStyles = computed(() => ({
  '--primary-color': selectedColor.value,
  '--progress': `${progress.value}%`
}))

// Optional chaining and nullish coalescing
const safeAccess = computed(() => {
  return data?.user?.profile?.name ?? 'Unknown'
})

onMounted(() => {
  // Modern Web APIs
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
  
  // Resize Observer
  const resizeObserver = new ResizeObserver(entries => {
    console.log('Element resized')
  })
  
  // Intersection Observer
  observer.observe(modal.value)
})
</script>

<style scoped>
/* Modern CSS Features */
.app {
  container-type: inline-size;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: clamp(1rem, 4vw, 2rem);
}

/* Container Queries */
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}

/* Modern Selectors */
.card:has(.content) {
  border: 2px solid var(--primary-color);
}

.card:is(.active, .focused) {
  transform: scale(1.02);
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
  background: oklch(0.9 0.05 180);
  backdrop-filter: blur(10px);
}

/* CSS Nesting */
.card {
  background: white;
  
  & header {
    padding: 1rem;
    
    & h2 {
      margin: 0;
      color: var(--primary-color);
    }
  }
  
  & .content {
    padding: 1rem;
  }
}

/* Modern Pseudo-classes */
input:user-invalid {
  border-color: red;
}

button:focus-visible {
  outline: 2px solid blue;
}
</style>