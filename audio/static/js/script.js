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
let passedOnBoarding;
let currentSurah;
let ayahsRecited;

try {
  passedOnBoarding = Boolean(localStorage.getItem("passedOnBoarding"))
  ayah_data = JSON.parse(localStorage.getItem("lastAyah"))
  ayahsRecited = Number(localStorage.getItem("ayahsRecited"))
  if(passedOnBoarding) {
    $("#progress").hide();
    $(".navbar").css("display", "flex")
  }
} catch (e) {
  console.log(e.message);
}

window.mySwipe = new Swipe(document.getElementById('slider'), {
  disableScroll: true,
  startSlide: ayah_data ? 1 : 0
});

String.prototype.trunc =
  function(n){
    return this.substr(0,n-1)+(this.length>n?'&hellip;':'');
  };

function load_ayah_callback(data) {
  state = StateEnum.AYAH_LOADED;
  ayah_data = data;
  $("#mic").removeClass("recording");
  $("#ayah-text").text(data.line);
  $("#surah-num").text(data.surah);
  $("#ayah-num").text(data.ayah);
  if(passedOnBoarding) {
    $(".note-buttons .previous").show()
    $(".note-buttons .next").show()
    $(".note-buttons .previous-ayah").hide()
  }
  session_id = data.hash;
  for (let i=0; i < session_count % AYAHS_PER_SUBISSION + 2; i++) {
    $(".progress-bubble:nth-of-type("+i+")").addClass("complete");
  }
}

if(ayah_data)
  load_ayah_callback(ayah_data)

