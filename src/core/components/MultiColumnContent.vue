<template>
  <div class="multi-column-content">
    <div class="row">
      <div 
        v-for="(column, index) in columns" 
        :key="index"
        :class="getColumnClass()"
        class="mb-3 mb-md-0"
      >
        <div class="column-content" v-html="column.content"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MultiColumnContent',
  
  props: {
    /**
     * The number of columns to display (2 or 3)
     */
    columnCount: {
      type: Number,
      required: true,
      validator: val => [2, 3].includes(val)
    },
    
    /**
     * The content for each column
     */
    columnsContent: {
      type: Array,
      required: true
    }
  },
  
  computed: {
    /**
     * Returns the column content data, ensuring we have the right number of columns
     */
    columns() {
      // Make a copy of the columns content
      let columns = [...this.columnsContent];
      
      // Ensure we have the correct number of columns
      if (columns.length < this.columnCount) {
        // Add empty columns if needed
        for (let i = columns.length; i < this.columnCount; i++) {
          columns.push({ content: '' });
        }
      } else if (columns.length > this.columnCount) {
        // Truncate if we have too many columns
        columns = columns.slice(0, this.columnCount);
      }
      
      return columns;
    }
  },
  
  methods: {
    /**
     * Calculate the Bootstrap column class based on column count
     */
    getColumnClass() {
      switch (this.columnCount) {
        case 3:
          return 'col-md-4';
        case 2:
        default:
          return 'col-md-6';
      }
    }
  }
};
</script>

<style scoped>
.multi-column-content {
  margin-bottom: 2rem;
}

.column-content {
  height: 100%;
}
</style>