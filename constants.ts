
export const EMOJIS = [
  '🤪', '🤡', '👽', '👻', '🤖', '🎃', '🤥', '🤢', '🤠', 
  '🥶', '🤯', '🥳', '😎', '🤓', '👿', '🦄', '🐷', '🙈', '🔥', '😻', '🐶', '🐯', '🦁'
];

export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 10;
export const BASE_TIME = 60; // seconds per level
export const TIME_DECREMENT_PER_LEVEL = 2; // harder each level
export const MIN_TIME = 20;

export const SOUND_EFFECTS = {
  select: '🎵',
  match: '✨',
  error: '🚫',
  win: '🎉',
  lose: '💀'
};

export const TRANSLATIONS = {
  zh: {
    title: '搞怪\n连连看',
    subtitle: 'FUNNY LINK',
    highScore: '历史最高分',
    maxLevel: '最高闯关',
    startGame: '开始游戏',
    settings: '设置',
    rules: '规则：20秒内连续消除可获得炸弹或提示！',
    gameOver: '游戏结束!',
    timeUp: '时间耗尽啦',
    finalLevel: '最终关卡',
    score: '本局得分',
    backToMenu: '返回主菜单',
    levelSuccess: '通关成功!',
    loading: '下一关加载中...',
    level: '第 {n} 关',
    pause: '暂停',
    resume: '继续游戏',
    quit: '结束游戏',
    language: '语言 / Language',
    musicVolume: '音乐音量',
    sfxVolume: '音效音量',
    comboBomb: '连击! +1 炸弹',
    comboHint: '连击! +1 提示',
  },
  en: {
    title: 'Funny\nLink',
    subtitle: 'FUNNY LINK',
    highScore: 'Best Score',
    maxLevel: 'Max Level',
    startGame: 'Start Game',
    settings: 'Settings',
    rules: 'Rule: Match quickly for bombs or hints!',
    gameOver: 'Game Over!',
    timeUp: 'Time is up!',
    finalLevel: 'Final Level',
    score: 'Score',
    backToMenu: 'Main Menu',
    levelSuccess: 'Level Complete!',
    loading: 'Loading next...',
    level: 'Level {n}',
    pause: 'Pause',
    resume: 'Resume',
    quit: 'Quit Game',
    language: 'Language / 语言',
    musicVolume: 'Music Volume',
    sfxVolume: 'SFX Volume',
    comboBomb: 'Combo! +1 Bomb',
    comboHint: 'Combo! +1 Hint',
  }
};
