<template>
  <form @submit.prevent="onSubmit">
    <div class="form-group">
      <label for="title">Titel*</label>
      <input id="title" v-model="meeting.title" required="required" class="form-control">
    </div>
    <div class="form-group">
      <label for="apiKey">API Key*</label>
      <input id="apiKey" v-model="meeting.apiKey" required="required" class="form-control">
    </div>
    <div class="form-group">
      <label for="apiSecret">API Secret*</label>
      <input id="apiSecret" v-model="meeting.apiSecret" required="required" class="form-control">
    </div>
    <button type="submit" class="btn btn-primary">Submit</button>
  </form>
</template>

<script>
export default {
  props: {
    meeting: {
      type: Object,
      required: false,
      default () {
        return {
          title: '',
          apiKey: '',
          apiSecret: ''
        }
      }
    }
  },
  methods: {
    onSubmit () {
      this.$emit('submit', {
        meeting: this.meeting
      })
    }
  }
}
</script>
