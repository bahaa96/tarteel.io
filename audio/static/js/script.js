var StateEnum = {
  INTRO: 1,
  AYAH_LOADED: 2,
  RECORDING: 3,
  COMMIT_DECISION: 4,
  THANK_YOU: 5
}
const AYAHS_PER_SUBISSION = 5;
var state = StateEnum.INTRO;
var session_id = null;
var session_count = 0;
var ayah_data;
var recording_data = new Array(AYAHS_PER_SUBISSION);

function load_ayah_callback(data) {
  state = StateEnum.AYAH_LOADED;
  ayah_data = data;
  $("#ayah").show();
  $("#mic").show();
  $("footer").css("height", "250px");
  $("#mic").removeClass("recording");
  $("#mic span").text("Record");
  $("#ayah-text").text(data.line);
  $("#surah-num").text(data.surah);
  $("#ayah-num").text(data.ayah);
  session_id = data.hash;
  for (let i=0; i < session_count % AYAHS_PER_SUBISSION + 2; i++) {
    $(".progress-bubble:nth-of-type("+i+")").addClass("complete");
  }
}

$("#demographics-form").submit(
  function() {
    $.ajax(
      {
        type: "POST",
        url: "/api/demographics/",
        data: $("#demographics-form").serialize(),
        dataType: "json",
        success: function (data) {
            $("#demographics-form-div").html("");
            $("#one-more").html("");
        }
      }
    );
    return false;
  }
)

function targetHasId(target, id) {
  if ($(target).parents("#"+id).length || $(target).attr('id') == id) {
    return true
  }
  return false
}

$("footer").click(function(evt) {
  $("#start").hide();
  if (state == StateEnum.INTRO || state == StateEnum.THANK_YOU) {
    recording_data = new Array(AYAHS_PER_SUBISSION);
    $(".info").hide();
    $("#start").hide();
    $(".complete").removeClass("complete");
    api.get_ayah(load_ayah_callback);
  } else if (targetHasId(evt.target, "submit")) {
      session_count += 1;
      if (session_count % AYAHS_PER_SUBISSION == 0) {
        for (var i = 0; i < recording_data.length; i++) {
          var record = recording_data[i];
          if (record) {
            api.send_recording(record.audio, record.surah_num, record.ayah_num, record.hash_string);
          }
        }
        state = StateEnum.THANK_YOU;
        $("#ayah").hide();
        $("#thank-you").show();
        $(".review").hide()
        $("footer").css({"height": "120px", "position": "relative"});
        $("#start").show();
      } else {
        $(".review").hide();
        api.get_ayah(load_ayah_callback);
      }
  } else if (state == StateEnum.AYAH_LOADED ||
      (state == StateEnum.COMMIT_DECISION && targetHasId(evt.target, "retry"))) {
    startRecording()
    state = StateEnum.RECORDING;
    $(".review").hide();
    $("#mic").show();
    $("#mic").addClass("recording");
  } else if (state == StateEnum.RECORDING) {
    if (recorder) {
      recorder.exportWAV(function(blob) {
        recording_data[session_count % AYAHS_PER_SUBISSION] = {
          surah_num: ayah_data.surah,
          ayah_num: ayah_data.ayah,
          hash_string: session_id,
          audio: blob
        }
      })
      stopRecording()
    }
    state = StateEnum.COMMIT_DECISION;
    $(".review").css("display", "flex");
    $("#mic").hide();
  }
});

$('.dropdown').click(function () {
        $(this).attr('tabindex', 1).focus();
        $(this).toggleClass('active');
        $(this).find('.dropdown-menu').slideToggle(300);
    });
    $('.dropdown').focusout(function () {
        $(this).removeClass('active');
        $(this).find('.dropdown-menu').slideUp(300);
    });
    $('.dropdown .dropdown-menu li').click(function () {
        $(this).parents('.dropdown').find('span').text($(this).text());
        $(this).parents('.dropdown').find('input').attr('value', $(this).attr('id'));
    });
