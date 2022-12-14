<template>
  <div>
    <input
      type="checkbox"
      :id="id"
      :checked="checked"
      class="x-hidden"
      @input="onChange"
    />
    <label :for="id" class="custom-checkbox-label">
      <div class="custom-checkbox-item">
        <div class="x-tick x-flex x-h-5 x-w-5 x-items-center x-justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="custom-checkbox text-left x-p-4">
          <!-- slot -->
          <div>
            <span class="x-icon">
              <slot></slot>
            </span>
          </div>
          <span>{{ label }}</span>
        </div>
      </div>
    </label>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps<{
  label: string;
  id: string;
  checked?: boolean;
}>();

const isChecked = ref(props.checked);

const emit = defineEmits<{
  (e: "update:checked", checked: boolean): void;
}>();

const onChange = (e: any) => {
  console.log("e.target.value", e.target.checked);
  emit("update:checked", e.target.checked);
};
</script>

<style scoped lang="css">
.custom-checkbox-label {
  background: #e5e7eb;
  cursor: pointer;
  position: relative;
  border-radius: 8px;
  display: block;

  width: 173px;
  height: 138px;
}

.custom-checkbox-item {
  background-color: white;
  position: relative;
}

.custom-checkbox-item,
.custom-checkbox {
  border-radius: 8px;
  position: absolute;
  inset: 4px;
  transition: background-color 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);
}
.custom-checkbox {
  background: white;
  color: #1a1a1ad9;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: baseline;
}

.x-tick {
  color: white;
  border: 2px solid #e5e7eb;
  border-radius: 4px;
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 10;
  transition: background-color 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);
}

.custom-checkbox-label:hover .x-tick {
  background: #e5e7eb;
}

.custom-checkbox-label:hover .custom-checkbox-item {
  background: #e5e7eb;
}

/* if checked */

.x-icon {
  font-size: 3rem;
}

/* if input checked */
input:checked + .custom-checkbox-label .custom-checkbox {
  background: #e5e7eb;
}
input:checked + .custom-checkbox-label .custom-checkbox-item {
  background: #e5e7eb;
}
input:checked + .custom-checkbox-label .custom-checkbox-item {
  background: #e5e7eb;
}

input:checked + .custom-checkbox-label .x-tick {
  border: 2px solid limegreen;
  background-color: limegreen;
}

.x-icon svg {
  display: inline-block;
  font-size: inherit;
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
</style>
