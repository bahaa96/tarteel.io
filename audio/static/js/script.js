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

window.mySwipe = new Swipe(document.getElementById('slider'), {
  disableScroll: true,
});


function load_ayah_callback(data) {
  state = StateEnum.AYAH_LOADED;
  ayah_data = data;
  $("#mic").removeClass("recording");
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

$("footer .btn").click(function(evt) {
  if (state == StateEnum.INTRO || state == StateEnum.THANK_YOU) {
    recording_data = new Array(AYAHS_PER_SUBISSION);
    window.mySwipe.slide(1)
    $(".complete").removeClass("complete");
    $("#ayah").show();
    $("#mic").show();
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
        window.mySwipe.next()
        $("#ayah").hide();
        $("#thank-you").show();
        $(".review").hide()
      } else {
        $(".review").hide();
        $("#mic").show()
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
    $("#mic").removeClass("recording");
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

// const isMobile = new MobileDetect(window.navigator.userAgent);
// if(isMobile.os()) $(".mobile-app").show()