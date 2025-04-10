<script setup lang="ts">
import AudioWorkletSTT from './components/AudioWorkletSTT.vue'
</script>

<template>
  <header>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
    <!-- </nav>
    </div> -->
  </header>
  <AudioWorkletSTT />
  <RouterView />
</template>

<style scoped></style>
