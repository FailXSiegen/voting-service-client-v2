<template>
  <div class="faq container min-vh-100">
    <h1>Häufige Fragen</h1>
    <ul>
      <li>Wo werden meine Daten gespeichert?</li>
      <li>DSGVO?</li>
      <li>Rechtssicherheit?</li>
      <li>Anfechtbarkeit?</li>
      <li>Support?</li>
      <li>Kosten?</li>
    </ul>
    <span class="alert alert-info text-center h4 w-100 mt-3 d-inline-block">
      Diese Seite befindet sich noch im Aufbau
    </span>
    <app-footer />
  </div>
</template>
<script>
import AppFooter from '@/frame/components/Footer'

export default {
  components: {
    AppFooter
  },
  created () {
    document.title = 'Häufige Fragen - digitalwahl.org'
  }
}
</script>
