/*
 * audio track controller
*/

import Event from '../events';
import EventHandler from '../event-handler';
import {logger} from '../utils/logger';

class AudioTrackController extends EventHandler {

  constructor(hls) {
    super(hls, Event.MANIFEST_LOADING,
               Event.MANIFEST_LOADED,
               Event.AUDIO_TRACK_LOADED);
    this.tracks = [];
    this.trackId = 0;
    this.ontick = this.ontick.bind(this);
  }

  destroy() {
    EventHandler.prototype.destroy.call(this);
  }

  onManifestLoading() {
    // reset audio tracks on manifest loading
    this.tracks = [];
    this.trackId = 0;
  }

  onManifestLoaded(data) {
    let tracks = data.audioTracks || [];
    let defaultFound = false;
    this.tracks = tracks;
    this.hls.trigger(Event.AUDIO_TRACKS_UPDATED, {audioTracks : tracks});
    // loop through available audio tracks and autoselect default if needed
    tracks.forEach(track => {
      if(track.default) {
        this.audioTrack = track.id;
        defaultFound = true;
        return;
      }
    });
    if (defaultFound === false && tracks.length) {
      logger.log('no default audio track defined, use first audio track as default');
      this.audioTrack = 0;
    }
  }

  onAudioTrackLoaded(data) {
    if (data.id < this.tracks.length) {
      logger.log(`audioTrack ${data.id} loaded`);
      
      // check if current playlist is a live playlist
      let newDetails = data.details;
      if (newDetails.live) {
        // if live playlist we will have to reload it periodically
        // set reload period to playlist target duration
        let reloadInterval = 1000*( newDetails.averagetargetduration ? newDetails.averagetargetduration : newDetails.targetduration),
          curDetails = this.tracks[data.id].details;
        if (curDetails && newDetails.endSN === curDetails.endSN) {
          // follow HLS Spec, If the client reloads a Playlist file and finds that it has not
          // changed then it MUST wait for a period of one-half the target
          // duration before retrying.
          reloadInterval /=2;
          logger.log(`same live audio playlist, reload twice as fast`);
        }
        // decrement reloadInterval with level loading delay
        reloadInterval -= performance.now() - data.stats.trequest;
        // in any case, don't reload more than every second
        reloadInterval = Math.max(1000,Math.round(reloadInterval));
        logger.log(`live audio playlist, reload in ${reloadInterval} ms`);
        if (this.timer){
          logger.log(`clearing audio Timeout`);
          clearTimeout(this.timer);
          this.timer = null;  
        }
        this.timer = setTimeout(this.ontick,reloadInterval);
      }
      if (!data.details.live && this.timer) {
        // playlist is not live and timer is armed : stopping it
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.tracks[data.id].details = data.details;
    }
  }

  ontick() {
    if (this.trackId !== undefined) {
      let audioTrack = this.tracks[this.trackId], type = audioTrack.type, details = audioTrack.details;
      if (type !== 'main' && (details === undefined || details.live === true)){
        logger.log(`triggering live audio reload`);
        this.hls.trigger(Event.AUDIO_TRACK_LOADING, {url: audioTrack.url, id: this.trackId});
      }
    }
  }

  /** get alternate audio tracks list from playlist **/
  get audioTracks() {
    return this.tracks;
  }

  /** get index of the selected audio track (index in audio track lists) **/
  get audioTrack() {
   return this.trackId;
  }

  /** select an audio track, based on its index in audio track lists**/
  set audioTrack(audioTrackId) {
    if (this.trackId !== audioTrackId || this.tracks[audioTrackId].details === undefined) {
      this.setAudioTrackInternal(audioTrackId);
    }
  }

 setAudioTrackInternal(newId) {
    // check if level idx is valid
    if (newId >= 0 && newId < this.tracks.length) {
      // stopping live reloading timer if any
      if (this.timer) {
       clearTimeout(this.timer);
       this.timer = null;
      }
      this.trackId = newId;
      logger.log(`switching to audioTrack ${newId}`);
      let audioTrack = this.tracks[newId], type = audioTrack.type;
      this.hls.trigger(Event.AUDIO_TRACK_SWITCH, {id: newId, type : type});
       // check if we need to load playlist for this audio Track
       let details = audioTrack.details;
      if (type !== 'main' && (details === undefined || details.live === true)) {
        // track not retrieved yet, or live playlist we need to (re)load it
        logger.log(`(re)loading playlist for audioTrack ${newId}`);
        this.hls.trigger(Event.AUDIO_TRACK_LOADING, {url: audioTrack.url, id: newId});
      }
    }
  }
}

export default AudioTrackController;
