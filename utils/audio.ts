
// A robust audio manager with synthesized BGM and SFX
class AudioManager {
  private ctx: AudioContext | null = null;
  
  private isPlayingBgm: boolean = false;
  private bgmVolumeValue: number = 0.5;
  private sfxVolumeValue: number = 0.5;
  
  // BGM Sequencing
  private nextNoteTime: number = 0;
  private noteIndex: number = 0;
  private timerID: number | null = null;
  private tempo: number = 110; // BPM

  // A cute, simple melody loop
  // Note: frequency, duration (in 16th notes)
  private melody: {f: number, d: number}[] = [
    {f: 523.25, d: 2}, {f: 659.25, d: 2}, {f: 783.99, d: 2}, {f: 1046.50, d: 2}, // C E G C
    {f: 783.99, d: 2}, {f: 659.25, d: 2}, {f: 523.25, d: 4}, // G E C
    {f: 587.33, d: 2}, {f: 698.46, d: 2}, {f: 880.00, d: 2}, {f: 587.33, d: 2}, // D F A D
    {f: 783.99, d: 8}, // G (long)
    {f: 523.25, d: 2}, {f: 659.25, d: 2}, {f: 783.99, d: 2}, {f: 1046.50, d: 2}, // C E G C
    {f: 1174.66, d: 2}, {f: 1046.50, d: 2}, {f: 880.00, d: 4}, // D C A
    {f: 783.99, d: 2}, {f: 659.25, d: 2}, {f: 587.33, d: 2}, {f: 659.25, d: 2}, 
    {f: 523.25, d: 8}  // C
  ];

  constructor() {}

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
  }

  setSfxVolume(val: number) {
    this.sfxVolumeValue = val;
  }

  private scheduleNote() {
    if (!this.ctx || !this.isPlayingBgm) return;

    const secondsPerBeat = 60.0 / this.tempo;
    const secondsPer16th = secondsPerBeat / 4;
    // Look ahead 0.1s
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
        this.playMelodyNote(this.nextNoteTime);
        const currentNote = this.melody[this.noteIndex % this.melody.length];
        this.nextNoteTime += currentNote.d * secondsPer16th;
        this.noteIndex++;
    }
    
    this.timerID = window.setTimeout(this.scheduleNote.bind(this), 25);
  }

  private playMelodyNote(time: number) {
      if (!this.ctx || this.bgmVolumeValue <= 0) return;
      
      const note = this.melody[this.noteIndex % this.melody.length];
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'triangle'; // Softer, cute sound
      osc.frequency.value = note.f;
      
      // Envelope
      const volume = this.bgmVolumeValue * 0.15; // Lower base volume for BGM
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.05);
      gain.gain.setValueAtTime(volume, time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, time + (note.d * (60/this.tempo)/4) * 0.9);
      
      osc.start(time);
      osc.stop(time + (note.d * (60/this.tempo)/4));
  }

  playBgm() {
    this.init();
    if (this.isPlayingBgm) return;
    
    this.isPlayingBgm = true;
    this.noteIndex = 0;
    if (this.ctx) {
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.scheduleNote();
    }
  }

  stopBgm() {
    this.isPlayingBgm = false;
    if (this.timerID) {
        clearTimeout(this.timerID);
        this.timerID = null;
    }
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
            // Cute arpeggio
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, t);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
            
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1318, t + 0.1);
            gain2.gain.setValueAtTime(vol, t + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc2.start(t + 0.1);
            osc2.stop(t + 0.3);
            break;
        case 'win':
            osc.type = 'triangle';
            [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => {
                const o = this.ctx!.createOscillator();
                const g = this.ctx!.createGain();
                o.connect(g);
                g.connect(this.ctx!.destination);
                o.type = 'triangle';
                o.frequency.value = f;
                g.gain.setValueAtTime(vol, t + i*0.1);
                g.gain.exponentialRampToValueAtTime(0.01, t + i*0.1 + 0.4);
                o.start(t + i*0.1);
                o.stop(t + i*0.1 + 0.4);
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
