<template>
  <div class="accordion-content">
    <div class="accordion" :id="accordionId">
      <div 
        v-for="(item, index) in accordionItems" 
        :key="index"
        class="accordion-item"
      >
        <h2 class="accordion-header" :id="getHeadingId(index)">
          <button 
            class="accordion-button" 
            :class="{ collapsed: !isItemOpen(index) }" 
            type="button" 
            data-bs-toggle="collapse" 
            :data-bs-target="`#${getCollapseId(index)}`" 
            :aria-expanded="isItemOpen(index)" 
            :aria-controls="getCollapseId(index)"
          >
            {{ item.title }}
          </button>
        </h2>
        <div 
          :id="getCollapseId(index)" 
          class="accordion-collapse collapse" 
          :class="{ show: isItemOpen(index) }" 
          :aria-labelledby="getHeadingId(index)" 
          :data-bs-parent="`#${accordionId}`"
        >
          <div class="accordion-body" v-html="item.content"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AccordionContent',
  
  props: {
    /**
     * Array of accordion items with title and content
     */
    accordionItems: {
      type: Array,
      required: true,
      validator: items => items.every(item => item.title && item.content)
    },
    
    /**
     * Optional - index of the item to be initially opened (0-based)
     * Default is 0 (first item)
     */
    defaultOpenIndex: {
      type: Number,
      default: 0
    },
    
    /**
     * Optional - unique identifier for this accordion
     * Default is a random string
     */
    id: {
      type: String,
      default: () => `accordion-${Math.random().toString(36).substring(2, 10)}`
    }
  },
  
  data() {
    return {
      openIndex: this.defaultOpenIndex
    };
  },
  
  computed: {
    /**
     * Unique accordion ID to avoid conflicts with multiple accordions on the same page
     */
    accordionId() {
      return this.id;
    }
  },
  
  methods: {
    /**
     * Generate a unique ID for the accordion heading
     */
    getHeadingId(index) {
      return `heading-${this.accordionId}-${index}`;
    },
    
    /**
     * Generate a unique ID for the accordion collapse element
     */
    getCollapseId(index) {
      return `collapse-${this.accordionId}-${index}`;
    },
    
    /**
     * Check if a specific accordion item is open
     */
    isItemOpen(index) {
      return index === this.openIndex;
    }
  },
  
  /**
   * After the component is mounted, initialize the Bootstrap accordion
   */
  mounted() {
    // Set up event listener to track which item is open
    const accordionElement = document.getElementById(this.accordionId);
    if (accordionElement) {
      accordionElement.addEventListener('shown.bs.collapse', (event) => {
        // Extract the index from the collapse ID
        const idParts = event.target.id.split('-');
        const shownIndex = parseInt(idParts[idParts.length - 1], 10);
        this.openIndex = shownIndex;
      });
    }
  },
  
  /**
   * Remove event listeners when component is destroyed
   */
  beforeUnmount() {
    const accordionElement = document.getElementById(this.accordionId);
    if (accordionElement) {
      accordionElement.removeEventListener('shown.bs.collapse');
    }
  }
};
</script>

<style scoped>
.accordion-content {
  margin-bottom: 2rem;
}

.accordion-item {
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
}

.accordion-button {
  border-radius: 0.25rem;
  font-weight: 500;
}

.accordion-button:not(.collapsed) {
  background-color: rgba(var(--bs-primary-rgb), 0.1);
  color: var(--bs-primary);
}

.accordion-body {
  padding: 1rem;
}
</style>