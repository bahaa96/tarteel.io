var api = {
  get_ayah: function(callback) {
    $.get("https://tarteel.tarjim.ly/get_ayah/", function(data) {
      callback.call(this, data);
    })
  },
  send_recording: function(audio, surah_num, ayah_num, hash_string) {
    var fd = new FormData();

    fd.append('file', audio, surah_num+"_"+ayah_num+"_"+hash_string+".wav");
    fd.append('surah_num', surah_num);
    fd.append('ayah_num', ayah_num);
    fd.append('hash_string', hash_string);
    $.ajax(
      {
        type: "POST",
        url: "https://tarteel.tarjim.ly/api/recordings/",
        data: fd,
        processData: false,
        contentType: false,
        complete: function(jqXHR, textStatus) {
          console.log(textStatus);
        }
      }
    )
  },
}