$("#demographics-form").submit(
  function() {
    $.ajax(
      {
        type: "POST",
        url: "/api/demographics/",
        data: $("#demographics-form").serialize(),
        dataType: "json",
        success: (data) => {
            window.mySwipe.slide(3)
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
    passedOnBoarding = Boolean(localStorage.getItem("passedOnBoarding"))
    if(passedOnBoarding){
      window.mySwipe.slide(4)
      $(".note-buttons .previous").show()
      $(".note-buttons .next").show()
    }
    else {
      window.mySwipe.slide(1)
      $(".complete").removeClass("complete");
      $("#ayah").show();
      $("#mic").show();
      if(!ayah_data)
        api.get_ayah(load_ayah_callback);
    }
  } else if (targetHasId(evt.target, "submit")) {
      const record = recording_data[session_count];
      if (record) {
        api.send_recording(record.audio, record.surah_num, record.ayah_num, record.hash_string);
        session_count += 1;
        try {
          localStorage.setItem("ayahsRecited", String(ayahsRecited + session_count))
        } catch (e) {
          console.log(e.message)
        }
      }
      if (session_count % AYAHS_PER_SUBISSION == 0 && !passedOnBoarding) {
        state = StateEnum.THANK_YOU;
        window.mySwipe.next()
        $("#ayah").hide();
        $("#thank-you").show();
        try {
          localStorage.setItem("passedOnBoarding", String(true))
        }
        catch (e) {
          console.log(e.message)
        }
        $(".review").hide()
      } else {
        $(".review").hide();
        $("#mic").show()
        if(passedOnBoarding)  {
          setNextAyah()
        } else {
          api.get_ayah(load_ayah_callback);
        }
      }
  } else if (state == StateEnum.AYAH_LOADED ||
      (state == StateEnum.COMMIT_DECISION && targetHasId(evt.target, "retry"))) {
    startRecording()
    state = StateEnum.RECORDING;
    $(".review").hide();
    $("#mic").show();
    $("#mic").addClass("recording");
    if(passedOnBoarding) {
      $(".note-buttons .previous-ayah").hide()
      $(".note-buttons .next").hide()
      $(".note-buttons .previous").hide()
    }
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
    if(passedOnBoarding) {
      $(".note-buttons .previous").hide()
      $(".note-buttons .next").hide()
      $(".note-buttons .previous-ayah").show()
    }
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


const renderSurahs = (surahs) => {
  $(".screen5 .content ul").html("")
  for (let surahKey in surahs) {
    surah = surahs[surahKey]
    $(".screen5 .content ul").append(`
    <li onclick="getSurah(${surahKey})">
      <p class="number">${ surahKey }</p>
      <div class="text">
        <p>
          ${ surah.latin }
        </p>
        <p  class="arabic" data-number=${surahKey}/>
      </div>
    </li>
  `)
  }
}

renderSurahs(surahs)

$(".screen5 .content form").submit((e) => e.preventDefault())
$(".screen6 .content form").submit((e) => e.preventDefault())
$(".screen5 .content form .input-wrapper input").keyup(e => {
  const value = e.target.value
  if(!value)
    renderSurahs(surahs)
  const output = {}
  const out = Object.keys(surahs).filter((elm) => {
    return (
      surahs[elm].arabic.includes(value.toLowerCase()) ||
      surahs[elm].english.toLocaleLowerCase().includes(value.toLowerCase())  ||
      surahs[elm].english.toLocaleLowerCase().includes(value.toLowerCase())
    )
  }).forEach(elm => output[elm] = surahs[elm])

  renderSurahs(output)
})
$(".screen6 .content form .input-wrapper input").keyup(e => {
  const value = e.target.value
  const ayahs = ayahsDict[currentSurah]
  if(!value)
    renderAyahs(currentSurah, ayahs)
  const output = {}
  const out = Object.keys(ayahs).filter((elm) => {
    return (
      ayahs[elm].text.includes(value.toLowerCase().trim())
    )
  }).forEach(elm => output[elm] = ayahs[elm])

  renderAyahs(currentSurah, output)
})

const renderAyahs = (surahKey, ayahs) => {
  const $ayahsList = $(".screen6 .content ul")
  $ayahsList.html("")
  for(let ayahKey in ayahs) {
    $ayahsList.append(`
    <li onclick="setAyah(${surahKey}, ${ayahKey})">
      <p class="number">
        ${ ayahKey }
      </p>
      <p class="text">
        ${ ayahs[ayahKey].displayText.trunc(100) }
      </p>
    </li>
  `)
  }
}

const getSurah = (surahKey) => {
  renderAyahs(surahKey, ayahsDict[surahKey])
  currentSurah = surahKey
  $(".screen5 .content .title h3").text(surahs[surahKey].arabic)
  window.mySwipe.slide(5)
}

const setAyah = (surahKey, ayah) => {
  api.get_specific_ayah(surahKey, ayah, load_ayah_callback);
  window.mySwipe.slide(1)
  if(passedOnBoarding) {
    $("#progress").hide();
    $(".navbar").css("display", "flex")
  }
  $("#ayah").show()
  $("#mic").show()

}
setPreviousAyah = () => {
  const { ayah, surah } = ayah_data
  const prevAyah = Number(ayah) - 1
  if(ayah == 1) {
    const prevSurah = Number(surah) - 1
    setAyah(prevSurah, surahs[prevSurah].ayah)
  }
  else
    setAyah(surah, String(prevAyah))
}

setNextAyah = () => {
  const { ayah, surah } = ayah_data
  const nextAyah = Number(ayah) + 1
  if(surahs[surah]["ayah"] == nextAyah - 1) {
    const nextSurah = Number(surah) + 1
    setAyah(nextSurah, 1)
  }
  else
    setAyah(surah, String(nextAyah))
}

const goToDemographics = () => {
  window.mySwipe.slide(2)
}

const goToSubscribe = () => {
  window.mySwipe.slide(3)
}

const continueReading = () => {
  window.mySwipe.slide(4)
  setTimeout(() => stopRecording(), 250)
}

const isMobile = new MobileDetect(window.navigator.userAgent);
if(isMobile.os()) $(".mobile-app").show()