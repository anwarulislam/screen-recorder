<template>
  <div>
    <ScreenOnly />
    <!-- <WithAudio /> -->
  </div>

  <div class="mx-auto max-w-3xl" v-if="isEmbed">
    <pre>
    <code>
      {{ `
      <div>
        <div id="screen-recorder"></div>
        <script src="https://cdn.jsdelivr.net/gh/Ace-Tinker/screen-recorder@gh-pages/assets/index.js" defer=""></script>
      </div>
      ` 
      }}
    </code>
  </pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScreenOnly from "./ScreenOnly.vue";

const isEmbed = ref(false);

// if query param has embed=true, then set isEmbed to true

if (window.location.search.includes("embed=true")) {
  // // add script
  // const script = document.createElement("script");
  // script.src =
  //   "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js";
  // script.defer = true;
  // document.body.appendChild(script);

  isEmbed.value = true;
}
</script>

<style>
pre {
  white-space: pre-wrap; /* css-3 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
}
</style>
