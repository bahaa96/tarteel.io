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
/*End Dropdown Menu*/


$('.dropdown-menu li').click(function () {
  var input = '<strong>' + $(this).parents('.dropdown').find('input').val() + '</strong>',
      msg = '<span class="msg">Hidden input value: ';
  $('.msg').html(msg + input + '</span>');
}); 



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
  $("body").css("background-color","#F5F4F3"); // because mailchimp plug-in is on a white background
  $("#ayah").show();
  $("#mic").show();
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
    console.log($("#demographics-form").serialize());
    $.ajax(
      {
        type: "POST",
        url: "/api/demographics/",
        data: $("#demographics-form").serialize(),
        dataType: "json",
        success: function (data) {
            $("#demographics-form-div").html("");
        }
      }
    );
    return false;
  }
)

$("footer").click(function(evt) {
  $(".footer-btn").hide();
  if (state == StateEnum.INTRO || state == StateEnum.THANK_YOU) {
    recording_data = new Array(AYAHS_PER_SUBISSION);
    $(".info").hide();
    $("#start").hide();
    $(".complete").removeClass("complete");
    api.get_ayah(load_ayah_callback);
  } else if (state == StateEnum.COMMIT_DECISION &&
    $(evt.target).parents("#submit").length) {
      session_count += 1;
      if (session_count % AYAHS_PER_SUBISSION == 0) {
        for (var i = 0; i < recording_data.length; i++) {
          var record = recording_data[i];
          api.send_recording(record.audio, record.surah_num, record.ayah_num, record.hash_string);
        }
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
    startRecording()
    state = StateEnum.RECORDING;
    $("#mic").show();
    $("#mic").addClass("recording");
    $("#mic span").text("Stop");
  } else if (state == StateEnum.RECORDING) {
    recorder.exportWAV(function(blob) {
      recording_data[session_count % AYAHS_PER_SUBISSION] = {
        surah_num: ayah_data.surah,
        ayah_num: ayah_data.ayah,
        hash_string: session_id,
        audio: blob
      }
    })
    stopRecording()
    state = StateEnum.COMMIT_DECISION;
    $(".review").show();
  }
});
