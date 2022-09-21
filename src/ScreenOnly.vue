<template>
  <div class="container mx-auto text-center">
    <div class="home-container" v-if="streamStatus === 'NONE'">
      <button @click="startStream()">
        <span>Select a screen</span>
      </button>
    </div>

    <div
      :class="{
        hidden: streamStatus === 'NONE' || streamStatus === 'RECORDED',
      }"
    >
      <video id="preview" autoplay muted></video>
    </div>

    <button
      ref="startRecordingBtn"
      aria-label="Start"
      v-if="streamStatus === 'STREAMING'"
    >
      Start recording
    </button>

    <span class="text-5xl font-bold" v-if="streamStatus === 'INTERVAL'">
      {{ countdownTime }}
    </span>

    <button
      v-if="streamStatus === 'RECORDING'"
      aria-label="Stop"
      @click="stopStream(mediaStream)"
    >
      Stop Recording
    </button>

    <div v-if="streamStatus === 'RECORDED'">
      <video :src="recordedSource" controls></video>
    </div>

    <form action="/" v-if="streamStatus === 'RECORDED'">
      <button aria-label="New">New Recording</button>
    </form>

    <button
      v-if="streamStatus === 'RECORDED'"
      @click="downloadRecordedVideo()"
      aria-label="Download"
    >
      Download
    </button>
  </div>
</template>

<script setup lang="ts">
import ysFixWebmDuration from "fix-webm-duration";
import { ref } from "vue";
import { getDownloadName } from "./helpers";

const startRecordingBtn = ref<HTMLButtonElement | null>(null);

type MediaRecorderState =
  | "STREAMING"
  | "INTERVAL"
  | "RECORDING"
  | "RECORDED"
  | "NONE";

const mediaStream = ref<MediaStream | null>(null);
const streamStatus = ref<MediaRecorderState>("NONE");

const countdownTime = ref(3);
const duration = ref(0);
let startTime = 0;

const recordedSource = ref<any>(null);
let preview = ref<HTMLVideoElement | any>(null);

function startStream() {
  preview = document.getElementById("preview") as any;
  if (!preview) return;
  streamStatus.value = "STREAMING";
  // Requests a new MediaStream of the user's screen with video (display) and audio (if enabled) tracks
  navigator.mediaDevices
    .getDisplayMedia({
      video: {},
      // When the Promise returned by getDisplayMedia() is resolved, do the following
    })
    .then((stream) => {
      preview.srcObject = stream;

      // Sets preview video box to the stream
      mediaStream.value = stream;
      // Sets download button's link to the stream
      // downloadButtonLink.href = stream;
      // Firefox compatibility
      preview.captureStream = preview.captureStream || preview.mozCaptureStream;
      console.log("captured stream", preview);
      // Creates and returns a new Promise which is resolved when the preview video starts to play
      return new Promise((resolve) => (preview.onplaying = resolve));
      // Calls startRecording() with the preview stream and receives recordedChunks (data) when finished recording
    })
    .then(() => startRecording(preview.captureStream()))
    .then((recordedChunks) => {
      // Merges the chunks into a single Blob under video format
      let recordedBlob = new Blob(recordedChunks, {
        type: "video/webm",
      });
      // Fixes the recorded blob so that it is seekable (Chrome and Firefox bug)
      ysFixWebmDuration(recordedBlob, duration.value, { logger: false }).then(
        function (fixedBlob) {
          // Creates a URL that references the Blob and sets it to the recoding video box
          recordedSource.value = URL.createObjectURL(fixedBlob);
        }
      );
    });
}

function getSupportedMimeTypes() {
  const possibleTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/mp4;codecs=h264,aac",
  ];
  return possibleTypes.filter((mimeType) => {
    return MediaRecorder.isTypeSupported(mimeType);
  });
}

// Handles starting the recording process
async function startRecording(stream: MediaStream | null) {
  if (!stream) return;
  console.log("start recording", stream);
  // Creates the MediaRecorder that will handle recording the input stream

  var options = { mimeType: getSupportedMimeTypes()[0] };

  let recorder = new MediaRecorder(stream, options);
  // Holds the Blobs of media data
  let data: any[] = [];
  // The event handler simply pushes the Blob onto the data array
  recorder.ondataavailable = (event) => data.push(event.data);

  await buttonClick(startRecordingBtn.value as HTMLButtonElement);

  // Hides start button and displays count and stop button
  streamStatus.value = "INTERVAL";

  countdown();
  await wait();

  streamStatus.value = "RECORDING";

  console.log("recorder", recorder);

  recorder.start();
  startTime = Date.now();
  // Creates a new Promise which is resolved when the MediaRecorder's onstop event handler is called
  // Rejects if its onerror event handler is called
  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event) => reject(event);
  });
  // Creates a new Promise and stops the MediaRecorder if it's recording
  let recorded = () => recorder.state == "recording" && recorder.stop();
  // Creates a new Promise which is fulfilled when both of the two Promises (stopped and recorded) have resolved
  await Promise.all([stopped, recorded]);
  stopStream(stream);
  return data;
}

// Returns a new Promise which resolves once the passed button is clicked
function buttonClick(button: HTMLButtonElement) {
  return new Promise((resolve) => (button.onclick = resolve));
}

// Counts down 3 seconds
function countdown() {
  const millisecond = 1000;
  let timeLeft = 3;
  let countdownTimer = setInterval(function () {
    timeLeft--;
    countdownTime.value = timeLeft;
    // Stops when 0 is reached
    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
    }
  }, millisecond);
}

// Returns a new Promise which resolves once 3000 milliseconds have elapsed
function wait() {
  const delayInMS = 3000;
  return new Promise((resolve) => setTimeout(resolve, delayInMS));
}

// Stops the input stream
function stopStream(stream: MediaStream | null) {
  console.log("stop stream", stream);
  if (!stream) return;
  duration.value = Date.now() - startTime;
  // Calls MediaStreamTrack.stop() on each track in the stream
  stream.getTracks().forEach((track) => track.stop());
  streamStatus.value = "RECORDED";
}

function downloadRecordedVideo() {
  console.log("download");
  // create a link and click it
  const link = document.createElement("a");
  link.href = recordedSource.value;
  link.download = getDownloadName() + ".webm";
  link.click();

  // remove link
  link.remove();
}
</script>

<style scoped>
button {
  @apply rounded py-2 px-4 font-bold;
  @apply bg-blue-500 text-white;
}
button:hover {
  @apply bg-blue-700;
}

video {
  @apply rounded;
  @apply max-h-96;
}
</style>
