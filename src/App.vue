<template>
  <div
    class="x-container x-mx-auto x-py-4 x-text-center x-flex x-items-center x-justify-center x-gap-10"
  >
    <!-- PREVIEW SCREEN -->
    <div>
      <video
        :srcObject.prop="mediaStream"
        class="m-video x-mx-auto x-w-0"
        autoplay
        muted
      ></video>
    </div>
    <!-- PREVIEW SCREEN -->

    <!-- COUNTDOWN NUMBER -->
    <span class="x-text-5xl x-font-bold" v-if="streamStatus === 'INTERVAL'">
      {{ countdownTime }}
    </span>
    <!-- COUNTDOWN NUMBER -->

    <!-- RECORDED PREVIEW -->

    <transition name="modal">
      <Modal v-if="showDownloadModal" @close="showDownloadModal = false">
        <template v-slot:body>
          <div v-if="streamStatus === 'RECORDED'">
            <video
              class="m-video x-mx-auto x-mb-5"
              :src="recordedSource"
              controls
            ></video>
          </div>

          <div class="centered-buttons x-flex x-justify-center x-gap-3">
            <a v-if="streamStatus === 'RECORDED'" class="m-button" href="">
              New Recording
            </a>

            <button
              class="m-button"
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

    <div v-if="streamStatus === 'NONE'">
      <Settings @onChange="onSettingChanges" />
    </div>

    <div class="centered-buttons x-flex x-justify-center x-gap-3">
      <button
        class="m-button"
        @click="startStream()"
        v-if="streamStatus === 'NONE'"
      >
        <span>Start Recording</span>
      </button>

      <button
        class="m-button x-hidden"
        ref="startRecordingBtn"
        aria-label="Start"
        v-if="streamStatus === 'STREAMING'"
      >
        Start Actual Recording
      </button>

      <button
        class="m-button"
        v-if="streamStatus === 'RECORDING'"
        aria-label="Stop"
        @click="togglePause()"
      >
        {{ isPaused ? "Resume Recording" : "Pause Recording" }}
      </button>

      <button
        class="m-button"
        v-if="streamStatus === 'RECORDING'"
        aria-label="Stop"
        @click="stopStream()"
      >
        Stop Recording
      </button>

      <a
        v-if="streamStatus === 'RECORDED'"
        class="m-button"
        href=""
        aria-label="New"
      >
        New Recording
      </a>

      <button
        class="m-button"
        v-if="streamStatus === 'RECORDED'"
        @click="downloadRecordedVideo()"
        aria-label="Download"
      >
        Download
      </button>
    </div>

    <transition name="modal">
      <Modal v-if="showPremiumModal" @close="showPremiumModal = false">
        <template v-slot:body>
          <div>
            <h1 class="x-text-lg x-font-semibold">Premium Fetaure</h1>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quod
              placeat iusto officia eaque voluptatibus, amet corrupti nulla in
              blanditiis quas consectetur quis officiis ab fugit est quisquam,
              illo assumenda saepe!
            </p>
          </div>
          <a :href="settings.link">
            <img class="x-w-full" :src="BASE_URL + settings.promoImage" />
          </a>
        </template>
      </Modal>
    </transition>
  </div>
</template>

<script setup lang="ts">
import ysFixWebmDuration from "fix-webm-duration";
import Cookies from "js-cookie";
import { ref } from "vue";
import Modal from "./components/Modal.vue";
import Settings, { Option } from "./components/Settings.vue";
import { getDownloadName } from "./helpers";

const option = ref<Option>();
const BASE_URL = "https://convert.7-cats.com";

const showPremiumModal = ref(false);
const settings = ref<{ promoImage?: string; link?: string }>({});

const getSettings = () => {
  fetch(`${BASE_URL}/public/settings-rc.json`)
    .then((res) => res.json())
    .then((data) => {
      settings.value = data;
      console.log(data);
    });
};
getSettings();

const onSettingChanges = (newOption: Option) => {
  option.value = newOption;
};

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
  if (isExpired()) {
    showPremiumModal.value = true;
    return;
  }

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

  tracks[0].addEventListener("ended", function () {
    stopStream();
  });

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
    setExpiry();

    recorder.onstop = resolve;
    recorder.onerror = (event: any) => reject(event);
  });
  // Creates a new Promise and stops the MediaRecorder if it's recording
  let recorded = () => recorder.state == "recording" && recorder.stop();

  // Creates a new Promise which is fulfilled when both of the two Promises (stopped and recorded) have resolved
  await Promise.all([stopped, recorded]);

  stopStream();
}

function setExpiry() {
  let isRecorded = 1;
  if (Cookies.get("is_recorded")) {
    isRecorded = Number(parseInt(Cookies.get("is_recorded") || "1"));
  }
  isRecorded++;
  Cookies.set("is_recorded", `${isRecorded}`, {
    expires: 1,
    path: "",
  });
}

function isExpired() {
  let isRecorded = 0;
  if (Cookies.get("is_recorded")) {
    isRecorded = Number(parseInt(Cookies.get("is_recorded") || "0"));
  }
  return isRecorded > 0 ? true : false;
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
.m-button {
  @apply x-rounded-lg x-py-4 x-px-8 x-font-bold;
  @apply x-bg-primary x-text-white;
  @apply x-text-base;
  font-family: sans-serif;
}
.m-button:hover {
  @apply x-bg-primary x-opacity-[.9];
}

.m-video {
  @apply x-rounded;
  @apply x-max-h-96;
}
</style>
