<template>
  <div class="imprint container min-vh-100">
    <h1>Impressum</h1>
    <p>Felix Herrmann<br />Hambergstraße 27<br />57074 Siegen</p>
    <p><a href="mailto:info@digitalwahl.org">info@digitalwahl.org</a></p>
    <p><strong>Steuernummer</strong></p>
    <p>342/5119/3204</p>
    <h2>Datenschutz</h2>
    <p>
      Eine ausführliche Datenschutzerklärung findest du
      <a href="/datenschutz">hier</a>.
    </p>

    <h2>Nutzungsbedingungen</h2>
    <p>
      Die Bedingungen, unter denen digitalwahl.org genutzt werden kann, findest
      du <a href="/nutzerbedingungen">hier</a>.
    </p>
    <div class="border border-primary p-3">
      <h2 class="mb-3">Unterstüzt und gefördert von:</h2>
      <hr class="d-none d-sm-block" />
      <div class="row align-items-baseline">
        <div class="col-sm col-12">
          <figure class="figure">
            <a
              href="https://www.deutsche-chorjugend.de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="../../../assets/images/logos/dcj.png"
                class="figure-img img-fluid"
                alt="Deutsche Chorjugend"
              />
            </a>
            <figcaption class="figure-caption">Deutsche Chorjugend</figcaption>
          </figure>
        </div>
        <div class="col-sm col-12">
          <figure class="figure">
            <a
              href="https://www.s-chorverband.de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="../../../assets/images/logos/scv.jpg"
                class="figure-img img-fluid"
                alt="Schwäbischer Chorverband"
              />
            </a>
            <figcaption class="figure-caption">
              Schwäbischer Chorverband
            </figcaption>
          </figure>
        </div>
      </div>
      <hr class="d-none d-sm-block" />
      <div class="row align-items-baseline">
        <div class="col-sm col-12">
          <figure class="figure">
            <a
              href="http://www.bcvonline.de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="../../../assets/images/logos/bcv.png"
                class="figure-img img-fluid"
                alt="Badischer Chroverband"
              />
            </a>
            <figcaption class="figure-caption">
              Badischer Chroverband
            </figcaption>
          </figure>
        </div>
        <div class="col-sm col-12">
          <figure class="figure">
            <a
              href="http://www.saengerjugend.de/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="../../../assets/images/logos/sjnrw.png"
                class="figure-img img-fluid"
                alt="Sängerjugend im Chorverband NRW e. V."
              />
            </a>
            <figcaption class="figure-caption">
              Sängerjugend im Chorverband NRW e. V.
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
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
    document.title = 'Impressum - digitalwahl.org'
  }
}
</script>
