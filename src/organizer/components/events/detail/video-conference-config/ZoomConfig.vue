<template>
  <div v-if="resolvedConfig">
    <div class="form-group">
      <label for="meetingId">Meeting ID*</label>
      <input
        id="meetingId"
        v-model="resolvedConfig.credentials.id"
        @keyup="onChange"
        class="form-control"
      />
    </div>
    <div class="form-group">
      <label for="meetingPassword">Meeting password*</label>
      <input
        id="meetingPassword"
        v-model="resolvedConfig.credentials.password"
        @keyup="onChange"
        class="form-control"
      />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    config: {
      type: String,
      required: true
    }
  },
  created () {
    this.resolvedConfig = JSON.parse(this.config)
  },
  data () {
    return {
      resolvedConfig: null
    }
  },
  methods: {
    onChange () {
      this.resolvedConfig.credentials.id =
        this.resolvedConfig.credentials.id.replace(/\s+/g, '')
      this.$emit('update', {
        config: this.resolvedConfig
      })
    }
  },
  watch: {
    config () {
      this.resolvedConfig = JSON.parse(this.config)
    }
  }
}
</script>
