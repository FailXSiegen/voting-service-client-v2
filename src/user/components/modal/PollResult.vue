<template>
  <div class="container-modal d-print-none">
    <div
      class="modal fade"
      :id="identifier"
      tabindex="-1"
      role="dialog"
      data-keyboard="false"
      data-backdrop="static"
      :aria-labelledby="identifier + 'Title'"
      aria-hidden="true"
    >
      <div
        class="modal-dialog modal-dialog-centered col-12 col-md-6"
        role="document"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Ergebnis</h5>
            <button
              type="button"
              class="close"
              @click="close()"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <app-result-item
            :eventRecord="eventRecord"
            :pollResult="pollResult"
          />
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-danger"
              aria-label="Schließen"
              @click="close()"
            >
              <span aria-hidden="true">Schließen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppResultItem from '@/organizer/components/events/detail/ResultItem'
import $ from 'jquery'
import { localize } from '@/frame/lib/localization-helper'

export default {
  components: {
    AppResultItem
  },
  mounted () {
    if (this.trigger === true) {
      this.onTriggerModal()
    }
  },
  props: {
    eventRecord: {
      type: Object
    },
    pollResult: {
      type: Object,
      required: true
    },
    trigger: {
      type: Boolean,
      required: true
    },
    identifier: {
      type: String,
      required: true
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    onTriggerModal () {
      if ($('#zmmtg-root .root-inner').length > 0) {
        $('#' + this.identifier).removeClass('fade')
      }
      $('#' + this.identifier).modal('show')
    },
    close () {
      $('#' + this.identifier).modal('hide')
      this.$emit('onCloseResultModal')
    }
  }
}
</script>
<style scoped>
.modal-dialog {
  max-width: 1500px;
}
</style>
