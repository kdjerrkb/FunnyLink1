
// A lightweight procedural audio synthesizer for cute/funny games
class AudioManager {
  private ctx: AudioContext | null = null;
  
  // Changed: Use HTMLAudioElement for BGM file instead of Oscillator
  private bgmAudio: HTMLAudioElement;
  private isPlayingBgm: boolean = false;
  
  private bgmVolumeValue: number = 0.5;
  private sfxVolumeValue: number = 0.5;

  constructor() {
    // Assumption: The file is named 'bgm.mp3' and located in the public root
    // Please ensure you have placed the mp3 file at /bgm.mp3
    this.bgmAudio = new Audio('/bgm.mp3');
    this.bgmAudio.loop = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setBgmVolume(val: number) {
    this.bgmVolumeValue = val;
    if (this.bgmAudio) {
      this.bgmAudio.volume = val;
    }
  }

  setSfxVolume(val: number) {
    this.sfxVolumeValue = val;
  }

  playBgm() {
    if (this.isPlayingBgm) return;
    
    // Ensure AudioContext is initialized for SFX
    this.init();

    // Play the MP3 file
    this.bgmAudio.volume = this.bgmVolumeValue;
    this.bgmAudio.play().catch(e => {
        console.warn("BGM play failed (autoplay policy?):", e);
    });
    
    this.isPlayingBgm = true;
  }

  stopBgm() {
    this.isPlayingBgm = false;
    this.bgmAudio.pause();
    this.bgmAudio.currentTime = 0; // Reset to start
  }

  playSfx(type: 'select' | 'match' | 'prop' | 'combo' | 'win' | 'lose') {
    this.init();
    if (!this.ctx) return;
    if (this.sfxVolumeValue <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const vol = this.sfxVolumeValue * 0.3;

    switch (type) {
        case 'select':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
            break;
        case 'match':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
            break;
        case 'prop':
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(600, t + 0.2);
            gain.gain.setValueAtTime(vol * 0.8, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
            break;
        case 'combo':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.setValueAtTime(1318, t + 0.1); // E6
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            osc.start(t);
            osc.stop(t + 0.4);
            break;
        case 'win':
            osc.type = 'triangle';
            // Arpeggio
            [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                const o = this.ctx!.createOscillator();
                const g = this.ctx!.createGain();
                o.connect(g);
                g.connect(this.ctx!.destination);
                o.frequency.value = f;
                g.gain.setValueAtTime(vol, t + i*0.1);
                g.gain.exponentialRampToValueAtTime(0.01, t + i*0.1 + 0.3);
                o.start(t + i*0.1);
                o.stop(t + i*0.1 + 0.3);
            });
            break;
        case 'lose':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.5);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.5);
            osc.start(t);
            osc.stop(t + 0.5);
            break;
    }
  }
}

export const audioManager = new AudioManager();
