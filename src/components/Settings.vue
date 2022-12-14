<template>
  <div class="setting-flex x-flex x-justify-center x-gap-4">
    <Checkbox :checked="option.mic" label="Microphone" id="mic">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="22"></line>
      </svg>
    </Checkbox>
    <Checkbox :checked="option.audio" label="Sound" id="audio">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      </svg>
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
    emit("onChange", newVal);
  },
  { deep: true, immediate: true }
);
</script>
