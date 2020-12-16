<template>
    <div class="validate container-fluid">
        <slot name="alerts"></slot>
        <div class="alert alert-success container text-center mt-3" v-if="submitSuccess">
            <h1>Bestätigt und Administrator wurde informiert</h1>
        </div>
        <div class="alert alert-info container text-center mt-3" v-if="!submitFinished">
            <h1>Validierungsprozess im Gang</h1>
        </div>
        <div class="alert alert-info container text-center mt-3" v-if="!submitSuccess && submitFinished">
            <h1>Validierungsprozess nicht erfolgreich</h1>
            <p v-if="responseText">{{ responseText }}</p>
        </div>
        <app-footer />
    </div>
</template>
<script>
export { default } from '@/frame/views/validateEmail.vue.js'
</script>
