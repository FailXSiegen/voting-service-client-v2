<template>
  <div class="register container-fluid">
    <div class="register__row row align-items-center justify-content-center">
      <div class="register__col col-md-5 py-3 text-center">
        <h1 class="register__headline">
          {{ localize('view.register.headline') }}
        </h1>
        <p class="register__subheadline">
          {{ localize('view.register.subheadline') }}
        </p>
        <form id="register-form" class="register__form border p-3 text-left" @submit.prevent="onRegisterOrganizer(submitData)">
          <div class="register__form-group form-group">
            <label class="register__label" for="username">
              {{ localize('view.register.label.username') }}
            </label>
            <input v-model="submitData.userName"
                   class="register__form-control form-control"
                   id="username"
                   type="text"
                   name="username"
                   required="required"/>
          </div>
          <div class="register__form-group form-group">
            <label class="register__label" for="email">
              {{ localize('view.register.label.email') }}
            </label>
            <input v-model="submitData.email"
                   type="email"
                   name="email"
                   id="email"
                   class="register__form-control form-control"
                   required="required">
          </div>
          <div class="register__form-group form-group">
            <label class="register__label" for="password">
              {{ localize('view.register.label.password') }}
            </label>
            <input v-model="submitData.password"
                   id="password"
                   class="register__form-control form-control"
                   type="password"
                   name="password"
                   required="required"/>
          </div>
          <div class="register__form-group form-group">
            <label class="register__label" for="repeat-password">
              {{ localize('view.register.label.repeatPassword') }}
            </label>
            <input v-model="submitData.repeatPassword"
                   id="repeat-password"
                   class="register__form-control form-control"
                   type="password"
                   name="repeatPassword"
                   required="required"/>
          </div>
          <div class="register__form-group form-group">
            <label class="register__label" for="public-name">
              {{ localize('view.register.label.publicName') }}
            </label>
            <input v-model="submitData.publicName"
                   class="register__form-control form-control"
                   id="public-name"
                   type="text"
                   name="public-name"
                   required="required"/>
          </div>
          <div class="register__form-group form-group">
            <button class="register__button btn btn-primary btn-block float-right mt-3">
              {{ localize('view.register.submit') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export { default } from '@/frame/views/register.vue.js'
</script>
