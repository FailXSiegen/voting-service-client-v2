<template>
  <div class="register container-fluid">
    <slot name="alerts"></slot>
    <div class="register__row row align-items-center justify-content-center">
      <div class="register__col col-md-5 py-3 text-center">
        <h1 class="register__headline">
          {{ localize('view.register.headline') }}
        </h1>
        <p class="register__subheadline">
          {{ localize('view.register.subheadline') }}
        </p>
        <div class="jumbotron jumbotron-fluid">
          <p class="register__description" v-html="localize('view.register.description')"></p>
        </div>
        <div v-if="submitSuccess" class="alert alert-success">
          <h2>Erfolgreich registriert</h2>
          <p>Bitte bestätigen Sie Ihre E-Mail Adresse. Nach Ihrer Bestätigung wird der Account von einem Administrator geprüft und freigeschaltet. Sie erhalten eine Bestätigung nach Freischaltung!</p>
        </div>
        <form v-else id="register-form" class="register__form border p-3 text-left" @submit.prevent="onRegisterOrganizer(submitData)">
          <div class="register__form-group form-group">
            <label class="register__label" for="username">
              {{ localize('view.register.label.username') }}
            </label>
            <input v-model="submitData.username"
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
            <div class="input-group">
              <div class="input-group-prepend">
                <div class="input-group-text">@</div>
              </div>
              <input v-model="submitData.email"
                   type="email"
                   name="email"
                   id="email"
                   class="register__form-control form-control"
                   required="required">
            </div>
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
            <label class="register__label" for="public-organisation">
              {{ localize('view.register.label.publicOrganisation') }}
            </label>
            <input v-model="submitData.publicOrganisation"
                   class="register__form-control form-control"
                   aria-describedby="public-organisation-hint"
                   id="public-organisation"
                   type="text"
                   name="public-organisation"
                   required="required"/>
              <small id="public-organisation-hint" class="form-text text-muted">{{ localize('view.register.label.publicOrganisationHint') }}</small>
          </div>
          <hr class="my-3 d-inline-block w-100" />
          <div class="register__form-group form-group ml-4">
              <input class="register__form-control form-check-input"
                   id="data-protection"
                   type="checkbox"
                   name="data-protection"
                   required="required"/>
            <label class="register__label form-check-label" for="data-protection" v-html="localize('view.register.label.dataProtection')"></label>
          </div>
          <div class="register__form-group form-group ml-4">
              <input class="register__form-control form-check-input"
                   id="beta"
                   type="checkbox"
                   name="beta"
                   required="required"/>
            <label class="register__label form-check-label" for="beta" v-html="localize('view.register.label.beta')"></label>
          </div>
          <hr class="my-3 d-inline-block w-100" />
          <div class="register__form-group form-group">
            <button class="register__button btn btn-primary btn-block float-right mt-3">
              {{ localize('view.register.submit') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <app-footer />
  </div>
</template>

<script>
export { default } from '@/frame/views/register.vue.js'
</script>
