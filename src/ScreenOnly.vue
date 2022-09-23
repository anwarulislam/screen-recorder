<template>
  <div class="container mx-auto py-4 text-center">
    <!-- PREVIEW SCREEN -->
    <div>
      <video
        :srcObject.prop="mediaStream"
        class="mx-auto w-0"
        autoplay
        muted
      ></video>
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
        @click="togglePause()"
      >
        {{ isPaused ? "Resume Recording" : "Pause Recording" }}
      </button>

      <button
        v-if="streamStatus === 'RECORDING'"
        aria-label="Stop"
        @click="stopStream()"
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
import { reactive, ref } from "vue";
import { getDownloadName } from "./helpers";
import Modal from "./components/Modal.vue";

const startRecordingBtn = ref<HTMLButtonElement | null>(null);

type MediaRecorderState =
  | "STREAMING"
  | "INTERVAL"
  | "RECORDING"
  | "RECORDED"
  | "NONE";

let mediaStream = ref<MediaStream>();
const streamStatus = ref<MediaRecorderState>("NONE");
const isPaused = ref(false);

const countdownTime = ref(3);
const duration = ref(0);
let startTime = 0;

const recordedSource = ref<any>(null);
let preview = ref<HTMLVideoElement | any>(null);

const showDownloadModal = ref(false);

const recordedChunks = ref<Blob[]>([]);

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
  const audio = true;
  const mic = true;

  // Requests a new MediaStream of the user's screen with video (display) and audio (if enabled) tracks

  window.desktopStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: audio,
  });

  window.voiceStream = await navigator.mediaDevices.getUserMedia({
    video: false,
    audio: audio,
  });

  streamStatus.value = "STREAMING";

  const tracks = [
    ...desktopStream.getVideoTracks(),
    ...mergeAudioStreams(desktopStream, voiceStream),
  ];

  // Sets preview video box to the stream
  window.stream = new MediaStream(tracks);
  // mediaStream.value = stream;

  startRecording();
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
async function startRecording() {
  recordedChunks.value = [];

  var options = { mimeType: getSupportedMimeTypes()[0] };

  window.recorder = new MediaRecorder(stream, options);

  recorder.ondataavailable = handleDataAvailable;

  // Hides start button and displays count and stop button
  streamStatus.value = "INTERVAL";

  await wait(countdown());

  streamStatus.value = "RECORDING";

  recorder.start();
  startTime = Date.now();
  // Creates a new Promise which is resolved when the MediaRecorder's onstop event handler is called
  // Rejects if its onerror event handler is called
  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event: any) => reject(event);
  });
  // Creates a new Promise and stops the MediaRecorder if it's recording
  let recorded = () => recorder.state == "recording" && recorder.stop();

  // Creates a new Promise which is fulfilled when both of the two Promises (stopped and recorded) have resolved
  await Promise.all([stopped, recorded]);

  stopStream();
}

function togglePause() {
  if (isPaused.value) {
    recorder.resume();
    isPaused.value = false;
  } else {
    recorder.pause();
    isPaused.value = true;
  }
}

const handleDataAvailable = (event: any) => {
  console.log("data-available");
  if (event.data.size > 0) {
    recordedChunks.value.push(event.data);
  } else {
    console.log("No data available");
  }
};

// Counts down 3 seconds
function countdown(timeLeft = 3) {
  const millisecond = 1000;
  let countdownTimer = setInterval(function () {
    timeLeft--;
    countdownTime.value = timeLeft;
    // Stops when 0 is reached
    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
    }
  }, millisecond);

  return timeLeft * millisecond;
}

// Returns a new Promise which resolves once 3000 milliseconds have elapsed
function wait(delayInMS = 3000) {
  return new Promise((resolve) => setTimeout(resolve, delayInMS));
}

// Stops the input stream
function stopStream() {
  if (!stream) return;

  duration.value = Date.now() - startTime;
  setRecordedSource();

  // Calls MediaStreamTrack.stop() on each track in the stream
  stream.getTracks().forEach((track) => track.stop());
  streamStatus.value = "RECORDED";
  showDownloadModal.value = true;

  // Resets the stream
  voiceStream.getTracks().forEach((track) => track.stop());
  desktopStream.getTracks().forEach((track) => track.stop());
}

function setRecordedSource() {
  // Merges the chunks into a single Blob under video format
  let recordedBlob = new Blob(recordedChunks.value, {
    type: "video/mp4",
  });
  // Fixes the recorded blob so that it is seekable (Chrome and Firefox bug)
  ysFixWebmDuration(recordedBlob, duration.value, { logger: false }).then(
    function (fixedBlob) {
      // Creates a URL that references the Blob and sets it to the recoding video box
      recordedSource.value = URL.createObjectURL(fixedBlob);
    }
  );
}

function downloadRecordedVideo() {
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
