<template>
 <div class="polls-listing-container" v-if="pollsWithNoResults">
   <h2>{{ localize('view.polls.headlines.listingTitle') }}</h2>
   <ul class="created-polls list-group">
     <li v-for="(poll, index) in pollsWithNoResults" :key="index" class="list-group-item">
       <h5 class="mb-1">{{ poll.title }}</h5>
       <button class="btn btn-primary my-2 mr-2" @click="startPoll">
         <i class="bi-play bi--2xl align-middle"></i>
         <span class="align-middle">
           {{ localize('view.polls.listing.start') }}
         </span>
       </button>
       <button class="btn btn-danger my-2 mr-2" @click="deletePoll">
         {{ localize('view.polls.listing.delete') }}
       </button>
     </li>
   </ul>
 </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {

  props: {
    pollsWithNoResults: {
      type: Array
    }
  },
  methods: {
    // @todo ADD LOCALIZATIONS - ERROR DUE TO LOST 'THIS' RELATION IN METHODS
    startPoll () {
      return confirm('ADD CONFIRM MESSAGE')
    },
    deletePoll () {
      return confirm('ADD ANOTHER CONFIRM MESSAGE')
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
