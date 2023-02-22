<template>
  <CorePageLayout>
    <div class="row align-items-center justify-content-around">
      <div class="login__col col-12">
        <h1 class="login__headline text-center">
          {{ $t('view.login.headline.title') }}
        </h1>
        <h2 class="login__subheadline mb-4 text-center subheader">
          {{ $t('view.login.headline.subtitle') }}
        </h2>
        <div class="login__row row justify-content-around mt-5">
          <div class="login__event mb-5 col-md-5">
            <EventUserLogin />
          </div>
          <div class="login__organizer mb-5 col-md-5">
            <OrganizerLogin />
            <OrganizerRegister />
          </div>
        </div>
      </div>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from '@/core/components/CorePageLayout.vue';
import EventUserLogin from '@/core/components/EventUserLogin.vue';
import OrganizerLogin from '@/core/components/OrganizerLogin.vue';
import OrganizerRegister from '@/core/components/OrganizerRegister.vue';
</script>
