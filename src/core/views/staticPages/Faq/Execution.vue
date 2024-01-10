<template>
  <div>
    <h2>Durchführung der Wahl</h2>
    <p>Bitte schauen Sie sich die genauen Prozesse auf der <a href="/anleitung">Anleitungs-Seite</a> an.</p>
  </div>
</template>
<script>
export default {
  mounted() {
    this.$emit('loaded', this.htmlContent);
  },
};
</script>
