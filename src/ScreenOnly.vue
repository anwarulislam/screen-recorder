<template>
  <div class="container mx-auto py-4 text-center">
    <!-- PREVIEW SCREEN -->
    <div v-if="streamStatus !== 'RECORDED'">
      <video id="preview" class="w-1" autoplay muted></video>
    </div>
    <!-- PREVIEW SCREEN -->

    <!-- COUNTDOWN NUMBER -->
    <span class="text-5xl font-bold" v-if="streamStatus === 'INTERVAL'">
      {{ countdownTime }}
    </span>
    <!-- COUNTDOWN NUMBER -->

    <!-- RECORDED PREVIEW -->

    <transition name="modal">
      <Modal v-if="showDownloadModal" @close="showDownloadModal = false">
        <template v-slot:body>
          <div v-if="streamStatus === 'RECORDED'">
            <video class="mx-auto mb-5" :src="recordedSource" controls></video>
          </div>

          <div class="centered-buttons flex justify-center gap-3">
            <a
              v-if="streamStatus === 'RECORDED'"
              class="button"
              href=""
              aria-label="New"
            >
              New Recording
            </a>

            <button
              v-if="streamStatus === 'RECORDED'"
              @click="downloadRecordedVideo()"
              aria-label="Download"
            >
              Download
            </button>
          </div>
        </template>
      </Modal>
    </transition>

    <!-- RECORDED PREVIEW -->

    <div class="centered-buttons flex justify-center gap-3">
      <button @click="startStream()" v-if="streamStatus === 'NONE'">
        <span>Start Recording</span>
      </button>

      <button
        ref="startRecordingBtn"
        aria-label="Start"
        class="hidden"
        v-if="streamStatus === 'STREAMING'"
      >
        Start Actual Recording
      </button>

      <button
        v-if="streamStatus === 'RECORDING'"
        aria-label="Stop"
        @click="stopStream(mediaStream)"
      >
        Stop Recording
      </button>

      <a
        v-if="streamStatus === 'RECORDED'"
        class="button"
        href=""
        aria-label="New"
      >
        New Recording
      </a>

      <button
        v-if="streamStatus === 'RECORDED'"
        @click="downloadRecordedVideo()"
        aria-label="Download"
      >
        Download
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ysFixWebmDuration from "fix-webm-duration";
import { ref } from "vue";
import { getDownloadName } from "./helpers";
import Modal from "./components/Modal.vue";

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

const showDownloadModal = ref(false);

const mergeAudioStreams = (
  desktopStream: MediaStream,
  voiceStream: MediaStream
) => {
  const context = new AudioContext();
  const destination = context.createMediaStreamDestination();
  let hasDesktop = false;
  let hasVoice = false;
  if (desktopStream && desktopStream.getAudioTracks().length > 0) {
    // If you don't want to share Audio from the desktop it should still work with just the voice.
    const source1 = context.createMediaStreamSource(desktopStream);
    const desktopGain = context.createGain();
    desktopGain.gain.value = 0.7;
    source1.connect(desktopGain).connect(destination);
    hasDesktop = true;
  }

  if (voiceStream && voiceStream.getAudioTracks().length > 0) {
    const source2 = context.createMediaStreamSource(voiceStream);
    const voiceGain = context.createGain();
    voiceGain.gain.value = 0.7;
    source2.connect(voiceGain).connect(destination);
    hasVoice = true;
  }

  return hasDesktop || hasVoice ? destination.stream.getAudioTracks() : [];
};

async function startStream() {
  preview = document.getElementById("preview") as any;
  if (!preview) return;
  streamStatus.value = "STREAMING";
  // Requests a new MediaStream of the user's screen with video (display) and audio (if enabled) tracks

  const audio = true;
  const mic = true;

  let desktopStream, voiceStream;

  navigator.mediaDevices
    .getUserMedia({
      video: false,
      audio: audio,
      // When the Promise returned by getDisplayMedia() is resolved, do the following
    })
    .then(async (voiceStream) => {
      desktopStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: audio,
      });

      const tracks = [
        ...desktopStream.getVideoTracks(),
        ...mergeAudioStreams(desktopStream, voiceStream),
      ];

      const stream = new MediaStream(tracks);

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
        type: "video/mp4",
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

  // await buttonClick(startRecordingBtn.value as HTMLButtonElement);

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
  showDownloadModal.value = true;
}

function downloadRecordedVideo() {
  console.log("download");
  // create a link and click it
  const link = document.createElement("a");
  link.href = recordedSource.value;
  link.download = getDownloadName() + ".mp4";
  link.click();

  // remove link
  link.remove();
}
</script>

<style scoped>
button,
.button {
  @apply rounded py-2 px-4 font-bold;
  @apply bg-blue-500 text-white;
}
button:hover,
.button:hover {
  @apply bg-blue-700;
}

video {
  @apply rounded;
  @apply max-h-96;
}
</style>
