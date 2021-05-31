// Initialize vars
let playlist_url = null;
let access_token = null;
let user_id = null;
let playlist_id = null;
let songsdisplayed = false;
let artistsdisplayed = false;
let time_range = 'short_term';
let time_range_display = 'last 4 weeks';
let playlist_uris = [];
let limit = '20';

// Authorization. Key from spotify api website, must send a waypoint through their settings
// https://developer.spotify.com/documentation/general/guides/authorization-guide/
function authorize() {
  const client_id = '11658d424e3d4eb1bcf78b7b536ad695';
  const redirect_uri = 'https://dragongr.github.io/spotify-stats/';
  const scopes = 'user-top-read playlist-modify-public playlist-modify-private';

// Store the date
const d = new Date();
let date = [d.getMonth() +  1, d.getDate(), d.getFullYear()];
date = date.join('/');

  // Create a Token, and finalize it
  // final result will lead to a humongous URL Link
  // with the necessary stuff
  let url = 'https://accounts.spotify.com/authorize';
  url += '?response_type=token';
  url += '&client_id=' + encodeURIComponent(client_id);
  url += '&scope=' + encodeURIComponent(scopes);
  url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
  // Paste the final URL format
  window.location = url;
}

// Grab the access token
// with the help of regex
// But first do an if
function getHashValue(key) {
  if (typeof key !== 'string') {
    key = '';
  } else {
    key = key.toLowerCase();
  }
  const keyAndHash = location.hash.match(new RegExp(key + '=([^&]*)'));
  let value = '';

  if (keyAndHash) {
    value = keyAndHash[1];
  }
  return value;
};

function updateRange() {
  time_range = $('input[name=time]:checked', '#timeForm').val();
  switch (time_range) {
    case 'short_term':
      time_range_display = 'last 4 weeks';
      break;
    case 'medium_term':
      time_range_display = 'last 6 months';
      break;
    case 'long_term':
      time_range_display = 'all time';
  }
}

// Refresh display according to the newly updated controls
function refresh() {
  if (songsdisplayed) {
    getTopTracks();
  } else if (artistsdisplayed) {
    getTopArtists();
  }
}
function checkWidth() {
  if ($(window).width() < 1200) {
    $('html, body').animate({
      scrollTop: $("#results-container").offset().top
    }, 500);
  }
}

// Do a quick check if user has signed in,
// If user hasn't, prompt him to log in.
function getUserId() {
  if (access_token) {
    $.ajax({
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      success: function(response) {
        user_id = response.id;
      },
      error: function(jqXHR, textStatus, errorThrown) {
        ifError(jqXHR.status);
      },
    });
  } else {
    alert('Please log in to Spotify.');
  }
}

// Get user's top artists
function getTopArtists() {
  $('#artist-button').addClass("loading");
  if (access_token) {
    $.ajax({
      url: 'https://api.spotify.com/v1/me/top/artists',
      data: {
        limit: limit,
        time_range: time_range,
      },
      headers: {
        'Authorization': 'Bearer ' + access_token,
      },
      success: function(response) {
        $('#artist-button').removeClass("loading");
        $('#results').empty();
        $('#results-header').html('<h2>Top Artists</h2>');
        response.items.map((item, i) => {
          let name = item.name;
          let url = item.external_urls.spotify;
          let image = item.images[1].url;
          $('#results').append('<div class="column wide artist item"><a href="' + url + '"target="_blank"><img src=' + image + '></a><h4 class="title">' + (i + 1) + '. ' + name + '</h4></div>');
        });

        artistsdisplayed = true;
        songsdisplayed = false;
        checkWidth();
      },
      error: function(jqXHR, textStatus, errorThrown) {
        ifError(jqXHR.status);
      },
    });
  } else {
    alert('Please log in to Spotify.');
  }
}

// Get user's top songs
function getTopTracks() {
  $('#track-button').addClass("loading");
  if (access_token) {
    $.ajax({
      url: 'https://api.spotify.com/v1/me/top/tracks',
      data: {
        limit: limit,
        time_range: time_range,
      },
      headers: {
        'Authorization': 'Bearer ' + access_token,
      },
      success: function(response) {
        $('#track-button').removeClass("loading");
        playlist_uris = [];
        $('#results').empty();
        $('#results-header').html('<h2>Top Tracks</h2>');
        response.items.map((item, i) => {
          playlist_uris.push(item.uri);
          let trackName = item.name;
          let artistName = item.artists[0].name;
          let url = item.external_urls.spotify;
          let image = item.album.images[1].url;
          $('#results').append('<div class="column wide track item"><a href="' + url + '" target="_blank"><img src=' + image
          + '></a><h4>' + (i + 1) + '. ' + trackName + ' <br>' + artistName + ' </h4></div>');
        });
        songsdisplayed = true;
        artistsdisplayed = false;
        checkWidth();
      },
      error: function(jqXHR, textStatus, errorThrown) {
        ifError(jqXHR.status);
      },
    });
  } else {
    alert('Please log in to Spotify.');
  }
}

// error mechanism
function ifError(error) {
  retryLogin();
  disableControls();
  alert('Unable to authorize through Spotify Web API (Error ' + error + '). Please try logging in again.');
}

// retryLogin mechanism
function retryLogin() {
  $('#instructions').css('display', 'block');
  $('#login').css('display', 'block');
}

$(document).ready(function() {
  initialize();
  access_token = getHashValue('access_token');

// Have some funcs enabled.
function enableControls() {
  $('#instructions').css('display', 'none');
  $('#login').css('display', 'none');
  $('#button-segment').removeClass("disabled");
  $('#timeForm').removeClass("disabled");
  $('#numForm').removeClass("disabled");
}

// Have the buttons disabled. These are being called
// On HTML with the "id=$"
// I shouldn't been telling you that. It's 101 HTML
function disableControls() {
  $('#button-segment').addClass("disabled");
  $('#track-button').addClass("disabled");
  $('#build-playlist-button').addClass("disabled");
  $('#artist-button').addClass("disabled");
  $('#timeForm').addClass("disabled");
  $('#numForm').addClass("disabled");
}

// add some listeners to the controls
// Again, "id=$"
function initialize() {
  $('#timeForm input').on('change', function() {
    updateRange();
    refresh();
  });
  const slider = document.getElementById("numResponses");
  slider.oninput = function() {
    limit = $('#numResponses').val().toString();
    $('#number').html("Number of results: " + limit);
  }

  $('#numResponses').on('change', refresh);
}

  // Enable or disable control based on user's authentication
  if (access_token) {
    getUserId();
    enableControls();
  } else {
    disableControls();
  }
});