<template>
  <div class="setting-flex x-flex x-justify-center x-gap-4">
    <Checkbox :checked="option.mic" label="Microphone" id="mic">
      <span style="margin-left: -4px">
        <img
          class="active image-icon"
          src="https://cdn.jsdelivr.net/gh/Ace-Tinker/screen-recorder@gh-pages/mic.png"
        />
        <img
          class="inactive image-icon"
          src="https://cdn.jsdelivr.net/gh/Ace-Tinker/screen-recorder@gh-pages/mic-n.png"
        />
      </span>
    </Checkbox>
    <Checkbox :checked="option.audio" label="Sound" id="audio">
      <span style="margin-left: -4px">
        <img
          class="active image-icon"
          src="https://cdn.jsdelivr.net/gh/Ace-Tinker/screen-recorder@gh-pages/sound.png"
        />
        <img
          class="inactive image-icon"
          src="https://cdn.jsdelivr.net/gh/Ace-Tinker/screen-recorder@gh-pages/sound-n.png"
        />
      </span>
    </Checkbox>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch } from "vue";
import Checkbox from "./Checkbox.vue";

export type Option = {
  audio: boolean;
  mic: boolean;
};

const option = ref<Option>({
  audio: true,
  mic: true,
});

const emit = defineEmits<{
  (e: "onChange", value: Option): void;
}>();

watch(
  option,
  (newVal) => {
    console.log("newVal", newVal);
    emit("onChange", newVal);
  },
  { deep: true, immediate: true }
);
</script>
