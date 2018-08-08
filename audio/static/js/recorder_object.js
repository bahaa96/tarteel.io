var audio_context;
var recorder;
var audioStream;
function startUserMedia(stream) {
  audioStream = stream;
 var input = audio_context.createMediaStreamSource(audioStream);
 recorder = new Recorder(input);
 recorder && recorder.record();
}
function stopRecording() {
  recorder.exportWAV(function(blob) {
    var a = new FileReader();
    a.onload = function(e) {console.log(e.target.result);}
    a.readAsDataURL(blob);
  });
  recorder.stop();
  audioStream.getTracks()[0].stop();
}
function startRecording() {
  try {
    // webkit shim
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    window.URL = window.URL || window.webkitURL;

    audio_context = new AudioContext;
    console.log('Audio context set up.');
    console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
  } catch (e) {
    console.log('No web audio support in this browser!');
  }

  navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
    console.log('No live audio input: ' + e);
  });
};
