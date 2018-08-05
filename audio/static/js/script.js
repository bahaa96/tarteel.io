var StateEnum = {
  INTRO: 1,
  AYAH_LOADED: 2,
  RECORDING: 3,
  COMMIT_DECISION: 4,
  THANK_YOU: 5
}
var state = StateEnum.INTRO;
var session_id = null;
var session_count = 0;
var ayah_data;

function load_ayah_callback(data) {
  state = StateEnum.AYAH_LOADED;
  ayah_data = data;
  $("#ayah").show();
  $("#mic").show();
  $("#mic").removeClass("recording");
  $("#mic span").text("Record");
  $("#ayah-text").text(data.line);
  $("#surah-num").text(data.surah);
  $("#ayah-num").text(data.ayah);
  session_id = data.hash;
  for (let i=0; i < session_count%5 + 2; i++) {
    $(".progress-bubble:nth-of-type("+i+")").addClass("complete");
  }
}

$("footer").click(function(evt) {
  $(".footer-btn").hide();
  if (state == StateEnum.INTRO || state == StateEnum.THANK_YOU) {
    $(".info").hide();
    $("#start").hide();
    $(".complete").removeClass("complete");
    api.get_ayah(load_ayah_callback);
  } else if (state == StateEnum.COMMIT_DECISION &&
    $(evt.target).parents("#submit").length) {
      recorder.exportWAV(function(blob) {
        api.send_recording(blob, ayah_data.surah, ayah_data.ayah, session_id)
      });
      session_count += 1;
      if (session_count % 5 == 0) {
        state = StateEnum.THANK_YOU;
        $("#ayah").hide();
        $("#thank-you").show();
        $("body").css("background-color","#fff"); // because mailchimp plug-in is on a white background
        $("#start").show();
      } else {
        api.get_ayah(load_ayah_callback);
      }
  } else if (state == StateEnum.AYAH_LOADED ||
      (state == StateEnum.COMMIT_DECISION && $(evt.target).parents("#retry").length)) {
    state = StateEnum.RECORDING;
    recorder.clear();
    recorder && recorder.record();
    $("body").css("background-color","#F5F4F3"); // because mailchimp plug-in is on a white background
    $("#mic").show();
    $("#mic").addClass("recording");
    $("#mic span").text("Stop");
  } else if (state == StateEnum.RECORDING) {
    state = StateEnum.COMMIT_DECISION;
    recorder && recorder.stop();
    $(".review").show();
  }
});
