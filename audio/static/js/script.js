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
let continuous = false
let preloadedAyahs = {}

const isMobile = new MobileDetect(window.navigator.userAgent);

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
  // images are not rendered well in mobile.
  if (isMobile.os()) {
    $("#ayah-text").text(data.line);
  } else {
    $("#ayah-text").html("<img src='"+data.image_url+"' class='ayah-image'>")    
  }
  $("#surah-num").text(data.surah);
  $("#ayah-num").text(data.ayah);
  $(".note-buttons .previous").show()
  $(".note-buttons .next").show()
  session_id = data.hash;
  for (let i=0; i < session_count % AYAHS_PER_SUBISSION + 2; i++) {
    $(".progress-bubble:nth-of-type("+i+")").addClass("complete");
  }
  if(continuous && passedOnBoarding)
    $("#mic").trigger("click")
  loadNextAyah()
  loadPreviousAyah()
}

// Ayah here is the last Ayah which retrieved from localstorage
if(ayah_data)
  load_ayah_callback(ayah_data)


function targetHasId(target, id) {
  if ($(target).parents("#"+id).length || $(target).attr('id') == id) {
    return true
  }
  return false
}

$("footer .btn").click(function(evt) {
  if (state == StateEnum.INTRO || state == StateEnum.THANK_YOU) {
    recording_data = new Array(AYAHS_PER_SUBISSION);
      $(".note-buttons .previous").show()
      $(".note-buttons .next").show()
      window.mySwipe.slide(1)
      $(".complete").removeClass("complete");
      $("#ayah").show();
      $("#mic").show();
      if(!ayah_data)
        api.get_ayah(load_ayah_callback);
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
        console.log(passedOnBoarding)
        window.mySwipe.next()
        $("#ayah").hide();
        $("#thank-you").show();``
        try {
          localStorage.setItem("passedOnBoarding", String(true))
          passedOnBoarding = true
        }
        catch (e) {
          console.log(e.message)
        }
        $(".review").hide()
      } else {
        $(".review").hide();
        $("#mic").show()
        setNextAyah()

      }
  } else if (state == StateEnum.AYAH_LOADED ||
      (state == StateEnum.COMMIT_DECISION && targetHasId(evt.target, "retry"))) {
    startRecording()
    state = StateEnum.RECORDING;
    $(".review").hide();
    $("#mic").show();
    $("#mic").addClass("recording");
    $(".note-buttons .next").hide()
    $(".note-buttons .previous").hide()
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
    $(".note-buttons .previous").css({ display: "block", margin: 0 })
    $(".note-buttons .next").hide()
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
  const surahsList = $(".screen5 .content ul")
  surahsList.html("")
  for (let surahKey in surahs) {
    surah = surahs[surahKey]
    surahsList.append(`
    <li onclick="getSurah(${surahKey})" data-key="${surahKey}" class=${ ayah_data.surah === surahKey ? "active": "" }>
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
  const activeOne = document.querySelector(".screen5 .content ul li.active")
  surahsList.scrollTop(Number(activeOne.getAttribute("data-key")) * 75 - ( 3 * 75))
}

$(".screen5 .content form").submit((e) => e.preventDefault())
$(".screen6 .content form").submit((e) => e.preventDefault())
$("#demographics-form").submit((e) => e.preventDefault())


$(".screen5 .content form .input-wrapper input").keyup(e => {
  const value = e.target.value
  if(!value)
    renderSurahs(surahs)
  const output = {}
  const out = Object.keys(surahs).filter((elm) => {
    return (
      surahs[elm].arabic.includes(value.toLowerCase().trim()) ||
      surahs[elm].english.toLocaleLowerCase().includes(value.toLowerCase().trim())  ||
      surahs[elm].english.toLocaleLowerCase().includes(value.toLowerCase().trim())
    )
  }).forEach(elm => output[elm] = surahs[elm])

  renderSurahs(output)
})
$(".screen6 .content form .input-wrapper input").keyup(e => {
  const value = e.target.value
  currentSurah = currentSurah || ayah_data.surah
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
    <li onclick="setAyah(${surahKey}, ${ayahKey})" data-key="${ayahKey}" class=${ ayah_data.ayah === ayahKey && surahKey === ayah_data.surah ? "active": "" }>
      <p class="number">
        ${ ayahKey }
      </p>
      <p class="text">
        ${ ayahs[ayahKey].displayText.trunc(95) }
      </p>
    </li>
  `)
  }
  const activeOne = document.querySelector(".screen6 .content ul li.active")
  if (activeOne) {
    $ayahsList.scrollTop(Number(activeOne.getAttribute("data-key")) * 78 - (3 * 78))
  }else {
    $ayahsList.scrollTop(0)
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
  $(".review").hide()

}
const setPreviousAyah = () => {
  if(preloadedAyahs.prevAyah) {
    load_ayah_callback(preloadedAyahs.prevAyah)
    return false
  }
  const { ayah, surah } = ayah_data
  const prevAyah = Number(ayah) - 1
  if(ayah == 1) {
    const prevSurah = Number(surah) - 1
    setAyah(prevSurah, surahs[prevSurah].ayah)
  }
  else
    setAyah(surah, String(prevAyah))
}

const setNextAyah = () => {
  if(preloadedAyahs.nextAyah) {
    load_ayah_callback(preloadedAyahs.nextAyah)
    return false
  }
  const { ayah, surah } = ayah_data
  const nextAyah = Number(ayah) + 1
  if(surahs[surah]["ayah"] == nextAyah - 1) {
    const nextSurah = Number(surah) + 1
    setAyah(nextSurah, 1)
  }
  else
    setAyah(surah, String(nextAyah))
}

function loadNextAyah() {
  let callback = (data) => {
    preloadedAyahs.nextAyah = data
    console.log("Next Ayah", data)
    $('<img/>')[0].src = data.image_url;
  }
  const { ayah, surah } = ayah_data
  const nextAyah = Number(ayah) + 1
  if(surahs[surah]["ayah"] == nextAyah - 1) {
    const nextSurah = Number(surah) + 1
    api.get_specific_ayah(String(nextSurah), String(1), callback)
  }
  else {
    api.get_specific_ayah(surah, String(nextAyah), callback)
  }
}

function loadPreviousAyah() {
  let callback = (data) => {
    preloadedAyahs.prevAyah = data
    console.log("prevAyah Ayah", data)
    $('<img/>')[0].src = data.image_url;
  }
    const { ayah, surah } = ayah_data
    const prevAyah = Number(ayah) - 1
    if(ayah == 1) {
      const prevSurah = Number(surah) - 1
      api.get_specific_ayah(String(prevSurah), surahs[prevSurah].ayah, callback)
    }
    else {
      api.get_specific_ayah(surah, String(prevAyah), callback)
    }
}

function renderCounter() {
  const counter = $(".navbar .counter")
  const currentContent = kFormatter(Number(counter.html()))
  counter.html(`${currentContent}`)
}
renderCounter()


const goToDemographics = () => {
  window.mySwipe.slide(2)
}

const goToSubscribe = () => {
  window.mySwipe.slide(3)
}


const submitDemographics = () => {
  const serializedForm = $("#demographics-form").serializeArray()
  const gender = serializedForm[0].value
  const age = serializedForm[1].value
  const ethnicity = serializedForm[2].value
  if(gender && age && ethnicity) {
    $.ajax(
      {
        type: "POST",
        url: "/api/demographics/",
        data: $("#demographics-form").serialize(),
        dataType: "json",
        success: (data) => {
        }
      }
    );
    window.mySwipe.next()
  }
}

const skipDemographic = () => {
  window.mySwipe.next()
  // $(".review").hide()
  // $("#mic").show()
  // $("#ayah").show();
  // $("#progress").hide()
  // $(".navbar").css("display", "flex")
  // setNextAyah()
  // window.mySwipe.slide(1)
}

const toggleNavbarMenu = () => {
  const hamburger = document.querySelector(".hamburger svg")
  hamburger.classList.toggle('active')
  $(".navbar ul").toggle()
}

const navigateToChangeAyah = (surahKey = ayah_data.surah) => {
  window.mySwipe.slide(5)
  renderAyahs(surahKey, ayahsDict[surahKey])
  renderSurahs(surahs)
}

function kFormatter(num) {
  return (num/1000).toFixed(1) + 'k'
}


if(isMobile.os()) $(".mobile-app").show()