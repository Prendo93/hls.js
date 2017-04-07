
            this.retryDate = performance.now() + delay;
            // retry loading state
            this.state = State.FRAG_LOADING_WAITING_RETRY;
          } else {
            logger.error(`audioStreamController: ${data.details} reaches max retry, redispatch as fatal ...`);
            // switch error to fatal
            data.fatal = true;
            this.state = State.ERROR;
          }
        }
        break;
      case ErrorDetails.FRAG_LOOP_LOADING_ERROR:
      case ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
      case ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
      case ErrorDetails.KEY_LOAD_ERROR:
      case ErrorDetails.KEY_LOAD_TIMEOUT:
        //  when in ERROR state, don't switch back to IDLE state in case a non-fatal error is received
        if(this.state !== State.ERROR) {
            // if fatal error, stop processing, otherwise move to IDLE to retry loading
            this.state = data.fatal ? State.ERROR : State.IDLE;
            logger.warn(`audioStreamController: ${data.details} while loading frag,switch to ${this.state} state ...`);
        }
        break;
      case ErrorDetails.BUFFER_FULL_ERROR:
        // if in appending state
        if (data.parent === 'audio' && (this.state === State.PARSING || this.state === State.PARSED)) {
          const media = this.mediaBuffer,
                currentTime = this.media.currentTime,
                mediaBuffered = media && BufferHelper.isBuffered(media,currentTime) && BufferHelper.isBuffered(media,currentTime+0.5);
          // reduce max buf len if current position is buffered
          if (mediaBuffered) {
            const config = this.config;
            if(config.maxMaxBufferLength >= config.maxBufferLength) {
              // reduce max buffer length as it might be too high. we do this to avoid loop flushing ...
              config.maxMaxBufferLength/=2;
              logger.warn(`audio:reduce max buffer length to ${config.maxMaxBufferLength}s`);
              // increase fragment load Index to avoid frag loop loading error after buffer flush
              this.fragLoadIdx += 2 * config.fragLoadingLoopThreshold;
            }
            this.state = State.IDLE;
          } else {
            // current position is not buffered, but browser is still complaining about buffer full error
            // this happens on IE/Edge, refer to https://github.com/video-dev/hls.js/pull/708
            // in that case flush the whole audio buffer to recover
            logger.warn('buffer full error also media.currentTime is not buffered, flush audio buffer');
            this.fragCurrent = null;
            // flush everything
            this.state = State.BUFFER_FLUSHING;
            this.hls.trigger(Event.BUFFER_FLUSHING, {startOffset: 0 , endOffset: Number.POSITIVE_INFINITY, type : 'audio'});
          }
        }
        break;
      default:
        break;
    }
  }

  onBufferFlushed() {
    let pendingData = this.pendingData;
    if (pendingData && pendingData.length) {
      logger.log('appending pending audio data on Buffer Flushed');
      pendingData.forEach(appendObj => {
        this.hls.trigger(Event.BUFFER_APPENDING, appendObj);
      });
      this.appended = true;
      this.pendingData = [];
      this.state = State.PARSED;
    } else {
      // move to IDLE once flush complete. this should trigger new fragment loading
      this.state = State.IDLE;
      // reset reference to frag
      this.fragPrevious = null;
      this.tick();
    }
  }
}
export default AudioStreamController;


          else if (bufferEnd <= start) {
            if (trackDetails.live && frag.loadIdx && frag.loadIdx === this.fragLoadIdx) {
              // we just loaded this first fragment, and we are still lagging behind the start of the live playlist
              // let's force seek to start
              const nextBuffered = bufferInfo.nextStart ? bufferInfo.nextStart : start;
              logger.log(`no alt audio available @currentTime:${this.media.currentTime}, seeking @${nextBuffered + 0.05}`);
              this.media.currentTime = nextBuffered + 0.05;
              return;
            }
              // Prefer the next fragment if it's within tolerance
              if (fragNext && !fragmentWithinToleranceTest(fragNext)) {
                foundFrag = fragNext;
              } else {
                foundFrag = BinarySearch.search(fragments, fragmentWithinToleranceTest);
              }
            this.retryDate = performance.now() + delay;
            // retry loading state
            this.state = State.FRAG_LOADING_WAITING_RETRY;
          } else {
            logger.error(`audioStreamController: ${data.details} reaches max retry, redispatch as fatal ...`);
            // switch error to fatal
            data.fatal = true;
            this.state = State.ERROR;
          }
        }
        break;
      case ErrorDetails.FRAG_LOOP_LOADING_ERROR:
      case ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
      case ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
      case ErrorDetails.KEY_LOAD_ERROR:
      case ErrorDetails.KEY_LOAD_TIMEOUT:
        //  when in ERROR state, don't switch back to IDLE state in case a non-fatal error is received
        if(this.state !== State.ERROR) {
            // if fatal error, stop processing, otherwise move to IDLE to retry loading
            this.state = data.fatal ? State.ERROR : State.IDLE;
            logger.warn(`audioStreamController: ${data.details} while loading frag,switch to ${this.state} state ...`);
        }
        break;
      case ErrorDetails.BUFFER_FULL_ERROR:
        // if in appending state
        if (data.parent === 'audio' && (this.state === State.PARSING || this.state === State.PARSED)) {
          const media = this.mediaBuffer,
                currentTime = this.media.currentTime,
                mediaBuffered = media && BufferHelper.isBuffered(media,currentTime) && BufferHelper.isBuffered(media,currentTime+0.5);
          // reduce max buf len if current position is buffered
          if (mediaBuffered) {
            const config = this.config;
            if(config.maxMaxBufferLength >= config.maxBufferLength) {
              // reduce max buffer length as it might be too high. we do this to avoid loop flushing ...
              config.maxMaxBufferLength/=2;
              logger.warn(`audio:reduce max buffer length to ${config.maxMaxBufferLength}s`);
              // increase fragment load Index to avoid frag loop loading error after buffer flush
              this.fragLoadIdx += 2 * config.fragLoadingLoopThreshold;
            }
            this.state = State.IDLE;
          } else {
            // current position is not buffered, but browser is still complaining about buffer full error
            // this happens on IE/Edge, refer to https://github.com/video-dev/hls.js/pull/708
            // in that case flush the whole audio buffer to recover
            logger.warn('buffer full error also media.currentTime is not buffered, flush audio buffer');
            this.fragCurrent = null;
            // flush everything
            this.state = State.BUFFER_FLUSHING;
            this.hls.trigger(Event.BUFFER_FLUSHING, {startOffset: 0 , endOffset: Number.POSITIVE_INFINITY, type : 'audio'});
          }
        }
        break;
      default:
        break;
    }
  }

  onBufferFlushed() {
    let pendingData = this.pendingData;
    if (pendingData && pendingData.length) {
      logger.log('appending pending audio data on Buffer Flushed');
      pendingData.forEach(appendObj => {
        this.hls.trigger(Event.BUFFER_APPENDING, appendObj);
      });
      this.appended = true;
      this.pendingData = [];
      this.state = State.PARSED;
    } else {
      // move to IDLE once flush complete. this should trigger new fragment loading
      this.state = State.IDLE;
      // reset reference to frag
      this.fragPrevious = null;
      this.tick();
    }
  }
}
export default AudioStreamController;

