<template>
  <label :for="id" class="custom-check-label">
    <input
      type="checkbox"
      :id="id"
      :checked="checked"
      class="x-absolute x-right-3 x-top-3 x-z-10"
      @input="onChange"
    />
    <div class="custom-check">
      <!-- slot -->
      <div>
        <span class="x-icon">
          <slot></slot>
        </span>
      </div>
      <span>{{ label }}</span>
    </div>
  </label>
</template>
<script lang="ts" setup>
const props = defineProps<{
  label: string;
  id: string;
  checked?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:checked", checked: boolean): void;
}>();

const onChange = (e: Event | any) => {
  emit("update:checked", e.target.checked);
};
</script>

<style scoped lang="css">
.custom-check-label {
  position: relative;
  border-radius: 8px;
}
.custom-check {
  position: relative;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  box-shadow: inset 0px -5px 0px 0px #e5e7eb;
  min-width: 60px;
  text-align: left;
  cursor: pointer;
  transition: 0.3s;
  color: #4b5563;
}

.custom-check:hover {
  box-shadow: inset 0px -10px 0px 0px #e5e7eb;
}

/* if checked */
.custom-check-label input:checked + div {
  background: #ddd;
}

.x-icon {
  font-size: 2rem;
}

input[type="checkbox"] {
  /* Styling checkbox */
  width: 1rem;
  height: 1rem;
  border-radius: 4px;
  border: 2px solid #e5e7eb;
  transition: 0.3s;
}

input[type="checkbox"]:checked {
  background: #e5e7eb;
  accent-color: #e5e7eb;
}
</style>
