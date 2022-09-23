export {};

declare global {
  var voiceStream: MediaStream;
  var desktopStream: MediaStream;
  var stream: MediaStream;
  var recorder: MediaRecorder;

  interface Window {
    voiceStream: MediaStream;
    desktopStream: MediaStream;
    stream: MediaStream;
    recorder: MediaRecorder;
    [key: string]: any;
  }
}
